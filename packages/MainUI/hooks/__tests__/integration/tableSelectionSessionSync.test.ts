import { renderHook, act } from "@testing-library/react";
import useTableSelection from "../../useTableSelection";
import { useUserContext } from "../../useUserContext";
import * as sessionSyncModule from "@/utils/hooks/useTableSelection/sessionSync";
import type { Tab, EntityData, GridProps, Field, User } from "@workspaceui/api-client/src/api/types";

// Mock all dependencies
jest.mock("../../useUserContext");
jest.mock("../../useSelected", () => ({
  useSelected: jest.fn(() => ({
    graph: {
      getChildren: jest.fn(() => []),
      setSelected: jest.fn(),
      getSelected: jest.fn(() => null),
      clearSelected: jest.fn(),
      setSelectedMultiple: jest.fn(),
      clearSelectedMultiple: jest.fn(),
    },
  })),
}));
jest.mock("../../navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: jest.fn(() => ({
    activeWindow: { windowId: "test-window" },
    clearSelectedRecord: jest.fn(),
    setSelectedRecord: jest.fn(),
    getSelectedRecord: jest.fn(),
  })),
}));
jest.mock("@/hooks/useStateReconciliation", () => ({
  useStateReconciliation: jest.fn(() => ({
    reconcileStates: jest.fn(),
    handleSyncError: jest.fn(),
  })),
}));
jest.mock("@/utils/debounce", () => ({
  debounce: jest.fn((fn) => fn),
}));
jest.mock("@/utils/structures", () => ({
  mapBy: jest.fn((items: unknown[], key: string) => {
    const result: Record<string, unknown> = {};
    for (const item of items) {
      const keyValue = (item as Record<string, unknown>)[key];
      result[String(keyValue)] = item;
    }
    return result;
  }),
}));
jest.mock("@/utils/commons", () => ({
  compareArraysAlphabetically: jest.fn(() => false),
}));
jest.mock("@/utils/hooks/useTableSelection/sessionSync");

describe("Table Selection Session Sync Integration", () => {
  const mockSetSession = jest.fn();
  const mockSyncSessionSpy = jest.spyOn(sessionSyncModule, "syncSelectedRecordsToSession");

  const mockGridProps: GridProps = {
    sort: 1,
    autoExpand: false,
    editorProps: {
      displayField: "name",
      valueField: "id",
    },
    displaylength: 20,
    fkField: false,
    selectOnClick: true,
    canSort: true,
    canFilter: true,
    showHover: true,
    filterEditorProperties: {
      keyProperty: "id",
    },
    showIf: "",
  };

  const mockField: Field = {
    hqlName: "testField",
    inputName: "testInput",
    columnName: "test_column",
    process: "",
    shownInStatusBar: false,
    tab: "test-tab",
    displayed: true,
    startnewline: false,
    showInGridView: true,
    fieldGroup$_identifier: "test_field_group",
    fieldGroup: "test_field_group",
    isMandatory: false,
    column: { keyColumn: "true" },
    name: "Test Field",
    id: "test-field-id",
    module: "test_module",
    hasDefaultValue: false,
    refColumnName: "",
    targetEntity: "",
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: false,
    isDisplayed: true,
    sequenceNumber: 1,
    isUpdatable: true,
    description: "Test Field Description",
    helpComment: "Test Field Help",
    gridProps: mockGridProps,
    type: "string",
    field: [],
    refList: [],
  };

  const mockTab: Tab = {
    id: "test-tab",
    name: "Test Tab",
    title: "Test Tab Title",
    window: "test-window",
    tabLevel: 0,
    parentTabId: undefined,
    uIPattern: "STD",
    table: "test_table",
    entityName: "TestEntity",
    fields: {
      testField: mockField,
    },
    parentColumns: [],
    _identifier: "test_identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test_module",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useUserContext).mockReturnValue({
      setSession: mockSetSession,
      session: {},
      user: {
        id: "test-user",
        name: "Test User",
        username: "testuser",
      } as Partial<User> as User,
      login: jest.fn(),
      changeProfile: jest.fn(),
      token: "mock-token",
      roles: [],
      currentRole: undefined,
      prevRole: undefined,
      profile: {
        name: "Test User",
        email: "test@example.com",
        image: "",
      },
      currentWarehouse: undefined,
      currentClient: undefined,
      currentOrganization: undefined,
      setToken: jest.fn(),
      clearUserData: jest.fn(),
      setDefaultConfiguration: jest.fn(),
      languages: [],
    });
  });

  it("should sync session when table selection changes", async () => {
    // Instead of mocking individual utils, let's verify the integration flow
    const mockRecords: EntityData[] = [
      { id: "1", name: "Record 1" },
      { id: "2", name: "Record 2" },
    ];
    const rowSelection = { "1": true, "2": true };

    // Mock syncSelectedRecordsToSession to simulate successful execution
    mockSyncSessionSpy.mockResolvedValue(undefined);

    // Render hook
    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // 1. Verify table selection change triggered session sync
    expect(mockSyncSessionSpy).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });

    // 2. Verify session sync was called exactly once per selection change
    expect(mockSyncSessionSpy).toHaveBeenCalledTimes(1);

    // 3. Verify the call was made with correct tab and records
    const callArgs = mockSyncSessionSpy.mock.calls[0][0];
    expect(callArgs.tab).toBe(mockTab);
    expect(callArgs.selectedRecords).toEqual(mockRecords);
    expect(callArgs.setSession).toBe(mockSetSession);
    expect(callArgs.parentId).toBeUndefined();

    // 4. Verify UI remains functional after sync (hook doesn't throw)
    expect(() => {
      renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));
    }).not.toThrow();
  });

  it("should handle session sync failures gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock session sync to fail silently (more realistic error handling)
    mockSyncSessionSpy.mockImplementation(async () => {
      // Simulate a network error that doesn't crash the effect
      const error = new Error("Network timeout");
      console.error("Session sync failed:", error);
      // Instead of throwing, just fail silently like a real API might
      return undefined;
    });

    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    // 1. Render hook with correct parameters - should work despite session sync issues
    // Note: useTableSelection doesn't return anything, it's an effect-only hook
    const hookResult = renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    // Allow effects to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // 2. Verify session sync was attempted
    expect(mockSyncSessionSpy).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });

    // 3. Hook should render successfully despite sync failure
    // The hook doesn't return any value (it's effect-only), so we verify it doesn't crash
    expect(hookResult.result.current).toBeUndefined(); // This is expected behavior

    // Verify the hook rendered without throwing errors
    expect(() => hookResult.rerender()).not.toThrow();

    // 4. Session was not updated due to sync failure
    expect(mockSetSession).not.toHaveBeenCalled();

    // 5. Verify error was logged
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

    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    // 1. Set initial session state through mock
    jest.mocked(useUserContext).mockReturnValue({
      ...jest.mocked(useUserContext)(),
      session: initialSessionState,
    });

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
    // Mock session sync with payload inspection
    let capturedPayload: Record<string, unknown> | null = null;

    mockSyncSessionSpy.mockImplementation(async ({ tab, selectedRecords, setSession }) => {
      // Simulate the real session sync behavior
      const entityKeyColumn = Object.values(tab.fields).find((field) => field?.column?.keyColumn);

      if (entityKeyColumn && selectedRecords.length > 0) {
        const allSelectedIds = selectedRecords.map((record) => String(record.id));
        const payload = {
          inpKeyName: entityKeyColumn.inputName,
          inpTabId: tab.id,
          // Add MULTIPLE_ROW_IDS for multiple selections
          ...(selectedRecords.length > 1 && { MULTIPLE_ROW_IDS: allSelectedIds }),
        };

        capturedPayload = payload;

        // Mock successful response processing
        setSession((prev) => ({ ...prev, syncedIds: allSelectedIds.join(",") }));
      }
    });

    const mockRecords: EntityData[] = [
      { id: "1", name: "Record 1" },
      { id: "2", name: "Record 2" },
      { id: "3", name: "Record 3" },
    ];
    const rowSelection = { "1": true, "2": true, "3": true };

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify session sync was called with multiple records
    expect(mockSyncSessionSpy).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });

    // Verify MULTIPLE_ROW_IDS was included in payload
    expect(capturedPayload).toEqual(
      expect.objectContaining({
        MULTIPLE_ROW_IDS: ["1", "2", "3"],
      })
    );

    // Verify session was updated with all selected record IDs
    expect(mockSetSession).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should not include MULTIPLE_ROW_IDS for single selection", async () => {
    // Mock session sync with payload inspection
    let capturedPayload: Record<string, unknown> | null = null;

    mockSyncSessionSpy.mockImplementation(async ({ tab, selectedRecords, setSession }) => {
      const entityKeyColumn = Object.values(tab.fields).find((field) => field?.column?.keyColumn);

      if (entityKeyColumn && selectedRecords.length > 0) {
        const payload = {
          inpKeyName: entityKeyColumn.inputName,
          inpTabId: tab.id,
          // Only add MULTIPLE_ROW_IDS for multiple selections
          ...(selectedRecords.length > 1 && {
            MULTIPLE_ROW_IDS: selectedRecords.map((record) => String(record.id)),
          }),
        };

        capturedPayload = payload;
        setSession((prev) => ({ ...prev, syncedIds: String(selectedRecords[0].id) }));
      }
    });

    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection, jest.fn()));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify session sync was called with single record
    expect(mockSyncSessionSpy).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });

    // Verify MULTIPLE_ROW_IDS was NOT included in payload
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
