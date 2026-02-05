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
import { useEffect, useRef } from "react";
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
 * @param _onSelectionChange - Optional callback function invoked when selection changes, receives the last selected record ID
 *
 * @returns void - This hook manages side effects and doesn't return values
 *
 * @see {@link useSelected} - For global selection graph access
 * @see {@link useStateReconciliation} - For handling selection conflicts
 * @see {@link debounce} - For performance optimization of URL updates
 */
export default function useTableSelection(
  windowIdentifier: string,
  tab: Tab,
  records: EntityData[],
  rowSelection: MRT_RowSelectionState,
  _onSelectionChange?: (recordId: string) => void
) {
  const { graph } = useSelected();
  const { clearSelectedRecord, getTabFormState, setSelectedRecord, getSelectedRecord } = useWindowContext();
  const { setSession, setSessionSyncLoading } = useUserContext();
  const previousSelectionRef = useRef<string[]>([]);
  const previousSingleSelectionRef = useRef<string | undefined>(undefined);

  const windowId = tab.window;
  const currentWindowId = windowIdentifier?.split("_")[0];

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

  const previousSelectedRecordsRef = useRef<EntityData[]>([]);

  /**
   * Main effect for handling table selection changes and synchronization.
   *
   * This effect is the core of the selection management system. It:
   * 1. Validates that the current tab belongs to the active window
   * 2. Validates parent-child selection rules
   * 3. Processes the current selection state into usable format
   * 4. Detects actual changes using alphabetical comparison for performance
   * 5. Updates Context immediately (synchronously)
   * 6. Updates the global selection graph with new state
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
    const hasSelectionIdChanged = !compareArraysAlphabetically(currentSelectionIds, previousSelectionRef.current);

    // Check if the actual record objects have changed (e.g. updated data/attachments)
    // This assumes that data updates result in new object references (immutability)
    const hasRecordContentChanged =
      selectedRecords.length === previousSelectedRecordsRef.current.length &&
      selectedRecords.some((record, index) => record !== previousSelectedRecordsRef.current[index]);

    const shouldUpdate = hasSelectionIdChanged || hasRecordContentChanged;

    if (!shouldUpdate) {
      return;
    }

    // Update the refs with the new selection for next comparison
    previousSelectionRef.current = currentSelectionIds;
    previousSelectedRecordsRef.current = selectedRecords;

    // 5. Synchronize to Context (Immediate)
    if (selectedRecords.length === 1) {
      // Case A: Single Record Selected
      const recordId = String(selectedRecords[0].id);
      const currentUrlSelection = getSelectedRecord(windowIdentifier, tab.id);

      if (currentUrlSelection !== recordId) {
        setSelectedRecord(windowIdentifier, tab.id, recordId);
      }
    } else if (selectedRecords.length === 0) {
      // Case B: No Selection (Deselect All)
      // Only clear if the table selection state is actually empty
      // If rowSelection has keys but selectedRecords is empty, it means the selected record
      // is not in the current page of data, so we should PRESERVE the global selection.
      const hasTableSelection = Object.keys(rowSelection).length > 0;

      if (!hasTableSelection) {
        // Guard: Check if any child tab is in "Form Mode"
        const children = graph.getChildren(tab);
        const hasChildInFormView = children?.some((child) => {
          if (!getTabFormState) return false;
          const childState = getTabFormState(windowIdentifier, child.id);
          return childState?.mode === "form";
        });

        if (!hasChildInFormView) {
          clearSelectedRecord(windowIdentifier, tab.id);
        } else {
          logger.debug(`[useTableSelection] NOT clearing parent selection for tab ${tab.id} - child is in FormView`);
        }
      }
    }

    // 6. Update Graph (Global State)
    // DON'T call onSelectionChange to avoid infinite loop
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
    windowIdentifier,
    clearSelectedRecord,
    setSelectedRecord,
    currentWindowId,
    getSelectedRecord,
    getTabFormState,
    setSession,
    setSessionSyncLoading,
    windowId,
  ]);
}
