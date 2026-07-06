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
import { isNumericReference } from "@/utils/form/constants";
import { updateSelectorValue } from "@/utils/form/selectors/utils";
import { openParameterDialog } from "./parameterDialogStore";
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
  /** Reads the current visibility of a parameter (backs `item.isVisible()`). */
  isDisplayed: (name: string) => boolean;
  setTitle: (name: string, title: string) => void;
  setValueMap: (name: string, map: unknown) => void;
  getValueMap: (name: string) => ListOption[];
  addField: (field: DynamicParameter) => void;
  removeField: (target: number | string) => void;
  focusField: (name: string) => void;
}

/**
 * Client-side action a migrated script assigns to a footer button via
 * `button.action = fn` (Classic SmartClient parity). When assigned, pressing the
 * button runs this closure instead of the standard Pick&Execute submit.
 */
export type FooterButtonAction = () => void;

/** A footer button handle reachable through `view.popupButtons.members`. */
export interface FooterButtonHandle extends Record<string, unknown> {
  _buttonValue: string;
  title: string;
  hide: () => void;
  show: () => void;
  setDisabled: (disabled?: boolean) => void;
  /**
   * Overrides the button's client-side action (Classic `button.action = fn`).
   * Assigning a function makes pressing the button run it instead of submitting
   * to the process's own Java handler; leaving it unset keeps the standard submit.
   */
  action?: FooterButtonAction;
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
  /** Current enabled state of the execute/OK button (backs `view.okButton.isEnabled()`). */
  isOkButtonEnabled: () => boolean;
  /** Forces the execute/OK button enabled (backs `view.okButton.enable()`). */
  enableOkButton: () => void;
  /** Launches a nested process modal layered on top of the current one. */
  openProcess: (params: OpenProcessParams) => void;
}

/** Execute/OK button handle reached through `view.okButton` (classic SmartClient surface). */
export interface OkButtonHandle {
  isEnabled: () => boolean;
  enable: () => void;
}

/**
 * Parameters accepted by `view.openProcess` / `view.standardWindow.openProcess`,
 * matching the classic launch shape. Only `processId` is required; the rest are
 * captured so the nested-modal context can be enriched later without changing
 * this script-facing surface.
 */
export interface OpenProcessParams {
  processId: string;
  windowId?: string;
  windowTitle?: string;
  externalParams?: Record<string, unknown>;
  callerField?: CallerField;
  paramWindow?: unknown;
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
  // Classic callers pass either a row index or a record, and either a column name or a field object.
  getEditedCell: (row: number | EntityData, col: string | Record<string, unknown>) => unknown;
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
  /** Per-cell edit callback (classic `realPaymentOnChange` family); fired on every cell edit. */
  onRecordChange: (fn: (record: EntityData, changes: Record<string, unknown>) => void) => void;
  /** Per-toggle selection delta (classic `selectionChanged(record, state)` shape). */
  onSelectionToggle: (fn: (record: EntityData, state: boolean) => void) => void;
  // Per-column field hooks (classic AD_FIELD `ONCHANGEFUNCTION` / `EM_OBUIAPP_VALIDATOR`)
  setColumnOnChange: (colName: string, fn: ColumnOnChange) => void;
  setColumnValidator: (colName: string, fn: ColumnValidator) => void;
}

/** Classic per-grid-column onChange (`AD_FIELD.ONCHANGEFUNCTION`): `fn(item, view, form, grid)`. */
export type ColumnOnChange = (item: ItemProxy, view: ViewProxy, form: FormProxy, grid: GridProxy) => void;
/** Classic per-grid-column validator (`AD_FIELD.EM_OBUIAPP_VALIDATOR`): returns `false` to reject. */
export type ColumnValidator = (item: ItemProxy, validator: unknown, value: unknown, record: EntityData) => boolean;

/** Resolves the live `GridController` for a parameter name (undefined when none). */
export type GridResolver = (paramName: string) => GridController | undefined;

/** Identity of the field/button that launched the process (`view.callerField`). */
export interface CallerField extends Record<string, unknown> {
  id?: string;
  name?: string;
  columnId?: string;
  record?: EntityData;
  /** The launcher's view, so a nested script can reach `view.callerField.view`. */
  view?: unknown;
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
  /**
   * Selects an existing option of a selector, setting its value and displayed
   * label together. Live only when a `FieldController` is injected. New-UI
   * equivalent of classic `setValueProgrammatically`; see `assignLiveItemMethods`.
   */
  setValueProgrammatically?: (value: unknown) => void;
  /**
   * Reads the item's current visibility (Classic `item.isVisible()`). Live only
   * when a `FieldController` is injected; reflects the same display state the
   * rendered field uses. Returns a strict boolean so scripts that forward it to a
   * server payload never serialize `undefined` (which `JSON.stringify` drops).
   */
  isVisible?: () => boolean;
  /** Reads the first option value of the selector's current value map; live with a controller. */
  getFirstOptionValue?: () => unknown;
  /**
   * Relabels the field at runtime (Classic `item.title = …`, from handlers such as
   * `AddPaymentReloadLabelsActionHandler`). Live only when a `FieldController` is injected.
   */
  setTitle?: (title: string) => void;
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
  getEditedCell?: (row: number | EntityData, col: string | Record<string, unknown>) => unknown;
  invalidateCache?: () => void;
  fetchData?: (criteria?: unknown) => void;
  getCriteria?: () => unknown;
  addSelectedIDsToCriteria?: (criteria: unknown, preserveSelected?: boolean) => unknown;
  getFieldByColumnName?: (colName: string) => unknown;
  /** Registers a per-row renderer; `setRecordComponent` is a classic-vocabulary alias. */
  setRowActions?: (renderer: RowActionRenderer) => void;
  setRecordComponent?: (renderer: RowActionRenderer) => void;
  /** Registers a per-cell edit subscriber; live only when a `GridController` backs the proxy. */
  onRecordChange?: (fn: (record: EntityData, changes: Record<string, unknown>) => void) => void;
  /** Registers a per-toggle selection-delta subscriber; live only with a controller. */
  onSelectionToggle?: (fn: (record: EntityData, state: boolean) => void) => void;
  /** Registers a per-column onChange / validator (classic AD_FIELD hooks); live with a controller. */
  setColumnOnChange?: (colName: string, fn: ColumnOnChange) => void;
  setColumnValidator?: (colName: string, fn: ColumnValidator) => void;
  /** Grid-relative debounce (classic `this.fireOnPause` on the grid); delegates to the view. */
  fireOnPause?: (id: string, fn: () => void, delay: number) => void;
  /** Grid-parameter visibility; live only when visibility hooks are supplied. */
  show?: () => void;
  hide?: () => void;
}

/**
 * Show/hide hooks for a grid parameter. The classic
 * `canvas.viewGrid.show()/hide()` toggles the grid widget; in the new UI a grid is
 * a parameter, so this delegates to the field-display store (the same one backing
 * `item.show()/hide()`), where the script wins over static display logic.
 */
export interface GridVisibility {
  show: () => void;
  hide: () => void;
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
  /** Execute/OK button handle (live only with a controller). */
  okButton?: OkButtonHandle;
  cancelButton?: { hide: () => void; show: () => void };
  parentElement?: { parentElement: { closeButton: { hide: () => void; show: () => void } } };
  /** Nested-process launch (live only with a controller); `standardWindow` is the classic alias. */
  openProcess?: (params: OpenProcessParams) => void;
  standardWindow?: { openProcess: (params: OpenProcessParams) => void };
  /**
   * Reproduction of Classic's `actionHandlerCall()`: submits the standard
   * execution payload to the process's configured Java class and resolves with
   * the server response. Live only when the executor is injected (the
   * `onProcess` path); deferred (throwing) otherwise.
   */
  executeProcess?: (actionValue?: string) => Promise<unknown>;
  /**
   * Opens an action-time dynamic parameter-form dialog (classic `isc.DynamicForm`
   * inside `isc.OBPopup`); resolves with the collected values or `null` on cancel.
   * Always live (no controller dependency).
   */
  openDynamicForm?: typeof openParameterDialog;
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
  "setValueProgrammatically",
  "getFirstOptionValue",
  "setRequired",
  "setDisabled",
  "setTitle",
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
  "setTitle",
  "show",
  "hide",
  "clearValue",
  "setValueMap",
  "getValueMap",
  "setValueFromRecord",
  "setValueProgrammatically",
  "getFirstOptionValue",
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

/** Method name for the nested-process launch; shared across the proxy wiring. */
const OPEN_PROCESS = "openProcess";

/** `view.executeProcess()` stays deferred unless its executor is injected. */
const EXECUTE_PROCESS_METHOD = ["executeProcess"] as const;

/** Full deferred set used when no controller is present (`getContextInfo` is always live). */
const DEFERRED_VIEW_METHODS = [...LIVE_VIEW_METHODS, OPEN_PROCESS] as const;

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
  "onRecordChange",
  "onSelectionToggle",
  "setColumnOnChange",
  "setColumnValidator",
  "fireOnPause",
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
  "onRecordChange",
  "onSelectionToggle",
  "setColumnOnChange",
  "setColumnValidator",
  "fireOnPause",
];

/** Deferred set that remains when a controller IS present (single source of truth). */
const DEFERRED_GRID_METHODS_WITH_CONTROLLER = DEFERRED_GRID_METHODS.filter((m) => !LIVE_GRID_METHODS.includes(m));

/** Classic grid lifecycle callbacks assigned as properties (`grid.dataArrived = fn`). */
const GRID_CALLBACK_PROPS = ["dataArrived", "selectionChanged", "recordChange"] as const;

/** Grid visibility methods; deferred (throwing) unless visibility hooks are supplied. */
const GRID_VISIBILITY_METHODS = ["show", "hide"] as const;

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

/**
 * Deferred grid data methods that must be safe NO-OPS (not throwing) when no
 * controller is live yet. A process-level `onLoad` can call `grid.fetchData()` /
 * `grid.invalidateCache()` before the embedded grid registers its controller; since
 * embedded grids fetch on mount, a pre-registration call is redundant, and the
 * functional re-fetch (after a user change) runs later when the controller IS live.
 * Keeping these as no-ops prevents a spurious "not implemented yet" from aborting onLoad.
 */
const DEFERRED_GRID_NOOP_METHODS = ["fetchData", "invalidateCache"] as const;

/** Assigns no-op stubs for the given method names onto `target` (overrides any throwing stub). */
function assignDeferredNoop(target: Record<string, unknown>, methods: readonly string[]): void {
  for (const method of methods) {
    target[method] = () => undefined;
  }
}

/** Reads the id of a record for `setValueFromRecord`, mirroring classic precedence. */
function recordId(record: Record<string, unknown> | undefined): unknown {
  if (!record) return "";
  return record.id ?? record.value ?? "";
}

// ---------------------------------------------------------------------------
// Selector value-map bridge
//
// Classic scripts drive a selector with `setValue(id)` + `setValueMap(map)`. The
// new-UI selectors read none of that directly: they watch the form keys
// `${field}$_entries` (the dropdown options as `{ id, label }`) and
// `${field}$_identifier` (the label shown for the current value) — the same
// contract used by FIC callouts and the form's initial state. These helpers
// translate the classic map onto those keys so the field actually updates.
// ---------------------------------------------------------------------------

/** Form-key suffix holding the label rendered for a selector's current value. */
const IDENTIFIER_KEY_SUFFIX = "$_identifier";
/** Form-key suffix holding a selector's injected dropdown options. */
const ENTRIES_KEY_SUFFIX = "$_entries";

/** Builds a normalized selector entry from one raw classic map element, or null. */
function toSelectorEntry(raw: unknown): ListOption | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = record.id ?? record.value;
  if (id === undefined || id === null) return null;
  const label = record.label ?? record.title ?? record.text ?? id;
  const value = record.value ?? id;
  return { id: String(id), value: String(value), label: String(label) };
}

/** Normalizes an array-shaped classic value map into selector entries. */
function normalizeEntryArray(map: unknown[]): ListOption[] {
  const entries: ListOption[] = [];
  for (const raw of map) {
    const entry = toSelectorEntry(raw);
    if (entry) entries.push(entry);
  }
  return entries;
}

/** Normalizes an `id → label` object map into selector entries. */
function normalizeEntryObject(map: Record<string, unknown>): ListOption[] {
  const entries: ListOption[] = [];
  for (const [id, label] of Object.entries(map)) {
    entries.push({ id, value: id, label: String(label) });
  }
  return entries;
}

/**
 * Normalizes a classic value map into the selector entry shape the new UI reads.
 * Accepts an array of `{ id?, value?, label?/title?/text? }` elements or a plain
 * `id → label` object; elements without a resolvable id are dropped.
 */
export function normalizeValueMapEntries(map: unknown): ListOption[] {
  if (Array.isArray(map)) return normalizeEntryArray(map);
  if (map && typeof map === "object") return normalizeEntryObject(map as Record<string, unknown>);
  return [];
}

/** Reads a selector's injected entries from the form, or `[]` when none are set. */
function readEntries(form: FormHandle, name: string): ListOption[] {
  const stored = form.getValues(`${name}${ENTRIES_KEY_SUFFIX}`);
  return Array.isArray(stored) ? (stored as ListOption[]) : [];
}

/**
 * Writes `${name}$_identifier` so the selector renders the label of `value`,
 * looking it up in `entries`. No-op when no entry matches (e.g. plain text
 * fields), so it is safe to call from every `setValue`.
 */
function syncSelectorIdentifier(form: FormHandle, name: string, value: unknown, entries: ListOption[]): void {
  const match = entries.find((entry) => entry.id === value || entry.value === value);
  if (!match) return;
  form.setValue(`${name}${IDENTIFIER_KEY_SUFFIX}`, match.label, { shouldDirty: true, shouldValidate: true });
}

/** Sets a form value and keeps the selector's displayed label in sync. */
function applyValue(form: FormHandle, name: string, value: unknown): void {
  form.setValue(name, value, { shouldDirty: true, shouldValidate: true });
  syncSelectorIdentifier(form, name, value, readEntries(form, name));
}

/**
 * Refreshes the label shown for the selector's current value from a classic
 * value map. It deliberately does NOT inject the map as `$_entries`: doing so
 * would replace the datasource-driven option list, so the dropdown would only
 * offer the scripted entries. `addCurrentValueIfMissing` already surfaces the
 * current value while the datasource loads lazily, so the full option list is
 * preserved. Still forwards the raw map to the controller so list-reference
 * selectors (which read `refList`) keep working.
 */
function applyValueMap(form: FormHandle, name: string, map: unknown, controller: FieldController): void {
  const entries = normalizeValueMapEntries(map);
  syncSelectorIdentifier(form, name, form.getValues(name), entries);
  controller.setValueMap(name, map);
}

/** Returns the selector's injected entries, falling back to the controller's value map. */
function readValueMap(form: FormHandle, name: string, controller: FieldController): ListOption[] {
  const entries = readEntries(form, name);
  if (entries.length > 0) return entries;
  return controller.getValueMap(name);
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
  item.setTitle = (title: string) => controller.setTitle(paramName, title);
  item.show = () => controller.setDisplayed(paramName, true);
  item.hide = () => controller.setDisplayed(paramName, false);
  item.isVisible = () => controller.isDisplayed(paramName);
  item.setValueMap = (map: unknown) => applyValueMap(form, paramName, map, controller);
  item.getValueMap = () => readValueMap(form, paramName, controller);
  item.clearValue = () => form.setValue(paramName, null, { shouldDirty: true, shouldValidate: true });
  item.setValueFromRecord = (record: Record<string, unknown> | undefined) =>
    updateSelectorValue(form.setValue as unknown as UseFormSetValue<FieldValues>, paramName, recordId(record), record);
  // Classic `setValueProgrammatically` selects an existing option (value + label).
  // The new UI has no user `onChange` to suppress on the migrated-hook path, so
  // this maps to the same value+identifier set as `setValue`.
  item.setValueProgrammatically = (value: unknown) => applyValue(form, paramName, value);
  item.getFirstOptionValue = () => readValueMap(form, paramName, controller)[0]?.value;
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
      createItemProxy(form, parameter.name, {}, controller, gridResolver, parameter)
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
 * Finds the parameter a classic item name refers to. Migrated scripts address
 * items by `name`, by raw `dBColumnName`, or by the `parameters` map key (which
 * is the `dBColumnName`); all three are checked. Returns `undefined` when no
 * parameter matches.
 */
export function findParameter(name: string, parameters: ParametersMap | undefined): ProcessParameter | undefined {
  if (!parameters) return undefined;
  const byKey = parameters[name];
  if (byKey) return byKey;
  for (const parameter of Object.values(parameters)) {
    if (parameter.name === name || parameter.dBColumnName === name) return parameter;
  }
  return undefined;
}

/**
 * Resolves the react-hook-form key for a classic item name. The form is keyed by
 * `parameter.name`, so any addressing form (name / `dBColumnName` / map key) maps
 * back to its name. Falls back to the requested name when no parameter matches.
 */
export function resolveFormKey(name: string, parameters: ParametersMap | undefined): string {
  return findParameter(name, parameters)?.name ?? name;
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
function assignItemCanvas(
  item: ItemProxy,
  paramName: string,
  gridResolver?: GridResolver,
  controller?: FieldController
): void {
  if (!gridResolver) {
    Object.defineProperty(item, "canvas", {
      get: () => notImplemented("item.canvas"),
      enumerable: true,
      configurable: true,
    });
    return;
  }
  const visibility = controller ? buildGridVisibility(controller, paramName) : undefined;
  item.canvas = {
    viewGrid: createGridProxy(EMPTY_GRID_STATE, gridResolver(paramName), visibility),
    markForRedraw: () => {
      // No-op: the grid re-renders reactively from the modal's state.
    },
  };
}

/**
 * Coerces a numeric parameter's raw form value to a Number, mirroring classic
 * SmartClient (an Integer/Number item returns a number from `getValue()`).
 * Non-numeric parameters, empty strings, `null` and already-numeric values are
 * returned unchanged, so truthiness checks (`allSet`) keep their classic meaning.
 */
function coerceParamValue(raw: unknown, parameter?: ProcessParameter): unknown {
  if (!parameter || !isNumericReference(parameter.reference)) return raw;
  if (typeof raw !== "string" || raw.trim() === "") return raw;
  const asNumber = Number(raw);
  if (Number.isNaN(asNumber)) return raw;
  return asNumber;
}

export function createItemProxy(
  form: FormHandle,
  paramName: string,
  extras: ItemProxyExtras = {},
  controller?: FieldController,
  gridResolver?: GridResolver,
  parameter?: ProcessParameter
): ItemProxy {
  const item: ItemProxy = {
    name: paramName,
    getValue: () => coerceParamValue(form.getValues(paramName), parameter),
    setValue: (value: unknown) => applyValue(form, paramName, value),
  };
  if (extras.rowNum !== undefined) item.rowNum = extras.rowNum;
  if (extras.columnName !== undefined) item.columnName = extras.columnName;
  if (controller) {
    assignLiveItemMethods(item, form, paramName, controller);
    assignDeferred(item, "item", DEFERRED_ITEM_METHODS_WITH_CONTROLLER);
  } else {
    assignDeferred(item, "item", DEFERRED_ITEM_METHODS);
  }
  assignItemCanvas(item, paramName, gridResolver, controller);
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
    getItem: (name: string) => {
      const parameter = findParameter(name, parameters);
      const key = parameter?.name ?? name;
      return createItemProxy(form, key, {}, controller, gridResolver, parameter);
    },
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
  grid.onRecordChange = (fn) => controller.onRecordChange(fn);
  grid.onSelectionToggle = (fn) => controller.onSelectionToggle(fn);
  grid.setColumnOnChange = (colName, fn) => controller.setColumnOnChange(colName, fn);
  grid.setColumnValidator = (colName, fn) => controller.setColumnValidator(colName, fn);
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
  register: (fn: (...args: never[]) => void) => void
): void {
  let last: ((...args: never[]) => void) | undefined;
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
  defineGridCallbackProp(
    grid,
    GRID_CALLBACK_PROPS[0],
    controller.onDataArrived as (fn: (...args: never[]) => void) => void
  );
  defineGridCallbackProp(
    grid,
    GRID_CALLBACK_PROPS[1],
    controller.onSelectionChanged as (fn: (...args: never[]) => void) => void
  );
  defineGridCallbackProp(
    grid,
    GRID_CALLBACK_PROPS[2],
    controller.onRecordChange as (fn: (...args: never[]) => void) => void
  );
}

/**
 * Builds the grid visibility hooks for a grid parameter, delegating to the field
 * controller's display store (so `canvas.viewGrid.hide()` hides the grid parameter,
 * mirroring the classic widget hide). Reuses the same `setDisplayed` path as
 * `item.show()/hide()`.
 */
export function buildGridVisibility(controller: FieldController, paramName: string): GridVisibility {
  return {
    show: () => controller.setDisplayed(paramName, true),
    hide: () => controller.setDisplayed(paramName, false),
  };
}

/**
 * Assigns the grid-relative `fireOnPause` (classic `this.fireOnPause` where `this`
 * is the grid). It delegates to the view's debouncer, read lazily from `grid.view`
 * (set by `WindowReferenceGrid` after the proxy is built), so the single shared
 * timer map and its cleanup are reused. Falls back to running immediately when no
 * debouncer is wired.
 */
function assignGridFireOnPause(grid: GridProxy): void {
  grid.fireOnPause = (id, fn, delay) => {
    const view = grid.view as ViewProxy | undefined;
    if (view?.fireOnPause) {
      view.fireOnPause(id, fn, delay);
    } else {
      fn();
    }
  };
}

/** Assigns `grid.show`/`hide` from the visibility hooks, or throwing stubs when absent. */
function assignGridVisibility(grid: GridProxy, visibility?: GridVisibility): void {
  if (!visibility) {
    assignDeferred(grid, "grid", GRID_VISIBILITY_METHODS);
    return;
  }
  grid.show = visibility.show;
  grid.hide = visibility.hide;
}

/**
 * Builds the `grid` proxy. Without a controller it is read-only over the given
 * `state` (the plain `onGridLoad` snapshot and unit tests), and every mutation
 * method defers. With a `GridController` the full surface becomes live, served
 * from the modal's current grid state, and the lifecycle callbacks are wired.
 * `visibility`, when supplied, makes `show()`/`hide()` toggle the grid parameter.
 */
export function createGridProxy(state: GridState, controller?: GridController, visibility?: GridVisibility): GridProxy {
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
    assignGridFireOnPause(gridProxy);
  } else {
    assignDeferred(gridProxy, "grid", DEFERRED_GRID_METHODS);
    // Pre-registration fetch/invalidate are redundant (the grid fetches on mount),
    // so make them safe no-ops instead of throwing — see DEFERRED_GRID_NOOP_METHODS.
    assignDeferredNoop(gridProxy, DEFERRED_GRID_NOOP_METHODS);
  }
  assignGridVisibility(gridProxy, visibility);
  return gridProxy;
}

/**
 * Builds the classic `view.parentWindow.view` handle a migrated script reaches through the
 * SmartClient idiom `view.parentWindow.view.getContextInfo()`. The new UI keeps a single `view`,
 * so the parent handle aliases the same context accessors. The original `parentWindow` data (the
 * Tab) is preserved so scripts reading tab fields off `parentWindow` keep working.
 */
function buildParentWindow(
  parentWindow: unknown,
  parentView: Pick<ViewProxy, "getContextInfo" | "getView">
): Record<string, unknown> {
  const accessors = { getContextInfo: parentView.getContextInfo, getView: parentView.getView };
  // Classic two-tier fallback `parentWindow.activeView[.parentView].getContextInfo(...)`. The new UI
  // keeps a single context, so activeView and its parentView alias the same accessors.
  const activeView = { ...accessors, parentView: { ...accessors } };
  const base = parentWindow && typeof parentWindow === "object" ? (parentWindow as Record<string, unknown>) : {};
  return { ...base, view: accessors, activeView };
}

/** Read-only environment data and the always-live context accessors. */
function assignViewData(view: ViewProxy, form: FormHandle, data: ViewData): void {
  view.windowId = data.windowId;
  view.callerField = data.callerField;
  view.sourceView = data.sourceView;
  view.activeView = { tabId: data.activeTabId };
  // Context map = the launching tab id (so classic `contextInfo.inpTabId` resolves), overlaid with
  // the parent record fields and the current parameter values (real values win over the default).
  view.getContextInfo = () => ({
    inpTabId: data.activeTabId,
    ...(data.parentRecord ?? {}),
    ...(form.getValues() as Record<string, unknown>),
  });
  // Best-effort: only the current view is reachable from the modal. A matching
  // tabId returns this view; any other id returns a minimal read-only handle.
  view.getView = (tabId?: string) => (tabId === undefined || tabId === data.activeTabId ? view : { tabId });
  // Classic `view.parentWindow.view.getContextInfo()` idiom (built after the accessors above).
  view.parentWindow = buildParentWindow(data.parentWindow, view);
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

/** Nested-process launch plus the classic `standardWindow.openProcess` alias. */
function assignNestedViewActions(view: ViewProxy, controller: ViewController): void {
  view.openProcess = (params) => controller.openProcess(params);
  view.standardWindow = { openProcess: (params) => controller.openProcess(params) };
}

/**
 * Assigns `view.okButton`. With a controller the handle reads/forces the live
 * execute-button state; without one its methods defer (throwing a traceable
 * error), matching the rest of the view's controller-gated surface.
 */
function assignOkButton(view: ViewProxy, controller?: ViewController): void {
  if (!controller) {
    view.okButton = {
      isEnabled: () => notImplemented("view.okButton.isEnabled"),
      enable: () => notImplemented("view.okButton.enable"),
    };
    return;
  }
  view.okButton = {
    isEnabled: () => controller.isOkButtonEnabled(),
    enable: () => controller.enableOkButton(),
  };
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
 * otherwise. `openProcess` (and its `standardWindow` alias) is live with a
 * controller and deferred without one.
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
    /** Executor for `view.executeProcess()` (the `actionHandlerCall()` reproduction). */
    executeProcess?: (actionValue?: string) => Promise<unknown>;
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
    assignNestedViewActions(view, deps.viewController);
  } else {
    assignDeferred(view, "view", DEFERRED_VIEW_METHODS);
  }
  assignOkButton(view, deps.viewController);

  if (deps.executeProcess) {
    view.executeProcess = deps.executeProcess;
  } else {
    assignDeferred(view, "view", EXECUTE_PROCESS_METHOD);
  }
  // Always-live (no controller dependency): opens an action-time dynamic parameter form.
  view.openDynamicForm = openParameterDialog;
  return view;
}
