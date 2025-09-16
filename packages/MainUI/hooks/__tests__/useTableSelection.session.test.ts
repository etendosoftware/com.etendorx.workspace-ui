import { renderHook, act } from "@testing-library/react";
import useTableSelection from "../useTableSelection";
import * as sessionSync from "@/utils/hooks/useTableSelection/sessionSync";
import { useUserContext } from "../useUserContext";
import {
  createMockTab,
  createMockEntityRecords,
  createMockUserContext,
  setupCommonTestMocks,
  setupTableSelectionMockImplementations,
  createTableSelectionTestHelpers,
} from "@/utils/tests/mockHelpers";

// Mock modules at the top level - this is where jest.mock() calls belong
jest.mock("../useUserContext");
jest.mock("../useSelected", () => ({
  useSelected: jest.fn(),
}));
jest.mock("../navigation/useMultiWindowURL", () => ({
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

describe("useTableSelection - Session Sync Integration", () => {
  const mockSetSession = jest.fn();
  const mockSessionSync = jest.spyOn(sessionSync, "syncSelectedRecordsToSession");
  const mockTab = createMockTab();

  // Get test helpers to reduce code duplication
  const { renderHookAndWait, expectSessionSyncCall } = createTableSelectionTestHelpers();

  beforeEach(() => {
    setupCommonTestMocks();
    setupTableSelectionMockImplementations();

    jest.mocked(useUserContext).mockReturnValue(
      createMockUserContext({
        setSession: mockSetSession,
      })
    );
  });

  it("should call session sync when selection changes", async () => {
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSessionSync, mockTab, mockRecords, mockSetSession);
  });

  it("should pass parentId when provided", async () => {
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };
    const parentId = "parent-123";

    const tabWithParent = createMockTab({
      parentTabId: parentId,
    });

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(tabWithParent, mockRecords, rowSelection));

    // Use helper for common session sync assertion with parentId
    expectSessionSyncCall(mockSessionSync, tabWithParent, mockRecords, mockSetSession, parentId);
  });

  it("should handle session sync errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Mock sessionSync to throw an error
    mockSessionSync.mockImplementationOnce(() => {
      throw new Error("Session sync failed");
    });

    // Render the hook and wait for effects, expecting an error to be thrown
    let hookError: Error | null = null;

    try {
      await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection));
    } catch (error) {
      hookError = error as Error;
    }

    // Verify that session sync was attempted
    expect(mockSessionSync).toHaveBeenCalled();

    // Verify that the error was thrown (which is the current behavior)
    expect(hookError).toBeTruthy();
    expect(hookError?.message).toBe("Session sync failed");

    consoleSpy.mockRestore();
  });

  it("should not call session sync when selection is empty", async () => {
    const mockRecords = createMockEntityRecords(0);
    const rowSelection = {};

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection));

    expect(mockSessionSync).not.toHaveBeenCalled();
  });

  it("should maintain existing hook behavior", async () => {
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Use helper to render hook and wait for effects
    const { unmount } = await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection));

    // Verify that session sync was called (maintaining core functionality)
    expect(mockSessionSync).toHaveBeenCalled();

    // Hook should be able to unmount cleanly
    expect(() => unmount()).not.toThrow();
  });

  it("should call session sync for multiple selected records", async () => {
    const mockRecords = createMockEntityRecords(3);
    const rowSelection = { "1": true, "2": true, "3": true };

    // Use helper to render hook and wait for effects
    await renderHookAndWait(() => useTableSelection(mockTab, mockRecords, rowSelection));

    // Use helper for common session sync assertion
    expectSessionSyncCall(mockSessionSync, mockTab, mockRecords, mockSetSession);
  });

  it("should pass setSession function from useUserContext", async () => {
    const customSetSession = jest.fn();
    const mockRecords = createMockEntityRecords(1);
    const rowSelection = { "1": true };

    // Reset mock before setting up custom one
    setupCommonTestMocks();
    setupTableSelectionMockImplementations();

    jest.mocked(useUserContext).mockReturnValue(
      createMockUserContext({
        setSession: customSetSession,
      })
    );

    const { rerender } = renderHook(({ records, selection }) => useTableSelection(mockTab, records, selection), {
      initialProps: {
        records: mockRecords,
        selection: rowSelection,
      },
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Force re-render to trigger useEffect
    rerender({
      records: mockRecords,
      selection: rowSelection,
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Use helper for common session sync assertion with custom setSession
    expectSessionSyncCall(mockSessionSync, mockTab, mockRecords, customSetSession);
  });
});
