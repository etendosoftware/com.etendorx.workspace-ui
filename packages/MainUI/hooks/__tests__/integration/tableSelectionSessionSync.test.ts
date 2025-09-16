import { renderHook, act } from "@testing-library/react";
import useTableSelection from "../../useTableSelection";
import { useUserContext } from "../../useUserContext";
import * as sessionSyncModule from "@/utils/hooks/useTableSelection/sessionSync";
import {
  createMockTab,
  createMockEntityRecords,
  createMockUserContext,
  setupCommonTestMocks,
  setupTableSelectionMockImplementations,
  createTableSelectionTestHelpers,
} from "@/utils/tests/mockHelpers";

// Mock modules at the top level - this is where jest.mock() calls belong
jest.mock("../../useUserContext");
jest.mock("../../useSelected", () => ({
  useSelected: jest.fn(),
}));
jest.mock("../../navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: jest.fn(),
}));
jest.mock("@/hooks/useStateReconciliation", () => ({
  useStateReconciliation: jest.fn(),
}));
jest.mock("@/utils/debounce", () => ({
  debounce: jest.fn(),
}));
jest.mock("@/utils/structures", () => ({
  mapBy: jest.fn(),
}));
jest.mock("@/utils/commons", () => ({
  compareArraysAlphabetically: jest.fn(),
}));
jest.mock("@/utils/hooks/useTableSelection/sessionSync");

describe("Table Selection Session Sync Integration", () => {
  const mockSetSession = jest.fn();
  const mockSyncSessionSpy = jest.spyOn(sessionSyncModule, "syncSelectedRecordsToSession");
  const mockTab = createMockTab();

  // Get test helpers to reduce code duplication
  const { renderHookAndWait, expectSessionSyncCall, createSessionSyncMockWithPayloadInspection } =
    createTableSelectionTestHelpers();

  beforeEach(() => {
    setupCommonTestMocks();
    setupTableSelectionMockImplementations();

    jest.mocked(useUserContext).mockReturnValue(
      createMockUserContext({
        setSession: mockSetSession,
      })
    );
  });

  it("should sync session when table selection changes", async () => {
    const mockRecords = createMockEntityRecords(2);
    const rowSelection = { "1": true, "2": true };

    // Mock syncSelectedRecordsToSession to simulate successful execution
    mockSyncSessionSpy.mockResolvedValue(undefined);

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSyncSessionSpy, mockTab, mockRecords, mockSetSession);

    // Verify session sync was called exactly once per selection change
    expect(mockSyncSessionSpy).toHaveBeenCalledTimes(1);

    // Verify the call arguments in detail
    const callArgs = mockSyncSessionSpy.mock.calls[0][0];
    expect(callArgs.tab).toBe(mockTab);
    expect(callArgs.selectedRecords).toEqual(mockRecords);
    expect(callArgs.setSession).toBe(mockSetSession);
    expect(callArgs.parentId).toBeUndefined();

    // Verify UI remains functional after sync (hook doesn't throw)
    expect(() => {
      renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));
    }).not.toThrow();
  });

  it("should handle session sync failures gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Mock session sync to fail silently (more realistic error handling)
    mockSyncSessionSpy.mockImplementation(async () => {
      const error = new Error("Network timeout");
      console.error("Session sync failed:", error);
      return undefined;
    });

    // Use helper to render hook and wait for effects
    const hookResult = await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSyncSessionSpy, mockTab, mockRecords, mockSetSession);

    // Hook should render successfully despite sync failure
    expect(hookResult.result.current).toBeUndefined();
    expect(() => hookResult.rerender()).not.toThrow();

    // Session was not updated due to sync failure
    expect(mockSetSession).not.toHaveBeenCalled();

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Session sync failed:",
      expect.objectContaining({ message: "Network timeout" })
    );

    consoleSpy.mockRestore();
  });

  it("should merge session attributes correctly", async () => {
    // Mock initial session state
    const initialSessionState = {
      existingField: "existingValue",
      existingAttr: "existingAttrValue",
    };

    const mockProcessedAttributes = {
      newField1: "newValue1",
      newField2: "newValue2",
      newAttr1: "newAttrValue1",
      existingAttr: "updatedAttrValue",
    };

    // Mock session sync to update session correctly
    mockSyncSessionSpy.mockImplementation(async ({ setSession }) => {
      setSession((prev) => ({
        ...prev,
        ...mockProcessedAttributes,
      }));
    });

    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // 1. Set initial session state through mock
    jest.mocked(useUserContext).mockReturnValue(
      createMockUserContext({
        setSession: mockSetSession,
        session: initialSessionState,
      })
    );

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // 2. Select records to trigger session sync
    expect(mockSyncSessionSpy).toHaveBeenCalled();

    // 3. Verify new attributes are merged with existing ones
    expect(mockSetSession).toHaveBeenCalledWith(expect.any(Function));

    // Test the merge function
    const mergeFunction = mockSetSession.mock.calls[0][0];
    const mergedResult = mergeFunction(initialSessionState);

    // 4. Verify existing attributes are preserved and new ones added
    expect(mergedResult).toEqual({
      existingField: "existingValue", // Preserved
      existingAttr: "updatedAttrValue", // Updated
      newField1: "newValue1", // Added
      newField2: "newValue2", // Added
      newAttr1: "newAttrValue1", // Added
    });
  });

  it("should handle multiple selection with MULTIPLE_ROW_IDS", async () => {
    const mockRecords = createMockEntityRecords(3);
    const rowSelection = { "1": true, "2": true, "3": true };

    // Use helper for payload inspection setup
    const { mockImplementation, getCapturedPayload } = createSessionSyncMockWithPayloadInspection();
    mockSyncSessionSpy.mockImplementation(mockImplementation);

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSyncSessionSpy, mockTab, mockRecords, mockSetSession);

    // Verify MULTIPLE_ROW_IDS was included in payload
    const capturedPayload = getCapturedPayload();
    expect(capturedPayload).toEqual(
      expect.objectContaining({
        MULTIPLE_ROW_IDS: ["1", "2", "3"],
      })
    );

    // Verify session was updated with all selected record IDs
    expect(mockSetSession).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should not include MULTIPLE_ROW_IDS for single selection", async () => {
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Use helper for payload inspection setup
    const { mockImplementation, getCapturedPayload } = createSessionSyncMockWithPayloadInspection();
    mockSyncSessionSpy.mockImplementation(mockImplementation);

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSyncSessionSpy, mockTab, mockRecords, mockSetSession);

    // Verify MULTIPLE_ROW_IDS was NOT included in payload
    const capturedPayload = getCapturedPayload();
    expect(capturedPayload).not.toHaveProperty("MULTIPLE_ROW_IDS");

    // Verify payload contains standard fields
    expect(capturedPayload).toEqual(
      expect.objectContaining({
        inpKeyName: "testInput",
        inpTabId: "test-tab",
      })
    );
  });
});
