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
 * Proxies that adapt the new-UI react-hook-form / grid state to the
 * SmartClient-style `item` / `form` / `view` / `grid` objects expected by
 * migrated parameter-level hooks (`onParameterChange` / `onGridLoad`).
 *
 * Only the methods that the in-scope migrated scripts actually call are backed
 * by real behaviour; the remaining classic methods are exposed as stubs that
 * throw a traceable "not implemented yet" error, so an unported script fails
 * clearly instead of with a cryptic "undefined is not a function".
 */

import type { UseFormReturn } from "react-hook-form";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";

// ---------------------------------------------------------------------------
// Dependencies (structural subsets, so tests can pass plain mocks)
// ---------------------------------------------------------------------------

/** Minimal react-hook-form surface the proxies delegate to. */
export interface FormHandle {
  getValues: (name?: string) => unknown;
  setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void;
}

/**
 * Adapts a react-hook-form instance to the structural `FormHandle` the proxies
 * use, confining the key/value casts to a single place. Shared by the
 * onParameterChange hook and the onGridLoad runner.
 */
export function createFormHandle(form: UseFormReturn): FormHandle {
  return {
    getValues: (name?: string) => (name === undefined ? form.getValues() : form.getValues(name as never)),
    setValue: (name, value, options) => form.setValue(name as never, value as never, options),
  };
}

/** A clickable affordance rendered as a real button inside the message bar. */
export interface MessageBarAction {
  label: string;
  onClick: () => void;
}

/** In-modal message banner backing `view.messageBar`. */
export interface MessageBarHandle {
  setMessage: (severity: string, title: string | null, text: string, actions?: MessageBarAction[]) => void;
  hide: () => void;
}

/** Loaded grid rows + current selection backing the `grid` proxy. */
export interface GridState {
  rows: EntityData[];
  selectedRecords: EntityData[];
}

export type ParametersMap = Record<string, ProcessParameter>;

// ---------------------------------------------------------------------------
// Proxy shapes
// ---------------------------------------------------------------------------

export interface ItemProxy extends Record<string, unknown> {
  name: string;
  getValue: () => unknown;
  setValue: (value: unknown) => void;
}

export interface FormProxy extends Record<string, unknown> {
  getItem: (name: string) => ItemProxy;
  getValues: () => unknown;
  redraw: () => void;
}

export interface GridProxy extends Record<string, unknown> {
  getData: () => { getLength: () => number };
  getSelectedRecords: () => EntityData[];
  getRecord: (index: number) => EntityData | undefined;
  getRecordIndex: (record: EntityData) => number;
  data: { localData: EntityData[]; allRows: EntityData[]; totalRows: number };
}

export interface ViewProxy extends Record<string, unknown> {
  theForm: FormProxy;
  messageBar: MessageBarHandle;
  viewGrid?: GridProxy;
}

/** Optional extras for the grid-cell variant of the onChange hook. */
export interface ItemProxyExtras {
  rowNum?: number;
  columnName?: string;
}

// ---------------------------------------------------------------------------
// Deferred (not-yet-implemented) classic methods, by proxy
// ---------------------------------------------------------------------------

const DEFERRED_ITEM_METHODS = [
  "setValueFromRecord",
  "setRequired",
  "setDisabled",
  "show",
  "hide",
  "clearValue",
  "fetchData",
  "setValueMap",
  "getValueMap",
  "getElementValue",
  "redraw",
] as const;

const DEFERRED_FORM_METHODS = ["getField", "getFields", "addField", "removeField", "focusInItem", "hideItem"] as const;

const DEFERRED_VIEW_METHODS = [
  "getContextInfo",
  "refresh",
  "handleReadOnlyLogic",
  "handleButtonsStatus",
  "fireOnPause",
  "openProcess",
  "selectAllRecords",
  "getSelection",
] as const;

const DEFERRED_GRID_METHODS = [
  "setEditValue",
  "getEditValues",
  "getEditedCell",
  "getEditedRecord",
  "selectSingleRecord",
  "selectRecord",
  "deselectRecord",
  "deselectAllRecords",
  "userSelectAllRecords",
  "invalidateCache",
  "fetchData",
  "filterByEditor",
  "getTotalRows",
  "setFilterEditorCriteria",
  "getCriteria",
  "addSelectedIDsToCriteria",
  "getFieldByColumnName",
] as const;

/** Throws a traceable error for a classic API not covered by this step. */
export function notImplemented(api: string): never {
  throw new Error(`${api} is not implemented yet`);
}

/** Assigns throwing stubs for the given deferred method names onto `target`. */
function assignDeferred(target: Record<string, unknown>, prefix: string, methods: readonly string[]): void {
  for (const method of methods) {
    target[method] = () => notImplemented(`${prefix}.${method}`);
  }
}

// ---------------------------------------------------------------------------
// Form-key resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the react-hook-form key for a classic item name. Migrated scripts
 * address items by parameter name or by raw `dBColumnName`; the form is keyed
 * by `parameter.name`, so a `dBColumnName` lookup maps back to its name. Falls
 * back to the requested name when no parameter matches.
 */
export function resolveFormKey(name: string, parameters: ParametersMap | undefined): string {
  if (!parameters) return name;
  const byName = parameters[name];
  if (byName) return byName.name;
  for (const parameter of Object.values(parameters)) {
    if (parameter.dBColumnName === name) return parameter.name;
  }
  return name;
}

// ---------------------------------------------------------------------------
// Proxy factories
// ---------------------------------------------------------------------------

/** Builds the `item` proxy for a single form key. */
export function createItemProxy(form: FormHandle, paramName: string, extras: ItemProxyExtras = {}): ItemProxy {
  const item: ItemProxy = {
    name: paramName,
    getValue: () => form.getValues(paramName),
    setValue: (value: unknown) => form.setValue(paramName, value, { shouldDirty: true, shouldValidate: true }),
  };
  if (extras.rowNum !== undefined) item.rowNum = extras.rowNum;
  if (extras.columnName !== undefined) item.columnName = extras.columnName;
  assignDeferred(item, "item", DEFERRED_ITEM_METHODS);
  return item;
}

/** Builds the `form` proxy backed by react-hook-form. */
export function createFormProxy(form: FormHandle, parameters: ParametersMap | undefined): FormProxy {
  const formProxy: FormProxy = {
    getItem: (name: string) => createItemProxy(form, resolveFormKey(name, parameters)),
    getValues: () => form.getValues(),
    redraw: () => {
      // No-op: react-hook-form re-renders reactively on value changes.
    },
  };
  assignDeferred(formProxy, "form", DEFERRED_FORM_METHODS);
  return formProxy;
}

/** Builds the `grid` proxy backed by the loaded rows and current selection. */
export function createGridProxy(state: GridState): GridProxy {
  const gridProxy: GridProxy = {
    getData: () => ({ getLength: () => state.rows.length }),
    getSelectedRecords: () => state.selectedRecords,
    getRecord: (index: number) => state.rows[index],
    getRecordIndex: (record: EntityData) => state.rows.findIndex((row) => row.id === record?.id),
    data: { localData: state.rows, allRows: state.rows, totalRows: state.rows.length },
  };
  assignDeferred(gridProxy, "grid", DEFERRED_GRID_METHODS);
  return gridProxy;
}

/** Builds the `view` proxy. `viewGrid` is set when the parameter is grid-typed. */
export function createViewProxy(
  form: FormHandle,
  parameters: ParametersMap | undefined,
  deps: { messageBar: MessageBarHandle; grid?: GridProxy }
): ViewProxy {
  const view: ViewProxy = {
    theForm: createFormProxy(form, parameters),
    messageBar: deps.messageBar,
  };
  if (deps.grid) view.viewGrid = deps.grid;
  assignDeferred(view, "view", DEFERRED_VIEW_METHODS);
  return view;
}
