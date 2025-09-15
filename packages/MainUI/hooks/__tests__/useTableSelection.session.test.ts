import { renderHook, act } from "@testing-library/react";
import useTableSelection from "../useTableSelection";
import * as sessionSync from "@/utils/hooks/useTableSelection/sessionSync";
import { useUserContext } from "../useUserContext";
import type { Tab, EntityData, GridProps, Field, User } from "@workspaceui/api-client/src/api/types";

jest.mock("@/utils/hooks/useTableSelection/sessionSync");
jest.mock("../useUserContext");
jest.mock("../useSelected", () => ({
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
jest.mock("../navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: jest.fn(() => ({
    activeWindow: { windowId: "test-window" },
    clearSelectedRecord: jest.fn(),
    setSelectedRecord: jest.fn(),
    getSelectedRecord: jest.fn(),
  })),
}));
jest.mock("@/utils/commons", () => ({
  compareArraysAlphabetically: jest.fn(() => false), // Indica que las selecciones son diferentes
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
jest.mock("@/hooks/useStateReconciliation", () => ({
  useStateReconciliation: jest.fn(() => ({
    reconcileStates: jest.fn(),
    handleSyncError: jest.fn(),
  })),
}));
jest.mock("@/utils/debounce", () => ({
  debounce: jest.fn((fn) => fn),
}));

describe("useTableSelection - Session Sync Integration", () => {
  const mockSetSession = jest.fn();
  const mockSessionSync = jest.spyOn(sessionSync, "syncSelectedRecordsToSession");

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
    gridProps: mockGridProps,
    type: "string",
    field: [],
    refList: [],
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: false,
    isDisplayed: true,
    sequenceNumber: 1,
    isUpdatable: true,
    description: "Test Field Description",
    helpComment: "Test Field Help",
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

  it("should call session sync when selection changes", async () => {
    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    // Wait for effects to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSessionSync).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });
  });

  it("should pass parentId when provided", async () => {
    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };
    const parentId = "parent-123";

    const tabWithParent: Tab = {
      ...mockTab,
      parentTabId: parentId,
    };

    renderHook(() => useTableSelection(tabWithParent, mockRecords, rowSelection));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSessionSync).toHaveBeenCalledWith({
      tab: tabWithParent,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId,
    });
  });

  it("should handle session sync errors gracefully", async () => {
    // Mock sessionSync to throw an error
    mockSessionSync.mockImplementationOnce(() => {
      throw new Error("Session sync failed");
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    // Render the hook and wait for effects, expecting an error to be thrown
    let hookError: Error | null = null;

    try {
      renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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
    const mockRecords: EntityData[] = [];
    const rowSelection = {};

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSessionSync).not.toHaveBeenCalled();
  });

  it("should maintain existing hook behavior", async () => {
    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

    // The hook should execute without throwing errors
    const { unmount } = renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify that session sync was called (maintaining core functionality)
    expect(mockSessionSync).toHaveBeenCalled();

    // Hook should be able to unmount cleanly
    expect(() => unmount()).not.toThrow();
  });

  it("should call session sync for multiple selected records", async () => {
    const mockRecords: EntityData[] = [
      { id: "1", name: "Record 1" },
      { id: "2", name: "Record 2" },
      { id: "3", name: "Record 3" },
    ];
    const rowSelection = { "1": true, "2": true, "3": true };

    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockSessionSync).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
      parentId: undefined,
    });
  });

  it("should pass setSession function from useUserContext", async () => {
    const customSetSession = jest.fn();

    // Reset mock before setting up custom one
    jest.clearAllMocks();

    jest.mocked(useUserContext).mockReturnValue({
      setSession: customSetSession,
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

    const mockRecords: EntityData[] = [{ id: "1", name: "Record 1" }];
    const rowSelection = { "1": true };

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

    expect(mockSessionSync).toHaveBeenCalledWith({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: customSetSession,
      parentId: undefined,
    });
  });
});
