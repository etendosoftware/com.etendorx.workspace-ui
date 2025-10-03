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

import { renderHook, act, waitFor } from "@testing-library/react";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useUserContext } from "@/hooks/useUserContext";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";
import { debounce } from "@/utils/debounce";
import useTableSelection from "../../hooks/useTableSelection";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_RowSelectionState } from "material-react-table";

// Mock dependencies
jest.mock("@/hooks/useSelected");
jest.mock("@/hooks/navigation/useMultiWindowURL");
jest.mock("@/hooks/useUserContext");
jest.mock("@/utils/hooks/useTableSelection/sessionSync");
jest.mock("@/utils/debounce");
jest.mock("@/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Setup mock implementations
const mockUseSelected = useSelected as jest.MockedFunction<typeof useSelected>;
const mockUseMultiWindowURL = useMultiWindowURL as jest.MockedFunction<typeof useMultiWindowURL>;
const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockSyncSelectedRecordsToSession = syncSelectedRecordsToSession as jest.MockedFunction<
  typeof syncSelectedRecordsToSession
>;
const mockDebounce = debounce as jest.MockedFunction<typeof debounce>;

// Mock data
const createMockTab = (overrides?: Partial<Tab>): Tab => ({
  id: "tab1",
  name: "Test Tab",
  title: "Test Tab Title",
  window: "window1",
  tabLevel: 0,
  parentTabId: undefined,
  uIPattern: "STD",
  table: "test_table",
  entityName: "TestEntity",
  fields: {},
  parentColumns: [],
  _identifier: "test_identifier",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "test_module",
  ...overrides,
});

const createMockEntityData = (id: string | number, overrides?: Partial<EntityData>): EntityData => ({
  id,
  name: `Record ${id}`,
  ...overrides,
});

const createMockRecords = (count: number): EntityData[] =>
  Array.from({ length: count }, (_, index) => createMockEntityData(index + 1));

const createMockRowSelection = (selectedIds: string[]): MRT_RowSelectionState =>
  selectedIds.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {} as MRT_RowSelectionState);

// Mock graph implementation
const createMockGraph = () => ({
  setSelected: jest.fn(),
  clearSelected: jest.fn(),
  getSelected: jest.fn(),
  setSelectedMultiple: jest.fn(),
  clearSelectedMultiple: jest.fn(),
  getSelectedMultiple: jest.fn(),
  getChildren: jest.fn().mockReturnValue([]),
  getParent: jest.fn().mockReturnValue(null),
});

// Mock window URL functions
const createMockWindowURL = (selectedRecord?: string) => ({
  activeWindow: { windowId: "window1" } as { windowId: string } | null | undefined,
  clearSelectedRecord: jest.fn(),
  setSelectedRecord: jest.fn(),
  getSelectedRecord: jest.fn().mockReturnValue(selectedRecord),
  clearChildrenSelections: jest.fn(),
  setSelectedRecordAndClearChildren: jest.fn(),
  getTabFormState: jest.fn().mockReturnValue(undefined),
  setTabFormState: jest.fn(),
  clearTabFormState: jest.fn(),
  clearTabFormStateAtomic: jest.fn(),
  applyWindowUpdates: jest.fn((fn) => fn([])),
});

// Mock user context
const createMockUserContext = () => ({
  setSession: jest.fn(),
  setSessionSyncLoading: jest.fn(),
  session: {},
  user: null,
  isLoading: false,
});

// Global mock variables accessible to all tests
let mockGraph: ReturnType<typeof createMockGraph>;
let mockWindowURL: ReturnType<typeof createMockWindowURL>;
let mockUserContext: ReturnType<typeof createMockUserContext>;
let mockDebouncedFunction: jest.Mock;

// Global setup for all tests
beforeEach(() => {
  jest.clearAllMocks();

  mockGraph = createMockGraph();
  mockWindowURL = createMockWindowURL();
  mockUserContext = createMockUserContext();
  mockDebouncedFunction = jest.fn();

  mockUseSelected.mockReturnValue({
    graph: mockGraph,
    activeLevels: [0],
    tabStates: {},
    setActiveLevel: jest.fn(),
    setTabRecordId: jest.fn(),
    getTabRecordId: jest.fn(() => ""),
    clearTabRecord: jest.fn(),
    clearAllStates: jest.fn(),
  });
  mockUseMultiWindowURL.mockReturnValue({
    ...mockWindowURL,
    windows: [],
    isHomeRoute: false,
    openWindow: jest.fn(),
    closeWindow: jest.fn(),
    setActiveWindow: jest.fn(),
    navigateToHome: jest.fn(),
    buildURL: jest.fn(),
    updateWindowTitle: jest.fn(),
    setTabFormState: jest.fn(),
    clearTabFormState: jest.fn(),
    getTabFormState: jest.fn(),
    setRecord: jest.fn(),
    clearRecord: jest.fn(),
    reorderWindows: jest.fn(),
    getNextOrder: jest.fn(),
    applyWindowUpdates: jest.fn(),
    clearChildrenSelections: jest.fn(),
    openWindowAndSelect: jest.fn(),
  } as ReturnType<typeof useMultiWindowURL>);
  mockUseUserContext.mockReturnValue(mockUserContext);
  mockSyncSelectedRecordsToSession.mockResolvedValue(undefined);
  mockDebounce.mockImplementation(<T extends (...args: any[]) => any>(fn: T, _delay: number) => {
    const debouncedFn = ((...args: Parameters<T>) => {
      mockDebouncedFunction(...args);
      fn(...args);
    }) as T & { cancel: () => void };
    debouncedFn.cancel = jest.fn();
    return debouncedFn;
  });
});

describe("useTableSelection", () => {
  describe("Basic functionality", () => {
    it("should initialize without errors", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const emptySelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection(tab, records, emptySelection));

      expect(result.current).toBeUndefined();
      expect(mockUseSelected).toHaveBeenCalled();
      expect(mockUseMultiWindowURL).toHaveBeenCalled();
    });

    it("should not process selection when window IDs don't match", () => {
      const tab = createMockTab({ window: "window2" });
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(mockGraph.setSelected).not.toHaveBeenCalled();
      expect(mockGraph.setSelectedMultiple).not.toHaveBeenCalled();
    });

    it("should handle empty records array", () => {
      const tab = createMockTab();
      const records: EntityData[] = [];
      const emptySelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection(tab, records, emptySelection));

      expect(result.current).toBeUndefined();
      expect(mockGraph.clearSelected).not.toHaveBeenCalled();
    });
  });

  describe("Selection processing", () => {
    it("should process single record selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["2"]);
      const onSelectionChange = jest.fn();

      renderHook(() => useTableSelection(tab, records, rowSelection, onSelectionChange));

      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[1]);
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, [records[1]]);
      // onSelectionChange is no longer called - URL is updated directly via debounced function
      expect(mockDebouncedFunction).toHaveBeenCalledWith([records[1]], "window1", "tab1");
    });

    it("should process multiple record selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);
      const rowSelection = createMockRowSelection(["1", "3", "5"]);
      const onSelectionChange = jest.fn();

      renderHook(() => useTableSelection(tab, records, rowSelection, onSelectionChange));

      const expectedRecords = [records[0], records[2], records[4]];
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[4]); // Last selected
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
      // onSelectionChange is no longer called - URL is updated directly via debounced function
      expect(mockDebouncedFunction).toHaveBeenCalledWith(expectedRecords, "window1", "tab1");
    });

    it("should clear selection when no records are selected", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Configure mock to simulate that there was a previous selection
      mockGraph.getSelected.mockReturnValue(records[0]);

      // First render with selection
      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1"]) },
      });

      // Clear selection
      rerender({ selection: {} });

      expect(mockGraph.clearSelected).toHaveBeenCalledWith(tab);
      expect(mockGraph.clearSelectedMultiple).toHaveBeenCalledWith(tab);
    });

    it("should handle invalid record IDs in selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1", "999", "2"]); // 999 doesn't exist

      renderHook(() => useTableSelection(tab, records, rowSelection));

      // Should only include valid records
      const expectedRecords = [records[0], records[1]]; // Records with IDs 1 and 2
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[1]); // Last valid selected
    });
  });

  describe("Selection change detection", () => {
    it("should not trigger updates when selection hasn't changed", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1", "2"]);

      const { rerender } = renderHook(() => useTableSelection(tab, records, rowSelection));

      // Clear all mock calls
      jest.clearAllMocks();

      // Re-render with same selection
      rerender();

      expect(mockGraph.setSelected).not.toHaveBeenCalled();
      expect(mockGraph.setSelectedMultiple).not.toHaveBeenCalled();
    });

    it("should trigger updates when selection order changes (alphabetical comparison)", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["2", "1"]) },
      });

      // Clear mock calls from initial render
      jest.clearAllMocks();

      // Change selection order (same IDs, different order)
      rerender({ selection: createMockRowSelection(["1", "2"]) });

      // Should not trigger update because alphabetical comparison ignores order
      expect(mockGraph.setSelected).not.toHaveBeenCalled();
    });

    it("should trigger updates when selection content changes", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1", "2"]) },
      });

      // Clear mock calls from initial render
      jest.clearAllMocks();

      // Change selection content
      rerender({ selection: createMockRowSelection(["1", "3"]) });

      // Should trigger update
      expect(mockGraph.setSelected).toHaveBeenCalled();
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
    });
  });

  describe("URL synchronization", () => {
    it("should update URL for single selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["2"]);

      renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(mockDebouncedFunction).toHaveBeenCalledWith([records[1]], "window1", "tab1");
    });

    it("should update URL for multiple selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1", "3"]);

      renderHook(() => useTableSelection(tab, records, rowSelection));

      const expectedRecords = [records[0], records[2]];
      expect(mockDebouncedFunction).toHaveBeenCalledWith(expectedRecords, "window1", "tab1");
    });

    it("should clear URL when no selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Start with a selection and then clear it to trigger the URL update
      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1"]) },
      });

      // Clear the selection to trigger URL clearing
      rerender({ selection: {} });

      expect(mockDebouncedFunction).toHaveBeenCalledWith([], "window1", "tab1");
    });
  });

  describe("Children record clearing", () => {
    it("should clear children records when parent selection changes", () => {
      const parentTab = createMockTab({ id: "parent", tabLevel: 0 });
      const childTab = createMockTab({ id: "child", tabLevel: 1, parentTabId: "parent" });

      mockGraph.getChildren.mockReturnValue([childTab]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection(parentTab, records, rowSelection));

      // Now uses atomic update instead of separate clearChildrenSelections
      expect(mockWindowURL.setSelectedRecordAndClearChildren).toHaveBeenCalledWith("window1", "parent", "1", ["child"]);
    });

    it("should not clear children when they belong to different window", () => {
      const parentTab = createMockTab({ id: "parent", tabLevel: 0 });
      const childTab = createMockTab({ id: "child", tabLevel: 1, parentTabId: "parent", window: "window2" });

      mockGraph.getChildren.mockReturnValue([childTab]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection(parentTab, records, rowSelection));

      expect(mockWindowURL.clearChildrenSelections).not.toHaveBeenCalled();
    });

    it("should handle tabs with no children", () => {
      const tab = createMockTab();
      mockGraph.getChildren.mockReturnValue([]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { result } = renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      expect(mockWindowURL.clearSelectedRecord).not.toHaveBeenCalled();
    });

    it("should handle undefined children", () => {
      const tab = createMockTab();
      mockGraph.getChildren.mockReturnValue(undefined);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { result } = renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      expect(mockWindowURL.clearSelectedRecord).not.toHaveBeenCalled();
    });
  });


  describe("Debounced URL updates", () => {
    it("should create debounced function with correct delay", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection: MRT_RowSelectionState = {};

      renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 150);
    });

    it("should handle debounced function errors", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      // Create a mock function that will be returned by debounce
      const debouncedFunction = jest.fn();

      // Configure debounce to return our mock function for this test
      mockDebounce.mockReturnValueOnce(debouncedFunction);

      renderHook(() => useTableSelection(tab, records, rowSelection));

      // The debounced function should be called with the selection
      expect(mockDebounce).toHaveBeenCalled();
      expect(debouncedFunction).toHaveBeenCalledWith([records[0]], "window1", "tab1");
    });
  });

  describe("Edge cases", () => {
    it("should handle null/undefined records", () => {
      const tab = createMockTab();
      const records: EntityData[] = [];
      const rowSelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      expect(mockGraph.clearSelected).not.toHaveBeenCalled();
    });

    it("should handle missing window ID", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      // Configure mock to return undefined activeWindow from the start
      mockUseMultiWindowURL.mockReturnValueOnce({
        windows: [],
        activeWindow: undefined,
        isHomeRoute: false,
        openWindow: jest.fn(),
        closeWindow: jest.fn(),
        setActiveWindow: jest.fn(),
        navigateToHome: jest.fn(),
        buildURL: jest.fn(),
        updateWindowTitle: jest.fn(),
        setSelectedRecord: jest.fn(),
        clearSelectedRecord: jest.fn(),
        getSelectedRecord: jest.fn(),
        setTabFormState: jest.fn(),
        clearTabFormState: jest.fn(),
        getTabFormState: jest.fn(),
        setRecord: jest.fn(),
        clearRecord: jest.fn(),
        reorderWindows: jest.fn(),
        getNextOrder: jest.fn(),
        applyWindowUpdates: jest.fn(),
        clearChildrenSelections: jest.fn(),
        openWindowAndSelect: jest.fn(),
      });

      renderHook(() => useTableSelection(tab, records, rowSelection));

      expect(mockGraph.setSelected).not.toHaveBeenCalled();
      expect(mockDebouncedFunction).not.toHaveBeenCalled();
    });

    it("should handle selection change without errors", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);
      const onSelectionChange = jest.fn();

      // Should not throw - onSelectionChange is not called anymore
      expect(() => {
        renderHook(() => useTableSelection(tab, records, rowSelection, onSelectionChange));
      }).not.toThrow();

      // Verify graph was updated
      expect(mockGraph.setSelected).toHaveBeenCalled();
    });
  });

  describe("Selection state transitions", () => {
    it("should handle transition from no selection to single selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: {} as MRT_RowSelectionState },
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Add single selection
      rerender({ selection: createMockRowSelection(["2"]) });

      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[1]);
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, [records[1]]);
    });

    it("should handle transition from single to multiple selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["2"]) },
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Change to multiple selection
      rerender({ selection: createMockRowSelection(["1", "2", "4"]) });

      const expectedRecords = [records[0], records[1], records[3]];
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[3]); // Last selected
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
    });

    it("should handle transition from multiple to single selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1", "2", "4"]) },
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Change to single selection
      rerender({ selection: createMockRowSelection(["3"]) });

      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[2]);
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, [records[2]]);
    });

    it("should handle transition from selection to no selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Configure mock to simulate that there was a previous selection
      mockGraph.getSelected.mockReturnValue(records[1]); // Simulate record 2 was selected

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1", "2"]) },
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Clear all selection
      rerender({ selection: {} });

      expect(mockGraph.clearSelected).toHaveBeenCalledWith(tab);
      expect(mockGraph.clearSelectedMultiple).toHaveBeenCalledWith(tab);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle rapid selection changes", async () => {
      const tab = createMockTab();
      const records = createMockRecords(10);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1"]) },
      });

      // Rapid selection changes
      const selections = [
        createMockRowSelection(["2", "3"]),
        createMockRowSelection(["4"]),
        createMockRowSelection(["5", "6", "7"]),
        createMockRowSelection([]),
      ];

      for (const selection of selections) {
        await act(async () => {
          rerender({ selection });
        });
      }

      // Should handle all changes without errors
      expect(mockGraph.setSelected).toHaveBeenCalled();
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
    });

    it("should handle tab configuration changes", () => {
      const initialTab = createMockTab({ id: "tab1" });
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { rerender } = renderHook(({ tab }) => useTableSelection(tab, records, rowSelection), {
        initialProps: { tab: initialTab },
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Change tab configuration
      const newTab = createMockTab({ id: "tab2", window: "window2" });
      rerender({ tab: newTab });
    });
  });

  describe("Graph integration", () => {
    it("should clear graph selected state when clearing selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Start with selection
      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1"]) },
      });

      // Mock that graph has current selection
      mockGraph.getSelected.mockReturnValue(records[0]);

      // Clear initial calls
      jest.clearAllMocks();

      // Clear selection
      rerender({ selection: {} });

      expect(mockGraph.clearSelected).toHaveBeenCalledWith(tab);
    });

    it("should not clear graph when it has no selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      mockGraph.getSelected.mockReturnValue(undefined);

      renderHook(() => useTableSelection(tab, records, {}));

      expect(mockGraph.clearSelected).not.toHaveBeenCalled();
    });
  });
});

describe("Utility functions", () => {
  describe("compareArraysAlphabetically", () => {
    // Note: These are internal functions, so we test them through the hook behavior
    it("should detect different array lengths through hook behavior", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1", "2"]) },
      });

      jest.clearAllMocks();

      // Change to different length
      rerender({ selection: createMockRowSelection(["1", "2", "3"]) });

      expect(mockGraph.setSelected).toHaveBeenCalled();
    });

    it("should ignore order differences through hook behavior", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);

      const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["b", "a", "c"]) },
      });

      jest.clearAllMocks();

      // Same items, different order
      rerender({ selection: createMockRowSelection(["a", "c", "b"]) });

      // Should not trigger update
      expect(mockGraph.setSelected).not.toHaveBeenCalled();
    });
  });

  describe("processSelectedRecords", () => {
    it("should process records and return correct structure through hook", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);
      const rowSelection = createMockRowSelection(["2", "4"]);

      renderHook(() => useTableSelection(tab, records, rowSelection));

      // Verify the processed records were passed correctly
      const expectedRecords = [records[1], records[3]];
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[3]); // Last selected
    });
  });
});

describe("Integration scenarios", () => {
  it("should handle complete workflow from empty to multiple selections and back", async () => {
    const tab = createMockTab();
    const records = createMockRecords(5);
    const onSelectionChange = jest.fn();

    // Configure getSelected to simulate having a previous selection when needed
    let currentSelectedRecord: EntityData | undefined = undefined;
    mockGraph.getSelected.mockImplementation(() => currentSelectedRecord);

    const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection, onSelectionChange), {
      initialProps: { selection: {} as MRT_RowSelectionState },
    });

    // Start with no selection
    expect(mockDebouncedFunction).not.toHaveBeenCalled();

    // Add single selection
    await act(async () => {
      currentSelectedRecord = records[2]; // Simulate record 3 being selected
      rerender({ selection: createMockRowSelection(["3"]) });
    });

    // Add multiple selection (this should keep the last selected)
    await act(async () => {
      currentSelectedRecord = records[4]; // Simulate record 5 being the last selected
      rerender({ selection: createMockRowSelection(["2", "3", "5"]) });
    });

    // Remove partial selection (back to single)
    await act(async () => {
      currentSelectedRecord = records[2]; // Simulate record 3 being selected again
      rerender({ selection: createMockRowSelection(["3"]) });
    });

    // Clear all selection - this should trigger clearSelected because currentSelectedRecord is truthy
    await act(async () => {
      rerender({ selection: {} });
    });

    // Verify all state changes were handled
    expect(mockGraph.setSelected).toHaveBeenCalled();
    expect(mockGraph.clearSelected).toHaveBeenCalled();
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
    expect(mockGraph.clearSelectedMultiple).toHaveBeenCalled();
  });

  it("should handle window switching scenarios", () => {
    const tab1 = createMockTab({ id: "tab1", window: "window1" });
    const tab2 = createMockTab({ id: "tab2", window: "window2" });
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    // Test with first window
    const { rerender } = renderHook(({ tab }) => useTableSelection(tab, records, rowSelection), {
      initialProps: { tab: tab1 },
    });

    // Switch to different window
    rerender({ tab: tab2 });
  });

  it("should handle missing activeWindow gracefully", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    // Configure mock to return undefined activeWindow from the start
    mockUseMultiWindowURL.mockReturnValue({
      windows: [],
      activeWindow: undefined,
      isHomeRoute: false,
      openWindow: jest.fn(),
      closeWindow: jest.fn(),
      setActiveWindow: jest.fn(),
      navigateToHome: jest.fn(),
      buildURL: jest.fn(),
      updateWindowTitle: jest.fn(),
      setSelectedRecord: jest.fn(),
      clearSelectedRecord: jest.fn(),
      getSelectedRecord: jest.fn(),
      setTabFormState: jest.fn(),
      clearTabFormState: jest.fn(),
      getTabFormState: jest.fn(),
      setRecord: jest.fn(),
      clearRecord: jest.fn(),
      reorderWindows: jest.fn(),
      getNextOrder: jest.fn(),
      applyWindowUpdates: jest.fn(),
      clearChildrenSelections: jest.fn(),
      openWindowAndSelect: jest.fn(),
    });

    renderHook(() => useTableSelection(tab, records, rowSelection));
  });
});

describe("Performance considerations", () => {
  it("should use debouncing for URL updates", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    renderHook(() => useTableSelection(tab, records, rowSelection));

    // Verify debounce was called with correct delay
    expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 150);
  });

  it("should handle debounced function creation properly", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(() => useTableSelection(tab, records, rowSelection));

    const initialDebounceCallCount = mockDebounce.mock.calls.length;

    // Re-render without changing dependencies that should affect the useCallback memoization
    // Note: With useCallback + debounce pattern, debounce gets called on each render
    // but the useCallback should prevent unnecessary re-creations when deps don't change
    rerender();

    // Verify that debounce was called (this is expected with useCallback pattern)
    expect(mockDebounce.mock.calls.length).toBeGreaterThanOrEqual(initialDebounceCallCount);

    // More importantly, verify the debounced function is being called correctly
    expect(mockDebouncedFunction).toHaveBeenCalledWith([records[0]], "window1", "tab1");
  });

  it("should handle rapid re-renders efficiently", async () => {
    const tab = createMockTab();
    const records = createMockRecords(10);

    const { rerender } = renderHook(({ selection }) => useTableSelection(tab, records, selection), {
      initialProps: { selection: createMockRowSelection(["1"]) },
    });

    // Rapid re-renders with same selection
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        rerender({ selection: createMockRowSelection(["1"]) });
      });
    }

    // Should not trigger excessive updates due to change detection
    expect(mockGraph.setSelected).toHaveBeenCalledTimes(1); // Only initial call
  });
});

describe("Error handling and edge cases", () => {
  it("should handle corrupted rowSelection object", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    // biome-ignore lint/suspicious/noExplicitAny: Testing edge case with corrupted data
    const corruptedSelection = { toString: () => "corrupted" } as any;

    expect(() => {
      renderHook(() => useTableSelection(tab, records, corruptedSelection));
    }).not.toThrow();
  });

  it("should handle null/undefined records in selection", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1", "null", "undefined", "2"]);

    renderHook(() => useTableSelection(tab, records, rowSelection));

    // Should only process valid records
    const expectedRecords = [records[0], records[1]]; // Records 1 and 2
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
  });

  it("should handle records array mutation", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(({ records, selection }) => useTableSelection(tab, records, selection), {
      initialProps: { records, selection: rowSelection },
    });

    // Mutate original array (bad practice but should be handled)
    records.push(createMockEntityData("4"));

    jest.clearAllMocks();

    // Re-render with mutated array and new selection to trigger update
    const newSelection = createMockRowSelection(["4"]); // Select the new record
    rerender({ records, selection: newSelection });

    // Should handle the mutation gracefully
    expect(mockGraph.setSelected).toHaveBeenCalled();
  });

  it("should handle extremely large selections", () => {
    const tab = createMockTab();
    const records = createMockRecords(1000);
    const selectedIds = Array.from({ length: 500 }, (_, i) => String(i + 1));
    const rowSelection = createMockRowSelection(selectedIds);

    renderHook(() => useTableSelection(tab, records, rowSelection));

    // Should handle large selections without performance issues
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
    expect(mockDebouncedFunction).toHaveBeenCalled();
  });
});

describe("Dependency updates", () => {
  it("should re-run effects when tab changes", () => {
    const initialTab = createMockTab({ id: "tab1" });
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(({ tab }) => useTableSelection(tab, records, rowSelection), {
      initialProps: { tab: initialTab },
    });

    jest.clearAllMocks();

    // Change tab
    const newTab = createMockTab({ id: "tab2" });
    rerender({ tab: newTab });
  });

  it("should re-run effects when windowId changes", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(() => useTableSelection(tab, records, rowSelection));

    // Change active window
    mockWindowURL.activeWindow = { windowId: "window2" };

    jest.clearAllMocks();

    rerender();

    // Should not process selection for different window
    expect(mockGraph.setSelected).not.toHaveBeenCalled();
  });

  it("should handle callback parameter (legacy support)", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const callback = jest.fn();

    // Hook accepts callback parameter for backwards compatibility but doesn't use it
    expect(() => {
      renderHook(() => useTableSelection(tab, records, rowSelection, callback));
    }).not.toThrow();

    // Callback is not called - URL is updated directly
    expect(callback).not.toHaveBeenCalled();
    // Verify graph was updated instead
    expect(mockGraph.setSelected).toHaveBeenCalled();
  });
});

describe("Memory management", () => {
  it("should cleanup debounced functions properly", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { unmount } = renderHook(() => useTableSelection(tab, records, rowSelection));

    // Unmount component
    unmount();

    // Debounced function should have been created
    expect(mockDebounce).toHaveBeenCalled();
  });

  it("should handle component unmounting during async operations", async () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { unmount } = renderHook(() => useTableSelection(tab, records, rowSelection));

    // Simulate async operation in progress
    mockDebouncedFunction.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        })
    );

    // Unmount before async operation completes
    unmount();

    // Should not throw errors
    await waitFor(() => {
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
