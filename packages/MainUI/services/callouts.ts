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

class GlobalCalloutManager {
  private isCalloutInProgress = false;
  private pendingCallouts = new Map<string, () => Promise<void>>();
  private calloutQueue: string[] = [];

  async executeCallout(fieldName: string, calloutFn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedCallout = async () => {
        try {
          await calloutFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.pendingCallouts.set(fieldName, wrappedCallout);

      if (!this.calloutQueue.includes(fieldName)) {
        this.calloutQueue.push(fieldName);
      }

      if (!this.isCalloutInProgress) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isCalloutInProgress || this.calloutQueue.length === 0) {
      return;
    }

    this.isCalloutInProgress = true;

    try {
      const fieldName = this.calloutQueue.shift();
      if (!fieldName) return;

      const callout = this.pendingCallouts.get(fieldName);
      if (!callout) return;

      await callout();

      this.pendingCallouts.delete(fieldName);

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      logger.error("Callout execution failed:", error);
    } finally {
      this.isCalloutInProgress = false;

      if (this.calloutQueue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    }
  }

  isCalloutRunning(): boolean {
    return this.isCalloutInProgress;
  }

  clearPendingCallouts(): void {
    this.pendingCallouts.clear();
    this.calloutQueue.length = 0;
  }

  arePendingCalloutsEmpty(): boolean {
    return this.calloutQueue.length === 0 && this.pendingCallouts.size === 0;
  }
}

export const globalCalloutManager = new GlobalCalloutManager();
