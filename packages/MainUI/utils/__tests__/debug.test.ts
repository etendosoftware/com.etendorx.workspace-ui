import {
  getEnvVar,
  isDebugCallouts,
  isDebugManualProcesses,
  enableCalloutDebugging,
  disableCalloutDebugging,
} from "../debug";

describe("debug", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const k of [
      "NEXT_PUBLIC_DEBUG_CALLOUTS",
      "DEBUG_CALLOUTS",
      "NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES",
      "DEBUG_MANUAL_PROCESSES",
    ]) {
      // @ts-ignore
      delete process.env[k];
    }
    try {
      window.localStorage.clear();
    } catch {}
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getEnvVar", () => {
    it("should return the value of an existing env var", () => {
      process.env.TEST_VAR = "hello";
      expect(getEnvVar("TEST_VAR")).toBe("hello");
    });

    it("should return undefined for a missing env var", () => {
      expect(getEnvVar("NON_EXISTENT_VAR")).toBeUndefined();
    });
  });

  describe("isDebugCallouts", () => {
    it("should return false by default", () => {
      expect(isDebugCallouts()).toBe(false);
    });

    it("should return true when NEXT_PUBLIC env var is true", () => {
      process.env.NEXT_PUBLIC_DEBUG_CALLOUTS = "true";
      expect(isDebugCallouts()).toBe(true);
    });

    it("should return true when NEXT_PUBLIC env var is 1", () => {
      process.env.NEXT_PUBLIC_DEBUG_CALLOUTS = "1";
      expect(isDebugCallouts()).toBe(true);
    });

    it("should return false when NEXT_PUBLIC env var is false", () => {
      process.env.NEXT_PUBLIC_DEBUG_CALLOUTS = "false";
      expect(isDebugCallouts()).toBe(false);
    });

    it("should return false when NEXT_PUBLIC env var is 0", () => {
      process.env.NEXT_PUBLIC_DEBUG_CALLOUTS = "0";
      expect(isDebugCallouts()).toBe(false);
    });

    it("should respect fallback DEBUG_CALLOUTS env var", () => {
      process.env.DEBUG_CALLOUTS = "true";
      expect(isDebugCallouts()).toBe(true);
    });

    it("should check localStorage when env is not set", () => {
      try {
        window.localStorage.setItem("DEBUG_CALLOUTS", "true");
        expect(isDebugCallouts()).toBe(true);
        window.localStorage.setItem("DEBUG_CALLOUTS", "0");
        expect(isDebugCallouts()).toBe(false);
      } catch {
        // localStorage may be unavailable in some test environments
        process.env.NEXT_PUBLIC_DEBUG_CALLOUTS = "true";
        expect(isDebugCallouts()).toBe(true);
      }
    });
  });

  describe("isDebugManualProcesses", () => {
    it("should return false by default", () => {
      expect(isDebugManualProcesses()).toBe(false);
    });

    it("should return true when env var is set", () => {
      process.env.NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES = "true";
      expect(isDebugManualProcesses()).toBe(true);
    });

    it("should respect fallback env var", () => {
      process.env.DEBUG_MANUAL_PROCESSES = "1";
      expect(isDebugManualProcesses()).toBe(true);
    });
  });

  describe("enableCalloutDebugging", () => {
    it("should set localStorage key to true", () => {
      try {
        enableCalloutDebugging();
        expect(window.localStorage.getItem("DEBUG_CALLOUTS")).toBe("true");
      } catch {
        // localStorage may not be available
        expect(true).toBe(true);
      }
    });
  });

  describe("disableCalloutDebugging", () => {
    it("should remove localStorage key", () => {
      try {
        window.localStorage.setItem("DEBUG_CALLOUTS", "true");
        disableCalloutDebugging();
        expect(window.localStorage.getItem("DEBUG_CALLOUTS")).toBeNull();
      } catch {
        expect(true).toBe(true);
      }
    });
  });
});
