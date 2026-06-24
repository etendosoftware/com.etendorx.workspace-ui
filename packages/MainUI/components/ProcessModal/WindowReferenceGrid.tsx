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

import { FilterAlt, FilterAltOff } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import PlusIcon from "../../../ComponentLibrary/src/assets/icons/plus.svg";
import TrashIcon from "../../../ComponentLibrary/src/assets/icons/trash.svg";
import SearchIcon from "../../../ComponentLibrary/src/assets/icons/search.svg";
import XIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import SaveIcon from "../../../ComponentLibrary/src/assets/icons/save.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { useTab } from "@/hooks/useTab";
import {
  type EntityData,
  type EntityValue,
  type Column,
  type Field,
  type Tab,
  type Criteria,
  UIPattern,
  FieldType,
} from "@workspaceui/api-client/src/api/types";
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
  MRT_ToggleFullScreenButton,
  useMaterialReactTable,
  createRow,
  type MRT_RowSelectionState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
  type MRT_Row,
  type MRT_TopToolbarProps,
  type MRT_ColumnDef,
  type MRT_SortingState,
} from "material-react-table";

import { useDatasource } from "@/hooks/useDatasource";
import { useGridColumnFilters } from "@/hooks/table/useGridColumnFilters";
import { useColumns } from "@/hooks/table/useColumns";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { tabAllowsMultipleSelection } from "@/utils/processes/definition/pickAndExecute";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import EmptyState from "../Table/EmptyState";
import Loading from "../loading";
import { tableStyles } from "./styles";
import type { WindowReferenceGridProps } from "./types";
import type { GridSelectionStructure } from "./ProcessDefinitionModal";
import { useUserStore } from "@/stores/userStore";
import { GridCellEditor } from "./GridCellEditor";
import { getPayScriptRules } from "./callouts/genericPayScriptCallout";
import { resolveMutualExclusion } from "@/payscript/engine/LogicEngine";
import { buildLocalGridRecord } from "./utils/generateLocalRecordId";
import { applyNumericMandatoryDefaults, collectMissingMandatory } from "./utils/validateMandatoryFields";
import { WindowReferenceGridProvider, useWindowReferenceGridContext } from "./WindowReferenceGridContext";
import { getFieldReference } from "@/utils";
import { buildEtendoContext } from "@/utils/contextUtils";
import { buildBaseCriteria } from "@/utils/criteriaUtils";
import { useSelected } from "@/hooks/useSelected";
import { PROCESS_DEFINITION_DATA } from "../../utils/processes/definition/constants";
import {
  convertDatasourceValue,
  resolveContextValue,
  applyMergedParam,
  buildFilterCriteriaEntry,
  normalizeContextKey,
  addSelectedIDsToCriteria,
} from "@/utils/processes/definition/utils";
import { logger } from "@/utils/logger";
import {
  buildGridVisibility,
  createGridProxy,
  createItemProxy,
  createViewProxy,
  ICON_PRESET,
} from "@/utils/processes/definition/scriptProxies";
import type {
  ColumnOnChange,
  ColumnValidator,
  FormHandle,
  GridController,
  GridProxy,
  RowActionButton,
  RowActionContext,
  RowActionDescriptor,
  RowActionRenderer,
  ViewProxy,
} from "@/utils/processes/definition/scriptProxies";

const MAX_WIDTH = 100;
const PAGE_SIZE = 100;
const EMPTY_PATCH: Record<string, number> = Object.freeze({});

// Selection-driven amount fields the substrate syncs/zeroes on selection changes.
const AMOUNT_FIELD = "amount";
const PAYMENT_AMOUNT_FIELD = "paymentAmount";

// Pick & Execute fetch param carrying the tabId of the view that owns the process
// button (the tab the process was launched from). Backend HQL transformers read it
// to pick the right query branch — see Classic OBPickAndExecuteGrid.transformRequest.
const BUTTON_OWNER_VIEW_TAB_ID_PARAM = "buttonOwnerViewTabId";

/**
 * Expands a column key to both naming shapes used across the row state:
 *   - HQL camelCase (`paidOut`)   — what `parseColumns` puts on `col.columnName`
 *   - DB snake_case (`paid_out`) — what `parseColumns` puts on `col.dbColumnName`
 *
 * `GridCellEditor.handleChange` mirrors writes to both keys on `row.original`
 * (and the accessor reads `value[dbColumnName] ?? value[hqlName]`), so the
 * sibling-zeroing path must also touch both — otherwise the sibling cell ends
 * up with one shape at the new value and the other at the old, and which one
 * "wins" depends on the accessor's nullish chain.
 */
export function expandKeyVariants(key: string): string[] {
  if (/[A-Z]/.test(key)) {
    const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    return snake === key ? [key] : [key, snake];
  }
  if (key.includes("_")) {
    const camel = key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
    return camel === key ? [key] : [key, camel];
  }
  return [key];
}

/**
 * True when `name` looks like a canonical HQL property name: camelCase, leading
 * lowercase ASCII letter, only `[A-Za-z0-9]` afterward — no underscores, dots,
 * slashes, or spaces. Etendo's `Sqlc.TransformaNombreColumna` strips all of
 * those when deriving property names from DB column names, so the canonical
 * shape is strictly camelCase.
 *
 * Rejects DB column names (`c_glitem_id`, `received_in`) and broken display
 * labels (`"g/LItem"`, `"G/L Item"`, `"orderNo."`).
 */
export function isValidHqlName(name: unknown): name is string {
  return typeof name === "string" && /^[a-z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Resolves a grid field's HQL property name. The metadata key in
 * `tab.fields["<key>"]` is the canonical HQL property name by Etendo
 * convention — it matches what backend handlers expect (e.g.
 * `glItem.getString("gLItem")`). `field.hqlName` from the metadata API is
 * sometimes a broken display label (`"g/LItem"`, `"orderNo."`), and
 * `field.columnName` is usually the DB snake_case column (`"c_glitem_id"`,
 * `"received_in"`). When the key looks like a clean HQL identifier, trust it
 * over the field's self-reported names.
 *
 * @param field        the grid column metadata
 * @param metadataKey  the entry key from `Object.entries(tab.fields)`
 */
// biome-ignore lint/suspicious/noExplicitAny: process metadata field is untyped at this layer
export function resolveHqlName(field: any, metadataKey: string): string {
  if (isValidHqlName(metadataKey)) return metadataKey;
  if (isValidHqlName(field?.hqlName)) return field.hqlName;
  if (isValidHqlName(field?.columnName)) return field.columnName;
  return metadataKey || "";
}

/**
 * Looks up the payscript registered for `processId` and applies any
 * declarative `fieldInteractions` rule (e.g. mutually-exclusive columns) that
 * matches `changes`. Mutates `row.original` in place with the sibling patch so
 * the live MRT row stays consistent with the dual-key write pattern used by
 * `GridCellEditor`, and returns the merged patch ready to be fed into
 * `setLocalRecords` / `onSelectionChange`.
 *
 * Returns the original `changes` unchanged when there are no rules, no
 * matching grid entry, or no triggered exclusion. Exported for unit testing.
 */
export function applyFieldInteractions(
  processId: string | undefined,
  gridName: string,
  // biome-ignore lint/suspicious/noExplicitAny: MRT row object is intentionally untyped across this file
  row: any,
  // biome-ignore lint/suspicious/noExplicitAny: payscript changes patch is intentionally untyped
  changes: Record<string, any>
  // biome-ignore lint/suspicious/noExplicitAny: merged patch passes through to setLocalRecords
): Record<string, any> {
  const rules = processId ? getPayScriptRules(processId) : undefined;
  const rawSiblingPatch = rules ? resolveMutualExclusion(rules, gridName, changes) : EMPTY_PATCH;
  // Expand each emitted sibling key to both DB and HQL shapes so row.original
  // (and the cell-edit cache) stay consistent with the dual-key write pattern.
  // biome-ignore lint/suspicious/noExplicitAny: same untyped patch shape
  const siblingPatch: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawSiblingPatch)) {
    for (const variant of expandKeyVariants(key)) {
      siblingPatch[variant] = value;
    }
  }
  if (Object.keys(siblingPatch).length === 0) return changes;
  for (const [key, value] of Object.entries(siblingPatch)) {
    row.original[key] = value;
    // Mirror to MRT's per-cell cache so the sibling cell renders the new value
    // on next paint (MRT's memo bails on identical `cell.getValue()`, which
    // reads from `_valuesCache[column.id]`). Writing both DB and HQL variants
    // covers whichever shape MRT uses as the column id for this grid.
    if (row._valuesCache) {
      row._valuesCache[key] = value;
    }
  }
  return { ...changes, ...siblingPatch };
}
// Fixed paper height keeps the table visually constant regardless of row count.
// Placing the size on the paper (which is the visible "card" wrapping toolbar +
// table container) avoids the flex-1/flex-basis: 0% collapse the container
// suffered when set in isolation. The container's `flex-1` then correctly fills
// the remaining space below the toolbar.
const TABLE_PAPER_HEIGHT = 350;

/**
 * Compiles and evaluates a server-rewritten display-logic expression. Returns
 * the truthy result, or `true` if compilation/evaluation throws — failing open
 * keeps a column visible when its expression is malformed, matching the
 * behavior of the form-level display-logic evaluator.
 */
function evaluateExpression(
  expression: string,
  session: Record<string, unknown>,
  context: Record<string, unknown>,
  fieldName: string,
  kind: string
): boolean {
  try {
    const compiled = compileExpression(expression);
    return !!compiled(session, context);
  } catch (e) {
    console.warn(`Error evaluating ${kind} for field ${fieldName}`, e);
    return true;
  }
}

/**
 * Pure predicate that decides whether a grid column should render. Combines
 * the static flags (`isActive`, `displayed`, `showInGridView`) with the two
 * server-rewritten expressions (`displayLogicExpression`,
 * `gridDisplayLogicExpression`). Extracted from the component so the
 * visibility logic can be unit-tested without rendering the grid.
 */
export function isFieldVisibleForContext(
  field: any,
  session: Record<string, unknown>,
  context: Record<string, unknown>
): boolean {
  if (field.isActive === false) return false;
  if (field.displayed === false) return false;
  if (!field.showInGridView) return false;

  if (
    field.displayLogicExpression &&
    !evaluateExpression(field.displayLogicExpression, session, context, field.name, "display logic")
  ) {
    return false;
  }

  if (
    field.gridDisplayLogicExpression &&
    !evaluateExpression(field.gridDisplayLogicExpression, session, context, field.name, "grid display logic")
  ) {
    return false;
  }

  return true;
}

/**
 * Extracts the actual value from a wrapped value object or returns the value directly
 */
export function extractActualValue(value: unknown): EntityValue {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value: EntityValue }).value;
  }
  return value as EntityValue;
}

/**
 * Merges default values into the params object
 */
export function mergeDefaultsIntoParams(
  defaults: Record<string, unknown>,
  mergedParams: Record<string, EntityValue>
): void {
  for (const [key, value] of Object.entries(defaults)) {
    mergedParams[key] = extractActualValue(value);
  }
}

/**
 * Merges current values into the params object, overriding defaults
 */
export function mergeCurrentValuesIntoParams(
  currentValues: Record<string, unknown>,
  mergedParams: Record<string, EntityValue>
): void {
  for (const [key, value] of Object.entries(currentValues)) {
    if (value !== undefined && value !== null) {
      mergedParams[key] = extractActualValue(value);
    }
  }
}

/**
 * Builds the sortBy string for the backend based on MRT sorting state and columns.
 * @returns {string | undefined} The sortBy string or undefined if no sorting/criteria.
 */
export function getSortByString(
  sorting: MRT_SortingState,
  rawColumns: Column[],
  hasCriteria: boolean
): string | undefined {
  if (sorting.length > 0) {
    const sortItem = sorting[0];
    const column = rawColumns?.find((col: Column) => col.id === sortItem.id || col.header === sortItem.id);
    const fieldName = (column as any)?.filterFieldName || column?.columnName || sortItem.id;
    return sortItem.desc ? `-${fieldName}` : fieldName;
  }
  if (hasCriteria) {
    return "-documentNo";
  }
  return undefined;
}

/**
 * Resolves the sortBy string for the datasource options.
 * Extracted to reduce cognitive complexity of the datasourceOptions memo.
 */
export function resolveSortBy(
  sorting: MRT_SortingState,
  rawColumns: Column[],
  finalCriteria: unknown[],
  tabOrderBy: string | undefined
): string | undefined {
  if (sorting.length > 0) {
    return getSortByString(sorting, rawColumns, finalCriteria.length > 0);
  }
  const fallback = finalCriteria.length > 0 ? "-documentNo" : undefined;
  return tabOrderBy ?? fallback;
}

/**
 * Builds a stable, cheap-to-compare key from the scalar entries of an object.
 * Used by `useMemo` to stabilize prop references that change identity but not
 * content across parent re-renders (e.g. when a cell edit re-renders the
 * modal and the same `currentValues` arrives as a fresh object).
 *
 * Object/array entries are ignored — they would need full JSON.stringify and
 * we don't currently rely on nested structure for the consumers (datasource
 * params, record-context). Adding nested support would slow the hot path
 * without payoff.
 */
export function computeScalarStableKey(values: Record<string, unknown> | null | undefined): string {
  if (!values) return "";
  return Object.entries(values)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

// Predicate telling whether a record field is read-only (and therefore must not
// be zeroed). When omitted, every field is treated as editable (legacy behavior).
type IsFieldReadOnly = (fieldName: string) => boolean;

// True when an amount-like field holds a non-zero value safe to zero (not read-only).
// Shared by the load-time reset (resetAmountField) and the deselect path
// (buildDeselectedRecord) so both honor the same read-only guard (e.g. the invoice
// `amount` cap in Add Invoices).
const shouldZeroAmountField = (record: EntityData, fieldName: string, isFieldReadOnly?: IsFieldReadOnly): boolean => {
  if (record[fieldName] === undefined || record[fieldName] === 0) {
    return false;
  }
  return !isFieldReadOnly?.(fieldName);
};

/**
 * Mirrors Classic SmartClient: marks a record as selected and applies the
 * default payment amount in a single pass. Reused by the initial sync (so
 * pre-selected rows render with the default already in place) and by
 * `handleRowSelection` when the user toggles a row.
 *
 * Default precedence: an existing non-zero `payment` wins; otherwise
 * `expectedAmount` if defined; otherwise `outstanding`; otherwise `0`.
 *
 * Returns the same reference when no change is needed so React downstream
 * memoization can skip work.
 */
export function buildSelectedRecord(record: EntityData): EntityData {
  const hasNonZeroPayment = record.payment != null && Number(record.payment) !== 0;
  const defaultPayment = hasNonZeroPayment ? record.payment : (record.expectedAmount ?? record.outstanding ?? 0);
  if (record.obSelected === true && record.payment === defaultPayment) return record;
  return { ...record, obSelected: true, payment: defaultPayment };
}

/**
 * Resets payment-related fields on a deselected record.
 * Extracted to reduce cognitive complexity of handleRowSelection.
 *
 * Read-only-aware: a field flagged read-only (e.g. the invoice `amount` cap in
 * Add Invoices) is left untouched, so migrated validations that read it keep
 * working. Without a predicate it zeroes both amount fields (legacy behavior).
 */
export function buildDeselectedRecord(
  record: EntityData,
  isFieldReadOnly?: IsFieldReadOnly
): { updated: EntityData; changed: boolean } {
  let updated = record;
  let changed = false;
  if (updated.obSelected) {
    updated = { ...updated, obSelected: false };
    changed = true;
  }
  if (updated.payment !== undefined && updated.payment !== 0) {
    updated = { ...updated, payment: 0 };
    changed = true;
  }
  if (shouldZeroAmountField(updated, AMOUNT_FIELD, isFieldReadOnly)) {
    updated = { ...updated, [AMOUNT_FIELD]: 0 };
    changed = true;
  }
  if (shouldZeroAmountField(updated, PAYMENT_AMOUNT_FIELD, isFieldReadOnly)) {
    updated = { ...updated, [PAYMENT_AMOUNT_FIELD]: 0 };
    changed = true;
  }
  return { updated, changed };
}

/**
 * WindowReferenceGrid Component
 * Displays a grid of referenced records that can be selected
 */

// Stable renderer component that consumes context instead of closures
// detailed props type would be better but simple any works for MRT contract here
const StableGridCellEditorRenderer = ({ cell, row, column }: any) => {
  const { fieldsRef, handleRecordChangeRef, validations, createRowErrors, clearCellError, siblingPatchVersion } =
    useWindowReferenceGridContext();

  // Check for validation errors for this row.
  // Guard: new rows in MRT create mode have row.original = {} (id === undefined).
  // Without the guard, any validation entry with context.id === undefined would match every new row.
  const rowId = row.original?.id;
  const validationError = rowId
    ? validations?.find((v: any) => {
        if (!v.isValid && v.context) {
          return v.context.id === rowId || v.context.rowId === rowId;
        }
        return false;
      })
    : undefined;

  // Mandatory-empty marker for the active create-row. Produces a red border
  // without any user-visible text/tooltip (handled inside GridCellEditor).
  // `createRowErrors` stores DB column names; `column.columnDef.columnName`
  // is the parsed HQL camelCase name (set by `parseColumns`), so we have to
  // check both shapes for the lookup to land.
  const colDef = column.columnDef as { columnName?: string; dbColumnName?: string };
  const isCreateRow = !rowId;
  const forceError =
    isCreateRow &&
    ((!!colDef.dbColumnName && createRowErrors.has(colDef.dbColumnName)) ||
      (!!colDef.columnName && createRowErrors.has(colDef.columnName)));

  // GridCellEditor expects 'col' with columnName.
  // column.columnDef usually has what we populated in useMemo columns.
  return (
    <GridCellEditor
      cell={cell}
      row={row}
      col={column.columnDef}
      fields={fieldsRef.current}
      onRecordChange={handleRecordChangeRef.current || undefined}
      validationError={validationError}
      forceError={forceError}
      onCellEdit={isCreateRow ? clearCellError : undefined}
      siblingPatchVersion={siblingPatchVersion}
      data-testid="GridCellEditor__ce8544"
    />
  );
};

// Helper to resolve parent context ID
export const resolveParentContextId = (
  dbName: string,
  effectiveRecordValues: any,
  currentValues: any
): { parentContextId: string | undefined; contextDocNo: string | undefined } => {
  // Helper: convert DB_NAME to inpDbName (camelCase)
  const toCamel = (s: string) => {
    return s
      .toLowerCase()
      .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      .replace(/_id$/, "Id");
  };
  const inpName = `inp${toCamel(dbName)}`;

  // Potential keys to find the ID
  const keysToCheck = [
    dbName,
    inpName,
    `inp${dbName}`, // simple prefix
  ];

  // Specific mapping for Add Payment 'order_invoice' generic parameter
  const isOrderInvoiceGrid = ["order_invoice", "C_Order_ID", "C_Invoice_ID"].includes(dbName);

  if (isOrderInvoiceGrid) {
    keysToCheck.push("C_Order_ID", "C_Invoice_ID", "inpcOrderId", "inpcInvoiceId");
  }

  let parentContextId: string | undefined;

  // Search in effective values
  for (const k of keysToCheck) {
    const val = effectiveRecordValues?.[k] || currentValues?.[k];
    if (val && typeof val === "string") {
      // Relaxed length check for debugging, usually 32 uuid
      if (val.length === 32) {
        parentContextId = val;
        break;
      }
    }
  }

  // Also retrieve Document No from context for fallback matching
  // biome-ignore lint/complexity/useLiteralKeys: special case for inpdocumentno
  const contextDocNo = effectiveRecordValues?.["inpdocumentno"] || currentValues?.["inpdocumentno"];

  return { parentContextId, contextDocNo };
};

/**
 * Pure predicate: `true` iff the row has a persisted/confirmed id. Used by
 * `enableEditing` to refuse edit-mode for any row that isn't the active
 * create-row. Combined with `editDisplayMode: "row"` this blocks the
 * double-click-to-edit-a-cell vector — MRT honours `enableEditing=false`
 * regardless of how edit-mode was triggered.
 */
// biome-ignore lint/suspicious/noExplicitAny: MRT row instance is untyped here
export const isPersistedRow = (row: any): boolean => Boolean(row?.original?.id);

/**
 * Pure decision for whether a grid cell should mount the inline editor.
 * `isSelected` is the legacy selection-based gate (grids with a checkbox).
 * Read-only fields and rows confirmed via the "+" toolbar (`isLocallyAdded`)
 * always render as inert.
 */
export const shouldRenderCellEditor = (
  isSelected: boolean,
  isFieldReadOnly: boolean,
  isLocallyAdded: boolean
): boolean => {
  if (isFieldReadOnly) return false;
  if (isLocallyAdded) return false;
  return isSelected;
};

/**
 * Normalises `windowReferenceTab.fields` (array OR object map) to a plain
 * array. Centralised because the metadata payload shape varies by caller.
 */
// biome-ignore lint/suspicious/noExplicitAny: tab fields shape is heterogeneous
const collectTabFields = (tab: any): any[] => {
  const raw = tab?.fields;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.values(raw);
};

/**
 * Looks up the field metadata that backs a grid column. Returns `undefined`
 * if no candidate matches any of the four supported key formats.
 */
// biome-ignore lint/suspicious/noExplicitAny: column / field types from MRT and AD metadata
const findFieldForColumn = (fields: any[], col: any): any | undefined => {
  return fields.find(
    (f) =>
      f.columnName === col.accessorKey ||
      f.inpColumnName === col.accessorKey ||
      f.hqlName === col.accessorKey ||
      f.name === col.header
  );
};

/**
 * Decides whether a single column should accept inline editing given its
 * metadata and the current read-only map. Pure function — exported for unit
 * testing.
 */
// biome-ignore lint/suspicious/noExplicitAny: column / field types from MRT and AD metadata
export const isColumnEditable = (col: any, fields: any[], fieldReadOnlyMap: Record<string, boolean>): boolean => {
  if (col.id === "mrt-row-actions" || col.id === "mrt-row-select") return false;
  if (col.enableEditing === false) return false;

  const field = findFieldForColumn(fields, col);
  // Unknown columns: trust the explicit `enableEditing` flag and default to
  // false for plain text/label columns to avoid the "fake editing" vector.
  if (!field) return col.enableEditing === true;

  if (field.readOnly === true) return false;
  if (field.isReadOnly === true) return false;
  if (field.uIPattern === UIPattern.READ_ONLY) return false;
  if (fieldReadOnlyMap[field.columnName]) return false;
  if (fieldReadOnlyMap[field.hqlName]) return false;

  return true;
};

/**
 * Builds the `enableEditing` predicate consumed by MRT. Returns `true` only
 * for the active create-row that has at least one editable column. Persisted
 * rows are always inert (defeats the double-click-edit vector).
 */
export const buildEnableEditingPredicate = (
  // biome-ignore lint/suspicious/noExplicitAny: MRT columns are untyped here
  finalColumns: any[],
  // biome-ignore lint/suspicious/noExplicitAny: AD tab metadata is heterogeneous
  windowReferenceTab: any,
  fieldReadOnlyMap: Record<string, boolean>
  // biome-ignore lint/suspicious/noExplicitAny: MRT row instance is untyped here
): ((row: any) => boolean) => {
  const fields = collectTabFields(windowReferenceTab);
  return (row) => {
    if (isPersistedRow(row)) return false;
    return finalColumns.some((col) => isColumnEditable(col, fields, fieldReadOnlyMap));
  };
};

/** Shared sizing for every action icon in the leading column (row buttons, trash, create-row). */
const ACTION_ICON_CLASS = "h-4 w-4";
const CREATE_ROW_CANCEL_TESTID = "WindowReferenceGrid__CreateRowCancelButton";
const CREATE_ROW_SAVE_TESTID = "WindowReferenceGrid__CreateRowSaveButton";
const CREATE_ROW_CANCEL_FALLBACK = "Cancel";
const CREATE_ROW_SAVE_FALLBACK = "Save";

interface CreateRowActionButtonsProps {
  // biome-ignore lint/suspicious/noExplicitAny: MRT row
  row: any;
  // biome-ignore lint/suspicious/noExplicitAny: MRT table instance
  table: any;
}

/**
 * Flushes the values typed into MRT's edit inputs for the given creating row into
 * `row._valuesCache`, mirroring MRT's own submit wiring so the fields MRT knows
 * about reach `onCreatingRowSave`. Only inputs whose name belongs to this row and
 * whose key already exists in the value cache are copied. Returns the value cache.
 */
export const collectEditInputValues = (
  // biome-ignore lint/suspicious/noExplicitAny: MRT row internals are untyped
  row: any,
  // biome-ignore lint/suspicious/noExplicitAny: MRT table internals are untyped
  table: any
) => {
  const editInputRefs = table?.refs?.editInputRefs?.current ?? {};
  const valuesCache = row?._valuesCache ?? {};
  // biome-ignore lint/suspicious/noExplicitAny: input refs are untyped DOM elements
  for (const input of Object.values<any>(editInputRefs)) {
    const name = input?.name;
    if (!name || name.split("_")[0] !== row.id) continue;
    if (input.value !== undefined && Object.hasOwn(valuesCache, name)) {
      valuesCache[name] = input.value;
    }
  }
  return valuesCache;
};

/**
 * Add/Cancel buttons for the grid's create-row scaffold. Replaces MRT's built-in
 * edit-action chrome so the create-row icons match the size, spacing and centering
 * of the other action icons in the column (script row buttons + the trash icon). It
 * drives MRT's creation flow directly: Cancel discards the scaffold; Save flushes
 * the edited inputs and hands them to `onCreatingRowSave`.
 */
export const CreateRowActionButtons = ({ row, table }: CreateRowActionButtonsProps) => {
  const { onCreatingRowSave, onCreatingRowCancel, localization } = table.options;
  const { isSaving } = table.getState();
  const cancelLabel = localization?.cancel ?? CREATE_ROW_CANCEL_FALLBACK;
  const saveLabel = localization?.save ?? CREATE_ROW_SAVE_FALLBACK;

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCreatingRowCancel?.({ row, table });
    table.setCreatingRow(null);
    row._valuesCache = {};
  };

  const handleSubmit = (event: React.MouseEvent) => {
    event.stopPropagation();
    const values = collectEditInputValues(row, table);
    onCreatingRowSave?.({
      exitCreatingMode: () => table.setCreatingRow(null),
      row,
      table,
      values,
    });
  };

  return (
    <div className="w-full flex justify-center items-center gap-1">
      <Tooltip title={cancelLabel} data-testid="CreateRowCancelTooltip__ce8544">
        <span>
          <IconButton aria-label={cancelLabel} onClick={handleCancel} data-testid={CREATE_ROW_CANCEL_TESTID}>
            <XIcon className={ACTION_ICON_CLASS} data-testid="XIcon__ce8544" />
          </IconButton>
        </span>
      </Tooltip>
      {onCreatingRowSave && (
        <Tooltip title={saveLabel} data-testid="CreateRowSaveTooltip__ce8544">
          <span>
            <IconButton
              aria-label={saveLabel}
              disabled={isSaving}
              onClick={handleSubmit}
              data-testid={CREATE_ROW_SAVE_TESTID}>
              <SaveIcon className={ACTION_ICON_CLASS} data-testid="SaveIcon__ce8544" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </div>
  );
};

/**
 * Whether the grid must render the leading "Actions" column. It is required when a
 * row would paint a button (deletable/locally-added rows or script row actions) and
 * also whenever the grid is creatable: the create-row scaffold must render through
 * `renderActionsCell` (our custom Add/Cancel buttons) instead of MRT's built-in
 * edit chrome, which only happens when row actions are enabled.
 */
export const shouldShowRowActions = (hasAnyActionableRow: boolean, hasRowActions: boolean, canAdd: boolean): boolean =>
  hasAnyActionableRow || hasRowActions || canAdd;

interface RenderActionsCellArgs {
  // biome-ignore lint/suspicious/noExplicitAny: MRT row
  row: any;
  // biome-ignore lint/suspicious/noExplicitAny: MRT table instance
  table: any;
  canDelete: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: handleDeleteRow signature
  onDelete: (row: any) => void;
  deleteRowLabel: string;
  /** Script-registered row buttons drawn before the delete icon on idle rows. */
  leadingActions?: React.ReactNode;
}

/**
 * Row-actions renderer for the P&E grids. Two branches:
 *  - creating row → defer to MRT's built-in Save/Cancel chrome.
 *  - idle row → render the script row buttons (if any) followed by the trash
 *    icon, disabled while another row is being created (locks the "one row at a
 *    time" contract).
 */
export const renderActionsCell = ({
  row,
  table,
  canDelete,
  onDelete,
  deleteRowLabel,
  leadingActions,
}: RenderActionsCellArgs) => {
  const state = table.getState();
  const isCreating = state.creatingRow?.id === row.id || !row.original?.id;
  if (isCreating) {
    return <CreateRowActionButtons row={row} table={table} data-testid="CreateRowActionButtons__ce8544" />;
  }
  const lockedByOther = Boolean(state.creatingRow);

  return (
    <div className="w-full flex justify-center items-center gap-1">
      {leadingActions}
      {canDelete && (
        <Tooltip title={deleteRowLabel} data-testid="Tooltip__ce8544">
          <span>
            <IconButton
              onClick={() => onDelete(row)}
              aria-label={deleteRowLabel}
              disabled={lockedByOther}
              data-testid="WindowReferenceGrid__DeleteRowButton">
              <TrashIcon className={ACTION_ICON_CLASS} data-testid="TrashIcon__ce8544" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </div>
  );
};

// Stable renderer for read-only cells
const ReadOnlyCellRenderer = ({ renderedCellValue }: any) => {
  const displayValue =
    typeof renderedCellValue === "string" && /^\d{4}-\d{2}-\d{2}T/.test(renderedCellValue)
      ? formatClassicDate(renderedCellValue, false) || renderedCellValue
      : renderedCellValue;
  return (
    <span className="text-gray-700 block truncate" title={String(displayValue ?? "")}>
      {displayValue}
    </span>
  );
};

// Stable renderer for interactive cells
const InteractiveGridCellRenderer = ({ row, cell, column }: any) => {
  const isSelected = row.getIsSelected();
  const isFieldReadOnly = Boolean(column.columnDef?.isFieldReadOnly);
  const isLocallyAdded = Boolean(row.original?._locallyAdded);

  if (shouldRenderCellEditor(isSelected, isFieldReadOnly, isLocallyAdded)) {
    return (
      <StableGridCellEditorRenderer
        cell={cell}
        row={row}
        column={column}
        data-testid="StableGridCellEditorRenderer__ce8544"
      />
    );
  }

  return <ReadOnlyCellRenderer renderedCellValue={cell.getValue()} data-testid="ReadOnlyCellRenderer__ce8544" />;
};

// Helper to get boolean edit props for MRT
export const getBooleanEditProps = (_cell: any) => {
  return {
    select: true,
    children: [
      <option key="Y" value="Y">
        Yes
      </option>,
      <option key="N" value="N">
        No
      </option>,
    ],
    SelectProps: {
      native: true,
    },
  };
};

export const GridCellRenderer = (props: any) => {
  const { row, column, cell } = props;
  const isSelected = row.getIsSelected();
  const isFieldReadOnly = Boolean(column.columnDef?.isFieldReadOnly);
  const isLocallyAdded = Boolean(row.original?._locallyAdded);

  if (shouldRenderCellEditor(isSelected, isFieldReadOnly, isLocallyAdded)) {
    return <StableGridCellEditorRenderer {...props} data-testid="StableGridCellEditorRenderer__ce8544" />;
  }

  // Handle date columns
  const colType = column.columnDef.type;
  const colReference = column.columnDef.column?.reference;
  const isDateCol = colType === "date" || colType === "datetime" || colReference === "15" || colReference === "16";
  const includeTimeForCol = colType === "datetime" || colReference === "16";
  const colColumnName = column.columnDef.columnName;

  if (isDateCol) {
    let value = cell?.getValue();
    if (value === undefined || value === null) {
      value = colColumnName ? row?.original?.[colColumnName] : undefined;
    }
    if (typeof value === "string" && value) {
      const formatted = formatClassicDate(value, includeTimeForCol);
      return <span>{formatted || value}</span>;
    }
    return <span>{value ? String(value) : ""}</span>;
  }

  // When this renderer is installed as the column's `Cell`, the *original*
  // Cell function from `useColumns` (color-tag wrapper, reference button,
  // clientclass link, etc.) is preserved under `fallbackCell` so we can
  // delegate to it for the non-selected, display-only path.
  const fallbackCell = column.columnDef.fallbackCell;
  if (fallbackCell && typeof fallbackCell === "function") {
    return fallbackCell(props);
  }

  return <InteractiveGridCellRenderer {...props} data-testid="InteractiveGridCellRenderer__ce8544" />;
};

// --- Per-row component plugin (declarative inline buttons) -----------------

const ROW_ACTIONS_COLUMN_ID = "script-row-actions";
/** Widened size of the leading actions column when it also hosts script buttons. */
const ACTIONS_COLUMN_SIZE_WITH_SCRIPT = 200;
const ACTIONS_COLUMN_SIZE_DEFAULT = 100;
const ROW_ACTION_ICON_CLASS = ACTION_ICON_CLASS;

/** Maps a declarative icon preset to its SVG component (no chained ternaries). */
const ROW_ACTION_ICONS: Record<string, typeof PlusIcon> = {
  [ICON_PRESET.SEARCH]: SearchIcon,
  [ICON_PRESET.ADD]: PlusIcon,
  [ICON_PRESET.CLEAR_RIGHT]: XIcon,
};

/** Renders one declarative row-action button; an unknown icon preset renders nothing. */
const RowActionButtonView = ({ button, onActivate }: { button: RowActionButton; onActivate: () => void }) => {
  const Icon = ROW_ACTION_ICONS[button.icon];
  if (!Icon) return null;
  const label = button.prompt ?? button.icon;
  // Stop propagation so the button never reaches the row-level selection toggle.
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (button.disabled) return;
    onActivate();
  };
  return (
    <Tooltip title={button.prompt ?? ""} data-testid="RowActionTooltip__ce8544">
      <span>
        <IconButton
          onClick={handleClick}
          aria-label={label}
          disabled={button.disabled}
          data-testid="WindowReferenceGrid__RowActionButton">
          <Icon className={ROW_ACTION_ICON_CLASS} data-testid="Icon__ce8544" />
        </IconButton>
      </span>
    </Tooltip>
  );
};

/**
 * Renders the inline row-action buttons declared by a migrated row renderer.
 * Returns a fragment (no wrapping element) so the buttons sit as direct siblings
 * of the delete icon in the leading actions cell — one centered, evenly-spaced row.
 */
export const RowActionsCell = ({
  buttons,
  onActivate,
}: {
  buttons: RowActionButton[];
  onActivate: (index: number) => void;
}) => {
  if (buttons.length === 0) return null;
  return (
    <>
      {buttons.map((button, index) => (
        <RowActionButtonView
          key={`${ROW_ACTIONS_COLUMN_ID}-${index}`}
          button={button}
          onActivate={() => onActivate(index)}
          data-testid="RowActionButtonView__ce8544"
        />
      ))}
    </>
  );
};

export const updateLocalRecordFromSelection = (record: EntityData, selectionItem: any): EntityData | null => {
  let updated = false;
  const newRecord = { ...record };

  if (selectionItem[AMOUNT_FIELD] !== undefined && selectionItem[AMOUNT_FIELD] !== newRecord[AMOUNT_FIELD]) {
    newRecord[AMOUNT_FIELD] = selectionItem[AMOUNT_FIELD];
    updated = true;
  }
  if (
    selectionItem[PAYMENT_AMOUNT_FIELD] !== undefined &&
    selectionItem[PAYMENT_AMOUNT_FIELD] !== newRecord[PAYMENT_AMOUNT_FIELD]
  ) {
    newRecord[PAYMENT_AMOUNT_FIELD] = selectionItem[PAYMENT_AMOUNT_FIELD];
    updated = true;
  }

  if (updated) {
    return { ...newRecord, ...selectionItem };
  }
  return null;
};

// Zeroes a single editable amount field in place. A read-only field (e.g. the
// invoice `amount` cap in Add Invoices) is left untouched so migrated validations
// that read it keep working. Returns whether the record was changed.
const resetAmountField = (record: EntityData, fieldName: string, isFieldReadOnly?: IsFieldReadOnly): boolean => {
  if (!shouldZeroAmountField(record, fieldName, isFieldReadOnly)) {
    return false;
  }
  record[fieldName] = 0;
  return true;
};

export const resetLocalRecordFields = (record: EntityData, isFieldReadOnly?: IsFieldReadOnly): EntityData | null => {
  const newRecord = { ...record };
  const amountChanged = resetAmountField(newRecord, AMOUNT_FIELD, isFieldReadOnly);
  const paymentChanged = resetAmountField(newRecord, PAYMENT_AMOUNT_FIELD, isFieldReadOnly);

  return amountChanged || paymentChanged ? newRecord : null;
};

// Sync the canonical selection cache with an MRT row-selection map: set selected
// rows, delete the rest. Single source of truth for both selection entry points
// (checkbox via handleRowSelection and row-body click via handleRowClick), so
// grid.getSelectedRecords() and onSelectionToggle reflect every user selection.
export const syncPersistentSelection = (
  cache: Map<string, EntityData>,
  recordsList: EntityData[],
  selection: MRT_RowSelectionState
): void => {
  for (const record of recordsList) {
    const id = String(record.id);
    if (selection[id]) {
      cache.set(id, record);
    } else {
      cache.delete(id);
    }
  }
};

// Returns a new array with `changes` merged into the row whose id matches; other
// rows keep their identity. Used both to commit (setLocalRecords) and to refresh
// the read store synchronously so cell-edit hooks see the just-typed value.
export const applyEditToRows = (
  records: EntityData[],
  rowId: unknown,
  changes: Record<string, EntityValue>
): EntityData[] => records.map((r) => (String(r.id) === String(rowId) ? { ...r, ...changes } : r));

// Applies an in-flight cell edit against the committed READ store
// (`gridApiRef.current.rows`) — the store the script proxy resolves rows from and
// that `getEditValues`/`getEditedCell`/the display read back. It returns the
// updated rows when the store holds `rowId`, or `null` when it does not (an MRT
// create-row, id="mrt-row-create", which persists only on `row.original`). The
// read store is the authority over `localRecordsRef`: it is at least as fresh
// (it can be one render ahead during the grid's phantom→real load) and it
// accumulates synchronous multi-row write bursts (e.g. the distribute loop)
// within a single tick, so using it as the base prevents both dropped writes and
// earlier writes being clobbered.
export const applyEditToReadStore = (
  readStoreRows: EntityData[],
  rowId: unknown,
  changes: Record<string, EntityValue>
): EntityData[] | null =>
  readStoreRows.some((r) => String(r.id) === String(rowId)) ? applyEditToRows(readStoreRows, rowId, changes) : null;

// Build the post-write record a column validator must see: the current row data
// overlaid with the pending changes. Classic validators read the value being
// written (e.g. `record.amount`), not the stale cell value; validating the
// pre-write value silently drops legitimate programmatic writes (the distribute
// loop setting amount=2.07 on a row whose default 0 fails a zero-amount check).
// Returns a fresh object — it never mutates `rowData`.
export const buildValidatorCandidate = (
  rowData: Record<string, unknown>,
  mergedChanges: Record<string, unknown>
): Record<string, unknown> => ({ ...rowData, ...(mergedChanges ?? {}) });

// Decides whether the per-column validator gate runs for a cell write. Classic
// fires cell validators ONLY on interactive (user) edits, never on programmatic
// writes (a script's `setEditValue` from distribute/seed); replicating that
// avoids a programmatic write being rejected — and raising a spurious validator
// message — by a validator that was only ever meant for user input. The gate
// also stays off during a column-onChange re-entry and when no validator is
// registered (the prior conditions).
export const shouldRunColumnValidators = (
  programmatic: boolean,
  inColumnOnChange: boolean,
  validatorCount: number
): boolean => !programmatic && !inColumnOnChange && validatorCount > 0;

// Outcome of `decideDatasourceSync`: whether the datasource-sync effect should
// process this render, plus the content signature the caller stores to dedup.
export interface DatasourceSyncDecision {
  shouldSync: boolean;
  signature: string;
}

// Decides whether the datasource-sync effect should process the current
// `rawRecords`. It proceeds only when (1) a real datasource fetch has completed
// — before that the records are a placeholder (initial state or the `skip`
// phase), NOT a delivered result — and (2) the serialized content differs from
// the last processed payload (dedup). Gating on the first fetch is what lets an
// empty result set still reach `onGridLoad`/`dataArrived`: without it the
// pre-fetch empty placeholder fires those hooks with a phantom `rowCount=0` and
// advances the dedup signature, so the genuine (also empty) delivery is then
// skipped. While gated the signature is returned unchanged so the caller never
// poisons its dedup ref. Classic fires these on data ARRIVAL, not while loading.
export const decideDatasourceSync = (
  rawRecords: EntityData[] | undefined,
  hasFirstFetchCompleted: boolean,
  lastSignature: string
): DatasourceSyncDecision => {
  if (!hasFirstFetchCompleted) {
    return { shouldSync: false, signature: lastSignature };
  }
  const signature = JSON.stringify(rawRecords ?? []);
  return { shouldSync: signature !== lastSignature, signature };
};

// Logic extracted to reduce cognitive complexity of useEffect
export const syncGridSelectionToLocalRecords = (
  externalSelection: any[],
  localRecords: EntityData[],
  setLocalRecords: (records: EntityData[]) => void,
  isFieldReadOnly?: IsFieldReadOnly
) => {
  let hasChanges = false;
  const newRecords = [...localRecords];
  const selectionMap = new Map(externalSelection.map((s: any) => [String(s.id), s]));

  for (let i = 0; i < newRecords.length; i++) {
    const record = newRecords[i];
    const selectionItem = selectionMap.get(String(record.id));

    if (selectionItem) {
      const updated = updateLocalRecordFromSelection(record, selectionItem);
      if (updated) {
        newRecords[i] = updated;
        hasChanges = true;
      }
    } else {
      const reset = resetLocalRecordFields(record, isFieldReadOnly);
      if (reset) {
        newRecords[i] = reset;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    setLocalRecords(newRecords);
  }
};

// Load-time race guard for the external-selection sync. The modal seeds
// `_selection: []` (from filterExpressions) before the backend pre-selection has
// propagated; the zeroing pass would then wipe a pre-selected row's editable
// `amount`. Defer the pass ONLY while this initial empty pass coincides with rows
// the backend pre-flagged (`obSelected`) and reconciliation hasn't happened yet.
// Once a real selection arrives, `reconciled` is set and this never guards again,
// so later engine/user-driven updates behave exactly as before (non-regressive).
export const shouldDeferInitialZeroing = (
  localRecords: EntityData[],
  externalSelection: unknown[],
  reconciled: boolean
): boolean => {
  if (reconciled || externalSelection.length > 0) {
    return false;
  }
  return localRecords.some((record) => record.obSelected === true);
};

// Builds an `isFieldReadOnly` predicate from the grid's computed read-only map.
// A missing/empty map yields a predicate that treats every field as editable,
// preserving the legacy zeroing behavior for grids without field metadata.
export const buildIsFieldReadOnly = (fieldReadOnlyMap: Record<string, boolean> | undefined): IsFieldReadOnly => {
  if (!fieldReadOnlyMap) {
    return () => false;
  }
  return (fieldName: string) => Boolean(fieldReadOnlyMap[fieldName]);
};

// Helper to find valid matching record in grid
export const findMatchingRecord = (
  rawRecords: any[],
  parentContextId: string | undefined,
  contextDocNo: string | undefined
) => {
  if (!rawRecords || rawRecords.length === 0) return undefined;

  return rawRecords.find(
    (r: any) =>
      (parentContextId &&
        (r.id === parentContextId ||
          r.order === parentContextId ||
          r.c_order_id === parentContextId ||
          r.salesOrder === parentContextId ||
          r.invoice === parentContextId ||
          r.c_invoice_id === parentContextId ||
          r.c_order_id?._identifier === parentContextId)) || // Edge case
      (contextDocNo &&
        typeof contextDocNo === "string" &&
        (r.salesOrderNo === contextDocNo || r.invoiceNo === contextDocNo || r.documentNo === contextDocNo))
  );
};

// Local type for datasource params
interface DatasourceParams {
  processId?: string;
  tabId?: string;
  windowId?: string;
  ad_org_id?: any;
  ad_client_id?: any;
  orderBy?: string;
  criteria?: any;
  [key: string]: any;
}

/**
 * Mirrors Classic OBPickAndExecuteGrid.transformRequest: P&E fetches carry the
 * tabId of the view that owns the process button (the tab the process was launched
 * from), which backend HQL transformers read to pick the right query branch. Only
 * set when an owner tab with an id exists (matches Classic's
 * `buttonOwnerView && buttonOwnerView.tabId` guard).
 */
export const applyButtonOwnerViewTabId = (options: DatasourceParams, originTab?: Tab): void => {
  if (!originTab?.id) return;
  options[BUTTON_OWNER_VIEW_TAB_ID_PARAM] = originTab.id;
};

// Standard context variable keys that are always valid filter columns
const STANDARD_FILTER_KEYS = [
  "c_bpartner_id",
  "m_product_id",
  "c_project_id",
  "c_campaign_id",
  "c_activity_id",
  "user1_id",
  "user2_id",
  "ad_org_id",
  "ad_client_id",
  "trxtype",
  "issotrx",
  "transaction_type",
] as const;

/**
 * Resolves a single dynamic key from PROCESS_DEFINITION_DATA and writes the
 * converted value into `options`. No-ops if the context value cannot be resolved.
 */
function resolveDynamicKey(
  key: string,
  valueMapping: unknown,
  recordValues: Record<string, unknown>,
  options: DatasourceParams
): void {
  const contextKey = normalizeContextKey(valueMapping as string);
  const resolvedValue = resolveContextValue(contextKey, recordValues);
  if (resolvedValue !== undefined && resolvedValue !== null) {
    options[key] = convertDatasourceValue(resolvedValue);
  }
}

/**
 * Applies all dynamic keys registered for a specific processId in
 * PROCESS_DEFINITION_DATA to the datasource options object.
 */
function applyProcessDynamicKeys(
  processId: string,
  recordValues: Record<string, unknown>,
  options: DatasourceParams
): void {
  const processDef = PROCESS_DEFINITION_DATA[processId];
  if (!processDef?.dynamicKeys) return;
  for (const [key, value] of Object.entries(processDef.dynamicKeys)) {
    resolveDynamicKey(key, value, recordValues, options);
  }
}

/**
 * Applies all dynamic context variables (org, client, and process-specific keys)
 * to the datasource options object.
 */
export function applyDynamicKeys(
  recordValues: Record<string, unknown>,
  processId: string | undefined,
  options: DatasourceParams
): void {
  if (!recordValues) return;
  if (recordValues.inpadOrgId) options.ad_org_id = recordValues.inpadOrgId;
  if (recordValues.inpadClientId) options.ad_client_id = recordValues.inpadClientId;
  if (processId) applyProcessDynamicKeys(processId, recordValues, options);
}

/**
 * Builds the set of column names that are valid filter targets for a given grid.
 * Includes fields from the window reference tab, the `fields` prop, and a set
 * of standard Etendo context keys.
 */
export function buildValidColumnNames(
  tabFields: Record<string, any> | undefined,
  propFields: any[] | undefined
): Set<string> {
  const validColumnNames = new Set<string>(STANDARD_FILTER_KEYS);

  for (const f of Object.values(tabFields || {})) {
    if (f.columnName) validColumnNames.add(f.columnName.toLowerCase());
    if (f.hqlName) validColumnNames.add(f.hqlName.toLowerCase());
  }

  for (const f of propFields || []) {
    if (f.columnName) validColumnNames.add(f.columnName.toLowerCase());
    if (f.name) validColumnNames.add(f.name.toLowerCase());
  }

  return validColumnNames;
}

/**
 * For each process parameter that has a matching value in `recordValues`, writes
 * the value to `options[dBColumnName]` — but only when the column name is in the
 * set of valid filter columns for this grid.
 */
export function applyRecordValues(
  parameters: Record<string, any>,
  recordValues: Record<string, unknown>,
  validColumnNames: Set<string>,
  options: DatasourceParams
): void {
  if (!parameters || !recordValues) return;

  for (const param of Object.values(parameters)) {
    const rawValue = extractActualValue(recordValues[param.name]);
    if (rawValue === undefined || rawValue === "" || rawValue === null || !param.dBColumnName) continue;
    if (validColumnNames.has(param.dBColumnName.toLowerCase())) {
      options[param.dBColumnName] = rawValue;
    }
  }
}

/**
 * Evaluates the readOnlyLogicExpression for a grid field.
 * Returns true if the field should be read-only.
 *
 * Logic mirrors ProcessParameterSelector's readOnly evaluation:
 * 1. Check field-level static flags (readOnly, isReadOnly)
 * 2. Evaluate readOnlyLogicExpression || column.readOnlyLogic via compileExpression
 */
export function evaluateFieldReadOnlyLogic(field: any, context: Record<string, unknown>): boolean {
  // Static flags
  if (field.readOnly === true || field.isReadOnly === true) return true;

  // Dynamic expression
  const expression = field.readOnlyLogicExpression || field.column?.readOnlyLogic;
  if (!expression) return false;

  try {
    const compiled = compileExpression(expression);
    const result = !!compiled(context, context);
    return result;
  } catch (e) {
    console.warn(`Error evaluating readOnlyLogic for field ${field.name}:`, e);
    return false; // default to editable on error
  }
}

/**
 * Builds the filter criteria array for a single grid parameter by looking up
 * its column name in the `filterExpressions` config returned by the backend.
 */
export function buildGridCriteria(
  filterExpressions: Record<string, Record<string, unknown>> | undefined,
  gridColumnName: string
): Array<{ fieldName: string; operator: string; value: EntityValue }> {
  if (!filterExpressions) return [];
  const expressions = Object.entries(filterExpressions).find(
    ([key]) => key.toLowerCase() === gridColumnName.toLowerCase()
  )?.[1];
  if (!expressions) return [];
  return Object.entries(expressions).map(
    ([fieldName, value]) =>
      buildFilterCriteriaEntry(fieldName, value) as { fieldName: string; operator: string; value: EntityValue }
  );
}

/**
 * Pure helper: given a proposed selection update and the prior selection, clamps
 * the result to at most 1 row. The kept entry is the one the user just toggled on
 * (the id missing from `prev`). Exported for unit testing.
 */
export function clampToSingleRecord(
  next: Record<string, boolean>,
  prev: Record<string, boolean>
): Record<string, boolean> {
  const selectedIds = Object.entries(next)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id);
  if (selectedIds.length <= 1) return next;
  const newlyToggledId = selectedIds.find((id) => !prev[id]) ?? selectedIds[selectedIds.length - 1];
  return { [newlyToggledId]: true };
}

/**
 * Deep-merges two filter expression maps by grid key.
 * Returns `base` as-is when override is empty → stable reference, no new object.
 */
const deepMergeFilterExpressions = (
  base?: Record<string, Record<string, string>>,
  override?: Record<string, Record<string, string>>
): Record<string, Record<string, string>> => {
  if (!override || Object.keys(override).length === 0) return base || {};
  if (!base || Object.keys(base).length === 0) return override;
  const merged: Record<string, Record<string, string>> = { ...base };
  for (const [gridKey, fields] of Object.entries(override)) {
    merged[gridKey] = { ...merged[gridKey], ...fields };
  }
  return merged;
};

/** Live grid handles the embedded-grid controller reads at call time. */
export interface EmbeddedGridApi {
  rows: EntityData[];
  refetch?: () => void;
  criteria: unknown;
  fields?: Field[];
  handleRowSelection: (
    updater: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)
  ) => void;
  handleClearSelections: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: row/changes mirror handleRecordChange's loose shape
  handleRecordChange: (row: any, changes: any, options?: { programmatic?: boolean }) => void;
  setRowActions: (renderer: RowActionRenderer) => void;
}

/**
 * Builds the programmable grid handle exposed to migrated scripts via
 * `view.theForm.getItem('<param>').canvas.viewGrid` (and as the first arg of
 * `onGridLoad`). It is a pure adapter over live getters: `getApi` returns the
 * current rows / datasource handles, `getSelected` the current selection, and
 * the two subscriber arrays collect chained lifecycle callbacks. Selection,
 * edit and refetch all reuse the grid's existing handlers, so script mutations
 * follow the exact same path as user interactions.
 */
/** Resolves a column name from either a string or a classic field object. */
function resolveColName(col: string | Record<string, unknown>): string {
  if (typeof col === "string") return col;
  return String(col?.columnName ?? col?.hqlName ?? col?.inputName ?? col?.name ?? "");
}

/**
 * Mutable registries the controller wires script callbacks into. They are shared
 * (by reference) with the grid component, so a script that subscribes here is
 * seen by the grid's lifecycle and vice-versa. Bundled into one argument to keep
 * the controller factory's signature small.
 */
export interface EmbeddedGridSubscriptions {
  dataArrived: Array<(rows: EntityData[]) => void>;
  selectionChanged: Array<(selection: EntityData[]) => void>;
  recordChange: Array<(record: EntityData, changes: Record<string, unknown>) => void>;
  selectionToggle: Array<(record: EntityData, state: boolean) => void>;
  columnOnChange: Map<string, ColumnOnChange>;
  columnValidator: Map<string, ColumnValidator>;
}

export function createEmbeddedGridController(
  getApi: () => EmbeddedGridApi,
  getSelected: () => EntityData[],
  subscriptions: EmbeddedGridSubscriptions
): GridController {
  const {
    dataArrived: dataArrivedSubs,
    selectionChanged: selectionChangedSubs,
    recordChange: recordChangeSubs,
    selectionToggle: selectionToggleSubs,
    columnOnChange,
    columnValidator,
  } = subscriptions;
  const rows = () => getApi().rows;
  const setSelectedById = (id: string, isSelected: boolean) =>
    getApi().handleRowSelection((prev) => ({ ...prev, [id]: isSelected }));
  return {
    getSelectedRecords: getSelected,
    selectRecord: (index) => {
      const record = rows()[index];
      if (record) setSelectedById(String(record.id), true);
    },
    deselectRecord: (index) => {
      const record = rows()[index];
      if (record) setSelectedById(String(record.id), false);
    },
    selectSingleRecord: (record) => {
      getApi().handleClearSelections();
      if (record) setSelectedById(String(record.id), true);
    },
    deselectAllRecords: () => getApi().handleClearSelections(),
    userSelectAllRecords: () => {
      const all: MRT_RowSelectionState = {};
      for (const record of rows()) all[String(record.id)] = true;
      getApi().handleRowSelection(all);
    },
    getRows: rows,
    getRecord: (index) => rows()[index],
    getRecordIndex: (record) => rows().findIndex((row) => String(row.id) === String(record?.id)),
    getEditedRecord: (index) => rows()[index],
    getTotalRows: () => rows().length,
    setEditValue: (rowIndex, colName, value) => {
      const record = rows()[rowIndex];
      // Programmatic write (script distribute/seed): flag it so handleRecordChange
      // skips the cell validator gate (Classic never validates programmatic writes).
      if (record) getApi().handleRecordChange(record, { [colName]: value }, { programmatic: true });
    },
    getEditValues: (rowIndex) => (rows()[rowIndex] as Record<string, unknown>) ?? {},
    getEditedCell: (row, col) => {
      const index =
        typeof row === "number" ? row : rows().findIndex((r) => String(r.id) === String((row as EntityData)?.id));
      return (rows()[index] as Record<string, unknown>)?.[resolveColName(col)];
    },
    invalidateCache: () => {
      getApi().refetch?.();
    },
    fetchData: () => {
      getApi().refetch?.();
    },
    getCriteria: () => getApi().criteria,
    addSelectedIDsToCriteria: (criteria, preserveSelected = true) =>
      addSelectedIDsToCriteria(
        criteria,
        getSelected().map((record) => String(record.id)),
        preserveSelected
      ),
    getFieldByColumnName: (colName) =>
      (getApi().fields ?? []).find(
        (field) => field.columnName === colName || field.hqlName === colName || field.inputName === colName
      ),
    setRowActions: (renderer) => getApi().setRowActions(renderer),
    onDataArrived: (fn) => {
      if (!dataArrivedSubs.includes(fn)) dataArrivedSubs.push(fn);
    },
    onSelectionChanged: (fn) => {
      if (!selectionChangedSubs.includes(fn)) selectionChangedSubs.push(fn);
    },
    onRecordChange: (fn) => {
      if (!recordChangeSubs.includes(fn)) recordChangeSubs.push(fn);
    },
    onSelectionToggle: (fn) => {
      if (!selectionToggleSubs.includes(fn)) selectionToggleSubs.push(fn);
    },
    setColumnOnChange: (colName, fn) => {
      columnOnChange.set(colName, fn);
    },
    setColumnValidator: (colName, fn) => {
      columnValidator.set(colName, fn);
    },
  };
}

const WindowReferenceGrid = ({
  parameter,
  tabId,
  currentValues, // passed from ProcessDefinitionModal
  fields,
  gridSelection,
  onSelectionChange,
  parameters,
  selectedRecordsCount,
  // Added back missing props
  entityName,
  windowReferenceTab,
  processConfig,
  processConfigLoading,
  processConfigError,
  recordValues,
  originTab,
  showTitle = true,
  onClose,
  processDefinition,
  onGridLoadHook,
  gridLoadFormHandle,
  messageBar,
  viewController,
  viewData,
  onRegisterGrid,
  onUnregisterGrid,
  fieldController,
  gridResolver,
}: WindowReferenceGridProps & { originTab?: Tab }) => {
  const { t } = useTranslation();
  // ... rest of component

  const contentRef = useRef<HTMLDivElement>(null);
  const { loading: tabLoading, error: tabError } = useTab(windowReferenceTab?.id);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [appliedTableFilters, setAppliedTableFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  // Mandatory-empty columns for the active create-row. The set is non-empty only
  // when the user hit Save with required fields blank; emptied as the user edits
  // each cell or cancels the create-row.
  const [createRowErrors, setCreateRowErrors] = useState<Set<string>>(() => new Set());
  const clearCellError = useCallback((columnName: string) => {
    setCreateRowErrors((prev) => {
      if (!prev.has(columnName)) return prev;
      const next = new Set(prev);
      next.delete(columnName);
      return next;
    });
  }, []);
  // Persistent cache of all selected rows across pages and filter changes.
  // Survives filter apply/remove and infinite-scroll page resets; cleared only when
  // the user explicitly deselects a row or calls handleClearSelections.
  const persistentSelectionRef = useRef<Map<string, EntityData>>(new Map());
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  // Merge recordValues (static context) with currentValues (live form state)
  // currentValues takes precedence for parameters being edited
  const effectiveRecordValues = useMemo(
    () => ({
      ...recordValues,
      ...currentValues,
    }),
    [recordValues, currentValues]
  );

  const { graph } = useSelected();
  const shouldSendOrg = selectedRecordsCount === 1;

  const etendoContext = useMemo(() => {
    return originTab ? buildEtendoContext(originTab, graph) : {};
  }, [originTab, graph]);

  const [_validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const user = useUserStore((s) => s.user);
  const session = useUserStore((s) => s.session);
  const currentClient = useUserStore((s) => s.currentClient);

  const effectiveRecordValuesRef = useRef(effectiveRecordValues);
  const parametersRef = useRef(parameters);
  const validationsRef = useRef<any[]>((effectiveRecordValues?._validations as any[]) || []);
  // Sync refs ensures GridCellEditor has latest values without triggering re-render via Context
  useEffect(() => {
    effectiveRecordValuesRef.current = effectiveRecordValues;
    parametersRef.current = parameters;
    validationsRef.current = (effectiveRecordValues?._validations as any[]) || [];
  }, [effectiveRecordValues, parameters]);

  // Get validations array for context (to trigger updates)
  const validations = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: explicit cast
    return (effectiveRecordValues?._validations as any[]) || [];
  }, [effectiveRecordValues]);

  const [isDataReady, setIsDataReady] = useState(false);

  const lastDefaultsRef = useRef<string>("");
  const lastFilterExpressionsRef = useRef<string>("");
  const lastFilterExpressionsObjRef = useRef<Record<string, Record<string, string>>>({});
  const stableWindowReferenceTabRef = useRef<typeof windowReferenceTab | undefined>(windowReferenceTab);

  // Stabilize windowReferenceTab reference to prevent infinite re-renders
  if (windowReferenceTab && windowReferenceTab.id !== stableWindowReferenceTabRef.current?.id) {
    stableWindowReferenceTabRef.current = windowReferenceTab;
  }
  const stableWindowReferenceTab = stableWindowReferenceTabRef.current;

  const initialIsFilterApplied = useMemo(
    () => !!(stableWindowReferenceTab?.hqlfilterclause || stableWindowReferenceTab?.sQLWhereClause),
    [stableWindowReferenceTab]
  );

  const [isImplicitFilterApplied, setIsImplicitFilterApplied] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (isImplicitFilterApplied === undefined) {
      setIsImplicitFilterApplied(initialIsFilterApplied);
    }
  }, [initialIsFilterApplied, isImplicitFilterApplied]);

  const stableProcessDefaults = useMemo<Record<string, EntityValue>>(() => {
    const defaults = (processConfig?.defaults as unknown as Record<string, EntityValue>) || {};
    const defaultsString = JSON.stringify(defaults);

    if (defaultsString !== lastDefaultsRef.current) {
      lastDefaultsRef.current = defaultsString;
      return defaults;
    }

    return lastDefaultsRef.current ? JSON.parse(lastDefaultsRef.current) : {};
  }, [processConfig?.defaults]);

  const stableFilterExpressions = useMemo(() => {
    const filters = processConfig?.filterExpressions || {};
    const filtersString = JSON.stringify(filters);

    if (filtersString !== lastFilterExpressionsRef.current) {
      lastFilterExpressionsRef.current = filtersString;
      lastFilterExpressionsObjRef.current = filters;
      return filters;
    }

    return lastFilterExpressionsObjRef.current;
  }, [processConfig?.filterExpressions]);

  // Visual-only filter expressions: merges criteria filters with _filterExpressions
  // (e.g. expectedDate from JS onLoad). Used only for MRT column header display,
  // NOT sent as backend criteria.
  const stableVisualFilterExpressions = useMemo(() => {
    const visualOnly = (processConfig?._filterExpressions || {}) as Record<string, Record<string, string>>;
    if (!visualOnly || Object.keys(visualOnly).length === 0) return stableFilterExpressions;
    return deepMergeFilterExpressions(stableFilterExpressions, visualOnly);
  }, [stableFilterExpressions, processConfig?._filterExpressions]);

  // Build expression evaluation context (similar to ProcessParameterSelector)
  const fieldReadOnlyContext = useMemo(
    () => ({
      ...session,
      ...recordValues,
      ...currentValues,
    }),
    [session, recordValues, currentValues]
  );

  // Compute read-only status for all grid fields
  const fieldReadOnlyMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!stableWindowReferenceTab?.fields) return map;

    const fields = Object.values(stableWindowReferenceTab.fields);
    for (const field of fields) {
      // Index by both identifiers so a lookup by record property name (hqlName,
      // e.g. `amount`) resolves even when `columnName` differs from it.
      const readOnly = evaluateFieldReadOnlyLogic(field, fieldReadOnlyContext);
      const columnName = (field as any).columnName;
      const hqlName = (field as any).hqlName;
      if (columnName) map[columnName] = readOnly;
      if (hqlName) map[hqlName] = readOnly;
    }

    return map;
  }, [stableWindowReferenceTab?.fields, fieldReadOnlyContext]);

  // Mirror the read-only map into a ref so the selection-sync effect can read it
  // without adding it to the effect deps (keeps the existing run timing intact).
  const fieldReadOnlyMapRef = useRef(fieldReadOnlyMap);
  fieldReadOnlyMapRef.current = fieldReadOnlyMap;

  useEffect(() => {
    if (!processConfigLoading && processConfig) {
      setIsDataReady(true);
    }
  }, [processConfigLoading, processConfig]);

  // Stabilize effectiveRecordValues by hashing its scalar entries — cheaper
  // than JSON.stringify and good enough for downstream memos.
  const recordValuesKey = computeScalarStableKey(effectiveRecordValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableRecordValues = useMemo(() => effectiveRecordValues, [recordValuesKey]);

  // Stabilize currentValues the same way. Without this, editing a grid cell
  // re-renders the parent modal (via `onSelectionChange`), which hands us a
  // new `currentValues` reference even though no scalar field actually
  // changed — and that destabilizes the `datasourceOptions` memo, causing
  // `useDatasource` to refetch on every keystroke.
  const currentValuesKey = computeScalarStableKey(currentValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableCurrentValues = useMemo(() => currentValues, [currentValuesKey]);

  const isFieldVisible = useCallback(
    (field: any) => {
      // Both expressions arrive pre-rewritten from the backend: `displayLogic`
      // and `displaylogicgrid` go through `DynamicExpressionParser` server-side,
      // which expands placeholders like `@ACCT_DIMENSION_DISPLAY@` into
      // per-field JS that references session attributes (e.g.
      // `context['$Element_BP_APP_L']`). Those keys live in `session` because
      // `SessionBuilder` exposes them via `attributes`.
      const context = { ...user, ...session, ...recordValues };
      return isFieldVisibleForContext(field, session, context);
    },
    [user, session, recordValues]
  );

  // Filter fields based on visibility logic (displayLogic & gridDisplayLogic)
  // Use a stringified version of the result to ensure referential stability
  // This prevents 'rawColumns' and 'columns' from regenerating on every 'recordValues' change
  // if the ACTUAL set of visible columns hasn't changed.
  const visibleFieldsFromTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) return [];

    const visibleEntries = Object.entries(stableWindowReferenceTab.fields).filter(([_, f]: [string, any]) =>
      isFieldVisible(f)
    );

    // Parse the filtered fields
    const parsed = visibleEntries.map(([key, field]: [string, any]) => {
      // Etendo convention: the metadata key (e.g. "gLItem") IS the HQL property
      // name. Override `hqlName` with it whenever the metadata API ships a
      // broken display label (`"g/LItem"`, `"orderNo."`). Preserve `columnName`
      // — it is the DB snake_case column (`"c_glitem_id"`, `"received_in"`),
      // which `parseColumns` reads to populate `Column.dbColumnName` for the
      // dual-key cell write in `GridCellEditor`.
      const resolvedHqlName = resolveHqlName(field, key);
      return {
        ...field,
        _key: key,
        hqlName: resolvedHqlName,
        columnName: field.columnName || field.column?.dBColumnName || resolvedHqlName,
        label: field.name,
        // Resolve FieldType so applyNumericMandatoryDefaults can detect numeric fields
        type: getFieldReference(field.column?.reference || field.reference),
      };
    });
    return parsed;
  }, [stableWindowReferenceTab?.fields, isFieldVisible]); // isFieldVisible changes often, but we check result below

  // Stabilize the array reference — join IDs into a string (cheaper than JSON.stringify of full objects)
  const visibleFieldIds = visibleFieldsFromTab.map((f: any) => f.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableVisibleFields = useMemo(() => visibleFieldsFromTab, [visibleFieldIds]);

  // Compute raw columns from fields
  const rawColumns = useMemo(() => {
    // Only use parsed fields for columns, fallback to provided fields prop if empty
    if (stableVisibleFields.length > 0) {
      // Map back to column structure expected by SmartClient-like grids
      const enriched = stableVisibleFields.map((field: any) => {
        // `field.columnName` has already been resolved to the HQL property name
        // in `visibleFieldsFromTab`; fall back to `_key` defensively for any
        // future caller that builds a field without going through that map.
        const colName = field.columnName || field._key;
        return {
          header: field.name || colName,
          accessorKey: colName,
          columnName: colName,
          type: getFieldReference(field.reference || field.column?.reference),
          // Important properties for column setup
          canHide: true,
          enableColumnFilter: true,
          enableSorting: true,
          ...field,
          // id must come AFTER the spread so it overrides the metadata field's UUID id.
          // Use display name (field.name) to match what parseColumns sets as column.id,
          // ensuring filter state IDs align with the MRT column IDs used in useColumns.
          id: field.name || field._key || field.columnName,
          // filterFieldName must come AFTER the spread to preserve HQL property name
          // Classic backend expects HQL names (e.g. "businessPartner") not DB names ("C_BPartner_ID")
          filterFieldName: field._key || field.hqlName || field.columnName,
        };
      });
      return enriched;
    }

    // Use fields prop passed to component (legacy path)
    // This path is for when fields are passed directly, not from stableWindowReferenceTab
    if (fields && fields.length > 0) {
      // Assuming 'fields' is a prop or another source
      // Create column definitions from Fields
      const enriched = fields.map((col: any) => {
        // Find matching field definition if possible
        const matchingField = fields.find((f) => f.id === col.id);
        const isDisplayName = !col.columnName || col.columnName === col.header; // Simplified check

        // For filtering, we need to check if hqlName is a display name
        // If hqlName is a display name, use the key from fields (camelCase property name)
        // Otherwise, use hqlName as-is
        const filterFieldName = isDisplayName
          ? matchingField?.column?._identifier ||
            (Object.keys(fields) as Array<keyof typeof fields>).find((k) => fields[k] === matchingField) ||
            col.columnName
          : col.columnName;

        return {
          ...col,
          filterFieldName, // This will be used for backend filtering
        };
      });

      return enriched;
    }
    return [];
  }, [fields, stableVisibleFields]);

  // `rawColumns` is already a useMemo, so its reference is stable across renders
  // unless its dependencies change. The previous join-based stabilization layer was
  // a no-op (the join ran every render and didn't add information beyond what the
  // useMemo deps already guarantee).
  const stableRawColumns = rawColumns;

  const datasourceOptions = useMemo(() => {
    const options: DatasourceParams = {
      pageSize: PAGE_SIZE,
      tabId: parameter.tab || tabId,
    };

    if (processConfig?.processId) options.processId = processConfig.processId;
    if (tabId) options.windowId = tabId;

    // 2. Inject Etendo session context (org, client, user, etc.)
    Object.assign(options, etendoContext);

    // 3. Apply dynamic keys from record context and process-specific mappings
    //    (mimics verifyInput in SmartClient — resolves @VARIABLE@ placeholders)
    applyDynamicKeys(stableRecordValues, processConfig?.processId, options);

    // 4. Apply parameter defaults and current form values
    const mergedParams: Record<string, EntityValue> = {};
    if (stableProcessDefaults && Object.keys(stableProcessDefaults).length > 0) {
      mergeDefaultsIntoParams(stableProcessDefaults, mergedParams);
    }
    if (stableCurrentValues && Object.keys(stableCurrentValues).length > 0) {
      mergeCurrentValuesIntoParams(stableCurrentValues, mergedParams);
    }
    for (const [key, value] of Object.entries(mergedParams)) {
      applyMergedParam(key, value, parameters, options);
    }

    // 5. Apply record-level values for parameters whose column exists in this grid
    const validColumnNames = buildValidColumnNames(stableWindowReferenceTab?.fields, fields);
    applyRecordValues(parameters, effectiveRecordValues, validColumnNames, options);

    // 6. Ensure _org mirrors ad_org_id (required by backend datasource)
    if (options.ad_org_id && !options._org) options._org = options.ad_org_id;

    // 7. Build filter criteria (explicit expressions take precedence over base criteria)
    const filterCriteria = buildGridCriteria(stableFilterExpressions, parameter.dBColumnName || "");
    const baseCriteria = buildBaseCriteria({
      tab: stableWindowReferenceTab || ({ fields: {}, parentColumns: [] } as any),
    });
    // When implicit filter is active (or no implicit filters defined), use filterExpressions criteria.
    // When the user deactivates the filter, fall back to baseCriteria only (show all related records).
    const applyImplicitFilter = isImplicitFilterApplied !== false;
    const finalCriteria = applyImplicitFilter && filterCriteria.length > 0 ? filterCriteria : baseCriteria;
    if (finalCriteria.length > 0) {
      options.criteria = finalCriteria as unknown as Criteria[];
    }

    // 8. Handle sorting
    // When the user has sorted a column, use that; otherwise fall back to the tab's
    // defined order-by clause (matching Classic's _orderBy on initial load), and
    // finally to the documentNo fallback when criteria are active.
    const tabOrderBy = stableWindowReferenceTab?.hqlorderbyclause || stableWindowReferenceTab?.sQLOrderByClause;
    const sortBy = resolveSortBy(sorting, stableRawColumns, finalCriteria, tabOrderBy);
    if (sortBy) {
      options.sortBy = sortBy;
      options.isSorting = true;
    }

    if (options.ad_org_id) {
      options._org = options.ad_org_id;
    }

    // Required for OBPickAndExecuteDataSource to apply Pick & Execute-specific fetching logic
    options.isPickAndEdit = true;
    // Send the owner tab so backend HQL transformers pick the right query branch (Classic parity)
    applyButtonOwnerViewTabId(options, originTab);
    // Match Classic default: send true unless the user has explicitly toggled the filter off
    options.isImplicitFilterApplied = isImplicitFilterApplied ?? true;

    return options;
  }, [
    processConfig?.processId,
    parameter.tab,
    parameter.dBColumnName,
    tabId,
    stableProcessDefaults,
    stableFilterExpressions,
    stableRecordValues,
    parameters,
    stableCurrentValues,
    stableWindowReferenceTab,
    fields,
    isImplicitFilterApplied,
    sorting,
    stableRawColumns,
    etendoContext,
    originTab,
  ]);

  // `datasourceOptions` legitimately changes content on cell edits because
  // the process's payscript (run by `useProcessCallouts` when `gridSelection`
  // mutates) writes derived totals/validations back into form fields via
  // `form.setValue`. Those values are folded into the request payload by
  // `mergeCurrentValuesIntoParams` because the backend needs them to resolve
  // `@VARIABLE@` placeholders during fetch. But they MUST NOT trigger a
  // refetch — Classic Etendo fetches the P&E grid once on open and only
  // refetches on explicit filter/sort/refresh actions. We mirror that by
  // passing this narrow key to `useDatasource`; after its first fetch
  // settles, the hook only re-fetches when this key changes (and the
  // request body still gets the latest `datasourceOptions` because
  // `params` is read fresh on every fire).
  const datasourceRefetchKey = useMemo(
    () =>
      JSON.stringify({
        criteria: datasourceOptions.criteria,
        sortBy: datasourceOptions.sortBy,
        isSorting: datasourceOptions.isSorting,
        isImplicitFilterApplied: datasourceOptions.isImplicitFilterApplied,
        tabId: datasourceOptions.tabId,
        processId: datasourceOptions.processId,
        windowId: datasourceOptions.windowId,
        buttonOwnerViewTabId: datasourceOptions.buttonOwnerViewTabId,
        pageSize: datasourceOptions.pageSize,
      }),
    [datasourceOptions]
  );

  // Build extra params for filter options requests (process context needed by Classic datasource)
  const filterExtraParams = useMemo(() => {
    const extra: Record<string, unknown> = { noActiveFilter: true, allowOrgParam: shouldSendOrg };
    if (datasourceOptions.processId) extra.processId = datasourceOptions.processId;
    if (datasourceOptions.windowId) extra.windowId = datasourceOptions.windowId;
    if (datasourceOptions.ad_org_id) extra.ad_org_id = datasourceOptions.ad_org_id;
    if (datasourceOptions.ad_client_id) extra.ad_client_id = datasourceOptions.ad_client_id;
    if (datasourceOptions.criteria) extra.criteria = datasourceOptions.criteria;
    return extra;
  }, [
    datasourceOptions.processId,
    datasourceOptions.windowId,
    datasourceOptions.ad_org_id,
    datasourceOptions.ad_client_id,
    datasourceOptions.criteria,
    shouldSendOrg,
  ]);

  // Use grid column filters hook to avoid code duplication with useTableData
  const { advancedColumnFilters, handleColumnFilterChange, handleLoadFilterOptions, handleLoadMoreFilterOptions } =
    useGridColumnFilters({
      columns: stableRawColumns,
      tabId: tabId ? String(tabId) : undefined,
      entityName: entityName ? String(entityName) : undefined,
      setAppliedTableFilters,
      setColumnFilters,
      isImplicitFilterApplied: isImplicitFilterApplied ?? initialIsFilterApplied,
      extraParams: filterExtraParams,
    });

  // Create a minimal tab object for useColumns with corrected field hqlNames
  const mockTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) {
      return {
        id: tabId,
        fields: {},
      } as any;
    }

    const correctedFields = Object.fromEntries(
      Object.entries(stableWindowReferenceTab.fields)
        .filter(([_, f]) => isFieldVisible(f))
        .map(([key, field]) => {
          // Prefer a canonical HQL prop name (`gLItem`) when present; otherwise
          // the metadata `key` IS that name by Etendo convention. The previous
          // heuristic missed `/` (e.g. "G/L Item" → "g/LItem") and preferred
          // `field.column._identifier` (the DB column, "c_glitem_id"), which
          // is the wrong shape for HQL-keyed handlers.
          const actualColumnName = resolveHqlName(field, key);
          return [
            key,
            {
              ...field,
              hqlName: actualColumnName,
            },
          ];
        })
    );

    return {
      ...stableWindowReferenceTab,
      id: stableWindowReferenceTab.id || tabId,
      fields: correctedFields,
    } as Tab;
  }, [stableWindowReferenceTab, tabId, isFieldVisible]);

  // Get columns with filter handlers using useColumns
  // Pass options as stable reference to avoid re-creating columns unnecessarily
  const handleDateTextFilterChange = useCallback(
    (columnId: string, filterValue: string) => {
      const column = stableRawColumns.find((col: Column) => col.columnName === columnId || col.id === columnId);
      const filterKey = column?.id || columnId;

      const mrtFilter = filterValue?.trim() ? { id: filterKey, value: filterValue } : null;

      setAppliedTableFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== filterKey);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });

      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== filterKey);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });
    },
    [stableRawColumns, setAppliedTableFilters, setColumnFilters]
  );

  const columnOptions = useMemo(
    () => ({
      onColumnFilter: handleColumnFilterChange,
      onDateTextFilterChange: handleDateTextFilterChange,
      onLoadFilterOptions: handleLoadFilterOptions,
      onLoadMoreFilterOptions: handleLoadMoreFilterOptions,
      columnFilterStates: advancedColumnFilters,
      tableColumnFilters: columnFilters,
      onNavigate: onClose,
    }),
    [
      handleColumnFilterChange,
      handleDateTextFilterChange,
      handleLoadFilterOptions,
      handleLoadMoreFilterOptions,
      advancedColumnFilters,
      columnFilters,
      onClose,
    ]
  );

  const finalFields = useMemo(() => {
    return stableVisibleFields.length > 0 ? stableVisibleFields : fields || [];
  }, [stableVisibleFields, fields]);

  // Use refs for fields and handler to pass to context
  const fieldsRef = useRef(finalFields);
  useEffect(() => {
    fieldsRef.current = finalFields;
  }, [finalFields]);

  // We already have handleRecordChangeRef from line 612!
  // But line 612 ref is internal to the hook logic. We need to expose it.
  // Actually, we can just pass handleRecordChangeRef (the one defined at 612) to the context.

  const columnsFromHook = useColumns(mockTab, columnOptions);

  // handleRecordChange is defined later using refs for stability
  // We use a ref to expose it to columns if needed before definition (though unlikely with current flow)
  const handleRecordChangeRef = useRef<((row: any, changes: any) => void) | null>(null);

  const columns = useMemo(() => {
    const finalColumns = columnsFromHook.length > 0 ? columnsFromHook : rawColumns;

    // DON'T change column IDs - they need to match the data keys from datasource
    // The accessorFn in parseColumns already handles data mapping using hqlName

    // Merge filterFieldName from rawColumns into finalColumns
    const columnsWithFilterFieldName = finalColumns.map((col: Column) => {
      const rawCol = rawColumns.find((r: Column) => r.header === col.header);
      return {
        ...col,
        filterFieldName: rawCol?.filterFieldName || col.columnName,
      };
    });

    // Ensure all columns have filtering enabled (either dropdown or text) and custom editing
    const columnsWithFilters = columnsWithFilterFieldName.map((col: Column) => {
      // Base config - start with existing column
      let columnConfig = { ...col };

      // If column doesn't have a Filter component (dropdown), enable simple text filtering
      if (!columnConfig.Filter) {
        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
          filterFn: "contains",
          muiTableBodyCellEditTextFieldProps: ({ cell }: { cell: any }) => {
            // Helper to determine if column is boolean-like
            const isBoolean =
              columnConfig.type === "boolean" ||
              columnConfig.column?.reference === "20" ||
              columnConfig.column?._identifier === "YesNo" ||
              ["Y", "N"].includes(String(cell.getValue()));

            if (isBoolean) {
              return getBooleanEditProps(cell);
            }
            return {};
          },
        };
      }

      // ALWAYS add custom editing logic (Edit and enableEditing)
      // This ensures our CellEditorFactory is used for all columns, including those with Filters (TableDir, etc.)
      //
      // `useColumns` already installs a `Cell` wrapper (color-tag rendering,
      // reference-button navigation, clientclass links, etc.). We can't keep
      // that wrapper as the final `Cell` — it doesn't know about row selection,
      // so editable cells (Amount, Writeoff in Order/Invoices) would never
      // switch to an editor when the user picks the row. Promote
      // `GridCellRenderer` to be the final `Cell` (it gates on
      // `row.getIsSelected()`) and stash the upstream wrapper under
      // `fallbackCell` so `GridCellRenderer` delegates to it for the
      // unselected/display path. Read-only columns are still overridden later
      // in `finalColumns` with `ReadOnlyCellRenderer`, so this preserves the
      // classic-UI parity: editable fields become editors on selection,
      // read-only fields stay as plain text.
      const upstreamCell = (col as any).Cell;
      const fallbackCell =
        typeof upstreamCell === "function" && upstreamCell !== GridCellRenderer ? upstreamCell : undefined;
      return {
        ...columnConfig,
        isFieldReadOnly:
          fieldReadOnlyMap[columnConfig.columnName] || fieldReadOnlyMap[columnConfig.accessorKey as string] || false,
        enableEditing: () => {
          // Basic read-only check based on field definition
          // Ideally this should use field.readOnly or similar prop if available
          const isReadOnly =
            columnConfig.readOnly ||
            columnConfig.isReadOnly ||
            fieldReadOnlyMap[columnConfig.columnName] ||
            fieldReadOnlyMap[columnConfig.accessorKey as string];
          if (isReadOnly) return false;

          if (columnConfig.columnName === "id" || columnConfig.columnName.includes("identifier")) return false;

          return true;
        },
        Edit: StableGridCellEditorRenderer,
        // The *parent P&E parameter's* DB name (same for every column in this
        // grid). Stored under a distinct key so it doesn't clobber the per-column
        // `dbColumnName` set by `parseColumns`, which we need for the
        // create-row mandatory-error lookup in `StableGridCellEditorRenderer`.
        parameterDBColumnName: parameter.dBColumnName,
        Cell: GridCellRenderer,
        fallbackCell,
      };
    });

    // Sort the final columns based on gridPosition.
    // Build a name→position lookup once instead of doing a linear `.find` per pair
    // inside the sort comparator (which is O(n²)).
    const positionByLookup = new Map<string, number>();
    for (const f of Object.values(stableWindowReferenceTab?.fields || {})) {
      const pos = f.gridPosition ?? f.sequenceNumber ?? 0;
      if (f.name) positionByLookup.set(`n:${f.name}`, pos);
      if (f.hqlName) positionByLookup.set(`h:${f.hqlName}`, pos);
    }
    const resolvePosition = (col: Column) =>
      positionByLookup.get(`n:${col.header}`) ?? positionByLookup.get(`h:${col.columnName}`) ?? 0;
    const sortedColumns = columnsWithFilters.sort((a: Column, b: Column) => resolvePosition(a) - resolvePosition(b));

    return sortedColumns;
  }, [columnsFromHook, rawColumns, stableWindowReferenceTab, fieldReadOnlyMap]);

  const shouldSkipFetch = !isDataReady || processConfigLoading || !entityName;

  const {
    records: rawRecords,
    loading: datasourceLoading,
    error: datasourceError,
    refetch,
    hasMoreRecords,
    fetchMore,
    addRecordLocally,
    removeRecordLocally,
    hasFirstFetchCompleted,
  } = useDatasource({
    entity: String(entityName),
    params: datasourceOptions,
    columns: rawColumns,
    activeColumnFilters: appliedTableFilters,
    skip: shouldSkipFetch,
    isImplicitFilterApplied: isImplicitFilterApplied ?? true,
    refetchKey: datasourceRefetchKey,
  });

  // Ref to track if we have performed initial auto-selection from context
  const autoSelectInit = useRef(false);

  // Sync external gridSelection changes and handle Context Auto-Selection
  useEffect(() => {
    const externalSelection = gridSelection[parameter.dBColumnName]?._selection || [];

    // 1. External Grid Selection (Priority: Callouts/State updates)
    if (externalSelection.length > 0) {
      const newIds = externalSelection.map((item) => String(item.id));
      // Functional setState so we can bail out when the resulting selection is
      // structurally identical to the current one. Without this guard the
      // effect's upstream deps (rawRecords / parameter / effectiveRecordValues)
      // re-fire it on every parent render and a freshly-built `newRowSelection`
      // object — even with the same keys — would re-trigger another render via
      // React's reference comparison, producing an infinite render loop.
      setRowSelection((prev) => {
        const prevKeys = Object.keys(prev);
        if (prevKeys.length === newIds.length && newIds.every((id) => prev[id] === true)) {
          return prev;
        }
        const next: MRT_RowSelectionState = {};
        for (const id of newIds) next[id] = true;
        return next;
      });
      autoSelectInit.current = true;
      return;
    }

    // 2. Default/Parent Context Selection Logic (Initialization Only)
    // Only run this if we haven't successfully initialized selection yet
    if (!autoSelectInit.current) {
      const { parentContextId, contextDocNo } = resolveParentContextId(
        parameter.dBColumnName,
        effectiveRecordValues,
        currentValues
      );

      if (parentContextId || contextDocNo) {
        // 3. Notify Parent & Select Visual Row
        // We MUST wait for records to load to match the context (Order) to the specific Grid Row (Schedule)
        const fullRecord = findMatchingRecord(rawRecords, parentContextId, contextDocNo);

        if (fullRecord) {
          const recordId = String(fullRecord.id);
          // CRITICAL: Select the ID of the record we FOUND, not the Context ID.
          setRowSelection({ [recordId]: true });

          setTimeout(() => {
            if (onSelectionChange) {
              // Use updater function to preserve other grids in gridSelection
              onSelectionChange((prev: GridSelectionStructure) => ({
                ...prev,
                [parameter.dBColumnName]: {
                  _selection: [fullRecord],
                  _allRows: rawRecords, // Provide context
                },
              }));
            }
          }, 0);
          autoSelectInit.current = true;
        }
      }
    }
  }, [
    gridSelection,
    parameter.dBColumnName, // stable
    effectiveRecordValues,
    currentValues,
    rawRecords,
    onSelectionChange,
    parameter, // less stable but needed
  ]);

  // Stabilize records reference using JSON comparison to prevent unnecessary re-renders
  const [localRecords, setLocalRecords] = useState<EntityData[]>([]);
  const rawRecordsStringRef = useRef<string>("");

  // Programmable grid handle plumbing (declared here so the data-arrived effect
  // below can reach them; the controller itself is built further down once its
  // selection/edit handlers exist, and stored into `gridControllerRef`).
  const gridControllerRef = useRef<GridController | null>(null);
  const dataArrivedSubsRef = useRef<Array<(rows: EntityData[]) => void>>([]);
  const selectionChangedSubsRef = useRef<Array<(selection: EntityData[]) => void>>([]);
  // Per-cell edit subscribers (grid.onRecordChange) and per-toggle selection-delta
  // subscribers (grid.onSelectionToggle); both additive and empty unless a migrated
  // script registers into them. Column hooks back grid.setColumnOnChange/Validator.
  const recordChangeSubsRef = useRef<Array<(record: EntityData, changes: Record<string, unknown>) => void>>([]);
  const selectionToggleSubsRef = useRef<Array<(record: EntityData, state: boolean) => void>>([]);
  const columnOnChangeRef = useRef<Map<string, ColumnOnChange>>(new Map());
  const columnValidatorRef = useRef<Map<string, ColumnValidator>>(new Map());
  // Ids selected as of the last selectionChanged fire, for the onSelectionToggle diff.
  const prevSelectionIdsRef = useRef<Set<string>>(new Set());
  // Guards against the infinite loop when a column onChange calls grid.setEditValue
  // (which re-enters handleRecordChange and would re-dispatch the column hooks).
  const inColumnOnChangeRef = useRef(false);

  // Per-row component plugin: a migrated script registers a renderer via
  // `grid.setRowActions(...)`. The renderer lives in a ref (replacing it needs
  // no re-render); `hasRowActions` flips once on first registration to add the
  // inline-buttons column. Without a renderer no column is added (additive).
  const rowActionsRendererRef = useRef<RowActionRenderer | null>(null);
  const [hasRowActions, setHasRowActions] = useState(false);
  const registerRowActions = useCallback((renderer: RowActionRenderer) => {
    rowActionsRendererRef.current = renderer;
    setHasRowActions(true);
  }, []);

  // Bumped by `handleRecordChange` whenever `applyFieldInteractions` produces a
  // non-empty sibling patch. Threaded through the grid context so each
  // GridCellEditor sees a new value and its `memo` comparator invalidates,
  // forcing the sibling cell to re-read `row.original` on the next paint. This
  // is the visual-refresh path for MRT create-rows (id="mrt-row-create") which
  // never enter `localRecords` and so never trigger re-render via state.
  const [siblingPatchVersion, setSiblingPatchVersion] = useState(0);

  // Sync with datasource (rawRecords)
  useEffect(() => {
    // Run only once a real fetch has delivered a result and the content changed
    // (see decideDatasourceSync). The signature is stored even when skipping the
    // body so the dedup keeps working, but it is left untouched while no fetch
    // has completed yet — so an empty result set still reaches onGridLoad.
    const { shouldSync, signature } = decideDatasourceSync(
      rawRecords,
      hasFirstFetchCompleted,
      rawRecordsStringRef.current
    );
    rawRecordsStringRef.current = signature;
    if (!shouldSync) return;
    // Apply the same default-payment logic that `handleRowSelection` runs on
    // user toggle, but synchronously for rows the backend pre-flagged with
    // `obSelected=true`. This collapses the legacy "rows arrive → default
    // appears later" two-step into a single render.
    const prepared = (rawRecords || []).map((record: EntityData) =>
      record?.obSelected ? buildSelectedRecord(record) : record
    );
    setLocalRecords(prepared);

    // Notify any script-registered `grid.dataArrived` subscribers (mirrors the
    // classic grid lifecycle hook), independently of whether an onGridLoad body
    // exists — a script may have subscribed from onLoad via the grid handle.
    for (const fn of dataArrivedSubsRef.current) fn(prepared);

    // Parameter-level onGridLoad: fire once per datasource payload. `grid` is the
    // programmable handle (same one reachable via `view.theForm.getItem(...)`),
    // so reading rows/selection and mutating the grid both work; `view.theForm`
    // lets the script read sibling parameter values.
    if (onGridLoadHook && gridLoadFormHandle && messageBar) {
      const selectedRecords = prepared.filter((record: EntityData) => Boolean(record?.obSelected));
      const grid = createGridProxy(
        { rows: prepared, selectedRecords },
        gridControllerRef.current ?? undefined,
        fieldController ? buildGridVisibility(fieldController, parameter.name) : undefined
      );
      const view = createViewProxy(gridLoadFormHandle, parameters, {
        messageBar,
        grid,
        controller: fieldController,
        viewController,
        gridResolver,
        data: viewData,
      });
      grid.view = view;
      try {
        onGridLoadHook(grid, view, parameters);
      } catch (error) {
        logger.error("[WindowReferenceGrid] onGridLoad failed", error);
      }
    }
  }, [
    rawRecords,
    hasFirstFetchCompleted,
    onGridLoadHook,
    gridLoadFormHandle,
    messageBar,
    parameters,
    parameter.name,
    viewController,
    viewData,
    fieldController,
    gridResolver,
  ]);

  // Initialize rowSelection from obSelected field when records arrive from the datasource.
  // Classic sends obSelected=true for rows that were previously selected, so we pre-check them.
  // This is generic: any Pick & Execute datasource can use obSelected to restore prior selection.
  // We also consult persistentSelectionRef so selections from other pages (e.g. row 101 when
  // currently showing page 1 after a filter change) are restored as soon as those rows scroll
  // back into view.
  useEffect(() => {
    if (!rawRecords?.length) return;

    // 1. Seed persistent cache from backend-flagged rows (obSelected=true).
    for (const record of rawRecords) {
      if (record.obSelected) {
        persistentSelectionRef.current.set(String(record.id), record);
      }
    }

    // 2. Rebuild MRT rowSelection for currently visible rows using the cache.
    const initialSelection: MRT_RowSelectionState = {};
    for (const record of rawRecords) {
      if (persistentSelectionRef.current.has(String(record.id))) {
        initialSelection[String(record.id)] = true;
      }
    }

    const hasPersistentSelection = persistentSelectionRef.current.size > 0;
    if (Object.keys(initialSelection).length === 0 && !hasPersistentSelection) return;

    setRowSelection(initialSelection);

    // 3. Send ALL persistently selected rows (including off-page ones) to the parent.
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: Array.from(persistentSelectionRef.current.values()),
        _allRows: rawRecords,
      },
    }));
  }, [rawRecords, onSelectionChange, parameter.dBColumnName]);

  // Ref to track last processed selection to prevent redundant updates
  const lastSelectionStringRef = useRef<string>("");
  // Armed once the first real (non-empty) external selection has been reconciled;
  // gates `shouldDeferInitialZeroing` so the deferral only applies during initial load.
  const initialSelectionReconciledRef = useRef<boolean>(false);

  // Sync with external updates via gridSelection (e.g. Callouts modifying data)
  useEffect(() => {
    // When PayScript engine runs, it returns the *updated selection* in gridSelection.
    const gridData = gridSelection[parameter.dBColumnName];
    // Only process if we have a valid selection array (even empty)
    if (!gridData || !gridData._selection || !localRecords.length) return;

    const externalSelection = gridData._selection;

    // Don't let the initial empty-selection pass zero a row the backend pre-selected
    // before its real selection has propagated (fixes pre-selected Amount → 0 at load).
    if (shouldDeferInitialZeroing(localRecords, externalSelection, initialSelectionReconciledRef.current)) {
      return;
    }
    initialSelectionReconciledRef.current = true;

    // OPTIMIZATION: Check if selection actually changed for THIS grid
    // We include amounts in the check because engine updates amounts. Also check paymentAmount.
    const selectionString = JSON.stringify(
      externalSelection.map((s: any) => `${s.id}-${s[AMOUNT_FIELD]}-${s[PAYMENT_AMOUNT_FIELD]}`)
    );
    if (selectionString === lastSelectionStringRef.current) {
      return;
    }
    lastSelectionStringRef.current = selectionString;

    syncGridSelectionToLocalRecords(
      externalSelection,
      localRecords,
      setLocalRecords,
      buildIsFieldReadOnly(fieldReadOnlyMapRef.current)
    );
  }, [gridSelection, parameter.dBColumnName]); // localRecords omitted to prevent cycle

  const records = localRecords;

  // Populate _allRows when records are loaded
  useEffect(() => {
    if (!records) return;

    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        ...prev[parameter.dBColumnName],
        _allRows: records,
      },
    }));
  }, [records, onSelectionChange, parameter.dBColumnName]);

  // Reset selection and filters on mount or when entity changes
  useEffect(() => {
    // Map initial filterExpressions from OnLoad to visual tableColumnFilters (MRT)
    let initialFilters: MRT_ColumnFiltersState = [];
    if (stableVisualFilterExpressions?.[parameter.dBColumnName || ""]) {
      const fieldExpressions = stableVisualFilterExpressions[parameter.dBColumnName || ""];
      initialFilters = Object.entries(fieldExpressions).map(([fieldName, logic]: [string, any]) => {
        let filterValue = "";

        if (logic !== null && typeof logic === "object" && !Array.isArray(logic)) {
          filterValue = logic.value ?? logic.values ?? "";
        } else if (logic !== undefined && logic !== null) {
          filterValue = String(logic);
        }

        // MRT columnFilters need to match the exact column `id` (often the Header name in this app)
        // rather than the raw database field name. We look it up in rawColumns.
        const matchingColumn = rawColumns?.find(
          (col: Column & { hqlName?: string }) =>
            col.columnName?.toLowerCase() === fieldName.toLowerCase() ||
            col.hqlName?.toLowerCase() === fieldName.toLowerCase() ||
            col.id?.toLowerCase() === fieldName.toLowerCase()
        );

        const columnId = matchingColumn?.id || matchingColumn?.header || fieldName;

        return {
          id: columnId,
          value: filterValue,
        };
      });
    }

    setRowSelection({});
    setColumnFilters(initialFilters);
    setAppliedTableFilters(initialFilters);

    // Call onSelectionChange with the structure for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: [],
      },
    }));
  }, [onSelectionChange, entityName, parameter.dBColumnName, stableVisualFilterExpressions, rawColumns]);

  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const newColumnFilters = typeof updaterOrValue === "function" ? updaterOrValue(columnFilters) : updaterOrValue;
      setColumnFilters(newColumnFilters);
      setAppliedTableFilters(newColumnFilters);
    },
    [columnFilters]
  );

  const handleRowSelection = useCallback(
    (updaterOrValue: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)) => {
      const rawSelection = typeof updaterOrValue === "function" ? updaterOrValue(rowSelection) : updaterOrValue;
      // For single-select tabs (obuiappSelectionType="S") clamp the selection to at most one row.
      // The kept entry is the one the user just toggled on (i.e. the id missing from `rowSelection`).
      let newSelection = rawSelection;
      if (!tabAllowsMultipleSelection(windowReferenceTab)) {
        const clamped = clampToSingleRecord(rawSelection, rowSelection);
        if (clamped !== rawSelection) {
          persistentSelectionRef.current.clear();
        }
        newSelection = clamped;
      }

      // 1. Prepare new records state first to ensure synchronous consistency.
      // Reuse the same `records` array reference when nothing changed — prevents
      // downstream parents from re-rendering on no-op selection toggles.
      let recordsChanged = false;
      // Built once: skips zeroing read-only amount fields (e.g. the invoice `amount`
      // cap in Add Invoices) on deselect, matching the load-time reset.
      const isFieldReadOnly = buildIsFieldReadOnly(fieldReadOnlyMapRef.current);
      // Base the selection snapshot on the READ STORE, not the closure `records`
      // (lagging `localRecords`). A programmatic `setEditValue` updates the read
      // store synchronously (see handleRecordChange); a `selectRecord` fired right
      // after it (distribute writes amount=2.07 then selects the row) would
      // otherwise capture the pre-write value into `_selection`, and the
      // selection-sync effect would then push that stale value back over the
      // freshly written one (the Add Payment Order/Invoice amount → 0 bug).
      const baseRecords = gridApiRef.current?.rows ?? records;
      const mappedRecords = baseRecords.map((record) => {
        const recordId = String(record.id);
        const isSelected = newSelection[recordId];

        if (isSelected) {
          const updated = buildSelectedRecord(record);
          if (updated !== record) {
            recordsChanged = true;
            return updated;
          }
        } else {
          // Aggressively reset amount to 0 if deselected, regardless of current value
          // Also handle 'paymentAmount' field which is used by Credit grid in Classic
          const { updated, changed } = buildDeselectedRecord(record, isFieldReadOnly);
          if (changed) {
            record = updated;
            recordsChanged = true;
          }
        }
        return record;
      });
      const newRecords = recordsChanged ? mappedRecords : baseRecords;

      // 2. Update local state if needed
      if (recordsChanged) {
        setLocalRecords(newRecords);
      }
      setRowSelection(newSelection);

      // 3. Update the persistent cache for rows on the current page.
      // Only rows currently in `records` are touched; off-page selections are preserved.
      syncPersistentSelection(persistentSelectionRef.current, newRecords, newSelection);

      // 4. Propagate ALL persistently selected rows (including off-page) to the parent.
      onSelectionChange((prev: GridSelectionStructure) => ({
        ...prev,
        [parameter.dBColumnName]: {
          _selection: Array.from(persistentSelectionRef.current.values()),
          _allRows: newRecords,
        },
      }));
    },
    [rowSelection, records, onSelectionChange, parameter.dBColumnName, processDefinition]
  );

  const handleClearSelections = useCallback(() => {
    persistentSelectionRef.current.clear();
    setRowSelection({});
    // Clear selections for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: records,
      },
    }));
  }, [onSelectionChange, parameter.dBColumnName, records]);

  const handleRowClick = useCallback(
    (row: MRT_Row<EntityData>, event?: React.MouseEvent) => {
      // Prevent toggling selection if clicking on an interactive element
      const target = event?.target as HTMLElement;
      if (target) {
        // Check if clicking inside interactive elements or their children (e.g. SVG inside Button)
        if (
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest("button") ||
          target.isContentEditable
        ) {
          return;
        }

        // Check for specific roles often used in complex UI components
        const role = target.getAttribute("role");
        if (role === "combobox" || role === "listbox" || role === "option" || role === "button") {
          return;
        }

        // Broad check for MUI and generic interactive wrappers
        if (
          target.closest(".MuiInputBase-root") ||
          target.closest(".etendo-input-wrapper") ||
          target.closest(".MuiFormControl-root") ||
          target.closest(".MuiAutocomplete-root") ||
          target.closest('[role="combobox"]') ||
          target.closest(".react-select__control") ||
          target.closest(".etendo-combobox")
        ) {
          return;
        }
      }

      const newSelection = { ...rowSelection };
      newSelection[row.id] = !newSelection[row.id];

      // For single-select tabs, deselect everything else when this row is being turned on.
      if (!tabAllowsMultipleSelection(windowReferenceTab) && newSelection[row.id]) {
        for (const otherId of Object.keys(newSelection)) {
          if (otherId !== row.id) newSelection[otherId] = false;
        }
        persistentSelectionRef.current.clear();
      }

      // Mirror Classic SmartClient: update obSelected and payment on each record
      const updatedRecords = records.map((record) => {
        const rid = String(record.id);
        if (newSelection[rid]) {
          const defaultPayment =
            record.payment && Number(record.payment) !== 0
              ? record.payment
              : (record.expectedAmount ?? record.outstanding ?? 0);
          return { ...record, obSelected: true, payment: defaultPayment };
        }
        if (record.obSelected) {
          return { ...record, obSelected: false, payment: 0 };
        }
        return record;
      });

      // Populate the canonical selection cache so a row-body click registers the
      // selection identically to a checkbox click (handleRowSelection). Without
      // this, grid.getSelectedRecords() / onSelectionToggle stay empty for clicks.
      syncPersistentSelection(persistentSelectionRef.current, updatedRecords, newSelection);

      setRowSelection(newSelection);

      // Update with the new structure, propagating from the same canonical cache
      // as handleRowSelection so both selection stores stay consistent.
      onSelectionChange((prev: GridSelectionStructure) => ({
        ...prev,
        [parameter.dBColumnName]: {
          _selection: Array.from(persistentSelectionRef.current.values()),
          _allRows: updatedRecords,
        },
      }));
    },
    [records, onSelectionChange, parameter.dBColumnName, rowSelection, processDefinition]
  );

  // Removes a row from the local grid buffer only — never hits the backend.
  // Mirrors the trash-icon behaviour of the classic P&E grid (e.g. APRM GL Items),
  // where rows are submitted in batch when the surrounding process is executed.
  const handleDeleteRow = useCallback(
    (row: MRT_Row<EntityData>) => {
      const idStr = String(row.original?.id ?? "");
      if (!idStr) return;
      removeRecordLocally(idStr);
      setLocalRecords((prev) => prev.filter((r) => String(r.id) !== idStr));
      persistentSelectionRef.current.delete(idStr);
      setRowSelection((prev) => {
        if (!(idStr in prev)) return prev;
        const next = { ...prev };
        delete next[idStr];
        return next;
      });
      onSelectionChange((prev: GridSelectionStructure) => {
        const current = prev[parameter.dBColumnName];
        const filterOut = (rs: EntityData[]) => rs.filter((r) => String(r.id) !== idStr);
        return {
          ...prev,
          [parameter.dBColumnName]: {
            _selection: filterOut(current?._selection ?? []),
            _allRows: filterOut(current?._allRows ?? []),
          },
        };
      });
    },
    [removeRecordLocally, onSelectionChange, parameter.dBColumnName]
  );

  // Process id (used by field-interactions lookups in the handlers below).
  const processId = processDefinition?.id;

  const handleCreateRow = useCallback(
    ({ values, table, row }: any) => {
      if (!stableWindowReferenceTab) return;
      // MRT's `values` only captures fields it knows about; our custom cell
      // editors write directly into `row.original`. Merge both before checking
      // for empty mandatory values so user-typed selections always count.
      const merged = { ...(row?.original ?? {}), ...(values ?? {}) };
      // Pre-fill `0` for empty mandatory numeric fields (e.g. received_in /
      // paid_out) so the user only has to type the non-zero side — matches
      // the classic UI flow.
      let mergedWithDefaults = applyNumericMandatoryDefaults(visibleFieldsFromTab, merged);
      // Defense-in-depth: re-apply mutual-exclusion field interactions at
      // create-row save time. The synchronous handler (handleRecordChange)
      // already zeroes the sibling on every cell edit, so under normal flow
      // this is a no-op. We re-run it here to guard against edge cases where
      // an edit was dispatched while the rules registry was momentarily
      // empty or the row state hadn't propagated yet.
      const rules = processId ? getPayScriptRules(processId) : undefined;
      if (rules) {
        const patch = resolveMutualExclusion(rules, parameter.dBColumnName, mergedWithDefaults);
        if (Object.keys(patch).length > 0) {
          // biome-ignore lint/suspicious/noExplicitAny: same untyped patch shape
          const expanded: Record<string, any> = {};
          for (const [k, v] of Object.entries(patch)) {
            for (const variant of expandKeyVariants(k)) expanded[variant] = v;
          }
          mergedWithDefaults = { ...mergedWithDefaults, ...expanded };
        }
      }
      const missing = collectMissingMandatory(visibleFieldsFromTab, mergedWithDefaults);
      if (missing.size > 0) {
        // Preserve Set reference when contents haven't changed — prevents context
        // consumers (every grid cell) from re-rendering on identical errors.
        setCreateRowErrors((prev) => {
          if (prev.size !== missing.size) return missing;
          for (const k of missing) if (!prev.has(k)) return missing;
          return prev;
        });
        return;
      }
      setCreateRowErrors((prev) => (prev.size === 0 ? prev : new Set()));
      const { id, record } = buildLocalGridRecord(mergedWithDefaults, row?.original);
      addRecordLocally({ ...record, _locallyAdded: true });
      setRowSelection((prev) => ({ ...prev, [id]: true }));
      table.setCreatingRow(null);
    },
    [stableWindowReferenceTab, addRecordLocally, visibleFieldsFromTab, processId, parameter.dBColumnName]
  );

  // Refs for state accessed in handlers to allow stable handler identity
  const localRecordsRef = useRef(localRecords);
  const rowSelectionRef = useRef(rowSelection);
  // Ensure refs are always up to date
  useEffect(() => {
    localRecordsRef.current = localRecords;
    rowSelectionRef.current = rowSelection;
  }, [localRecords, rowSelection]);

  // Builds the {grid, view} script proxies used by the cell-edit hooks, reusing
  // the same construction as the onGridLoad effect (the grid reads live state via
  // the controller; `grid.view` wires the view-level fireOnPause/context). Returns
  // null when the form handle isn't available (read-only / test contexts).
  const buildCellHookProxies = useCallback((): { grid: GridProxy; view: ViewProxy } | null => {
    if (!gridLoadFormHandle || !messageBar) return null;
    const grid = createGridProxy(
      { rows: localRecordsRef.current, selectedRecords: Array.from(persistentSelectionRef.current.values()) },
      gridControllerRef.current ?? undefined,
      fieldController ? buildGridVisibility(fieldController, parameter.name) : undefined
    );
    const view = createViewProxy(gridLoadFormHandle, parameters, {
      messageBar,
      grid,
      controller: fieldController,
      viewController,
      gridResolver,
      data: viewData,
    });
    grid.view = view;
    return { grid, view };
  }, [
    gridLoadFormHandle,
    messageBar,
    parameters,
    parameter.name,
    viewController,
    viewData,
    fieldController,
    gridResolver,
  ]);

  // Grid-cell variant of the item proxy passed to a per-column onChange / validator:
  // `getValue`/`record` point at the edited row's cell, `grid`/`view` are wired.
  const buildColumnItemProxy = useCallback(
    (formHandle: FormHandle, rowData: Record<string, unknown>, colName: string, grid: GridProxy, view: ViewProxy) => {
      const item = createItemProxy(formHandle, colName, { columnName: colName }, fieldController, gridResolver);
      item.getValue = () => rowData?.[colName];
      item.record = rowData;
      item.grid = grid;
      item.view = view;
      return item;
    },
    [fieldController, gridResolver]
  );

  // Runs registered per-column validators on the changed columns. On rejection it
  // reverts the edited cell to its prior value (the script already showed its own
  // message) and returns true so the caller aborts the change — the faithful
  // equivalent of a classic validator returning false.
  const rejectByColumnValidator = useCallback(
    (row: any, mergedChanges: Record<string, unknown>, records: EntityData[]): boolean => {
      const proxies = buildCellHookProxies();
      if (!proxies || !gridLoadFormHandle) return false;
      const { grid, view } = proxies;
      const rowData = (row.original ?? row) as Record<string, unknown>;
      // Validate the value(s) being written, not the stale cell value (see
      // buildValidatorCandidate): a programmatic setEditValue must be checked
      // against the candidate it writes, otherwise a row whose default fails the
      // validator (e.g. amount=0) drops every legitimate write.
      const candidate = buildValidatorCandidate(rowData, mergedChanges);
      let rejected = false;
      for (const colName of Object.keys(mergedChanges ?? {})) {
        const validator = columnValidatorRef.current.get(colName);
        if (!validator) continue;
        const item = buildColumnItemProxy(gridLoadFormHandle, candidate, colName, grid, view);
        if (validator(item, undefined, candidate[colName], candidate as EntityData) === false) {
          const prior = records.find((r) => String(r.id) === String(row.id)) as Record<string, unknown> | undefined;
          if (prior && colName in prior) rowData[colName] = prior[colName];
          rejected = true;
        }
      }
      if (rejected) setSiblingPatchVersion((v) => v + 1);
      return rejected;
    },
    [buildCellHookProxies, buildColumnItemProxy, gridLoadFormHandle]
  );

  // Fires the cell-edit hooks on every real edit (both create-rows and existing
  // rows): script `grid.onRecordChange` subscribers, then per-column onChange
  // handlers. No-op unless a migrated script registered any. The re-entrancy guard
  // stops a column onChange that calls `grid.setEditValue` from looping forever.
  const fireCellEditHooks = useCallback(
    (row: any, mergedChanges: Record<string, unknown>): void => {
      const hasSubs = recordChangeSubsRef.current.length > 0;
      const hasColumnOnChange = columnOnChangeRef.current.size > 0;
      if ((!hasSubs && !hasColumnOnChange) || inColumnOnChangeRef.current) return;
      const proxies = buildCellHookProxies();
      if (!proxies || !gridLoadFormHandle) return;
      const { grid, view } = proxies;
      const rowData = (row.original ?? row) as Record<string, unknown>;
      const changes = mergedChanges ?? {};

      for (const fn of recordChangeSubsRef.current) {
        try {
          fn(row as EntityData, changes);
        } catch (error) {
          logger.error("[WindowReferenceGrid] onRecordChange subscriber failed", error);
        }
      }

      if (!hasColumnOnChange) return;
      inColumnOnChangeRef.current = true;
      try {
        for (const colName of Object.keys(changes)) {
          const onChange = columnOnChangeRef.current.get(colName);
          if (!onChange) continue;
          const item = buildColumnItemProxy(gridLoadFormHandle, rowData, colName, grid, view);
          try {
            onChange(item, view, view.theForm, grid);
          } catch (error) {
            logger.error("[WindowReferenceGrid] column onChange failed", error);
          }
        }
      } finally {
        inColumnOnChangeRef.current = false;
      }
    },
    [buildCellHookProxies, buildColumnItemProxy, gridLoadFormHandle]
  );

  // Stable handler using refs
  const handleRecordChange = useCallback(
    (row: any, changes: any, options?: { programmatic?: boolean }) => {
      const records = localRecordsRef.current;
      const selection = rowSelectionRef.current;

      // Apply declarative field interactions from the payscript (e.g. mutually
      // exclusive columns in a P&E grid). Runs BEFORE the localRecords lookup so
      // MRT create-rows (id="mrt-row-create"), which haven't entered the state
      // yet, still get their sibling columns zeroed on `row.original` and on
      // MRT's per-cell cache — otherwise the row would be saved with both
      // siblings populated.
      const mergedChanges = applyFieldInteractions(processId, parameter.dBColumnName, row, changes);

      // If a sibling patch was applied, bump the version so every GridCellEditor
      // memo invalidates and re-reads row.original. Both create-rows and
      // existing rows path through here; for existing rows it's redundant with
      // setLocalRecords below but harmless (single integer bump).
      if (mergedChanges !== changes) {
        setSiblingPatchVersion((v) => v + 1);
      }

      // Per-column validator gate (classic AD_FIELD validator). Runs only for
      // interactive edits with registered validators and outside a column-onChange
      // re-entry; programmatic writes (distribute/seed) are never validated, matching
      // classic. On reject the edited cell is reverted and the change is aborted.
      if (
        shouldRunColumnValidators(!!options?.programmatic, inColumnOnChangeRef.current, columnValidatorRef.current.size)
      ) {
        if (rejectByColumnValidator(row, mergedChanges, records)) return;
      }

      // Persist the edit against the committed read store (see applyEditToReadStore):
      // a script-proxy setEditValue targets a row drawn from gridApiRef.current.rows,
      // which getEditValues / getEditedCell / the cell display also read. Rows absent
      // from the read store (MRT create-rows, id="mrt-row-create") return null here
      // and keep the row.original / _valuesCache mutation above as their only state
      // effect, just firing the cell-edit hooks below.
      const updatedRecords = applyEditToReadStore(gridApiRef.current.rows, row.id, mergedChanges);
      if (updatedRecords) {
        // Update state (trigger re-render)
        setLocalRecords(updatedRecords);
        // Reflect the in-flight edit in the read store synchronously, BEFORE the
        // cell-edit hooks fire below. setLocalRecords commits on the next render, so
        // without this a migrated onChange reading grid.getEditValues / getEditedCell
        // (which read gridApiRef.current.rows) would see the previous render's value
        // (stale-by-one). Classic SmartClient committed the cell value synchronously
        // before the change handler.
        gridApiRef.current.rows = updatedRecords;

        // Update selection if selected (read from ref)
        if (selection[row.id]) {
          onSelectionChange((prev: GridSelectionStructure) => {
            const currentSelection = prev[parameter.dBColumnName]?._selection || [];
            const updatedSelection = currentSelection.map((item) =>
              String(item.id) === String(row.id) ? { ...item, ...mergedChanges } : item
            );
            return {
              ...prev,
              [parameter.dBColumnName]: {
                ...prev[parameter.dBColumnName],
                _selection: updatedSelection,
                _allRows:
                  prev[parameter.dBColumnName]?._allRows?.map((item) =>
                    String(item.id) === String(row.id) ? { ...item, ...mergedChanges } : item
                  ) || [],
              },
            };
          });
        }
      }

      // Notify script-registered cell-edit hooks (mirrors the classic per-cell
      // onChange). Additive: a no-op when no script registered any subscriber.
      fireCellEditHooks(row, mergedChanges);
    },
    [parameter.dBColumnName, onSelectionChange, processId, rejectByColumnValidator, fireCellEditHooks]
  ); // Dependencies are now minimal and stable

  // Update the ref exposed to context
  useEffect(() => {
    handleRecordChangeRef.current = handleRecordChange;
  }, [handleRecordChange]);

  // --- Programmable grid handle (view.theForm.getItem('<param>').canvas.viewGrid)
  // Live handles the controller reads at call time, refreshed every render so the
  // controller identity stays stable (the modal keeps it in a registry) while it
  // always operates on the current rows / selection / datasource handles.
  const gridApiRef = useRef<EmbeddedGridApi>({
    rows: localRecords,
    refetch,
    criteria: datasourceOptions?.criteria,
    fields,
    handleRowSelection,
    handleClearSelections,
    handleRecordChange,
    setRowActions: registerRowActions,
  });
  gridApiRef.current = {
    rows: localRecords,
    refetch,
    criteria: datasourceOptions?.criteria,
    fields,
    handleRowSelection,
    handleClearSelections,
    handleRecordChange,
    setRowActions: registerRowActions,
  };

  const gridController = useMemo<GridController>(
    () =>
      createEmbeddedGridController(
        () => gridApiRef.current,
        () => Array.from(persistentSelectionRef.current.values()),
        {
          dataArrived: dataArrivedSubsRef.current,
          selectionChanged: selectionChangedSubsRef.current,
          recordChange: recordChangeSubsRef.current,
          selectionToggle: selectionToggleSubsRef.current,
          columnOnChange: columnOnChangeRef.current,
          columnValidator: columnValidatorRef.current,
        }
      ),
    []
  );
  gridControllerRef.current = gridController;

  // Register this grid's controller with the modal so scripts reach it through
  // `view.theForm.getItem('<param>').canvas.viewGrid`. Keyed by parameter name
  // (the key `resolveFormKey` maps item lookups to).
  useEffect(() => {
    if (!onRegisterGrid) return;
    onRegisterGrid(parameter.name, gridController);
    return () => onUnregisterGrid?.(parameter.name);
  }, [onRegisterGrid, onUnregisterGrid, parameter.name, gridController]);

  // Diffs the previous vs current selection and emits one per-toggle delta
  // (record, state) for each added (true) / removed (false) id. A removed record
  // may be off the current page, so it is resolved from the persistent cache then
  // from localRecords. Updates the baseline for the next diff.
  const emitSelectionToggles = useCallback((selection: EntityData[]) => {
    const currentIds = new Set(selection.map((r) => String(r.id)));
    const byId = new Map(selection.map((r) => [String(r.id), r] as const));
    const fire = (record: EntityData, state: boolean) => {
      for (const fn of selectionToggleSubsRef.current) {
        try {
          fn(record, state);
        } catch (error) {
          logger.error("[WindowReferenceGrid] onSelectionToggle subscriber failed", error);
        }
      }
    };
    for (const id of currentIds) {
      if (!prevSelectionIdsRef.current.has(id)) {
        const record = byId.get(id);
        if (record) fire(record, true);
      }
    }
    for (const id of prevSelectionIdsRef.current) {
      if (!currentIds.has(id)) {
        const record =
          persistentSelectionRef.current.get(id) ?? localRecordsRef.current.find((r) => String(r.id) === id);
        if (record) fire(record, false);
      }
    }
    prevSelectionIdsRef.current = currentIds;
  }, []);

  // Notify script `selectionChanged` subscribers on every selection change
  // (skipping the initial mount so it mirrors a user/programmatic toggle).
  const selectionChangedReadyRef = useRef(false);
  useEffect(() => {
    if (!selectionChangedReadyRef.current) {
      selectionChangedReadyRef.current = true;
      // Seed the toggle-diff baseline so the first real toggle diffs against the
      // mount selection instead of emitting spurious "added" toggles.
      prevSelectionIdsRef.current = new Set(Array.from(persistentSelectionRef.current.keys()));
      return;
    }
    const selection = Array.from(persistentSelectionRef.current.values());
    // Existing full-array contract — UNCHANGED (already-migrated processes rely on it).
    for (const fn of selectionChangedSubsRef.current) fn(selection);

    // Additive per-toggle delta (classic `selectionChanged(record, state)`): diff
    // the previous vs current selection and emit one toggle per added/removed id.
    // Gated so it stays a pure no-op unless a script subscribed via onSelectionToggle.
    if (selectionToggleSubsRef.current.length > 0) {
      emitSelectionToggles(selection);
    }
  }, [rowSelection]);

  // Context value for GridCellEditor components (defined here to capture handleRecordChangeRef)
  const gridContextValue = useMemo(
    () => ({
      effectiveRecordValuesRef,
      parametersRef,
      fieldsRef,
      handleRecordChangeRef,
      validationsRef,
      validations,
      session,
      tabId,
      tab: stableWindowReferenceTab,
      fieldReadOnlyMap,
      shouldSendOrg,
      createRowErrors,
      clearCellError,
      siblingPatchVersion,
    }),
    [
      tabId,
      stableWindowReferenceTab,
      session,
      validations,
      fieldReadOnlyMap,
      shouldSendOrg,
      createRowErrors,
      clearCellError,
      siblingPatchVersion,
    ]
  );

  // Builds the {record, view, grid} context for a row-action renderer/button,
  // reusing the exact proxies the onGridLoad path builds so script mutations
  // follow the same live grid handle.
  const buildRowActionContext = useCallback(
    (record: EntityData): RowActionContext | null => {
      if (!gridLoadFormHandle || !messageBar) return null;
      const selectedRecords = Array.from(persistentSelectionRef.current.values());
      const grid = createGridProxy(
        { rows: localRecords, selectedRecords },
        gridControllerRef.current ?? undefined,
        fieldController ? buildGridVisibility(fieldController, parameter.name) : undefined
      );
      const view = createViewProxy(gridLoadFormHandle, parameters, {
        messageBar,
        grid,
        controller: fieldController,
        viewController,
        gridResolver,
        data: viewData,
      });
      grid.view = view;
      return { record, view, grid };
    },
    [
      gridLoadFormHandle,
      messageBar,
      localRecords,
      parameters,
      parameter.name,
      fieldController,
      viewController,
      gridResolver,
      viewData,
    ]
  );

  // Calls the registered renderer for one row; a throw is logged and yields no
  // buttons so the row (and the table) keep rendering.
  const evaluateRowActions = useCallback(
    (record: EntityData): RowActionDescriptor | null => {
      const renderer = rowActionsRendererRef.current;
      if (!renderer) return null;
      const ctx = buildRowActionContext(record);
      if (!ctx) return null;
      try {
        return renderer(ctx) ?? null;
      } catch (error) {
        logger.error("[WindowReferenceGrid] row action renderer failed", error);
        return null;
      }
    },
    [buildRowActionContext]
  );

  // Runs a button's action with a fresh context; a throw is logged, not fatal.
  const runRowAction = useCallback(
    (button: RowActionButton, record: EntityData) => {
      if (button.disabled || !button.action) return;
      const ctx = buildRowActionContext(record);
      if (!ctx) return;
      try {
        button.action(ctx);
      } catch (error) {
        logger.error("[WindowReferenceGrid] row action failed", error);
      }
    },
    [buildRowActionContext]
  );

  const renderRowActionsCell = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: MRT cell render args
    ({ row }: any) => {
      const record = row.original as EntityData;
      const descriptor = evaluateRowActions(record);
      if (!descriptor || descriptor.buttons.length === 0) return null;
      return (
        <RowActionsCell
          buttons={descriptor.buttons}
          onActivate={(index) => runRowAction(descriptor.buttons[index], record)}
          data-testid="RowActionsCell__ce8544"
        />
      );
    },
    [evaluateRowActions, runRowAction]
  );

  const finalColumns = useMemo(() => {
    const windowReferenceTab = parameter.window?.tabs?.[0];
    let fields: any[] = [];
    if (windowReferenceTab?.fields) {
      if (Array.isArray(windowReferenceTab.fields)) {
        fields = windowReferenceTab.fields;
      } else {
        fields = Object.values(windowReferenceTab.fields);
      }
    }

    const mappedColumns = columns
      .filter((c) => c.id !== "actions")
      .map((col) => {
        // Identify if column corresponds to a Read-Only field
        let isReadOnly = false;
        if (fields.length > 0) {
          const colDef = col as MRT_ColumnDef<EntityData>;
          const field = fields.find((f: any) => {
            if (colDef.accessorKey) {
              if (f.columnName === colDef.accessorKey) return true;
              if (f.inpColumnName === colDef.accessorKey) return true;
              if (f.hqlName === colDef.accessorKey) return true;
            }
            if (col.header && f.name === col.header) return true;
            return false;
          });

          if (field) {
            // Check explicit metadata or dynamic logic
            if (
              field.readOnly === true ||
              field.isReadOnly === true ||
              field.uIPattern === UIPattern.READ_ONLY ||
              fieldReadOnlyMap[field.columnName] ||
              fieldReadOnlyMap[field.hqlName]
            ) {
              isReadOnly = true;
            }
          }
        }

        const newCol: any = {
          ...col,
          enableEditing: isReadOnly ? false : col.enableEditing,
          onRecordChange: handleRecordChange,
        };

        if (isReadOnly) {
          // For Read-Only fields, override the Cell renderer
          // Exception: preserve custom Cell renderers from clientclass-based link columns
          if (!col.clientclass) {
            newCol.Cell = ReadOnlyCellRenderer;
          }
          // Ensure Edit component is removed so it cannot be triggered
          newCol.Edit = undefined;
        } else if (!newCol.Cell) {
          // If no cell renderer set (and not read-only), ensure we use our interactive one for consistency
          // Note: columns usually have default or custom cell renderers set in useColumns or earlier logic
        }

        return newCol;
      });

    // The script row-action buttons are rendered inside the leading actions
    // column (the "mrt-row-actions" Cell override), not as a trailing column.
    return mappedColumns;
  }, [columns, handleRecordChange, parameter.window, fieldReadOnlyMap]);

  const fetchMoreOnBottomReached = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = event.currentTarget as HTMLDivElement;

      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (
          clientHeight > 0 &&
          scrollHeight > clientHeight &&
          scrollHeight - scrollTop - clientHeight < 100 && // 100px threshold
          !datasourceLoading &&
          hasMoreRecords
        ) {
          fetchMore();
        }
      }
    },
    [fetchMore, hasMoreRecords, datasourceLoading]
  );

  // Per-tab capabilities driven by AD_Tab metadata. Default `undefined` for
  // `obuiappShowSelect` keeps row selection visible (matches previous behavior
  // for tabs whose metadata predates the flag); only an explicit `false` hides
  // the checkbox column.
  const isReadOnlyTab = windowReferenceTab?.uIPattern === UIPattern.READ_ONLY;
  const canAdd = windowReferenceTab?.obuiappCanAdd === true && !isReadOnlyTab;
  const canDelete = windowReferenceTab?.obuiappCanDelete === true && !isReadOnlyTab;
  const enableRowSelectionFromMetadata = windowReferenceTab?.obuiappShowSelect !== false;
  const deleteRowLabel = t("processModal.gridToolbar.deleteRow");

  // The Actions column is rendered iff at least one row would actually paint
  // a button. Hidden in two cases:
  //   - canDelete=false AND no add-capability/locally-added row → nothing to render.
  //   - canDelete=true but `records` is empty → no row to put a trash on.
  // `enableEditing` is passed as a literal `false` (not a callback) when
  // canAdd is off, so MRT doesn't insert the column header by itself.
  const hasLocallyAddedRow = (records || []).some((r) => Boolean((r as { _locallyAdded?: boolean })?._locallyAdded));
  const hasAnyDeletableRow = canDelete && (records || []).length > 0;
  const hasAnyActionableRow = hasLocallyAddedRow || hasAnyDeletableRow;
  // Creatable grids must own the create-row chrome too (see shouldShowRowActions).
  const showRowActions = shouldShowRowActions(hasAnyActionableRow, hasRowActions, canAdd);
  const enableEditingPredicate = useMemo(
    () => buildEnableEditingPredicate(finalColumns, windowReferenceTab, fieldReadOnlyMap),
    [finalColumns, windowReferenceTab, fieldReadOnlyMap]
  );

  const tableOptions: MRT_TableOptions<EntityData> = useMemo(
    () => ({
      muiTablePaperProps: {
        className: tableStyles.paper,
        style: { height: `${TABLE_PAPER_HEIGHT}px`, maxHeight: `${TABLE_PAPER_HEIGHT}px` },
      },
      muiTableHeadCellProps: {
        className: tableStyles.headCell,
      },
      muiTableBodyCellProps: {
        className: tableStyles.bodyCell,
      },
      muiTableBodyProps: {
        className: tableStyles.body,
      },
      muiTableBodyRowProps: ({ row }) => {
        // When the tab disables selection (obuiappShowSelect=false), rows are
        // visually inert: no click-to-toggle and no blue highlight. The grid
        // still propagates every record as `_allRows` so the backend processes
        // them — selection here is purely cosmetic and would otherwise paint
        // every row blue (the datasource pre-fills `obSelected=true`).
        if (!enableRowSelectionFromMetadata) {
          return { className: "hover:bg-gray-50" };
        }
        return {
          onClick: (event) => handleRowClick(row, event),
          className: rowSelection[row.id]
            ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
            : "hover:bg-gray-50 cursor-pointer",
        };
      },
      muiTableContainerProps: {
        className: tableStyles.container,
        onScroll: fetchMoreOnBottomReached,
      },
      layoutMode: "semantic",
      enableColumnResizing: true,
      enableGlobalFilter: false,
      enableRowSelection: enableRowSelectionFromMetadata,
      enableMultiRowSelection: tabAllowsMultipleSelection(windowReferenceTab),
      positionToolbarAlertBanner: "none",
      enablePagination: false,
      enableStickyHeader: true,
      enableStickyFooter: false,
      renderBottomToolbar: () => null,
      muiBottomToolbarProps: { sx: { display: "none" } },
      enableColumnFilters: true,
      enableSorting: true,
      manualSorting: true,
      enableColumnActions: true,
      manualFiltering: true,
      onSortingChange: setSorting,
      enableRowVirtualization: true,
      columns: finalColumns, // Use modified columns with handler
      data: records || [],
      getRowId: (row) => String(row.id),
      renderTopToolbar: (props: MRT_TopToolbarProps<EntityData>) => (
        <GridTopToolbar
          {...props}
          canAdd={canAdd}
          parameterName={parameter.name}
          showTitle={showTitle}
          t={t}
          handleClearSelections={handleClearSelections}
          enableRowSelection={enableRowSelectionFromMetadata}
          isImplicitFilterApplied={isImplicitFilterApplied}
          initialIsFilterApplied={initialIsFilterApplied}
          handleMRTColumnFiltersChange={handleMRTColumnFiltersChange}
          setIsImplicitFilterApplied={setIsImplicitFilterApplied}
          visibleFieldsFromTab={visibleFieldsFromTab}
          data-testid="GridTopToolbar__ce8544"
        />
      ),
      renderEmptyRowsFallback: () => (
        <div className="flex justify-center items-center p-8 text-gray-500">
          <EmptyState maxWidth={MAX_WIDTH} containerStyle={{ padding: "0" }} data-testid="EmptyState__ce8544" />
        </div>
      ),
      initialState: {
        density: "compact",
        showColumnFilters: true,
      },
      state: {
        rowSelection,
        columnFilters,
        sorting,
      },
      keepNonExistentRowsSelected: true,
      onRowSelectionChange: handleRowSelection,
      onColumnFiltersChange: handleMRTColumnFiltersChange,
      // Passing `false` (not a callback) when canAdd is off prevents MRT
      // from inserting the Actions column header just to host edit buttons.
      enableEditing: canAdd ? enableEditingPredicate : false,
      createDisplayMode: "row",
      // Keep MRT's edit-display mode as "row" so a double-click on a cell does
      // NOT activate per-cell editing (which would bypass `shouldRenderCellEditor`
      // and let the user mutate a single cell outside the selection/locally-added
      // gate). Combined with `enableEditing` rejecting rows that already have an
      // `original.id`, no existing row can be entered into edit-mode by the user.
      editDisplayMode: "row",
      enableRowActions: showRowActions,
      positionActionsColumn: "first",
      displayColumnDefOptions: {
        "mrt-row-actions": {
          size: hasRowActions ? ACTIONS_COLUMN_SIZE_WITH_SCRIPT : ACTIONS_COLUMN_SIZE_DEFAULT,
          minSize: hasRowActions ? ACTIONS_COLUMN_SIZE_WITH_SCRIPT : ACTIONS_COLUMN_SIZE_DEFAULT,
          enableResizing: false,
          // Center the "Actions" header label over the centered icon row.
          muiTableHeadCellProps: {
            // align: "center",
            sx: { "& .Mui-TableHeadCell-Content": { justifyContent: "center" } },
          },
          // Own the actions cell directly. MRT's default actions cell forces its
          // built-in MRT_EditActionButtons for the create-row in row create/edit
          // mode and never consults `renderRowActions`, so overriding the column
          // `Cell` is the only way our create-row buttons (and idle-row buttons)
          // render for every row, including the creating scaffold.
          Cell: ({ row, table }) =>
            renderActionsCell({
              row,
              table,
              canDelete,
              onDelete: handleDeleteRow,
              deleteRowLabel,
              // Script buttons render on real (persisted) rows only.
              leadingActions: row.original?.id ? renderRowActionsCell({ row }) : null,
            }),
        },
      },
      onCreatingRowSave: handleCreateRow,
      onCreatingRowCancel: () => {
        setValidationErrors({});
        setCreateRowErrors((prev) => (prev.size === 0 ? prev : new Set()));
      },
    }),
    [
      finalColumns,
      records,
      rowSelection,
      columnFilters,
      handleRowSelection,
      handleMRTColumnFiltersChange,
      handleRowClick,
      handleCreateRow,
      handleDeleteRow,
      fetchMoreOnBottomReached,
      windowReferenceTab?.fields,
      canAdd,
      canDelete,
      deleteRowLabel,
      enableRowSelectionFromMetadata,
      enableEditingPredicate,
      showRowActions,
      hasRowActions,
      renderRowActionsCell,
    ]
  );

  const table = useMaterialReactTable(tableOptions);

  // Separate initial loading from filter/refresh loading.
  // The previous predicate `(... ) && !records` short-circuited as soon as
  // `localRecords` was initialized to `[]` (truthy in JS), so the empty
  // table rendered before the first datasource fetch returned, producing a
  // visible "empty → records → defaults" flash. `rawRecordsStringRef` is
  // empty until `useDatasource` resolves its first page, which is the
  // correct signal for "we haven't shown real data yet".
  const hasReceivedFirstPage = rawRecordsStringRef.current !== "";
  const isInitialLoading =
    tabLoading || processConfigLoading || !isDataReady || (datasourceLoading && !hasReceivedFirstPage);
  const error = tabError || processConfigError || datasourceError;

  if (isInitialLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loading data-testid="Loading__ce8544" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title={t("errors.missingData.title")}
        description={error?.message}
        showRetry
        onRetry={refetch}
        data-testid="ErrorDisplay__ce8544"
      />
    );
  }

  // Only show EmptyState if there are no columns (configuration error)
  // If there are columns but no records, show the table with empty state inside
  if ((!columns || columns.length === 0) && !tabLoading && !processConfigLoading) {
    return <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />;
  }

  return (
    <WindowReferenceGridProvider value={gridContextValue} data-testid="WindowReferenceGridProvider__ce8544">
      <div
        className={`flex flex-col w-full overflow-hidden transition duration-100 ${
          datasourceLoading ? "opacity-40 cursor-wait cursor-to-children" : "opacity-100"
        }`}
        ref={contentRef}>
        <MaterialReactTable table={table} data-testid="MaterialReactTable__ce8544" />
      </div>
    </WindowReferenceGridProvider>
  );
};

export default WindowReferenceGrid;

// Separate component for TopToolbar to avoid being re-defined on every render
export const GridTopToolbar = ({
  table,
  canAdd,
  parameterName,
  showTitle,
  t,
  handleClearSelections,
  enableRowSelection,
  isImplicitFilterApplied,
  initialIsFilterApplied,
  handleMRTColumnFiltersChange: _handleMRTColumnFiltersChange,
  setIsImplicitFilterApplied,
  visibleFieldsFromTab,
}: any) => {
  const selectedCount = table.getSelectedRowModel().rows.length;
  const effectiveImplicitFilter = isImplicitFilterApplied ?? initialIsFilterApplied;
  const addRowLabel = t("processModal.gridToolbar.addRow");

  const handleAddRow = () => {
    const initialValues: Record<string, unknown> = {};
    if (visibleFieldsFromTab) {
      for (const field of visibleFieldsFromTab) {
        if (field.isMandatory && (field.type === FieldType.NUMBER || field.type === FieldType.QUANTITY)) {
          // Populate every key shape so cell.getValue() picks it up via accessorKey
          const keys = [field.columnName, field.hqlName, field.name, field._key].filter(Boolean);
          for (const k of keys) initialValues[k] = 0;
        }
      }
    }
    if (Object.keys(initialValues).length === 0) {
      table.setCreatingRow(true);
      return;
    }
    const initialRow = createRow(table, initialValues as EntityData);
    table.setCreatingRow(initialRow);
  };

  return (
    <div className="flex items-center justify-between border-b border-b-transparent-neutral-10 bg-gray-50 h-[2.5rem]">
      <div className="flex items-center px-2">
        {showTitle && <div className="text-base font-medium text-gray-800 mr-4">{parameterName}</div>}
        {enableRowSelection !== false && selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedCount} {t("table.selection.multiple")}
            </span>
            <button
              type="button"
              onClick={handleClearSelections}
              className="px-3 py-1 text-sm cursor-pointer text-gray-700 border border-gray-300 rounded-full hover:bg-(--color-etendo-main) hover:text-(--color-baseline-0) transition-colors">
              {t("common.clear")}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center">
        {canAdd && (
          <Tooltip title={addRowLabel} data-testid="Tooltip__ce8544">
            <span>
              <IconButton onClick={handleAddRow} aria-label={addRowLabel} data-testid="GridTopToolbar__AddRowButton">
                <PlusIcon className="h-4 w-4" data-testid="PlusIcon__ce8544" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {initialIsFilterApplied && (
          <Tooltip
            title={t(effectiveImplicitFilter ? "table.tooltips.implicitFilterOn" : "table.tooltips.implicitFilterOff")}
            data-testid="Tooltip__ce8544">
            <span>
              <IconButton
                onClick={() => setIsImplicitFilterApplied(false)}
                disabled={!effectiveImplicitFilter}
                size="small"
                sx={{ color: effectiveImplicitFilter ? "var(--color-etendo-main)" : undefined }}
                data-testid="implicit-filter-button">
                {effectiveImplicitFilter ? (
                  <FilterAlt fontSize="small" data-testid="FilterAlt__ce8544" />
                ) : (
                  <FilterAltOff fontSize="small" data-testid="FilterAltOff__ce8544" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <MRT_ToggleFiltersButton table={table} data-testid="MRT_ToggleFiltersButton__ce8544" />
        <MRT_ShowHideColumnsButton table={table} data-testid="MRT_ShowHideColumnsButton__ce8544" />
        <MRT_ToggleDensePaddingButton table={table} data-testid="MRT_ToggleDensePaddingButton__ce8544" />
        <MRT_ToggleFullScreenButton table={table} data-testid="MRT_ToggleFullScreenButton__ce8544" />
      </div>
    </div>
  );
};
