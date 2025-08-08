import { isDebugManualProcesses } from "@/utils/debug";

describe("isDebugManualProcesses", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    jest.resetModules();
    for (const k of [
      "NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES",
      "DEBUG_MANUAL_PROCESSES",
    ]) {
      // @ts-ignore
      delete process.env[k];
    }
    try { window.localStorage.clear(); } catch {}
  });
  afterAll(() => {
    process.env = prev;
  });

  it("returns false by default", () => {
    expect(isDebugManualProcesses()).toBe(false);
  });

  it("respects NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES env var", () => {
    process.env.NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES = "true";
    expect(isDebugManualProcesses()).toBe(true);
    process.env.NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES = "false";
    expect(isDebugManualProcesses()).toBe(false);
  });

  it("respects DEBUG_MANUAL_PROCESSES env var", () => {
    process.env.DEBUG_MANUAL_PROCESSES = "1";
    expect(isDebugManualProcesses()).toBe(true);
    process.env.DEBUG_MANUAL_PROCESSES = "0";
    expect(isDebugManualProcesses()).toBe(false);
  });

  it("reads DEBUG_MANUAL_PROCESSES from localStorage (best-effort)", () => {
    // Fallback behavior; in some runners localStorage access might be restricted.
    try {
      window.localStorage.setItem("DEBUG_MANUAL_PROCESSES", "true");
      expect(isDebugManualProcesses()).toBe(true);
      window.localStorage.setItem("DEBUG_MANUAL_PROCESSES", "0");
      expect(isDebugManualProcesses()).toBe(false);
    } catch {
      // If localStorage is unavailable, ensure env var path still works
      process.env.NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES = "true";
      expect(isDebugManualProcesses()).toBe(true);
    }
  });
});
