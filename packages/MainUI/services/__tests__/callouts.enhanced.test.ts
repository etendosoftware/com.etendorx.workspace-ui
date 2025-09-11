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

import { globalCalloutManager } from "../callouts";

describe("Enhanced GlobalCalloutManager Event System", () => {
  let mockListener: jest.Mock;

  beforeEach(() => {
    mockListener = jest.fn();
    // Reset the callout manager to a clean state
    globalCalloutManager.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup listeners
    globalCalloutManager.off("calloutStart", mockListener);
    globalCalloutManager.off("calloutEnd", mockListener);
    globalCalloutManager.off("calloutProgress", mockListener);
  });

  describe("Event System API", () => {
    test("should add and remove event listeners", () => {
      // Add listener
      globalCalloutManager.on("calloutStart", mockListener);

      // Verify listener can be removed without error
      expect(() => {
        globalCalloutManager.off("calloutStart", mockListener);
      }).not.toThrow();

      // Multiple removes should not cause errors
      expect(() => {
        globalCalloutManager.off("calloutStart", mockListener);
      }).not.toThrow();
    });

    test("should handle multiple listeners for same event", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      globalCalloutManager.on("calloutStart", listener1);
      globalCalloutManager.on("calloutStart", listener2);

      // Both should be called when event is emitted
      // We'll verify this in the execution tests
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();

      // Cleanup
      globalCalloutManager.off("calloutStart", listener1);
      globalCalloutManager.off("calloutStart", listener2);
    });
  });

  describe("Event Emission During Callout Execution", () => {
    test("should emit calloutStart and calloutEnd events for single callout", async () => {
      const startListener = jest.fn();
      const endListener = jest.fn();

      globalCalloutManager.on("calloutStart", startListener);
      globalCalloutManager.on("calloutEnd", endListener);

      const calloutPromise = globalCalloutManager.executeCallout("testField", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // calloutStart should be called immediately
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(startListener).toHaveBeenCalledWith({ queueLength: 1 });

      // Wait for callout to complete
      await calloutPromise;

      // Wait for events to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      // calloutEnd should be called after completion
      expect(endListener).toHaveBeenCalledWith({ allCompleted: true });

      // Cleanup
      globalCalloutManager.off("calloutStart", startListener);
      globalCalloutManager.off("calloutEnd", endListener);
    });

    test("should emit progress events for multiple callouts", async () => {
      const startListener = jest.fn();
      const progressListener = jest.fn();
      const endListener = jest.fn();

      globalCalloutManager.on("calloutStart", startListener);
      globalCalloutManager.on("calloutProgress", progressListener);
      globalCalloutManager.on("calloutEnd", endListener);

      // Queue multiple callouts
      const callout1 = globalCalloutManager.executeCallout("field1", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const callout2 = globalCalloutManager.executeCallout("field2", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Wait for callouts to complete
      await Promise.all([callout1, callout2]);

      // Wait for events to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify events were emitted
      expect(startListener).toHaveBeenCalledWith({ queueLength: 2 });
      expect(progressListener).toHaveBeenCalled();
      expect(endListener).toHaveBeenCalledWith({ allCompleted: true });

      // Cleanup
      globalCalloutManager.off("calloutStart", startListener);
      globalCalloutManager.off("calloutProgress", progressListener);
      globalCalloutManager.off("calloutEnd", endListener);
    });

    test("should handle callout errors gracefully without breaking event system", async () => {
      const startListener = jest.fn();
      const endListener = jest.fn();

      globalCalloutManager.on("calloutStart", startListener);
      globalCalloutManager.on("calloutEnd", endListener);

      try {
        await globalCalloutManager.executeCallout("errorField", async () => {
          throw new Error("Test callout error");
        });
      } catch {
        // Error is expected
      }

      // Wait for events to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Events should still be emitted despite error
      expect(startListener).toHaveBeenCalledWith({ queueLength: 1 });
      expect(endListener).toHaveBeenCalledWith({ allCompleted: true });

      // Cleanup
      globalCalloutManager.off("calloutStart", startListener);
      globalCalloutManager.off("calloutEnd", endListener);
    });
  });

  describe("Event Listener Error Handling", () => {
    test("should isolate event listener errors", async () => {
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error("Listener error");
      });

      globalCalloutManager.on("calloutStart", badListener);
      globalCalloutManager.on("calloutStart", goodListener);

      // Execute callout - should not throw despite bad listener
      await expect(
        globalCalloutManager.executeCallout("testField", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        })
      ).resolves.not.toThrow();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalledWith({ queueLength: 1 });
      expect(badListener).toHaveBeenCalledWith({ queueLength: 1 });

      // Cleanup
      globalCalloutManager.off("calloutStart", badListener);
      globalCalloutManager.off("calloutStart", goodListener);
    });
  });

  describe("State Management API", () => {
    test("should return comprehensive state information", () => {
      const initialState = globalCalloutManager.getState();

      expect(initialState).toMatchObject({
        isRunning: false,
        queueLength: 0,
        pendingCount: 0,
        isSuppressed: false,
      });
    });

    test("should reflect running state correctly", async () => {
      const calloutPromise = globalCalloutManager.executeCallout("testField", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Check state while running
      await new Promise((resolve) => setTimeout(resolve, 5));
      const runningState = globalCalloutManager.getState();
      expect(runningState.isRunning).toBe(true);

      // Wait for completion
      await calloutPromise;

      // Wait for events to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      const completedState = globalCalloutManager.getState();
      expect(completedState.isRunning).toBe(false);
    });

    test("should reflect suppression state correctly", () => {
      globalCalloutManager.suppress();
      expect(globalCalloutManager.getState().isSuppressed).toBe(true);

      globalCalloutManager.resume();
      expect(globalCalloutManager.getState().isSuppressed).toBe(false);
    });
  });

  describe("Clear Pending Callouts with Events", () => {
    test("should emit calloutEnd event when clearing pending callouts", () => {
      const endListener = jest.fn();
      globalCalloutManager.on("calloutEnd", endListener);

      // Add a pending callout (don't execute it)
      globalCalloutManager.executeCallout("pendingField", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // Clear pending callouts
      globalCalloutManager.clearPendingCallouts();

      // Should emit calloutEnd with cleared flag
      expect(endListener).toHaveBeenCalledWith({ cleared: true });

      // Cleanup
      globalCalloutManager.off("calloutEnd", endListener);
    });

    test("should not emit event when clearing empty queue", () => {
      const endListener = jest.fn();
      globalCalloutManager.on("calloutEnd", endListener);

      // Clear empty queue
      globalCalloutManager.clearPendingCallouts();

      // Should not emit event
      expect(endListener).not.toHaveBeenCalled();

      // Cleanup
      globalCalloutManager.off("calloutEnd", endListener);
    });
  });

  describe("Backward Compatibility", () => {
    test("should maintain all existing API methods", () => {
      // Verify all existing methods are still available
      expect(typeof globalCalloutManager.executeCallout).toBe("function");
      expect(typeof globalCalloutManager.isCalloutRunning).toBe("function");
      expect(typeof globalCalloutManager.clearPendingCallouts).toBe("function");
      expect(typeof globalCalloutManager.arePendingCalloutsEmpty).toBe("function");
      expect(typeof globalCalloutManager.suppress).toBe("function");
      expect(typeof globalCalloutManager.resume).toBe("function");
      expect(typeof globalCalloutManager.isSuppressed).toBe("function");
      expect(typeof globalCalloutManager.canExecute).toBe("function");
    });

    test("should work with existing polling-based monitoring", async () => {
      // Simulate existing polling pattern
      const checkStatus = () => globalCalloutManager.isCalloutRunning();

      expect(checkStatus()).toBe(false);

      const calloutPromise = globalCalloutManager.executeCallout("testField", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Status should be available via polling during execution
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(checkStatus()).toBe(true);

      await calloutPromise;

      // Wait for events to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(checkStatus()).toBe(false);
    });
  });
});
