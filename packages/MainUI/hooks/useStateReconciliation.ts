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

import { useCallback, useMemo } from "react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";
import { logger } from "@/utils/logger";

interface StateReconciliationOptions {
  records: EntityData[];
  tab: Tab;
  windowId: string;
  currentWindowId: string;
}

/**
 * Validates if parent tab has a selection (required for child tabs)
 */
const validateParentSelection = (tab: Tab, graph: ReturnType<typeof useSelected>["graph"]): boolean => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return true; // No parent, validation passes
  }

  const parentSelected = graph.getSelected(parentTab);
  return !!parentSelected?.id;
};

/**
 * Handles reconciliation when URL has selection but table doesn't
 */
const reconcileURLOnly = (
  urlSelectedId: string,
  recordsMap: Map<string, EntityData>,
  windowId: string,
  tabId: string,
  clearSelectedRecord: (windowId: string, tabId: string) => void
): void => {
  const record = recordsMap.get(urlSelectedId);
  if (record) {
    logger.info(`[StateReconciliation] URL has valid selection (${urlSelectedId}), table will sync`);
  } else {
    logger.warn(`[StateReconciliation] URL selection (${urlSelectedId}) not found in current records, clearing URL`);
    clearSelectedRecord(windowId, tabId);
  }
};

/**
 * Handles reconciliation when table has selection but URL doesn't
 */
const reconcileTableOnly = (
  tableSelectionIds: string[],
  recordsMap: Map<string, EntityData>,
  windowId: string,
  tabId: string,
  setSelectedRecord: (windowId: string, tabId: string, recordId: string) => void
): void => {
  const lastSelected = tableSelectionIds[tableSelectionIds.length - 1];
  const record = recordsMap.get(lastSelected);

  if (record) {
    logger.info(`[StateReconciliation] Table selection (${lastSelected}) not in URL, updating URL`);
    setSelectedRecord(windowId, tabId, lastSelected);
  }
};

/**
 * Handles reconciliation when both URL and table have selections
 */
const reconcileBothSelections = (urlSelectedId: string, tableSelectionIds: string[]): void => {
  const urlInTable = tableSelectionIds.includes(urlSelectedId);
  if (!urlInTable) {
    logger.info(`[StateReconciliation] URL selection (${urlSelectedId}) not in table, URL takes precedence`);
    // The table component should handle updating its selection to match URL
  }
};

/**
 * Hook for managing state reconciliation between URL parameters and table selection state.
 * Handles conflicts that may arise when URL and table selections become out of sync.
 */
export const useStateReconciliation = ({ records, tab, windowId, currentWindowId }: StateReconciliationOptions) => {
  const { setSelectedRecord, clearSelectedRecord, getSelectedRecord } = useMultiWindowURL();
  const { graph } = useSelected();

  /**
   * Creates a mapping of record IDs to EntityData objects for quick lookups
   */
  const recordsMap = useMemo(() => {
    const map = new Map<string, EntityData>();
    for (const record of records) {
      map.set(String(record.id), record);
    }
    return map;
  }, [records]);

  /**
   * Reconciles state mismatches between URL and table selection
   * Priority: URL state takes precedence over table state when both exist
   */
  const reconcileStates = useCallback(
    (urlSelectedId: string | null, tableSelectionIds: string[]) => {
      // Early returns for invalid states
      if (!windowId || currentWindowId !== tab.window) {
        return;
      }

      if (!validateParentSelection(tab, graph)) {
        return; // Don't reconcile if parent has no selection
      }

      try {
        // Handle different reconciliation scenarios
        if (urlSelectedId && tableSelectionIds.length === 0) {
          reconcileURLOnly(urlSelectedId, recordsMap, windowId, tab.id, clearSelectedRecord);
        } else if (!urlSelectedId && tableSelectionIds.length > 0) {
          reconcileTableOnly(tableSelectionIds, recordsMap, windowId, tab.id, setSelectedRecord);
        } else if (urlSelectedId && tableSelectionIds.length > 0) {
          reconcileBothSelections(urlSelectedId, tableSelectionIds);
        }
        // If both are empty, no reconciliation needed
      } catch (error) {
        logger.error("[StateReconciliation] Error during state reconciliation:", error);
        // On error, clear both states to prevent inconsistency
        clearSelectedRecord(windowId, tab.id);
        graph.clearSelected(tab);
        graph.clearSelectedMultiple(tab);
      }
    },
    [windowId, currentWindowId, tab, recordsMap, setSelectedRecord, clearSelectedRecord, graph]
  );

  /**
   * Validates if a record ID exists in the current dataset
   */
  const validateRecordExists = useCallback(
    (recordId: string): boolean => {
      return recordsMap.has(recordId);
    },
    [recordsMap]
  );

  /**
   * Gets the current URL selected record ID for this tab
   */
  const getURLSelectedRecord = useCallback((): string | undefined => {
    if (!windowId) return undefined;
    return getSelectedRecord(windowId, tab.id);
  }, [windowId, tab.id, getSelectedRecord]);

  /**
   * Handles synchronization errors by clearing inconsistent state
   */
  const handleSyncError = useCallback(
    (error: Error, context: string) => {
      logger.warn(`[StateReconciliation] Sync error in ${context}:`, error);

      // Attempt to recover by clearing inconsistent state
      if (windowId) {
        clearSelectedRecord(windowId, tab.id);
        graph.clearSelected(tab);
        graph.clearSelectedMultiple(tab);
      }
    },
    [windowId, tab, clearSelectedRecord, graph]
  );

  return {
    reconcileStates,
    validateRecordExists,
    getURLSelectedRecord,
    handleSyncError,
    recordsMap,
  };
};

export default useStateReconciliation;
