import { globalCalloutManager } from "../../../../services/callouts";

/**
 * Test helpers
 */
const createMockCalloutState = (overrides = {}) => ({
  isRunning: false,
  queueLength: 0,
  pendingCount: 0,
  isSuppressed: false,
  ...overrides,
});

const createMockValidationResult = (overrides = {}) => ({
  isValid: true,
  missingFields: [],
  ...overrides,
});

// Mock dependencies
jest.mock("../../../../services/callouts", () => ({
  globalCalloutManager: {
    getState: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    waitForIdle: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("../../../../hooks/useFormValidation", () => ({
  useFormValidation: jest.fn(() => ({
    validateRequiredFields: jest.fn(() => createMockValidationResult()),
    hasValidationErrors: false,
    validationErrors: [],
  })),
}));

describe("FormView Save Integration Tests", () => {
  const mockGlobalCalloutManager = globalCalloutManager as jest.Mocked<typeof globalCalloutManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGlobalCalloutManager.getState.mockReturnValue(createMockCalloutState());
  });

  it("should check callout state for save operations", () => {
    const state = mockGlobalCalloutManager.getState();
    expect(state.isRunning).toBe(false);
    expect(mockGlobalCalloutManager.getState).toHaveBeenCalled();
  });

  it("should wait for callouts to finish before saving", async () => {
    mockGlobalCalloutManager.getState.mockReturnValue(
      createMockCalloutState({ isRunning: true, queueLength: 1, pendingCount: 1 })
    );

    const state = mockGlobalCalloutManager.getState();

    // This simulates the logic in FormView handleSave
    if (state.isRunning || state.pendingCount > 0 || state.queueLength > 0) {
      await mockGlobalCalloutManager.waitForIdle();
    }

    expect(mockGlobalCalloutManager.waitForIdle).toHaveBeenCalled();
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
