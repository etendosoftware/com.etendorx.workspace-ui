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
import { useEffect, useRef, useCallback } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useStateReconciliation } from "@/hooks/useStateReconciliation";
import { debounce } from "@/utils/debounce";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";

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
 * Clears selection state for all child tabs when a parent tab's selection changes.
 *
 * This function maintains hierarchical consistency in the multi-tab interface by ensuring that
 * when a parent tab's selection changes, all child tabs lose their current selection. This prevents
 * orphaned selections and maintains logical data relationships in master-detail scenarios.
 *
 * The function operates within window boundaries, only clearing children that belong to the same
 * window as the current tab. This preserves selections in other windows during multi-window operations.
 *
 * @param windowId - The ID of the current window context
 * @param graph - Selection graph instance for querying tab relationships
 * @param tab - The parent tab whose children should be cleared
 * @param currentWindowId - The ID of the window containing the current tab
 * @param clearSelectedRecord - Function to clear selected record from URL state
 *
 * @example
 * ```typescript
 * // When sales order selection changes, clear all sales order line selections
 * clearChildrenRecords(windowId, graph, salesOrderTab, windowId, clearSelectedRecord);
 * ```
 */
const clearChildrenRecords = (
  windowId: string,
  graph: ReturnType<typeof useSelected>["graph"],
  tab: Tab,
  currentWindowId: string,
  clearSelectedRecord: (windowId: string, tabId: string) => void
): void => {
  const children = graph.getChildren(tab);
  if (!children || children.length === 0) return;

  for (const child of children) {
    if (child.window === currentWindowId) {
      clearSelectedRecord(windowId, child.id);
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
  const { activeWindow, clearSelectedRecord, setSelectedRecord, getSelectedRecord } = useMultiWindowURL();
  const previousSelectionRef = useRef<string[]>([]);

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window;

  // Initialize state reconciliation hook with current context
  const { reconcileStates, handleSyncError } = useStateReconciliation({
    records,
    tab,
    windowId: windowId || "",
    currentWindowId,
  });

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
  const debouncedURLUpdate = useCallback(
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

  /**
   * Performs bidirectional synchronization between URL parameters and table selection state.
   *
   * This function checks for discrepancies between what the URL indicates should be selected
   * and what the table actually has selected. It only operates when:
   * - We have a valid window ID
   * - The current tab belongs to the active window
   * - Records are available for validation
   *
   * The reconciliation process prioritizes URL state over table state, as URLs represent
   * user intent for navigation and bookmarking.
   */
  const performBidirectionalSync = useCallback(() => {
    if (!windowId || windowId !== currentWindowId || records.length === 0) return;

    try {
      const urlSelectedId = getSelectedRecord(windowId, tab.id);
      const tableSelectionIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

      // Check if reconciliation is needed
      const needsReconciliation =
        (urlSelectedId && !tableSelectionIds.includes(urlSelectedId)) ||
        (!urlSelectedId && tableSelectionIds.length > 0);

      if (needsReconciliation) {
        reconcileStates(urlSelectedId || null, tableSelectionIds);
      }
    } catch (error) {
      handleSyncError(error as Error, "bidirectional sync");
    }
  }, [windowId, currentWindowId, tab.id, rowSelection, records, getSelectedRecord, reconcileStates, handleSyncError]);

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

    const recordsMap = mapBy(records ?? [], "id");
    const { selectedRecords, lastSelected } = processSelectedRecords(rowSelection, recordsMap);

    const currentSelectionIds = selectedRecords.map((r) => String(r.id));
    const hasSelectionChanged = !compareArraysAlphabetically(currentSelectionIds, previousSelectionRef.current);

    if (!hasSelectionChanged) {
      return;
    }

    previousSelectionRef.current = currentSelectionIds;

    if (windowId) {
      clearChildrenRecords(windowId, graph, tab, currentWindowId, clearSelectedRecord);

      // Update URL to reflect current selection with debouncing
      debouncedURLUpdate(selectedRecords, windowId, tab.id);
    }

    updateGraphSelection(graph, tab, lastSelected, selectedRecords, onSelectionChange);

    if (selectedRecords.length > 0) {
      syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        parentId: tab.parentTabId, // Use parent tab ID if available
      });
    }
  }, [
    graph,
    records,
    rowSelection,
    tab,
    onSelectionChange,
    windowId,
    clearSelectedRecord,
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
  useEffect(() => {
    performBidirectionalSync();
  }, [performBidirectionalSync]);
}
