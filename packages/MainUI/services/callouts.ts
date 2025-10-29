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

/**
 * Immutable callout state
 */
interface CalloutManagerState {
  readonly isCalloutInProgress: boolean;
  readonly pendingCallouts: ReadonlyMap<string, () => Promise<void>>;
  readonly calloutQueue: readonly string[];
  readonly suppressCount: number;
  readonly eventListeners: ReadonlyMap<CalloutEventType, readonly CalloutEventListener[]>;
}

/**
 * Configuration for automatic cache cleanup
 */
interface CleanupConfig {
  maxQueueSize: number;
  maxPendingSize: number;
  cleanupOnIdle: boolean;
  idleTimeoutMs: number;
}

const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  maxQueueSize: 50, // Clear queue if it exceeds this size
  maxPendingSize: 100, // Clear pending if it exceeds this size
  cleanupOnIdle: true, // Auto-cleanup after idle period
  idleTimeoutMs: 5000, // 5 seconds idle timeout
};

/**
 * Create initial state
 */
const createInitialState = (): CalloutManagerState => ({
  isCalloutInProgress: false,
  pendingCallouts: new Map(),
  calloutQueue: [],
  suppressCount: 0,
  eventListeners: new Map(),
});

/**
 * Pure function to add event listener
 */
const addEventListener = (
  state: CalloutManagerState,
  event: CalloutEventType,
  listener: CalloutEventListener
): CalloutManagerState => {
  const currentListeners = state.eventListeners.get(event) || [];
  const newListeners = new Map(state.eventListeners);
  newListeners.set(event, [...currentListeners, listener]);

  if (isDebugCallouts()) {
    logger.debug(`[CalloutManager] Event listener added for '${event}', total: ${newListeners.get(event)?.length}`);
  }

  return { ...state, eventListeners: newListeners };
};

/**
 * Pure function to remove event listener
 */
const removeEventListener = (
  state: CalloutManagerState,
  event: CalloutEventType,
  listener: CalloutEventListener
): CalloutManagerState => {
  const currentListeners = state.eventListeners.get(event) || [];
  const newListeners = new Map(state.eventListeners);
  const filtered = currentListeners.filter((l) => l !== listener);
  newListeners.set(event, filtered);

  if (isDebugCallouts()) {
    logger.debug(`[CalloutManager] Event listener removed for '${event}', remaining: ${filtered.length}`);
  }

  return { ...state, eventListeners: newListeners };
};

/**
 * Pure function to emit events (has side effects in listeners)
 */
const emitEvent = (state: CalloutManagerState, event: CalloutEventType, data?: Record<string, unknown>): void => {
  const listeners = state.eventListeners.get(event) || [];

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
};

/**
 * Pure function to queue a callout
 */
const queueCallout = (
  state: CalloutManagerState,
  fieldName: string,
  calloutFn: () => Promise<void>
): CalloutManagerState => {
  const newPendingCallouts = new Map(state.pendingCallouts);
  newPendingCallouts.set(fieldName, calloutFn);

  const newQueue = state.calloutQueue.includes(fieldName) ? state.calloutQueue : [...state.calloutQueue, fieldName];

  return {
    ...state,
    pendingCallouts: newPendingCallouts,
    calloutQueue: newQueue,
  };
};

/**
 * Pure function to check if cleanup is needed
 */
const shouldCleanup = (state: CalloutManagerState, config: CleanupConfig): boolean => {
  return state.calloutQueue.length > config.maxQueueSize || state.pendingCallouts.size > config.maxPendingSize;
};

/**
 * Pure function to clear pending callouts
 */
const clearPending = (state: CalloutManagerState): CalloutManagerState => {
  const hadPending = state.pendingCallouts.size > 0 || state.calloutQueue.length > 0;

  const newState = {
    ...state,
    pendingCallouts: new Map(),
    calloutQueue: [],
  };

  if (hadPending) {
    emitEvent(newState, "calloutEnd", { cleared: true });
  }

  return newState;
};

class GlobalCalloutManager {
  private state: CalloutManagerState = createInitialState();
  private cleanupConfig: CleanupConfig = DEFAULT_CLEANUP_CONFIG;
  private idleTimer: NodeJS.Timeout | null = null;

  /**
   * Subscribe to callout events
   */
  on(event: CalloutEventType, listener: CalloutEventListener): void {
    this.state = addEventListener(this.state, event, listener);
  }

  /**
   * Unsubscribe from callout events
   */
  off(event: CalloutEventType, listener: CalloutEventListener): void {
    this.state = removeEventListener(this.state, event, listener);
  }

  /**
   * Get comprehensive state information
   */
  getState(): CalloutState {
    return {
      isRunning: this.state.isCalloutInProgress,
      queueLength: this.state.calloutQueue.length,
      pendingCount: this.state.pendingCallouts.size,
      isSuppressed: this.state.suppressCount > 0,
    };
  }

  /**
   * Configure cleanup behavior
   */
  configureCleanup(config: Partial<CleanupConfig>): void {
    this.cleanupConfig = { ...this.cleanupConfig, ...config };
  }

  async executeCallout(fieldName: string, calloutFn: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const wrappedCallout = async () => {
        try {
          await calloutFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.state = queueCallout(this.state, fieldName, wrappedCallout);

      // Check if cleanup is needed
      if (shouldCleanup(this.state, this.cleanupConfig)) {
        logger.warn("[CalloutManager] Cache size exceeded limits, clearing old callouts", {
          queueSize: this.state.calloutQueue.length,
          pendingSize: this.state.pendingCallouts.size,
        });
        this.clearPendingCallouts();
      }

      this.startProcessingIfNeeded();
      this.resetIdleTimer();
    });
  }

  private startProcessingIfNeeded(): void {
    if (this.state.isCalloutInProgress) {
      return;
    }

    queueMicrotask(() => {
      if (!this.state.isCalloutInProgress && this.state.calloutQueue.length > 0) {
        emitEvent(this.state, "calloutStart", { queueLength: this.state.calloutQueue.length });
        this.processQueue().catch((error) => {
          logger.error("Error processing callout queue:", error);
        });
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.state.isCalloutInProgress || this.state.calloutQueue.length === 0) {
      return;
    }

    this.state = { ...this.state, isCalloutInProgress: true };

    try {
      while (this.state.calloutQueue.length > 0) {
        await this.processNextCallout();
      }
    } catch (error) {
      this.handleExecutionError(error);
    } finally {
      this.state = { ...this.state, isCalloutInProgress: false };
      emitEvent(this.state, "calloutEnd", { allCompleted: true });
    }
  }

  private async processNextCallout(): Promise<void> {
    const fieldName = this.state.calloutQueue[0];
    if (!fieldName) return;

    // Remove from queue immutably
    this.state = {
      ...this.state,
      calloutQueue: this.state.calloutQueue.slice(1),
    };

    const callout = this.state.pendingCallouts.get(fieldName);
    if (!callout) return;

    await this.executeCalloutWithLogging(fieldName, callout);

    // Remove from pending immutably
    const newPendingCallouts = new Map(this.state.pendingCallouts);
    newPendingCallouts.delete(fieldName);
    this.state = {
      ...this.state,
      pendingCallouts: newPendingCallouts,
    };

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
    if (this.state.calloutQueue.length > 0) {
      emitEvent(this.state, "calloutProgress", {
        completed: fieldName,
        remaining: this.state.calloutQueue.length,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private handleExecutionError(error: unknown): void {
    const fieldName = this.state.calloutQueue[0];
    logger.error(`Callout execution failed for field: ${fieldName}`, error);

    if (fieldName) {
      const newPendingCallouts = new Map(this.state.pendingCallouts);
      newPendingCallouts.delete(fieldName);
      this.state = {
        ...this.state,
        pendingCallouts: newPendingCallouts,
      };
    }
  }

  private resetIdleTimer(): void {
    if (!this.cleanupConfig.cleanupOnIdle) return;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      if (!this.state.isCalloutInProgress && this.state.calloutQueue.length > 0) {
        logger.debug("[CalloutManager] Idle timeout reached, clearing pending callouts");
        this.clearPendingCallouts();
      }
    }, this.cleanupConfig.idleTimeoutMs);
  }

  isCalloutRunning(): boolean {
    return this.state.isCalloutInProgress;
  }

  clearPendingCallouts(): void {
    this.state = clearPending(this.state);
  }

  arePendingCalloutsEmpty(): boolean {
    return this.state.calloutQueue.length === 0 && this.state.pendingCallouts.size === 0;
  }

  suppress(): void {
    this.state = {
      ...this.state,
      suppressCount: this.state.suppressCount + 1,
    };
    if (isDebugCallouts()) logger.debug(`[Callout] Suppress on (depth=${this.state.suppressCount})`);
  }

  resume(): void {
    this.state = {
      ...this.state,
      suppressCount: Math.max(0, this.state.suppressCount - 1),
    };
    if (isDebugCallouts()) logger.debug(`[Callout] Resume (depth=${this.state.suppressCount})`);
  }

  isSuppressed(): boolean {
    return this.state.suppressCount > 0;
  }

  canExecute(_hqlName: string): boolean {
    return !this.state.isCalloutInProgress && !this.isSuppressed();
  }

  /**
   * Reset the callout manager to initial state
   */
  reset(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.state = createInitialState();

    if (isDebugCallouts()) {
      logger.debug("[CalloutManager] Reset to initial state");
    }
  }
}

export const globalCalloutManager = new GlobalCalloutManager();
