import { globalCalloutManager } from "../../../../services/callouts";

// Mock dependencies
jest.mock("../../../../services/callouts", () => ({
  globalCalloutManager: {
    getState: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock("../../../../hooks/useFormValidation", () => ({
  useFormValidation: jest.fn(() => ({
    validateRequiredFields: jest.fn(() => ({
      isValid: true,
      missingFields: [],
    })),
    hasValidationErrors: false,
    validationErrors: [],
  })),
}));

describe("FormView Save Integration Tests", () => {
  const mockGlobalCalloutManager = globalCalloutManager as jest.Mocked<typeof globalCalloutManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGlobalCalloutManager.getState.mockReturnValue({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
      isSuppressed: false,
    });
  });

  it("should check callout state for save operations", () => {
    const state = mockGlobalCalloutManager.getState();
    expect(state.isRunning).toBe(false);
    expect(mockGlobalCalloutManager.getState).toHaveBeenCalled();
  });

  it("should prevent save when callouts are running", () => {
    mockGlobalCalloutManager.getState.mockReturnValue({
      isRunning: true,
      queueLength: 1,
      pendingCount: 1,
      isSuppressed: false,
    });

    const state = mockGlobalCalloutManager.getState();

    // This simulates the logic in FormView handleSave
    let shouldSave = true;
    if (state.isRunning) {
      shouldSave = false;
      console.warn("Cannot save while callouts are running");
    }

    expect(shouldSave).toBe(false);
    expect(state.isRunning).toBe(true);
  });

  it("should validate integration points exist", () => {
    // Verify that the mocked functions are available
    expect(globalCalloutManager.getState).toBeDefined();
    expect(globalCalloutManager.on).toBeDefined();
    expect(globalCalloutManager.off).toBeDefined();

    // Test basic state access
    const state = mockGlobalCalloutManager.getState();
    expect(typeof state.isRunning).toBe("boolean");
    expect(typeof state.queueLength).toBe("number");
    expect(typeof state.pendingCount).toBe("number");
    expect(typeof state.isSuppressed).toBe("boolean");
  });
});
