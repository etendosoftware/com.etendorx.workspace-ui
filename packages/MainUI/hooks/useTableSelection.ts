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

/**
 * @fileoverview Table Selection Management Hook
 *
 * This module provides a comprehensive hook for managing table row selection state in Etendo WorkspaceUI.
 * It handles synchronization between Material React Table selection state, URL parameters, and the
 * application's global selection graph. The hook ensures consistent selection behavior across the
 * multi-window interface and provides debounced URL updates for optimal performance.
 *
 * Key Features:
 * - Bidirectional synchronization between table selection and URL parameters
 * - Multi-window navigation support with per-window state isolation
 * - Hierarchical tab selection management (parent-child relationships)
 * - Debounced URL updates to prevent excessive navigation events
 * - State reconciliation to handle conflicts between different selection sources
 * - Performance-optimized selection change detection using alphabetical comparison
 *
 * @author Etendo Development Team
 * @since 2025
 */

import { useSelected } from "@/hooks/useSelected";
import { mapBy } from "@/utils/structures";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_RowSelectionState } from "material-react-table";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { debounce } from "@/utils/debounce";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";
import { useUserContext } from "@/hooks/useUserContext";
import { logger } from "@/utils/logger";
import { useWindowContext } from "@/contexts/window";

/**
 * Compares two arrays of strings alphabetically to detect content changes while ignoring order.
 * This optimization prevents unnecessary re-renders when selection order changes but content remains the same.
 *
 * The function sorts both arrays alphabetically before comparison, allowing for efficient detection
 * of actual selection changes versus simple reordering. This is crucial for performance in scenarios
 * where multiple rows are selected and their order in the selection state might vary.
 *
 * @param arr1 - First array of string IDs to compare
 * @param arr2 - Second array of string IDs to compare
 * @returns `true` if both arrays contain the same elements (regardless of order), `false` otherwise
 *
 * @example
 * ```typescript
 * compareArraysAlphabetically(['1', '3', '2'], ['2', '1', '3']) // returns true
 * compareArraysAlphabetically(['1', '2'], ['1', '2', '3']) // returns false
 * compareArraysAlphabetically(['1'], ['2']) // returns false
 * ```
 */
const compareArraysAlphabetically = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort((a, b) => a.localeCompare(b));
  const sorted2 = [...arr2].sort((a, b) => a.localeCompare(b));

  return sorted1.every((item, index) => item === sorted2[index]);
};

/**
 * Processes Material React Table row selection state to extract selected records and identify the last selected item.
 *
 * This function converts the boolean-based row selection state from Material React Table into a more usable format
 * containing the actual EntityData objects and identifying which record was selected last. The last selected record
 * is used for single-selection scenarios and URL synchronization.
 *
 * The function filters out any selections that don't correspond to existing records in the recordsMap,
 * ensuring data integrity and preventing errors from stale selection states.
 *
 * @param rowSelection - Material React Table row selection state (record ID -> boolean mapping)
 * @param recordsMap - Map of record IDs to EntityData objects for quick lookup
 * @returns Object containing:
 *   - `selectedRecords`: Array of EntityData objects that are currently selected
 *   - `lastSelected`: The last selected EntityData object, or null if no selections exist
 *
 * @example
 * ```typescript
 * const rowSelection = { '1': true, '3': true, '5': false };
 * const recordsMap = { '1': {...}, '2': {...}, '3': {...} };
 * const result = processSelectedRecords(rowSelection, recordsMap);
 * // result.selectedRecords = [EntityData1, EntityData3]
 * // result.lastSelected = EntityData3 (last processed)
 * ```
 */
const processSelectedRecords = (
  rowSelection: MRT_RowSelectionState,
  recordsMap: Record<string, EntityData>
): { selectedRecords: EntityData[]; lastSelected: EntityData | null } => {
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedRecords: EntityData[] = [];
  let lastSelected: EntityData | null = null;

  for (const recordId of selectedIds) {
    const record = recordsMap[recordId];
    if (record) {
      selectedRecords.push(record);
      lastSelected = record;
    }
  }

  return { selectedRecords, lastSelected };
};

/**
 * Clears selection state and FormView states for all child tabs when a parent tab's selection changes.
 *
 * This function maintains hierarchical consistency in the multi-tab interface by ensuring that
 * when a parent tab's selection changes, all child tabs lose their current selection AND their
 * FormView states. This prevents orphaned selections and form states, maintaining logical data
 * relationships in master-detail scenarios and preventing UI inconsistencies.
 *
 * The function operates within window boundaries, only clearing children that belong to the same
 * window as the current tab. This preserves selections in other windows during multi-window operations.
 *
 * Key behaviors:
 * - Clears selected record IDs from URL
 * - Clears tab form states (recordId, mode, formMode) from URL
 * - Recursively clears all descendant tabs
 *
 * @param windowIdentifier - The ID of the current window context
 * @param graph - Selection graph instance for querying tab relationships
 * @param tab - The parent tab whose children should be cleared
 * @param currentWindowId - The ID of the window containing the current tab
 * @param clearChildrenSelections - Function to clear both selected records and form states for child tabs
 *
 */
const clearChildrenRecords = (
  windowIdentifier: string,
  graph: ReturnType<typeof useSelected>["graph"],
  tab: Tab,
  currentWindowId: string,
  clearChildrenSelections: (windowId: string, childTabIds: string[]) => void,
  getTabFormState?: (
    windowIdentifier: string,
    tabId: string
  ) => { recordId?: string; mode?: string; formMode?: string } | undefined
): void => {
  const children = graph.getChildren(tab);

  if (!children || children.length === 0) {
    logger.debug(`[useTableSelection] No children found for tab ${tab.id}`);
    return;
  }

  const childTabs = children.filter((child) => child.window === currentWindowId);

  // Filter out children that are currently in FormView mode
  const childrenToClean = childTabs.filter((child) => {
    if (getTabFormState) {
      const childState = getTabFormState(windowIdentifier, child.id);
      const isInFormView = childState?.mode === "form";
      if (isInFormView) {
        logger.debug(`[useTableSelection] Preserving child ${child.id} - currently in FormView`);
        return false; // Don't clear this child
      }
    }
    return true; // Clear this child
  });

  const childTabIds = childrenToClean.map((child) => child.id);
  const totalChildren = childTabs.length;
  const preservedCount = totalChildren - childTabIds.length;

  logger.debug(
    `[useTableSelection] Clearing ${childTabIds.length} children for tab ${tab.id} (${preservedCount} preserved in FormView):`,
    {
      windowIdentifier,
      currentWindowId,
      childTabIds,
      preservedChildren: childTabs.filter((c) => !childTabIds.includes(c.id)).map((c) => c.id),
      allChildren: children.map((c) => ({ id: c.id, window: c.window })),
    }
  );

  if (childTabIds.length > 0) {
    // Clear URL state only for children not in FormView
    clearChildrenSelections(windowIdentifier, childTabIds);

    // Also clear graph state for children not in FormView to prevent stale references
    for (const childTab of childrenToClean) {
      graph.clearSelected(childTab);
      graph.clearSelectedMultiple(childTab);
    }
  }
};

/**
 * Updates the global selection graph with the current table selection state.
 *
 * This function synchronizes the application's global selection state with the current table selection,
 * maintaining both single-selection (lastSelected) and multi-selection state in the graph. It handles
 * the transition between different selection states (empty -> single -> multiple -> empty) and ensures
 * proper cleanup of previous selections.
 *
 * The function manages two types of selections:
 * - Single selection: Used for navigation, form editing, and URL synchronization
 * - Multiple selection: Used for bulk operations and multi-record actions
 *
 * @param graph - Selection graph instance for managing global selection state
 * @param tab - The tab whose selection is being updated
 * @param lastSelected - The most recently selected record, or null if no selection
 * @param selectedRecords - Array of all currently selected records
 * @param onSelectionChange - Optional callback function to notify parent components of selection changes
 *
 * @example
 * ```typescript
 * // Update graph with new selection
 * updateGraphSelection(graph, tab, record3, [record1, record2, record3], (id) => {
 *   console.log(`Selection changed to: ${id}`);
 * });
 * ```
 */
const updateGraphSelection = (
  graph: ReturnType<typeof useSelected>["graph"],
  tab: Tab,
  lastSelected: EntityData | null,
  selectedRecords: EntityData[],
  onSelectionChange?: (recordId: string) => void
): void => {
  if (lastSelected) {
    graph.setSelected(tab, lastSelected);
    onSelectionChange?.(String(lastSelected.id));
  } else if (graph.getSelected(tab)) {
    graph.clearSelected(tab);
    onSelectionChange?.("");
  }

  if (selectedRecords.length > 0) {
    graph.setSelectedMultiple(tab, selectedRecords);
  } else {
    graph.clearSelectedMultiple(tab);
  }
};

/**
 * Validates if a child tab can select records based on parent tab selection.
 * Returns false if the child's parent has no selection, true otherwise.
 *
 * @param tab - The tab to validate
 * @param graph - Selection graph for querying parent-child relationships
 * @param windowIdentifier - Current window identifier
 * @param getSelectedRecord - Function to get selected record from URL
 * @param rowSelection - Current row selection state
 * @param previousSelectionRef - Reference to track previous selection
 * @returns true if selection is allowed, false otherwise
 */
const validateParentSelection = (
  tab: Tab,
  graph: ReturnType<typeof useSelected>["graph"],
  windowIdentifier: string,
  getSelectedRecord: (windowIdentifier: string, tabId: string) => string | undefined,
  rowSelection: MRT_RowSelectionState,
  previousSelectionRef: React.MutableRefObject<string[]>
): boolean => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return true; // No parent, selection is allowed
  }

  const parentSelectedInURL = getSelectedRecord(windowIdentifier, parentTab.id);
  if (!parentSelectedInURL) {
    logger.debug(
      `[useTableSelection] Parent tab ${parentTab.id} has no selection, child tab ${tab.id} should not auto-select`
    );
    // Clear any selection in child if parent is not selected
    if (Object.keys(rowSelection).length > 0) {
      previousSelectionRef.current = [];
    }
    return false;
  }

  return true;
};

/**
 * Determines if the actual selection value changed (not just FormView mode change).
 * Compares previous and new selection IDs.
 *
 * @param selectedRecords - Currently selected records
 * @param previousSingleSelectionRef - Reference to previous selection ID
 * @returns Object containing new selection ID and whether it changed
 */
const checkSelectionChanged = (
  selectedRecords: EntityData[],
  previousSingleSelectionRef: React.MutableRefObject<string | undefined>
): { newSelectionId: string | undefined; selectionChanged: boolean } => {
  const newSelectionId = selectedRecords.length === 1 ? String(selectedRecords[0].id) : undefined;
  const previousSelectionId = previousSingleSelectionRef.current;
  const selectionChanged = previousSelectionId !== newSelectionId;

  return { newSelectionId, selectionChanged };
};

/**
 * Handles URL and graph updates for single selection with children using atomic operations.
 * This prevents race conditions by batching parent selection update and children clearing.
 */
const handleSingleSelectionWithChildren = ({
  windowIdentifier,
  tab,
  selectedRecords,
  childTabIds,
  currentWindowId,
  children,
  graph,
  debouncedURLUpdate,
  setSelectedRecordAndClearChildren,
}: {
  windowIdentifier: string;
  tab: Tab;
  selectedRecords: EntityData[];
  childTabIds: string[];
  currentWindowId: string;
  children: Tab[] | undefined;
  graph: ReturnType<typeof useSelected>["graph"];
  debouncedURLUpdate: { cancel: () => void };
  setSelectedRecordAndClearChildren: (
    windowIdentifier: string,
    tabId: string,
    recordId: string,
    childTabIds: string[]
  ) => void;
}): void => {
  // Cancel any pending debounced URL updates to prevent stale updates
  debouncedURLUpdate.cancel();

  // Single selection with children AND selection changed: use atomic update
  setSelectedRecordAndClearChildren(windowIdentifier, tab.id, String(selectedRecords[0].id), childTabIds);

  // Clear graph state for children to keep graph in sync
  for (const child of children || []) {
    if (child.window === currentWindowId) {
      graph.clearSelected(child);
      graph.clearSelectedMultiple(child);
    }
  }
};

/**
 * Handles URL and graph updates for non-atomic selection scenarios.
 * This includes cases without children, multiple selections, or unchanged selections.
 */
const handleNonAtomicSelection = ({
  selectedRecords,
  selectionChanged,
  childTabIds,
  debouncedURLUpdate,
  windowIdentifier,
  tab,
  graph,
  currentWindowId,
  clearChildrenSelections,
  getTabFormState,
}: {
  selectedRecords: EntityData[];
  selectionChanged: boolean;
  childTabIds: string[];
  debouncedURLUpdate: (records: EntityData[], windowIdentifier: string, tabId: string) => void;
  windowIdentifier: string;
  tab: Tab;
  graph: ReturnType<typeof useSelected>["graph"];
  currentWindowId: string;
  clearChildrenSelections: (windowIdentifier: string, childTabIds: string[]) => void;
  getTabFormState?: (
    windowIdentifier: string,
    tabId: string
  ) => { recordId?: string; mode?: string; formMode?: string } | undefined;
}): void => {
  if (selectedRecords.length === 1 && !selectionChanged && childTabIds.length > 0) {
    // Selection didn't change, just update URL without clearing children
    debouncedURLUpdate(selectedRecords, windowIdentifier, tab.id);
  } else {
    // Selection changed or no children: clear children and update URL
    clearChildrenRecords(windowIdentifier, graph, tab, currentWindowId, clearChildrenSelections, getTabFormState);
    debouncedURLUpdate(selectedRecords, windowIdentifier, tab.id);
  }
};

/**
 * Custom React hook for managing table row selection state with comprehensive synchronization capabilities.
 *
 * This hook provides a complete solution for handling table selection in Etendo WorkspaceUI's multi-window,
 * multi-tab environment. It manages the complex interactions between:
 *
 * - Material React Table selection state (UI layer)
 * - URL parameters (navigation and bookmarking)
 * - Global selection graph (application state)
 * - Parent-child tab relationships (hierarchical data)
 *
 * Key Features:
 * - **Bidirectional Sync**: Keeps URL parameters and table selection in sync
 * - **Performance Optimized**: Uses debounced URL updates and change detection
 * - **Multi-Window Support**: Handles selection across multiple browser windows/tabs
 * - **Hierarchical Management**: Automatically clears child tab selections when parent changes
 * - **State Reconciliation**: Resolves conflicts between different selection sources
 * - **Error Handling**: Gracefully handles sync errors and edge cases
 *
 * The hook operates only when the current tab belongs to the active window, preventing
 * cross-window interference while maintaining proper isolation.
 *
 * @param tab - Tab metadata containing window information and hierarchical relationships
 * @param records - Array of EntityData records available for selection in the current table
 * @param rowSelection - Current Material React Table selection state (record ID -> boolean mapping)
 * @param onSelectionChange - Optional callback function invoked when selection changes, receives the last selected record ID
 *
 * @returns void - This hook manages side effects and doesn't return values
 *
 * @see {@link useMultiWindowURL} - For URL parameter management
 * @see {@link useSelected} - For global selection graph access
 * @see {@link useStateReconciliation} - For handling selection conflicts
 * @see {@link debounce} - For performance optimization of URL updates
 */
export default function useTableSelection(
  tab: Tab,
  records: EntityData[],
  rowSelection: MRT_RowSelectionState,
  onSelectionChange?: (recordId: string) => void
) {
  const { graph } = useSelected();
  const {
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,
  } = useMultiWindowURL();
  const {
    activeWindow,
    clearSelectedRecord,
    getTabFormState,
    setSelectedRecord,
    getSelectedRecord
  } = useWindowContext();
  const { setSession, setSessionSyncLoading } = useUserContext();
  const previousSelectionRef = useRef<string[]>([]);
  const previousSingleSelectionRef = useRef<string | undefined>(undefined);

  const windowId = activeWindow?.windowId;
  const windowIdentifier = activeWindow?.windowIdentifier;
  const currentWindowId = tab.window;

  // Initialize previousSingleSelectionRef from URL on mount/remount
  // This is important when transitioning from FormView to Table mode
  useEffect(() => {
    if (windowIdentifier && previousSingleSelectionRef.current === undefined) {
      const currentSelection = getSelectedRecord(windowIdentifier, tab.id);

      if (currentSelection) {
        previousSingleSelectionRef.current = currentSelection;
      }
    }
  }, [windowIdentifier, tab.id, getSelectedRecord]);

  // REMOVED: useStateReconciliation - no longer needed with simplified architecture
  const handleSyncError = useCallback((error: Error, context: string) => {
    logger.error(`[TableSelection] Error during ${context}:`, error);
  }, []);

  /**
   * Creates a debounced function for URL updates to prevent excessive navigation events.
   *
   * The debounce delay of 150ms provides a balance between responsiveness and performance,
   * allowing rapid selection changes without overwhelming the browser's navigation system.
   * The function handles different selection scenarios:
   * - Single selection: Updates URL with the selected record ID
   * - No selection: Clears the record ID from URL (unless children are in FormView)
   * - Multiple selections: URL shows the last selected record for navigation consistency
   *
   * Error handling ensures that URL sync failures don't break the selection functionality.
   */
  const debouncedURLUpdate = useMemo(
    () =>
      debounce((selectedRecords: EntityData[], windowIdentifier: string, tabId: string) => {
        try {
          if (selectedRecords.length === 1) {
            // Single selection: Update URL
            setSelectedRecord(windowIdentifier, tabId, String(selectedRecords[0].id));
          } else if (selectedRecords.length === 0) {
            // Before clearing, check if any child tabs are in FormView
            // If so, preserve parent selection to keep child FormView open
            const children = graph.getChildren(tab);
            const hasChildInFormView = children?.some((child) => {
              if (!getTabFormState) return false;
              const childState = getTabFormState(windowIdentifier, child.id);
              return childState?.mode === "form";
            });

            if (hasChildInFormView) {
              logger.debug(`[useTableSelection] NOT clearing parent selection for tab ${tabId} - child is in FormView`);
              return; // Don't clear parent selection if child is in FormView
            }

            // No selection and no children in FormView: Clear URL
            clearSelectedRecord(windowIdentifier, tabId);
          }
          // Multiple selections: URL shows last selected (handled by existing logic)
        } catch (error) {
          handleSyncError(error as Error, "URL update");
        }
      }, 150),
    [setSelectedRecord, clearSelectedRecord, handleSyncError, graph, tab, getTabFormState]
  );

  /**
   * Main effect for handling table selection changes and synchronization.
   *
   * This effect is the core of the selection management system. It:
   * 1. Validates that the current tab belongs to the active window
   * 2. Validates parent-child selection rules
   * 3. Processes the current selection state into usable format
   * 4. Detects actual changes using alphabetical comparison for performance
   * 5. Updates URL parameters with debouncing for optimal performance
   * 6. Clears child tab selections to maintain hierarchical consistency
   * 7. Updates the global selection graph with new state
   *
   * The effect only runs when selection actually changes (not just reorders),
   * preventing unnecessary updates and improving performance.
   */
  useEffect(() => {
    // 1. Validate correct window
    const isCorrectWindow = windowId === currentWindowId;
    if (!isCorrectWindow || !windowIdentifier) {
      return;
    }

    // 2. Validate parent selection for child tabs
    if (!validateParentSelection(tab, graph, windowIdentifier, getSelectedRecord, rowSelection, previousSelectionRef)) {
      return;
    }

    // 3. Process selected records
    const recordsMap = mapBy(records ?? [], "id");
    const { selectedRecords, lastSelected } = processSelectedRecords(rowSelection, recordsMap);

    // 4. Detect changes (ignore order changes)
    const currentSelectionIds = selectedRecords.map((r) => String(r.id));
    const hasSelectionChanged = !compareArraysAlphabetically(currentSelectionIds, previousSelectionRef.current);

    if (!hasSelectionChanged) {
      return;
    }

    previousSelectionRef.current = currentSelectionIds;

    // 5-6. Handle URL updates and children clearing
    const children = graph.getChildren(tab);
    const childTabIds = children?.filter((child) => child.window === currentWindowId).map((child) => child.id) || [];

    const { newSelectionId, selectionChanged } = checkSelectionChanged(selectedRecords, previousSingleSelectionRef);

    // Use atomic update for single selection with children when selection changed
    if (selectedRecords.length === 1 && childTabIds.length > 0 && selectionChanged) {
      handleSingleSelectionWithChildren({
        windowIdentifier,
        tab,
        selectedRecords,
        childTabIds,
        currentWindowId,
        children,
        graph,
        debouncedURLUpdate,
        setSelectedRecordAndClearChildren,
      });
    } else {
      handleNonAtomicSelection({
        selectedRecords,
        selectionChanged,
        childTabIds,
        debouncedURLUpdate,
        windowIdentifier,
        tab,
        graph,
        currentWindowId,
        clearChildrenSelections,
        getTabFormState,
      });
    }

    // Update the ref with the new selection for next comparison
    previousSingleSelectionRef.current = newSelectionId;

    // 7. Update graph state (DON'T call onSelectionChange to avoid infinite loop)
    updateGraphSelection(graph, tab, lastSelected, selectedRecords);

    // Sync to session for backend state
    if (selectedRecords.length > 0) {
      syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        parentId: tab.parentTabId,
        setSession,
        setSessionSyncLoading,
      });
    }
  }, [
    graph,
    records,
    rowSelection,
    tab,
    onSelectionChange,
    windowIdentifier,
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,
    currentWindowId,
    debouncedURLUpdate,
    getSelectedRecord,
    getTabFormState,
  ]);

  /**
   * Effect for performing bidirectional synchronization on mount and dependency changes.
   *
   * This effect ensures that URL and table selection states are properly synchronized
   * when the component mounts or when key dependencies change. It's essential for
   * handling direct navigation to URLs with selection parameters and maintaining
   * consistency across page refreshes.
   */
  // REMOVED: Bidirectional sync effect - no longer needed
}
