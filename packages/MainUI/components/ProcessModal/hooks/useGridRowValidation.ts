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

import { useMemo } from "react";
import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";

export interface GridValidationInput {
  /** Rows currently selected in this embedded P&E grid. Empty when nothing is picked. */
  selectedRows: EntityData[];
  /** Tab fields metadata for the grid (cell definitions). */
  fields: Record<string, Field> | undefined;
}

export interface UseGridRowValidationParams {
  /**
   * One entry per Window Reference parameter rendered in the modal. Single-grid
   * P&E (28 of the 32 catalog windows) sends just one entry; Add Payment-style
   * multi-grid P&E sends one entry per stacked grid.
   */
  grids: GridValidationInput[];
}

export interface UseGridRowValidationResult {
  /** True when at least one selected row has an empty mandatory cell. */
  hasInvalidSelection: boolean;
  /** Maps `row.id` → set of `field.hqlName` that are mandatory but empty. */
  invalidCellsByRow: Map<string, Set<string>>;
}

const isEmptyCellValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
};

const collectMandatoryFields = (fields: Record<string, Field> | undefined): Field[] => {
  if (!fields) return [];
  return Object.values(fields).filter((field) => field.isMandatory && field.isUpdatable && field.displayed);
};

/**
 * Validates inline-editable mandatory cells across the rows selected in a P&E
 * grid. The Execute button is gated against {@link UseGridRowValidationResult.hasInvalidSelection}
 * so a process is never dispatched with empty required cells.
 *
 * Display logic per-row evaluation is intentionally not done here: in Etendo
 * Classic the grid columns are pre-projected by the tab definition and dynamic
 * hiding is rare. If a future P&E ships per-row display logic, it can be added
 * by feeding `compileExpression` + `createSmartContext` per row — same pattern
 * used by {@link useDisplayLogic}.
 */
const validateGrid = (grid: GridValidationInput, invalidCellsByRow: Map<string, Set<string>>): void => {
  if (!grid.selectedRows.length) return;
  const mandatoryFields = collectMandatoryFields(grid.fields);
  if (!mandatoryFields.length) return;

  for (const row of grid.selectedRows) {
    const rowKey = String(row.id ?? "");
    const rowData = row as Record<string, unknown>;
    const existing = invalidCellsByRow.get(rowKey) ?? new Set<string>();
    for (const field of mandatoryFields) {
      if (isEmptyCellValue(rowData[field.hqlName])) {
        existing.add(field.hqlName);
      }
    }
    if (existing.size > 0) {
      invalidCellsByRow.set(rowKey, existing);
    }
  }
};

export const useGridRowValidation = ({ grids }: UseGridRowValidationParams): UseGridRowValidationResult => {
  return useMemo(() => {
    const invalidCellsByRow = new Map<string, Set<string>>();
    for (const grid of grids) {
      validateGrid(grid, invalidCellsByRow);
    }
    return {
      hasInvalidSelection: invalidCellsByRow.size > 0,
      invalidCellsByRow,
    };
  }, [grids]);
};
