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

import { type RefObject, useMemo } from "react";
import type { MRT_Row, MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { type ShortcutBindings, useShortcutBindings } from "@/hooks/useShortcutBindings";
import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import {
  findFirstFilterInput,
  isGridBodyTarget,
  isGridHeaderTarget,
  isGridTarget,
} from "@/utils/table/gridShortcutScope";

type GridTable = MRT_TableInstance<EntityData>;

interface UseGridShortcutsParams {
  containerRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<GridTable | null>;
  /** The grid is visible, its tab is focused and no row is being edited inline. */
  enabled: boolean;
  onNewRow: () => void;
  onEditRow: (row: MRT_Row<EntityData>) => void;
  onOpenInForm: (row: MRT_Row<EntityData>) => void;
}

/** The selected row when exactly one is selected, as the classic edit shortcuts require. */
export function getSingleSelectedRow(table: GridTable | null): MRT_Row<EntityData> | null {
  const rows = table?.getSelectedRowModel().rows ?? [];
  if (rows.length !== 1) return null;
  return rows[0];
}

/** Classic `Grid_FocusGrid`: back from the filter row to the rows, selecting the first one if none is. */
export function focusGridRows(container: HTMLElement | null, table: GridTable | null): void {
  container?.focus();
  if (!table || table.getSelectedRowModel().rows.length > 0) return;
  const [firstRow] = table.getRowModel().rows;
  if (firstRow) table.setRowSelection({ [firstRow.id]: true });
}

/**
 * Classic grid shortcuts. Like `OBGrid.body` / `OBGrid.filter`, each one only fires from its part
 * of this grid, so arrows, Enter and typing elsewhere are untouched:
 * - rows: select / unselect all (Alt+Shift+A/N), edit inline (F2), edit in form (Ctrl+F2);
 * - filter row: back to the rows (Escape);
 * - anywhere in the grid: focus the filter row (Ctrl+Shift+F), clear the column filters keeping
 *   the implicit filter, as classic `clearFilter(true)` (Alt+Delete).
 * New row (Ctrl+I) works from any part of the focused tab. Delete is the toolbar's (it confirms).
 */
export function useGridShortcuts({
  containerRef,
  tableRef,
  enabled,
  onNewRow,
  onEditRow,
  onOpenInForm,
}: UseGridShortcutsParams): void {
  const bindings = useMemo<ShortcutBindings>(() => {
    const inGrid = (event: KeyboardEvent) => isGridTarget(event.target, containerRef.current);
    const inRows = (event: KeyboardEvent) => isGridBodyTarget(event.target, containerRef.current);
    const inFilterRow = (event: KeyboardEvent) => isGridHeaderTarget(event.target, containerRef.current);
    const withSingleRow = (action: (row: MRT_Row<EntityData>) => void) => () => {
      const row = getSingleSelectedRow(tableRef.current);
      if (row) action(row);
    };

    return {
      [SHORTCUT_IDS.TOOLBAR_NEW_ROW]: { handler: onNewRow, allowInInputs: true },
      [SHORTCUT_IDS.GRID_FOCUS_FILTER]: {
        handler: () => findFirstFilterInput(containerRef.current)?.focus(),
        allowInInputs: true,
        isInScope: inGrid,
      },
      [SHORTCUT_IDS.GRID_FOCUS_GRID]: {
        handler: () => focusGridRows(containerRef.current, tableRef.current),
        allowInInputs: true,
        isInScope: inFilterRow,
      },
      [SHORTCUT_IDS.GRID_CLEAR_FILTER]: {
        handler: () => tableRef.current?.setColumnFilters([]),
        allowInInputs: true,
        isInScope: inGrid,
      },
      [SHORTCUT_IDS.GRID_SELECT_ALL]: {
        handler: () => tableRef.current?.toggleAllRowsSelected(true),
        isInScope: inRows,
      },
      [SHORTCUT_IDS.GRID_UNSELECT_ALL]: {
        handler: () => tableRef.current?.toggleAllRowsSelected(false),
        isInScope: inRows,
      },
      [SHORTCUT_IDS.VIEW_GRID_EDIT_IN_GRID]: { handler: withSingleRow(onEditRow), isInScope: inRows },
      [SHORTCUT_IDS.VIEW_GRID_EDIT_IN_FORM]: { handler: withSingleRow(onOpenInForm), isInScope: inRows },
    };
  }, [containerRef, tableRef, onNewRow, onEditRow, onOpenInForm]);

  useShortcutBindings(bindings, enabled);
}
