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

import { useSelected } from "@/hooks/useSelected";
import { mapBy } from "@/utils/structures";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_RowSelectionState } from "material-react-table";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useStateReconciliation } from "@/hooks/useStateReconciliation";
import { debounce } from "@/utils/debounce";

const compareArraysAlphabetically = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort((a, b) => a.localeCompare(b));
  const sorted2 = [...arr2].sort((a, b) => a.localeCompare(b));

  return sorted1.every((item, index) => item === sorted2[index]);
};

const compareArraysNumerically = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort((a, b) => Number(a) - Number(b));
  const sorted2 = [...arr2].sort((a, b) => Number(a) - Number(b));

  return sorted1.every((item, index) => item === sorted2[index]);
};

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

  // Initialize state reconciliation hook
  const { reconcileStates, handleSyncError } = useStateReconciliation({
    records,
    tab,
    windowId: windowId || "",
    currentWindowId,
  });

  // Create debounced URL update function
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

  // Bidirectional synchronization check
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

  // Perform bidirectional sync on mount and when dependencies change
  useEffect(() => {
    performBidirectionalSync();
  }, [performBidirectionalSync]);
}

export function useTableSelectionNumeric(
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

  // Initialize state reconciliation hook
  const { reconcileStates, handleSyncError } = useStateReconciliation({
    records,
    tab,
    windowId: windowId || "",
    currentWindowId,
  });

  // Create debounced URL update function
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
          handleSyncError(error as Error, "URL update numeric");
        }
      }, 150),
    [setSelectedRecord, clearSelectedRecord, handleSyncError]
  );

  // Bidirectional synchronization check
  const performBidirectionalSync = useCallback(() => {
    if (!windowId || windowId !== currentWindowId) return;

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
      handleSyncError(error as Error, "bidirectional sync numeric");
    }
  }, [windowId, currentWindowId, tab.id, rowSelection, getSelectedRecord, reconcileStates, handleSyncError]);

  useEffect(() => {
    const isCorrectWindow = windowId === currentWindowId;
    if (!isCorrectWindow) {
      return;
    }

    const recordsMap = mapBy(records ?? [], "id");
    const { selectedRecords, lastSelected } = processSelectedRecords(rowSelection, recordsMap);

    const currentSelectionIds = selectedRecords.map((r) => String(r.id));
    const hasSelectionChanged = !compareArraysNumerically(currentSelectionIds, previousSelectionRef.current);

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

  // Perform bidirectional sync on mount and when dependencies change
  useEffect(() => {
    performBidirectionalSync();
  }, [performBidirectionalSync]);
}
