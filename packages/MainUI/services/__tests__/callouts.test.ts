import { GlobalCalloutManager, globalCalloutManager } from "../callouts";

// Mock logger
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock debug
jest.mock("@/utils/debug", () => ({
  isDebugCallouts: jest.fn(() => false),
}));

describe("GlobalCalloutManager", () => {
  let manager: GlobalCalloutManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new GlobalCalloutManager();
  });

  afterEach(() => {
    manager.reset();
  });

  describe("Event subscription", () => {
    it("notifies listeners on callout start and end", async () => {
      const startListener = jest.fn();
      const endListener = jest.fn();

      manager.on("calloutStart", startListener);
      manager.on("calloutEnd", endListener);

      await manager.executeCallout("field1", async () => {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(startListener).toHaveBeenCalled();
      expect(endListener).toHaveBeenCalled();
    });
  });

  describe("Execution logic", () => {
    it("executes callouts in sequence", async () => {
      const executionOrder: string[] = [];

      const p1 = manager.executeCallout("field1", async () => {
        executionOrder.push("field1");
      });

      const p2 = manager.executeCallout("field2", async () => {
        executionOrder.push("field2");
      });

      await Promise.all([p1, p2]);

      expect(executionOrder).toEqual(["field1", "field2"]);
    });

    it("handles execution errors and continues with next", async () => {
      const nextCallout = jest.fn();

      const p1 = manager
        .executeCallout("errorField", async () => {
          throw new Error("Failed");
        })
        .catch(() => {});

      const p2 = manager.executeCallout("nextField", async () => {
        nextCallout();
      });

      await Promise.all([p1, p2]);

      expect(nextCallout).toHaveBeenCalled();
    });
  });

  describe("State and Suppression", () => {
    it("tracks suppression state", () => {
      expect(manager.isSuppressed()).toBe(false);
      manager.suppress();
      expect(manager.isSuppressed()).toBe(true);
      manager.resume();
      expect(manager.isSuppressed()).toBe(false);
    });

    it("tracks running state", async () => {
      expect(manager.isCalloutRunning()).toBe(false);

      const p = manager.executeCallout("field1", async () => {
        expect(manager.isCalloutRunning()).toBe(true);
      });

      await p;
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(manager.isCalloutRunning()).toBe(false);
    });
  });

  describe("Cleanup", () => {
    it("clears pending callouts on clearPendingCallouts", () => {
      manager.executeCallout("field1", async () => {});
      manager.clearPendingCallouts();
      expect(manager.arePendingCalloutsEmpty()).toBe(true);
    });
  });

  it("exports a global instance", () => {
    expect(globalCalloutManager).toBeInstanceOf(GlobalCalloutManager);
  });
});
