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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useCallback, useMemo } from "react";
import type { MRT_ColumnPinningState, MRT_ColumnSizingState, MRT_Updater } from "material-react-table";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { scheduleGridConfigurationSave } from "@/utils/savedViews/gridConfiguration";
import { isUserColumnReorder, resolveUpdater, withFixedPinnedColumns } from "@/utils/table/columnState";

interface UseColumnLayoutParams {
  windowIdentifier: string;
  tabId: string;
  tabLevel: number;
  /** Stored column order of the tab. */
  columnOrder: string[];
  /** Stores a new column order (the table data handler). */
  onColumnOrderChange: (order: string[]) => void;
}

export interface UseColumnLayoutReturn {
  /** Column widths for the MRT `columnSizing` state. */
  columnSizing: MRT_ColumnSizingState;
  /** Pinned columns for the MRT `columnPinning` state, always led by the fixed ones. */
  columnPinning: MRT_ColumnPinningState;
  handleColumnSizingChange: (updater: MRT_Updater<MRT_ColumnSizingState>) => void;
  handleColumnPinningChange: (updater: MRT_Updater<MRT_ColumnPinningState>) => void;
  handleColumnOrderChange: (updater: MRT_Updater<string[]>) => void;
  /** Stores the column configuration of the tab for the user after a change the user made. */
  scheduleColumnSave: () => void;
}

/**
 * Controlled column width, pinning and order of a grid (classic field `width` / `frozen` and field
 * order), kept in the window store and stored for the user only after changes the user makes:
 * resizing, pinning, and reordering. The order MRT sets by itself is never stored.
 */
export const useColumnLayout = ({
  windowIdentifier,
  tabId,
  tabLevel,
  columnOrder,
  onColumnOrderChange,
}: UseColumnLayoutParams): UseColumnLayoutReturn => {
  const { tableColumnSizing, tableColumnPinning, setTableColumnSizing, setTableColumnPinning } =
    useTableStatePersistenceTab({ windowIdentifier, tabId, tabLevel });

  const columnPinning = useMemo(() => withFixedPinnedColumns(tableColumnPinning), [tableColumnPinning]);

  const scheduleColumnSave = useCallback(() => {
    if (!windowIdentifier || !tabId) return;
    scheduleGridConfigurationSave(windowIdentifier, tabId);
  }, [windowIdentifier, tabId]);

  const handleColumnSizingChange = useCallback(
    (updater: MRT_Updater<MRT_ColumnSizingState>) => {
      setTableColumnSizing(updater);
      scheduleColumnSave();
    },
    [setTableColumnSizing, scheduleColumnSave]
  );

  const handleColumnPinningChange = useCallback(
    (updater: MRT_Updater<MRT_ColumnPinningState>) => {
      setTableColumnPinning(withFixedPinnedColumns(resolveUpdater(updater, columnPinning)));
      scheduleColumnSave();
    },
    [columnPinning, setTableColumnPinning, scheduleColumnSave]
  );

  const handleColumnOrderChange = useCallback(
    (updater: MRT_Updater<string[]>) => {
      const nextOrder = resolveUpdater(updater, columnOrder);
      onColumnOrderChange(nextOrder);
      if (isUserColumnReorder(columnOrder, nextOrder)) {
        scheduleColumnSave();
      }
    },
    [columnOrder, onColumnOrderChange, scheduleColumnSave]
  );

  return {
    columnSizing: tableColumnSizing,
    columnPinning,
    handleColumnSizingChange,
    handleColumnPinningChange,
    handleColumnOrderChange,
    scheduleColumnSave,
  };
};
