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
 * @param windowId - The ID of the current window context
 * @param graph - Selection graph instance for querying tab relationships
 * @param tab - The parent tab whose children should be cleared
 * @param currentWindowId - The ID of the window containing the current tab
 * @param clearChildrenSelections - Function to clear both selected records and form states for child tabs
 *
 * @example
 * ```typescript
 * // When sales order selection changes, clear all sales order line selections and form views
 * clearChildrenRecords(windowId, graph, salesOrderTab, windowId, clearChildrenSelections);
 * ```
 */
const clearChildrenRecords = (
  windowId: string,
  graph: ReturnType<typeof useSelected>["graph"],
  tab: Tab,
  currentWindowId: string,
  clearChildrenSelections: (windowId: string, childTabIds: string[]) => void
): void => {
  const children = graph.getChildren(tab);

  if (!children || children.length === 0) {
    logger.debug(`[useTableSelection] No children found for tab ${tab.id}`);
    return;
  }

  const childTabs = children.filter((child) => child.window === currentWindowId);
  const childTabIds = childTabs.map((child) => child.id);

  logger.debug(`[useTableSelection] Clearing ${childTabIds.length} children for tab ${tab.id}:`, {
    windowId,
    currentWindowId,
    childTabIds,
    allChildren: children.map((c) => ({ id: c.id, window: c.window })),
  });

  if (childTabIds.length > 0) {
    // Clear URL state
    clearChildrenSelections(windowId, childTabIds);

    // Also clear graph state for all children to prevent stale references
    for (const childTab of childTabs) {
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
    activeWindow,
    setSelectedRecord,
    clearSelectedRecord,
    getSelectedRecord,
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,
  } = useMultiWindowURL();
  const { setSession, setSessionSyncLoading } = useUserContext();
  const previousSelectionRef = useRef<string[]>([]);
  const previousSingleSelectionRef = useRef<string | undefined>(undefined);

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window;

  // Initialize previousSingleSelectionRef from URL on mount/remount
  // This is important when transitioning from FormView to Table mode
  useEffect(() => {
    if (windowId && previousSingleSelectionRef.current === undefined) {
      const currentSelection = getSelectedRecord(windowId, tab.id);
      if (currentSelection) {
        previousSingleSelectionRef.current = currentSelection;
      }
    }
  }, [windowId, tab.id, getSelectedRecord]);

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
   * - No selection: Clears the record ID from URL
   * - Multiple selections: URL shows the last selected record for navigation consistency
   *
   * Error handling ensures that URL sync failures don't break the selection functionality.
   */
  const debouncedURLUpdate = useMemo(
    () =>
      debounce((selectedRecords: EntityData[], windowId: string, tabId: string) => {
        try {
          if (selectedRecords.length === 1) {
            // Single selection: Update URL
            setSelectedRecord(windowId, tabId, String(selectedRecords[0].id));
          } else if (selectedRecords.length === 0) {
            // No selection: Clear URL
            clearSelectedRecord(windowId, tabId);
          }
          // Multiple selections: URL shows last selected (handled by existing logic)
        } catch (error) {
          handleSyncError(error as Error, "URL update");
        }
      }, 150),
    [setSelectedRecord, clearSelectedRecord, handleSyncError]
  );

  // REMOVED: performBidirectionalSync - was causing race conditions
  // New approach: URL is single source of truth, no bidirectional sync needed

  /**
   * Main effect for handling table selection changes and synchronization.
   *
   * This effect is the core of the selection management system. It:
   * 1. Validates that the current tab belongs to the active window
   * 2. Processes the current selection state into usable format
   * 3. Detects actual changes using alphabetical comparison for performance
   * 4. Updates URL parameters with debouncing for optimal performance
   * 5. Clears child tab selections to maintain hierarchical consistency
   * 6. Updates the global selection graph with new state
   *
   * The effect only runs when selection actually changes (not just reorders),
   * preventing unnecessary updates and improving performance.
   */
  useEffect(() => {
    const isCorrectWindow = windowId === currentWindowId;
    if (!isCorrectWindow) {
      return;
    }

    // For child tabs, check if parent has a selected record
    // If parent has no selection, child should not auto-select
    // Use URL as source of truth instead of graph to avoid stale state
    const parentTab = graph.getParent(tab);
    if (parentTab && windowId) {
      const parentSelectedInURL = getSelectedRecord(windowId, parentTab.id);
      if (!parentSelectedInURL) {
        logger.debug(
          `[useTableSelection] Parent tab ${parentTab.id} has no selection, child tab ${tab.id} should not auto-select`
        );
        // Clear any selection in child if parent is not selected
        if (Object.keys(rowSelection).length > 0) {
          previousSelectionRef.current = [];
        }
        return;
      }
    }

    const recordsMap = mapBy(records ?? [], "id");
    const { selectedRecords, lastSelected } = processSelectedRecords(rowSelection, recordsMap);

    const currentSelectionIds = selectedRecords.map((r) => String(r.id));
    const hasSelectionChanged = !compareArraysAlphabetically(currentSelectionIds, previousSelectionRef.current);

    if (!hasSelectionChanged) {
      return;
    }

    logger.debug(`[useTableSelection] Selection change detected in tab ${tab.id}`, {
      previous: previousSelectionRef.current,
      current: currentSelectionIds,
      source: "rowSelection change",
    });

    previousSelectionRef.current = currentSelectionIds;

    if (windowId) {
      const children = graph.getChildren(tab);
      const childTabIds = children?.filter((child) => child.window === currentWindowId).map((child) => child.id) || [];

      // Check if selection actually changed (not just mode change from FormView to Table)
      // Use previousSingleSelectionRef instead of currentURLSelection to avoid race conditions
      const newSelectionId = selectedRecords.length === 1 ? String(selectedRecords[0].id) : undefined;
      const previousSelectionId = previousSingleSelectionRef.current;
      const selectionChanged = previousSelectionId !== newSelectionId;

      // Atomically update parent selection and clear children in single navigation
      // But only if the selection actually changed (not just FormView -> Table with same record)
      if (selectedRecords.length === 1 && childTabIds.length > 0 && selectionChanged) {
        // Cancel any pending debounced URL updates to prevent stale updates
        logger.debug(`[useTableSelection] Canceling pending debounce for tab ${tab.id} before atomic update`);
        debouncedURLUpdate.cancel();

        // Single selection with children AND selection changed: use atomic update
        logger.debug(`[useTableSelection] Using atomic update for tab ${tab.id}:`, {
          newSelection: String(selectedRecords[0].id),
          childrenToClear: childTabIds
        });
        setSelectedRecordAndClearChildren(windowId, tab.id, String(selectedRecords[0].id), childTabIds);

        // Clear graph state for children to keep graph in sync
        for (const child of children || []) {
          if (child.window === currentWindowId) {
            graph.clearSelected(child);
            graph.clearSelectedMultiple(child);
          }
        }
      } else {
        // No children or multiple/no selection or selection didn't change: use separate calls
        if (selectedRecords.length === 1 && !selectionChanged && childTabIds.length > 0) {
          // Selection didn't change, just update URL without clearing children
          debouncedURLUpdate(selectedRecords, windowId, tab.id);
        } else {
          // Selection changed or no children: clear children and update URL
          clearChildrenRecords(windowId, graph, tab, currentWindowId, clearChildrenSelections);
          debouncedURLUpdate(selectedRecords, windowId, tab.id);
        }
      }

      // Update the ref with the new selection for next comparison
      previousSingleSelectionRef.current = newSelectionId;
    }

    // Update graph state but DON'T call onSelectionChange since we already updated the URL above
    // Calling onSelectionChange would trigger handleRecordSelection -> setSelectedRecord -> another URL update
    // which creates an infinite loop
    updateGraphSelection(graph, tab, lastSelected, selectedRecords);

    if (selectedRecords.length > 0) {
      syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        parentId: tab.parentTabId, // Use parent tab ID if available
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
    windowId,
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,
    currentWindowId,
    debouncedURLUpdate,
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
