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

import type { FieldValues, UseFormReturn, UseFormSetValue } from "react-hook-form";
import type { EntityData, ListOption, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { updateSelectorValue } from "@/utils/form/selectors/utils";
import type { DynamicParameter } from "./utils";

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

/**
 * Bridge the proxies use to mutate the modal's reactive state. Supplied by the
 * process modal (which owns the parameters / logic-field stores and the form
 * instance); absent in contexts that only read (e.g. plain unit tests), where
 * the corresponding classic methods stay deferred. Keeps the proxies pure
 * adapters with no React / state dependency of their own.
 */
export interface FieldController {
  setRequired: (name: string, required: boolean) => void;
  setDisabled: (name: string, disabled: boolean) => void;
  setDisplayed: (name: string, displayed: boolean) => void;
  setValueMap: (name: string, map: unknown) => void;
  getValueMap: (name: string) => ListOption[];
  addField: (field: DynamicParameter) => void;
  removeField: (target: number | string) => void;
  focusField: (name: string) => void;
}

/** A footer button handle reachable through `view.popupButtons.members`. */
export interface FooterButtonHandle extends Record<string, unknown> {
  _buttonValue: string;
  title: string;
  hide: () => void;
  show: () => void;
  setDisabled: (disabled?: boolean) => void;
}

/**
 * View-level bridge the modal supplies so the `view` action methods and footer
 * chrome become live. Mirrors `FieldController`: absent in plain tests (and any
 * context that only reads), where the corresponding classic methods stay
 * deferred. Keeps `createViewProxy` a pure adapter with no React dependency.
 */
export interface ViewController {
  refresh: (force?: boolean, keepEditedValues?: boolean) => void;
  fireOnPause: (id: string, fn: () => void, delay: number) => void;
  handleReadOnlyLogic: () => void;
  handleButtonsStatus: () => void;
  getSelection: () => EntityData[];
  selectAllRecords: () => void;
  getFooterButtons: () => FooterButtonHandle[];
  setCancelHidden: (hidden: boolean) => void;
  setCloseHidden: (hidden: boolean) => void;
}

/** Built-in icon presets for a row-action button. */
export type RowActionIcon = "search" | "add" | "clearRight";

/** Shared icon-preset literals so the proxy and the grid renderer agree on names. */
export const ICON_PRESET = {
  SEARCH: "search",
  ADD: "add",
  CLEAR_RIGHT: "clearRight",
} as const;

/** Context handed to a row-action button click and to the row renderer. */
export interface RowActionContext {
  record: EntityData;
  view: ViewProxy;
  grid: GridProxy;
}

/** One inline icon-button (or a separator) drawn in a grid row. */
export interface RowActionButton {
  icon: RowActionIcon;
  prompt?: string;
  disabled?: boolean;
  /** Runs when the button is clicked. */
  action?: (ctx: RowActionContext) => void;
}

/** Declarative descriptor a row renderer returns for a single row. */
export interface RowActionDescriptor {
  buttons: RowActionButton[];
}

/** Callback registered via `grid.setRowActions`; returns nothing to draw no buttons. */
export type RowActionRenderer = (ctx: RowActionContext) => RowActionDescriptor | null | undefined;

/**
 * Per-grid bridge a single embedded grid (`WindowReferenceGrid`) exposes so the
 * `viewGrid` proxy methods become live. Mirrors `FieldController` /
 * `ViewController`: absent in plain tests (and the read-only `onGridLoad` path),
 * where the corresponding classic methods stay deferred. Keeps the grid proxy a
 * pure adapter with no React dependency. The modal registers one controller per
 * grid parameter and the proxies reach it through a `GridResolver`.
 */
export interface GridController {
  // Selection
  getSelectedRecords: () => EntityData[];
  selectRecord: (index: number) => void;
  deselectRecord: (index: number) => void;
  selectSingleRecord: (record: EntityData) => void;
  deselectAllRecords: () => void;
  userSelectAllRecords: () => void;
  // Row access
  getRows: () => EntityData[];
  getRecord: (index: number) => EntityData | undefined;
  getRecordIndex: (record: EntityData) => number;
  getEditedRecord: (index: number) => EntityData | undefined;
  getTotalRows: () => number;
  // Edit values (overlay merged into the loaded rows)
  setEditValue: (rowIndex: number, colName: string, value: unknown) => void;
  getEditValues: (rowIndex: number) => Record<string, unknown>;
  getEditedCell: (rowIndex: number, colName: string) => unknown;
  // Data / lifecycle
  invalidateCache: () => void;
  fetchData: (criteria?: unknown) => void;
  // Criteria
  getCriteria: () => unknown;
  addSelectedIDsToCriteria: (criteria: unknown, preserveSelected?: boolean) => unknown;
  // Column metadata
  getFieldByColumnName: (colName: string) => unknown;
  // Per-row component plugin (declarative inline buttons)
  setRowActions: (renderer: RowActionRenderer) => void;
  // Lifecycle callbacks (chained: every subscriber is kept and fired)
  onDataArrived: (fn: (rows: EntityData[]) => void) => void;
  onSelectionChanged: (fn: (selection: EntityData[]) => void) => void;
}

/** Resolves the live `GridController` for a parameter name (undefined when none). */
export type GridResolver = (paramName: string) => GridController | undefined;

/** Identity of the field/button that launched the process (`view.callerField`). */
export interface CallerField extends Record<string, unknown> {
  id?: string;
  name?: string;
  columnId?: string;
  record?: EntityData;
}

/**
 * Pure read-only data the modal already holds, surfaced on the `view`. These
 * need no controller (they are plain values), so they are present on every
 * `view` regardless of who builds it.
 */
export interface ViewData {
  windowId?: string;
  callerField?: CallerField;
  parentWindow?: unknown;
  sourceView?: unknown;
  parentRecord?: Record<string, unknown>;
  activeTabId?: string;
}

// ---------------------------------------------------------------------------
// Proxy shapes
// ---------------------------------------------------------------------------

/** Underlying widget handle of a form item; `viewGrid` is the embedded grid. */
export interface CanvasProxy extends Record<string, unknown> {
  viewGrid?: GridProxy;
  markForRedraw: () => void;
}

export interface ItemProxy extends Record<string, unknown> {
  name: string;
  getValue: () => unknown;
  setValue: (value: unknown) => void;
  /** Live only for grid parameters (when a `GridResolver` is injected). */
  canvas?: CanvasProxy;
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
  /** Methods below are live only when a `GridController` backs the proxy. */
  getEditedRecord?: (index: number) => EntityData | undefined;
  getTotalRows?: () => number;
  selectRecord?: (index: number) => void;
  deselectRecord?: (index: number) => void;
  selectSingleRecord?: (record: EntityData) => void;
  deselectAllRecords?: () => void;
  userSelectAllRecords?: () => void;
  setEditValue?: (rowIndex: number, colName: string, value: unknown) => void;
  getEditValues?: (rowIndex: number) => Record<string, unknown>;
  getEditedCell?: (rowIndex: number, colName: string) => unknown;
  invalidateCache?: () => void;
  fetchData?: (criteria?: unknown) => void;
  getCriteria?: () => unknown;
  addSelectedIDsToCriteria?: (criteria: unknown, preserveSelected?: boolean) => unknown;
  getFieldByColumnName?: (colName: string) => unknown;
  /** Registers a per-row renderer; `setRecordComponent` is a classic-vocabulary alias. */
  setRowActions?: (renderer: RowActionRenderer) => void;
  setRecordComponent?: (renderer: RowActionRenderer) => void;
}

export interface ViewProxy extends Record<string, unknown> {
  theForm: FormProxy;
  messageBar: MessageBarHandle;
  viewGrid?: GridProxy;
  /** Read-only environment data (always present). */
  windowId?: string;
  callerField?: CallerField;
  parentWindow?: unknown;
  sourceView?: unknown;
  activeView?: { tabId?: string };
  getContextInfo: () => Record<string, unknown>;
  getView: (tabId?: string) => unknown;
  /** Lifecycle actions (live only when a `ViewController` is injected). */
  refresh?: (force?: boolean, keepEditedValues?: boolean) => void;
  fireOnPause?: (id: string, fn: () => void, delay: number) => void;
  handleReadOnlyLogic?: () => void;
  handleButtonsStatus?: () => void;
  selectAllRecords?: () => void;
  getSelection?: () => EntityData[];
  /** Footer chrome (live only with a controller). */
  popupButtons?: { members: FooterButtonHandle[] };
  cancelButton?: { hide: () => void; show: () => void };
  parentElement?: { parentElement: { closeButton: { hide: () => void; show: () => void } } };
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

/**
 * Classic methods that become live once a `FieldController` is injected. The
 * remaining names stay deferred even with a controller because later migration
 * steps own them (`item.fetchData` and `item.canvas` belong to the embedded
 * grid; `getElementValue` is outside this surface).
 */
const LIVE_ITEM_METHODS: readonly string[] = [
  "setRequired",
  "setDisabled",
  "show",
  "hide",
  "clearValue",
  "setValueMap",
  "getValueMap",
  "setValueFromRecord",
  "redraw",
];
const LIVE_FORM_METHODS: readonly string[] = [...DEFERRED_FORM_METHODS];

/** Deferred sets that remain when a controller IS present (single source of truth). */
const DEFERRED_ITEM_METHODS_WITH_CONTROLLER = DEFERRED_ITEM_METHODS.filter((m) => !LIVE_ITEM_METHODS.includes(m));
const DEFERRED_FORM_METHODS_WITH_CONTROLLER = DEFERRED_FORM_METHODS.filter((m) => !LIVE_FORM_METHODS.includes(m));

/** Action methods that become live once a `ViewController` is injected. */
const LIVE_VIEW_METHODS = [
  "refresh",
  "fireOnPause",
  "handleReadOnlyLogic",
  "handleButtonsStatus",
  "selectAllRecords",
  "getSelection",
] as const;

/** Owned by the nested-process modal step; stays deferred even with a controller. */
const NESTED_VIEW_METHODS = ["openProcess"] as const;

/** Full deferred set used when no controller is present (`getContextInfo` is always live). */
const DEFERRED_VIEW_METHODS = [...LIVE_VIEW_METHODS, ...NESTED_VIEW_METHODS] as const;

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
  "setRowActions",
  "setRecordComponent",
] as const;

/**
 * Grid methods that become live once a `GridController` is injected. The two
 * filter-editor methods stay deferred even with a controller: the new grid
 * applies filters reactively and has no SmartClient filter-editor handle to
 * drive, so they remain best-effort/unsupported (documented limitation).
 */
const LIVE_GRID_METHODS: readonly string[] = [
  "getEditedRecord",
  "getTotalRows",
  "selectRecord",
  "deselectRecord",
  "selectSingleRecord",
  "deselectAllRecords",
  "userSelectAllRecords",
  "setEditValue",
  "getEditValues",
  "getEditedCell",
  "invalidateCache",
  "fetchData",
  "getCriteria",
  "addSelectedIDsToCriteria",
  "getFieldByColumnName",
  "setRowActions",
  "setRecordComponent",
];

/** Deferred set that remains when a controller IS present (single source of truth). */
const DEFERRED_GRID_METHODS_WITH_CONTROLLER = DEFERRED_GRID_METHODS.filter((m) => !LIVE_GRID_METHODS.includes(m));

/** Classic grid lifecycle callbacks assigned as properties (`grid.dataArrived = fn`). */
const GRID_CALLBACK_PROPS = ["dataArrived", "selectionChanged"] as const;

/** Stable empty grid state for proxies whose data is served live by a controller. */
const EMPTY_GRID_STATE: GridState = { rows: [], selectedRecords: [] };

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

/** Reads the id of a record for `setValueFromRecord`, mirroring classic precedence. */
function recordId(record: Record<string, unknown> | undefined): unknown {
  if (!record) return "";
  return record.id ?? record.value ?? "";
}

/**
 * Assigns the live `item` mutation methods, delegating each to the injected
 * controller (or the form handle for value-only operations). One statement per
 * method keeps the cognitive complexity flat.
 */
function assignLiveItemMethods(
  item: ItemProxy,
  form: FormHandle,
  paramName: string,
  controller: FieldController
): void {
  item.setRequired = (required = true) => controller.setRequired(paramName, required);
  item.setDisabled = (disabled = true) => controller.setDisabled(paramName, disabled);
  item.show = () => controller.setDisplayed(paramName, true);
  item.hide = () => controller.setDisplayed(paramName, false);
  item.setValueMap = (map: unknown) => controller.setValueMap(paramName, map);
  item.getValueMap = () => controller.getValueMap(paramName);
  item.clearValue = () => form.setValue(paramName, null, { shouldDirty: true, shouldValidate: true });
  item.setValueFromRecord = (record: Record<string, unknown> | undefined) =>
    updateSelectorValue(form.setValue as unknown as UseFormSetValue<FieldValues>, paramName, recordId(record), record);
  item.redraw = () => {
    // No-op: react-hook-form re-renders reactively on value changes.
  };
}

/**
 * Assigns the live `form` mutation methods. Item accessors thread the controller
 * so the returned items are themselves mutable; structural changes (add / remove
 * / focus) and visibility delegate to the controller.
 */
function assignLiveFormMethods(
  formProxy: FormProxy,
  form: FormHandle,
  parameters: ParametersMap | undefined,
  controller: FieldController,
  gridResolver?: GridResolver
): void {
  const getFields = () =>
    Object.values(parameters ?? {}).map((parameter) =>
      createItemProxy(form, parameter.name, {}, controller, gridResolver)
    );
  formProxy.getFields = getFields;
  formProxy.getField = (index: number) => getFields()[index];
  formProxy.hideItem = (name: string) => controller.setDisplayed(resolveFormKey(name, parameters), false);
  formProxy.addField = (field: DynamicParameter) => controller.addField(field);
  formProxy.removeField = (target: number | string) => controller.removeField(target);
  formProxy.focusInItem = (name: string) => controller.focusField(resolveFormKey(name, parameters));
  formProxy.markForRedraw = () => {
    // No-op: react-hook-form re-renders reactively on value changes.
  };
  Object.defineProperty(formProxy, "values", {
    get: () => form.getValues(),
    enumerable: true,
    configurable: true,
  });
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

/**
 * Builds the `item` proxy for a single form key. When a `controller` is given,
 * the classic mutation methods (`setRequired`, `setDisabled`, `show` / `hide`,
 * `setValueMap` / `getValueMap`, `clearValue`, `setValueFromRecord`, `redraw`)
 * become live; otherwise every classic method stays deferred.
 */
/**
 * Attaches `item.canvas` for grid parameters. With a `gridResolver` the
 * `canvas.viewGrid` handle is live when the parameter has a registered grid and
 * defers otherwise; without a resolver, accessing `canvas` throws a traceable
 * error (the embedded grid is only reachable from the modal).
 */
function assignItemCanvas(item: ItemProxy, paramName: string, gridResolver?: GridResolver): void {
  if (!gridResolver) {
    Object.defineProperty(item, "canvas", {
      get: () => notImplemented("item.canvas"),
      enumerable: true,
      configurable: true,
    });
    return;
  }
  item.canvas = {
    viewGrid: createGridProxy(EMPTY_GRID_STATE, gridResolver(paramName)),
    markForRedraw: () => {
      // No-op: the grid re-renders reactively from the modal's state.
    },
  };
}

export function createItemProxy(
  form: FormHandle,
  paramName: string,
  extras: ItemProxyExtras = {},
  controller?: FieldController,
  gridResolver?: GridResolver
): ItemProxy {
  const item: ItemProxy = {
    name: paramName,
    getValue: () => form.getValues(paramName),
    setValue: (value: unknown) => form.setValue(paramName, value, { shouldDirty: true, shouldValidate: true }),
  };
  if (extras.rowNum !== undefined) item.rowNum = extras.rowNum;
  if (extras.columnName !== undefined) item.columnName = extras.columnName;
  if (controller) {
    assignLiveItemMethods(item, form, paramName, controller);
    assignDeferred(item, "item", DEFERRED_ITEM_METHODS_WITH_CONTROLLER);
  } else {
    assignDeferred(item, "item", DEFERRED_ITEM_METHODS);
  }
  assignItemCanvas(item, paramName, gridResolver);
  return item;
}

/**
 * Builds the `form` proxy backed by react-hook-form. With a `controller` the
 * structural / visibility methods (`getItem` items become mutable too,
 * `hideItem`, `getField` / `getFields`, `addField` / `removeField`,
 * `focusInItem`, `markForRedraw`, `values`) become live; otherwise they defer.
 */
export function createFormProxy(
  form: FormHandle,
  parameters: ParametersMap | undefined,
  controller?: FieldController,
  gridResolver?: GridResolver
): FormProxy {
  const formProxy: FormProxy = {
    getItem: (name: string) => createItemProxy(form, resolveFormKey(name, parameters), {}, controller, gridResolver),
    getValues: () => form.getValues(),
    redraw: () => {
      // No-op: react-hook-form re-renders reactively on value changes.
    },
  };
  if (controller) {
    assignLiveFormMethods(formProxy, form, parameters, controller, gridResolver);
    assignDeferred(formProxy, "form", DEFERRED_FORM_METHODS_WITH_CONTROLLER);
  } else {
    assignDeferred(formProxy, "form", DEFERRED_FORM_METHODS);
  }
  return formProxy;
}

/**
 * Re-points the read-only accessors and assigns the live mutation/data methods,
 * each delegating to the injected controller so the proxy reflects the modal's
 * current grid state. One statement per method keeps the complexity flat.
 */
function assignLiveGridMethods(grid: GridProxy, controller: GridController): void {
  grid.getData = () => ({ getLength: () => controller.getRows().length });
  grid.getSelectedRecords = () => controller.getSelectedRecords();
  grid.getRecord = (index) => controller.getRecord(index);
  grid.getRecordIndex = (record) => controller.getRecordIndex(record);
  grid.getEditedRecord = (index) => controller.getEditedRecord(index);
  grid.getTotalRows = () => controller.getTotalRows();
  grid.selectRecord = (index) => controller.selectRecord(index);
  grid.deselectRecord = (index) => controller.deselectRecord(index);
  grid.selectSingleRecord = (record) => controller.selectSingleRecord(record);
  grid.deselectAllRecords = () => controller.deselectAllRecords();
  grid.userSelectAllRecords = () => controller.userSelectAllRecords();
  grid.setEditValue = (rowIndex, colName, value) => controller.setEditValue(rowIndex, colName, value);
  grid.getEditValues = (rowIndex) => controller.getEditValues(rowIndex);
  grid.getEditedCell = (rowIndex, colName) => controller.getEditedCell(rowIndex, colName);
  grid.invalidateCache = () => controller.invalidateCache();
  grid.fetchData = (criteria) => controller.fetchData(criteria);
  grid.getCriteria = () => controller.getCriteria();
  grid.addSelectedIDsToCriteria = (criteria, preserveSelected) =>
    controller.addSelectedIDsToCriteria(criteria, preserveSelected);
  grid.getFieldByColumnName = (colName) => controller.getFieldByColumnName(colName);
  grid.setRowActions = (renderer) => controller.setRowActions(renderer);
  grid.setRecordComponent = (renderer) => controller.setRowActions(renderer);
  Object.defineProperty(grid, "data", {
    get: () => {
      const rows = controller.getRows();
      return { localData: rows, allRows: rows, totalRows: controller.getTotalRows() };
    },
    enumerable: true,
    configurable: true,
  });
}

/** Defines a chained callback property (`grid.dataArrived = fn`) routed to the controller. */
function defineGridCallbackProp(
  grid: GridProxy,
  name: string,
  register: (fn: (rows: EntityData[]) => void) => void
): void {
  let last: ((rows: EntityData[]) => void) | undefined;
  Object.defineProperty(grid, name, {
    get: () => last,
    set: (fn) => {
      last = fn;
      if (typeof fn === "function") register(fn);
    },
    enumerable: true,
    configurable: true,
  });
}

/** Wires the classic lifecycle callback properties to the controller's subscriber sinks. */
function assignGridCallbacks(grid: GridProxy, controller: GridController): void {
  defineGridCallbackProp(grid, GRID_CALLBACK_PROPS[0], controller.onDataArrived);
  defineGridCallbackProp(grid, GRID_CALLBACK_PROPS[1], controller.onSelectionChanged);
}

/**
 * Builds the `grid` proxy. Without a controller it is read-only over the given
 * `state` (the plain `onGridLoad` snapshot and unit tests), and every mutation
 * method defers. With a `GridController` the full surface becomes live, served
 * from the modal's current grid state, and the lifecycle callbacks are wired.
 */
export function createGridProxy(state: GridState, controller?: GridController): GridProxy {
  const gridProxy: GridProxy = {
    getData: () => ({ getLength: () => state.rows.length }),
    getSelectedRecords: () => state.selectedRecords,
    getRecord: (index: number) => state.rows[index],
    getRecordIndex: (record: EntityData) => state.rows.findIndex((row) => row.id === record?.id),
    data: { localData: state.rows, allRows: state.rows, totalRows: state.rows.length },
  };
  if (controller) {
    assignLiveGridMethods(gridProxy, controller);
    assignGridCallbacks(gridProxy, controller);
    assignDeferred(gridProxy, "grid", DEFERRED_GRID_METHODS_WITH_CONTROLLER);
  } else {
    assignDeferred(gridProxy, "grid", DEFERRED_GRID_METHODS);
  }
  return gridProxy;
}

/** Read-only environment data and the always-live context accessors. */
function assignViewData(view: ViewProxy, form: FormHandle, data: ViewData): void {
  view.windowId = data.windowId;
  view.callerField = data.callerField;
  view.parentWindow = data.parentWindow;
  view.sourceView = data.sourceView;
  view.activeView = { tabId: data.activeTabId };
  // Context map = parent record fields overlaid with the current parameter values.
  view.getContextInfo = () => ({ ...(data.parentRecord ?? {}), ...(form.getValues() as Record<string, unknown>) });
  // Best-effort: only the current view is reachable from the modal. A matching
  // tabId returns this view; any other id returns a minimal read-only handle.
  view.getView = (tabId?: string) => (tabId === undefined || tabId === data.activeTabId ? view : { tabId });
}

/** Lifecycle action methods, each delegating to the injected controller. */
function assignViewActions(view: ViewProxy, controller: ViewController): void {
  view.refresh = (force, keepEditedValues) => controller.refresh(force, keepEditedValues);
  view.fireOnPause = (id, fn, delay) => controller.fireOnPause(id, fn, delay);
  view.handleReadOnlyLogic = () => controller.handleReadOnlyLogic();
  view.handleButtonsStatus = () => controller.handleButtonsStatus();
  view.selectAllRecords = () => controller.selectAllRecords();
  view.getSelection = () => controller.getSelection();
}

/** Footer chrome handles (`popupButtons` / `cancelButton` / the close `X`). */
function assignFooterChrome(view: ViewProxy, controller: ViewController): void {
  view.popupButtons = { members: controller.getFooterButtons() };
  view.cancelButton = {
    hide: () => controller.setCancelHidden(true),
    show: () => controller.setCancelHidden(false),
  };
  view.parentElement = {
    parentElement: {
      closeButton: {
        hide: () => controller.setCloseHidden(true),
        show: () => controller.setCloseHidden(false),
      },
    },
  };
}

/**
 * Builds the canonical `view` proxy shared by every migrated hook. `viewGrid` is
 * set for grid-typed parameters. Read-only data and `getContextInfo` / `getView`
 * are always present; the lifecycle actions and footer chrome become live only
 * when a `ViewController` is injected, and stay deferred (throwing stubs)
 * otherwise. `openProcess` is always deferred (owned by the nested-modal step).
 *
 * `hookData` carries the plain data fields the onLoad / onProcess scripts read
 * directly off their second argument (`selectedRecords`, `recordIds`, …). It is
 * spread first so the canonical `view` surface always takes precedence over any
 * stray key, keeping "the second argument is the view" uniform across hooks.
 */
export function createViewProxy(
  form: FormHandle,
  parameters: ParametersMap | undefined,
  deps: {
    messageBar: MessageBarHandle;
    grid?: GridProxy;
    controller?: FieldController;
    viewController?: ViewController;
    gridResolver?: GridResolver;
    data?: ViewData;
    hookData?: Record<string, unknown>;
  }
): ViewProxy {
  const view = {
    ...(deps.hookData ?? {}),
    theForm: createFormProxy(form, parameters, deps.controller, deps.gridResolver),
    messageBar: deps.messageBar,
  } as ViewProxy;
  if (deps.grid) view.viewGrid = deps.grid;

  assignViewData(view, form, deps.data ?? {});

  if (deps.viewController) {
    assignViewActions(view, deps.viewController);
    assignFooterChrome(view, deps.viewController);
    assignDeferred(view, "view", NESTED_VIEW_METHODS);
  } else {
    assignDeferred(view, "view", DEFERRED_VIEW_METHODS);
  }
  return view;
}
