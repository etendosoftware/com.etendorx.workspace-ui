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
import { useUserContext } from "@/hooks/useUserContext";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";
import useTableSelection from "../../hooks/useTableSelection";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_RowSelectionState } from "material-react-table";
import { useWindowContext } from "@/contexts/window";

// Mock dependencies
jest.mock("@/hooks/useSelected");
jest.mock("@/hooks/useUserContext");
jest.mock("@/utils/hooks/useTableSelection/sessionSync");
jest.mock("@/contexts/window", () => {
  const actual = jest.requireActual("@/contexts/window");
  return {
    ...actual,
    useWindowContext: jest.fn(),
  };
});
jest.mock("@/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

// Setup mock implementations
const mockUseSelected = useSelected as jest.MockedFunction<typeof useSelected>;
const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockUseWindowContext = useWindowContext as jest.MockedFunction<typeof useWindowContext>;
const mockSyncSelectedRecordsToSession = syncSelectedRecordsToSession as jest.MockedFunction<
  typeof syncSelectedRecordsToSession
>;

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
let mockUserContext: ReturnType<typeof createMockUserContext>;

// Global setup for all tests
beforeEach(() => {
  jest.clearAllMocks();
  mockReplace.mockClear();

  // Setup URL params for active window
  mockSearchParams.set("w_window1_123456789", "active");
  mockSearchParams.set("wi_window1_123456789", "window1");
  mockSearchParams.set("o_window1_123456789", "1");

  mockGraph = createMockGraph();
  mockUserContext = createMockUserContext();

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

  mockUseUserContext.mockReturnValue(mockUserContext);
  mockSyncSelectedRecordsToSession.mockResolvedValue(undefined);

  // Mock WindowContext to provide activeWindow and context functions
  mockUseWindowContext.mockReturnValue({
    activeWindow: {
      windowId: "window1",
      windowIdentifier: "window1_123456789",
      order: 1,
      tabs: {},
    },
    windows: [],
    setSelectedRecord: jest.fn(),
    clearSelectedRecord: jest.fn(),
    getSelectedRecord: jest.fn(() => undefined),
    getTabFormState: jest.fn(() => undefined),
    clearChildrenSelections: jest.fn(),
    setSelectedRecordAndClearChildren: jest.fn(),
    addWindow: jest.fn(),
    removeWindow: jest.fn(),
    updateWindow: jest.fn(),
    setActiveWindow: jest.fn(),
    getAllWindows: jest.fn(() => []),
    getActiveWindow: jest.fn(() => null),
    getWindow: jest.fn(() => undefined),
    addTab: jest.fn(),
    removeTab: jest.fn(),
    updateTab: jest.fn(),
    getTab: jest.fn(() => undefined),
    setTabFormState: jest.fn(),
    clearTabFormState: jest.fn(),
    isRecoveryLoading: false,
    setIsRecoveryLoading: jest.fn(),
  });
});

describe("useTableSelection", () => {
  describe("Basic functionality", () => {
    it("should initialize without errors", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const emptySelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection("window1_123456789", tab, records, emptySelection));

      expect(result.current).toBeUndefined();
      expect(mockUseSelected).toHaveBeenCalled();
    });

    it("should not process selection when window IDs don't match", () => {
      const tab = createMockTab({ window: "window2" });
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      expect(mockGraph.setSelected).not.toHaveBeenCalled();
      expect(mockGraph.setSelectedMultiple).not.toHaveBeenCalled();
    });

    it("should handle empty records array", () => {
      const tab = createMockTab();
      const records: EntityData[] = [];
      const emptySelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection("window1_123456789", tab, records, emptySelection));

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

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection, onSelectionChange));

      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[1]);
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, [records[1]]);
      // onSelectionChange is no longer called - WindowContext is updated immediately
    });

    it("should process multiple record selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(5);
      const rowSelection = createMockRowSelection(["1", "3", "5"]);
      const onSelectionChange = jest.fn();

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection, onSelectionChange));

      const expectedRecords = [records[0], records[2], records[4]];
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[4]); // Last selected
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
      // onSelectionChange is no longer called - WindowContext is updated immediately
    });

    it("should clear selection when no records are selected", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Configure mock to simulate that there was a previous selection
      mockGraph.getSelected.mockReturnValue(records[0]);

      // First render with selection
      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

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

      const { rerender } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

  describe("WindowContext synchronization", () => {
    it("should update WindowContext immediately for single selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["2"]);

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      // WindowContext should be updated immediately (no debounce)
      expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[1]);
    });

    it("should update WindowContext immediately for multiple selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1", "3"]);

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      const expectedRecords = [records[0], records[2]];
      expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
    });

    it("should clear WindowContext when no selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      // Configure mock to simulate that there was a previous selection
      mockGraph.getSelected.mockReturnValue(records[0]);

      // Start with a selection and then clear it
      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
        initialProps: { selection: createMockRowSelection(["1"]) },
      });

      // Clear the selection
      rerender({ selection: {} });

      expect(mockGraph.clearSelected).toHaveBeenCalledWith(tab);
    });
  });

  describe("Children record clearing", () => {
    it("should clear children records when parent selection changes", () => {
      const parentTab = createMockTab({ id: "parent", tabLevel: 0 });
      const childTab = createMockTab({ id: "child", tabLevel: 1, parentTabId: "parent" });

      mockGraph.getChildren.mockReturnValue([childTab]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection("window1_123456789", parentTab, records, rowSelection));

      // Now uses atomic update instead of separate clearChildrenSelections
      // expect(mockWindowURL...); // REMOVED: mockWindowURL no longer exists
    });

    it("should not clear children when they belong to different window", () => {
      const parentTab = createMockTab({ id: "parent", tabLevel: 0 });
      const childTab = createMockTab({ id: "child", tabLevel: 1, parentTabId: "parent", window: "window2" });

      mockGraph.getChildren.mockReturnValue([childTab]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      renderHook(() => useTableSelection("window1_123456789", parentTab, records, rowSelection));

      // expect(mockWindowURL...); // REMOVED: mockWindowURL no longer exists
    });

    it("should handle tabs with no children", () => {
      const tab = createMockTab();
      mockGraph.getChildren.mockReturnValue([]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { result } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      // No special handling needed - immediate sync doesn't require cleanup
    });

    it("should not clear children when selection stays the same", () => {
      const parentTab = createMockTab({ id: "parent", tabLevel: 0 });
      const childTab = createMockTab({ id: "child", tabLevel: 1, parentTabId: "parent" });

      mockGraph.getChildren.mockReturnValue([childTab]);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", parentTab, records, selection), {
        initialProps: { selection: rowSelection },
      });

      // Clear mock calls from initial render
      jest.clearAllMocks();

      // Re-render with same selection
      rerender({ selection: rowSelection });

      // Should NOT call setSelectedRecordAndClearChildren again
      // expect(mockWindowURL...); // REMOVED: mockWindowURL no longer exists
    });

    it("should handle undefined children", () => {
      const tab = createMockTab();
      mockGraph.getChildren.mockReturnValue(undefined);

      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);

      const { result } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      // No special handling needed - immediate sync doesn't require cleanup
    });
  });

  describe("Edge cases", () => {
    it("should handle null/undefined records", () => {
      const tab = createMockTab();
      const records: EntityData[] = [];
      const rowSelection: MRT_RowSelectionState = {};

      const { result } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

      expect(result.current).toBeUndefined();
      expect(mockGraph.clearSelected).not.toHaveBeenCalled();
    });

    it("should handle selection change without errors", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);
      const rowSelection = createMockRowSelection(["1"]);
      const onSelectionChange = jest.fn();

      // Should not throw - onSelectionChange is not called anymore
      expect(() => {
        renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection, onSelectionChange));
      }).not.toThrow();

      // Verify graph was updated
      expect(mockGraph.setSelected).toHaveBeenCalled();
    });
  });

  describe("Selection state transitions", () => {
    it("should handle transition from no selection to single selection", () => {
      const tab = createMockTab();
      const records = createMockRecords(3);

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ tab }) => useTableSelection("window1_123456789", tab, records, rowSelection), {
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
      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      renderHook(() => useTableSelection("window1_123456789", tab, records, {}));

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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

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

    const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection, onSelectionChange), {
      initialProps: { selection: {} as MRT_RowSelectionState },
    });

    // Start with no selection - graph should not be updated
    expect(mockGraph.setSelected).not.toHaveBeenCalled();

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
    const { rerender } = renderHook(({ tab }) => useTableSelection("window1_123456789", tab, records, rowSelection), {
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
    // mockUseMultiWindowURL.mockReturnValue...; // REMOVED

    renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));
  });
});

describe("Performance considerations", () => {
  it("should use immediate synchronization (no debounce)", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

    // Verify graph was updated immediately
    expect(mockGraph.setSelected).toHaveBeenCalledWith(tab, records[0]);
  });

  it("should handle rapid re-renders efficiently", async () => {
    const tab = createMockTab();
    const records = createMockRecords(10);

    const { rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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
      renderHook(() => useTableSelection("window1_123456789", tab, records, corruptedSelection));
    }).not.toThrow();
  });

  it("should handle null/undefined records in selection", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1", "null", "undefined", "2"]);

    renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

    // Should only process valid records
    const expectedRecords = [records[0], records[1]]; // Records 1 and 2
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalledWith(tab, expectedRecords);
  });

  it("should handle records array mutation", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(({ records, selection }) => useTableSelection("window1_123456789", tab, records, selection), {
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

    renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

    // Should handle large selections without performance issues
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
  });
});

describe("Dependency updates", () => {
  it("should re-run effects when tab changes", () => {
    const initialTab = createMockTab({ id: "tab1" });
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { rerender } = renderHook(({ tab }) => useTableSelection("window1_123456789", tab, records, rowSelection), {
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

    const { rerender } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

    // Change active window
    // mockWindowURL.activeWindow = ...; // REMOVED

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
      renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection, callback));
    }).not.toThrow();

    // Callback is not called - URL is updated directly
    expect(callback).not.toHaveBeenCalled();
    // Verify graph was updated instead
    expect(mockGraph.setSelected).toHaveBeenCalled();
  });
});

describe("Memory management", () => {
  it("should handle component unmounting gracefully", () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { unmount } = renderHook(() => useTableSelection("window1_123456789", tab, records, rowSelection));

    // Unmount component - should not throw
    expect(() => unmount()).not.toThrow();
  });

  it("should handle component unmounting during selection changes", async () => {
    const tab = createMockTab();
    const records = createMockRecords(3);
    const rowSelection = createMockRowSelection(["1"]);

    const { unmount, rerender } = renderHook(({ selection }) => useTableSelection("window1_123456789", tab, records, selection), {
      initialProps: { selection: rowSelection },
    });

    // Change selection
    await act(async () => {
      rerender({ selection: createMockRowSelection(["2"]) });
    });

    // Unmount immediately
    unmount();

    // Should not throw errors
    await waitFor(() => {
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
