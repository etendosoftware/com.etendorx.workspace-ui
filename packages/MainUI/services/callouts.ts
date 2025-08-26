/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { logger } from "@/utils/logger";
import { isDebugCallouts } from "@/utils/debug";

/**
 * Event types emitted by GlobalCalloutManager
 */
type CalloutEventType = "calloutStart" | "calloutEnd" | "calloutProgress";

/**
 * Event listener function signature
 */
type CalloutEventListener = (data?: Record<string, unknown>) => void;

/**
 * State information returned by getState()
 */
interface CalloutState {
  isRunning: boolean;
  queueLength: number;
  pendingCount: number;
  isSuppressed: boolean;
}

class GlobalCalloutManager {
  private isCalloutInProgress = false;
  private pendingCallouts = new Map<string, () => Promise<void>>();
  private calloutQueue: string[] = [];
  private suppressCount = 0;

  // Event system implementation
  private eventListeners = new Map<CalloutEventType, CalloutEventListener[]>();

  /**
   * Subscribe to callout events
   * @param event - Event type to listen for
   * @param listener - Callback function to execute when event occurs
   */
  on(event: CalloutEventType, listener: CalloutEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);

    if (isDebugCallouts()) {
      logger.debug(
        `[CalloutManager] Event listener added for '${event}', total: ${this.eventListeners.get(event)?.length}`
      );
    }
  }

  /**
   * Unsubscribe from callout events
   * @param event - Event type to stop listening for
   * @param listener - Specific callback function to remove
   */
  off(event: CalloutEventType, listener: CalloutEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        if (isDebugCallouts()) {
          logger.debug(`[CalloutManager] Event listener removed for '${event}', remaining: ${listeners.length}`);
        }
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param event - Event type to emit
   * @param data - Optional data to pass to listeners
   */
  private emit(event: CalloutEventType, data?: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(event) || [];

    if (isDebugCallouts() && listeners.length > 0) {
      logger.debug(`[CalloutManager] Emitting '${event}' to ${listeners.length} listeners`, data);
    }

    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        logger.error(`Error in callout event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Get comprehensive state information
   * @returns Current callout manager state
   */
  getState(): CalloutState {
    return {
      isRunning: this.isCalloutInProgress,
      queueLength: this.calloutQueue.length,
      pendingCount: this.pendingCallouts.size,
      isSuppressed: this.suppressCount > 0,
    };
  }

  async executeCallout(fieldName: string, calloutFn: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const wrappedCallout = this.createWrappedCallout(calloutFn, resolve, reject);
      this.queueCallout(fieldName, wrappedCallout);
      this.startProcessingIfNeeded();
    });
  }

  private createWrappedCallout(
    calloutFn: () => Promise<void>,
    resolve: () => void,
    reject: (error: unknown) => void
  ): () => Promise<void> {
    return async () => {
      try {
        await calloutFn();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
  }

  private queueCallout(fieldName: string, wrappedCallout: () => Promise<void>): void {
    this.pendingCallouts.set(fieldName, wrappedCallout);
    
    if (!this.calloutQueue.includes(fieldName)) {
      this.calloutQueue.push(fieldName);
    }
  }

  private startProcessingIfNeeded(): void {
    if (this.isCalloutInProgress) {
      return;
    }

    queueMicrotask(() => {
      if (this.shouldStartProcessing()) {
        this.emitCalloutStart();
        this.processQueue().catch((error) => {
          logger.error("Error processing callout queue:", error);
        });
      }
    });
  }

  private shouldStartProcessing(): boolean {
    return !this.isCalloutInProgress && this.calloutQueue.length > 0;
  }

  private emitCalloutStart(): void {
    const queueLength = this.calloutQueue.length;
    this.emit("calloutStart", { queueLength });
  }

  private async processQueue(): Promise<void> {
    if (this.isCalloutInProgress || this.calloutQueue.length === 0) {
      return;
    }

    this.isCalloutInProgress = true;

    await this.executeQueuedCallouts();
  }

  private async executeQueuedCallouts(): Promise<void> {
    try {
      while (this.calloutQueue.length > 0) {
        await this.processNextCallout();
      }
    } catch (error) {
      this.handleExecutionError(error);
    } finally {
      this.finalizeExecution();
    }
  }

  private async processNextCallout(): Promise<void> {
    const fieldName = this.calloutQueue.shift();
    if (!fieldName) return;

    const callout = this.pendingCallouts.get(fieldName);
    if (!callout) return;

    await this.executeCalloutWithLogging(fieldName, callout);
    this.pendingCallouts.delete(fieldName);
    await this.emitProgressIfNeeded(fieldName);
  }

  private async executeCalloutWithLogging(fieldName: string, callout: () => Promise<void>): Promise<void> {
    if (isDebugCallouts()) logger.debug(`[Callout] Executing: ${fieldName}`);

    try {
      await callout();
      if (isDebugCallouts()) logger.debug(`[Callout] Completed: ${fieldName}`);
    } catch (error) {
      logger.error(`[Callout] Error executing ${fieldName}:`, error);
    }
  }

  private async emitProgressIfNeeded(fieldName: string): Promise<void> {
    if (this.calloutQueue.length > 0) {
      this.emit("calloutProgress", {
        completed: fieldName,
        remaining: this.calloutQueue.length,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private handleExecutionError(error: unknown): void {
    const fieldName = this.calloutQueue[0];
    logger.error(`Callout execution failed for field: ${fieldName}`, error);

    if (fieldName) {
      this.pendingCallouts.delete(fieldName);
    }
  }

  private finalizeExecution(): void {
    this.isCalloutInProgress = false;
    this.emit("calloutEnd", { allCompleted: true });
  }

  isCalloutRunning(): boolean {
    return this.isCalloutInProgress;
  }

  clearPendingCallouts(): void {
    const hadPendingCallouts = this.pendingCallouts.size > 0 || this.calloutQueue.length > 0;

    this.pendingCallouts.clear();
    this.calloutQueue.length = 0;

    // Emit calloutEnd event if there were pending callouts
    if (hadPendingCallouts) {
      this.emit("calloutEnd", { cleared: true });
    }
  }

  arePendingCalloutsEmpty(): boolean {
    return this.calloutQueue.length === 0 && this.pendingCallouts.size === 0;
  }

  // Globally suppress callouts (e.g., while applying server-driven values)
  suppress(): void {
    this.suppressCount++;
    if (isDebugCallouts()) logger.debug(`[Callout] Suppress on (depth=${this.suppressCount})`);
  }

  resume(): void {
    this.suppressCount = Math.max(0, this.suppressCount - 1);
    if (isDebugCallouts()) logger.debug(`[Callout] Resume (depth=${this.suppressCount})`);
  }

  isSuppressed(): boolean {
    return this.suppressCount > 0;
  }

  canExecute(_hqlName: string): boolean {
    return !this.isCalloutInProgress && !this.isSuppressed();
  }

  /**
   * Reset the callout manager to initial state
   */
  reset(): void {
    this.isCalloutInProgress = false;
    this.pendingCallouts.clear();
    this.calloutQueue.length = 0;
    this.suppressCount = 0;
    this.eventListeners.clear();

    if (isDebugCallouts()) {
      logger.debug("[CalloutManager] Reset to initial state");
    }
  }
}

export const globalCalloutManager = new GlobalCalloutManager();
