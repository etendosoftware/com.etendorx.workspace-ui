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

import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityData, ListOption, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { createOBShim } from "@/utils/ob/obShim";
import type { OBShim } from "@/utils/ob/types";
import { dispatchBuiltinAction } from "@/utils/processes/definition/actionDispatcherStore";
import { dialogScriptApi, type DialogScriptApi } from "@/utils/processes/definition/dialogs";
import { messageBar } from "@/utils/processes/definition/messageBarStore";
import type { MessageBarHandle } from "@/utils/processes/definition/scriptProxies";

/**
 * Auth credentials required to build the process context.
 */
export interface ProcessContextCredentials {
  token: string;
  getCsrfToken: () => string;
  /** Raw label resolver (e.g. `useLanguage().getLabel`) for `OB.I18N.getLabel`. */
  getLabel?: (key: string) => string;
  /** Current UI language code, for `OB.Format.*` locale-derived defaults. */
  language?: string | null;
}

/**
 * Generic response wrapper returned by all process context helpers.
 */
export interface ProcessContextResponse<T = unknown> {
  data: T;
}

/**
 * Options for callAction helper.
 */
export interface CallActionOptions {
  /** Additional query params appended to the kernel URL */
  queryParams?: Record<string, string>;
}

/**
 * Options for callDatasource helper.
 */
export interface CallDatasourceOptions {
  /** Additional query params (e.g. _startRow, _endRow, criteria) */
  queryParams?: Record<string, string>;
}

/**
 * Options for callServlet helper.
 */
export interface CallServletOptions {
  /** HTTP method – defaults to "POST" */
  method?: "GET" | "POST";
  /** Extra headers to merge with auth headers */
  headers?: Record<string, string>;
  /** Extra query params */
  queryParams?: Record<string, string>;
}

/**
 * The fully-typed context object injected into AD JS functions
 * (onLoad / onProcess) via executeStringFunction context argument.
 *
 * All helpers automatically attach Bearer token and CSRF Token headers.
 */
export interface ProcessScriptContext {
  /**
   * Call an Etendo Action Handler class.
   *
   * @example
   * await callAction('org.openbravo.warehouse.pickinglist.AssignActionHandler', { action: 'getemployees' })
   */
  callAction: <T = unknown>(
    actionHandler: string,
    payload: Record<string, unknown>,
    options?: CallActionOptions
  ) => Promise<ProcessContextResponse<T>>;

  /**
   * Query an Etendo datasource endpoint.
   *
   * @example
   * await callDatasource('OBWPL_PickingList', { queryParams: { _where: "status='pending'" } })
   */
  callDatasource: <T = unknown>(
    entityName: string,
    payload?: Record<string, unknown>,
    options?: CallDatasourceOptions
  ) => Promise<ProcessContextResponse<T>>;

  /**
   * Call an arbitrary ERP servlet URL.
   * Use this for endpoints not covered by callAction / callDatasource.
   *
   * @example
   * await callServlet('/org.openbravo.service.json.JsonToXmlConverter', { key: 'value' })
   */
  callServlet: <T = unknown>(
    path: string,
    payload?: Record<string, unknown>,
    options?: CallServletOptions
  ) => Promise<ProcessContextResponse<T>>;

  /**
   * The `OB.*` compatibility shim (translations, formatting, action registry,
   * property store, …). A single instance per modal so action registration and
   * module-namespace writes persist across onLoad / onProcess / onChange / onRefresh.
   */
  OB: OBShim;

  /**
   * Promise-based modal dialogs (`confirm` / `warn` / `say`) plus the `isc`
   * namespace shim, for migrated scripts that gate flow on a user decision.
   * `confirm` resolves to `true` (OK) / `false` (Cancel); the classic callback
   * shape is also honoured. See {@link DialogScriptApi}.
   */
  confirm: DialogScriptApi["confirm"];
  warn: DialogScriptApi["warn"];
  say: DialogScriptApi["say"];
  isc: DialogScriptApi["isc"];

  /**
   * In-modal sticky message banner. `messageBar.setMessage(severity, title, text,
   * actions?)` shows one banner at a time (sanitized HTML body); `.hide()` clears
   * it. The same handle is exposed as `view.messageBar` inside the parameter/grid
   * proxies, so process-level hooks (which have no `view`) use `messageBar.*`.
   */
  messageBar: MessageBarHandle;
}

/**
 * Builds the injectable process script context with authenticated HTTP helpers.
 *
 * Designed to be passed as `context` to `executeStringFunction`, allowing
 * AD JS (onLoad / onProcess) to call ERP endpoints without managing
 * authentication headers manually.
 *
 * @example
 * const ctx = buildProcessScriptContext({ token, getCsrfToken });
 * await executeStringFunction(onLoad, { Metadata, ...ctx }, processDefinition, args);
 */
export function buildProcessScriptContext(credentials: ProcessContextCredentials): ProcessScriptContext {
  const { token, getCsrfToken, getLabel, language } = credentials;

  const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json;charset=UTF-8",
    Authorization: `Bearer ${token}`,
    "X-CSRF-Token": getCsrfToken(),
  });

  const handleResponse = async <T>(response: Response): Promise<ProcessContextResponse<T>> => {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Request failed");
      throw new Error(errorText);
    }
    const data = (await response.json()) as T;
    return { data };
  };

  const buildQuery = (base: string, extra?: Record<string, string>): string => {
    if (!extra || Object.keys(extra).length === 0) return base;
    const params = new URLSearchParams(extra).toString();
    return base.includes("?") ? `${base}&${params}` : `${base}?${params}`;
  };

  const callAction = async <T = unknown>(
    actionHandler: string,
    payload: Record<string, unknown>,
    options: CallActionOptions = {}
  ): Promise<ProcessContextResponse<T>> => {
    const base = `/api/erp/org.openbravo.client.kernel?_action=${encodeURIComponent(actionHandler)}`;
    const url = buildQuery(base, options.queryParams);
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<T>(response);
  };

  const callDatasource = async <T = unknown>(
    entityName: string,
    payload: Record<string, unknown> = {},
    options: CallDatasourceOptions = {}
  ): Promise<ProcessContextResponse<T>> => {
    const base = `/api/datasource/${encodeURIComponent(entityName)}`;
    const url = buildQuery(base, options.queryParams);
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<T>(response);
  };

  const callServlet = async <T = unknown>(
    path: string,
    payload: Record<string, unknown> = {},
    options: CallServletOptions = {}
  ): Promise<ProcessContextResponse<T>> => {
    const { method = "POST", headers: extraHeaders = {}, queryParams } = options;
    const url = buildQuery(path, queryParams);
    const response = await fetch(url, {
      method,
      headers: { ...authHeaders(), ...extraHeaders },
      ...(method !== "GET" ? { body: JSON.stringify(payload) } : {}),
    });
    return handleResponse<T>(response);
  };

  // One shared OB shim per modal: the action registry and namespace writes
  // performed in one hook stay visible to the others. Built-in action types
  // dispatched via OB.Utilities.Action.executeJSON reach the modal's handlers
  // through the dispatch store (registered by the modal while it is mounted).
  // OB.RemoteCallManager.call runs through the same kernel call as callAction.
  // OB.Datasource.create runs through the api-client datasource (the same path
  // the grid and selectors use): it builds the full datasource request params
  // and resolves CSRF server-side, which the raw callDatasource proxy does not.
  const remoteCall = (handler: string, params: Record<string, unknown>) => callAction(handler, params);
  const fetchDatasource = (entity: string, payload: Record<string, unknown>) =>
    datasource.get(entity, payload) as Promise<{ data: unknown }>;
  const OB = createOBShim({ getLabel, language, dispatchBuiltinAction, remoteCall, fetchDatasource });

  return { callAction, callDatasource, callServlet, OB, ...dialogScriptApi, messageBar };
}

/** Shape of a dynamic parameter returned by an onLoad script */
export interface DynamicParameter {
  id?: string;
  name: string;
  reference: string;
  required?: boolean;
  refList?: Array<{ value: string; label: string }>;
  displayLogic?: string;
  [key: string]: unknown;
}

/** Shape of the full parameters map held in ProcessDefinitionModal state */
export type ParametersMap = Record<string, ProcessParameter>;

/**
 * Builds an updated gridSelection state from the legacy `_gridSelection`
 * mapping returned by onLoad scripts.
 *
 * @param prev     Current gridSelection state
 * @param mapping  Record<tableName, string[]> of IDs returned by onLoad
 */
export function applyGridSelection(
  prev: Record<string, { _selection: EntityData[]; _allRows: EntityData[] }>,
  mapping: Record<string, string[]>
): Record<string, { _selection: EntityData[]; _allRows: EntityData[] }> {
  const next = { ...prev };
  for (const [key, ids] of Object.entries(mapping)) {
    next[key] = {
      ...(next[key] || { _selection: [], _allRows: [] }),
      _selection: Array.isArray(ids) ? ids.map((id) => ({ id: String(id) }) as EntityData) : [],
    };
  }
  return next;
}

/**
 * Injects dynamic parameters (from `_dynamicParameters`) into the parameters map.
 * Returns the set of injected names so the caller can skip them in the value loop.
 *
 * @param dynamicParams  Array of dynamic parameter descriptors from onLoad result
 * @param newParameters  Mutable copy of the current parameters map (mutated in place)
 */
export function injectDynamicParameters(dynamicParams: DynamicParameter[], newParameters: ParametersMap): Set<string> {
  const injectedNames = new Set<string>();
  for (const dp of dynamicParams) {
    injectedNames.add(dp.name);
    newParameters[dp.name] = {
      ...dp,
      id: dp.id || dp.name,
      DBColumnName: dp.name,
      required: dp.required ?? false,
      refList: dp.refList ?? [],
    } as unknown as ProcessParameter;
  }
  return injectedNames;
}

/**
 * Filters the `refList` of an existing parameter to only include the values
 * returned by the onLoad script.
 *
 * @param param      The existing parameter (mutated in place via shallow copy)
 * @param rawValues  The raw value(s) returned from the onLoad result entry
 */
export function applyStaticParameterValues(param: ProcessParameter, rawValues: unknown): ProcessParameter {
  const newOptions = Array.isArray(rawValues) ? (rawValues as string[]) : [rawValues as string];
  const updated = { ...param };
  if (Array.isArray(updated.refList)) {
    updated.refList = updated.refList.filter((opt) => newOptions.includes(opt.value));
  }
  return updated;
}

/**
 * Sets a boolean UI flag in an immutable flag map. Short-circuits to the same
 * reference when the value is unchanged, so a no-op never triggers a re-render.
 */
export function withFlag(prev: Record<string, boolean>, key: string, value: boolean): Record<string, boolean> {
  if (prev[key] === value) return prev;
  return { ...prev, [key]: value };
}

/**
 * Footer-button visibility/enablement toggled imperatively by migrated scripts
 * (`view.popupButtons` / `view.cancelButton` / the close `X`). Keyed by the
 * action button's value; the cancel/close flags are modal-wide.
 */
export interface ScriptButtonState {
  hiddenValues: Record<string, boolean>;
  disabledValues: Record<string, boolean>;
  cancelHidden: boolean;
  closeHidden: boolean;
}

/** Stable empty reference, so the reset effect never builds a fresh object. */
export const EMPTY_SCRIPT_BUTTON_STATE: ScriptButtonState = {
  hiddenValues: {},
  disabledValues: {},
  cancelHidden: false,
  closeHidden: false,
};

/** Sets an action button's hidden flag; short-circuits on a no-op (absent = false). */
export function withButtonHidden(prev: ScriptButtonState, value: string, hidden: boolean): ScriptButtonState {
  if ((prev.hiddenValues[value] ?? false) === hidden) return prev;
  return { ...prev, hiddenValues: { ...prev.hiddenValues, [value]: hidden } };
}

/** Sets an action button's disabled flag; short-circuits on a no-op (absent = false). */
export function withButtonDisabled(prev: ScriptButtonState, value: string, disabled: boolean): ScriptButtonState {
  if ((prev.disabledValues[value] ?? false) === disabled) return prev;
  return { ...prev, disabledValues: { ...prev.disabledValues, [value]: disabled } };
}

/** Sets the cancel button's hidden flag; short-circuits on a no-op. */
export function withCancelHidden(prev: ScriptButtonState, hidden: boolean): ScriptButtonState {
  if (prev.cancelHidden === hidden) return prev;
  return { ...prev, cancelHidden: hidden };
}

/** Sets the close (`X`) button's hidden flag; short-circuits on a no-op. */
export function withCloseHidden(prev: ScriptButtonState, hidden: boolean): ScriptButtonState {
  if (prev.closeHidden === hidden) return prev;
  return { ...prev, closeHidden: hidden };
}

/** Default combinator and the id-set operator used when merging grid criteria. */
const CRITERIA_AND_OPERATOR = "and";
const CRITERIA_ID_IN_SET_OPERATOR = "inSet";
const CRITERIA_ID_FIELD = "id";

/** A SmartClient-style advanced criteria object the embedded grid scripts read/build. */
export interface GridCriteria extends Record<string, unknown> {
  operator?: string;
  criteria?: unknown[];
}

/** Returns a shallow copy of an advanced-criteria object, or an empty one when absent. */
function normalizeCriteria(criteria: unknown): GridCriteria {
  if (criteria && typeof criteria === "object") return { ...(criteria as GridCriteria) };
  return {};
}

/**
 * Merges the given record ids into an advanced-criteria object as an `id IN (…)`
 * sub-criterion, mirroring the classic grid `addSelectedIDsToCriteria`. Returns
 * the criteria unchanged when there is nothing to add (no ids or not preserving
 * the selection), so callers can pass the result straight through.
 */
export function addSelectedIDsToCriteria(
  criteria: unknown,
  selectedIds: string[],
  preserveSelected = true
): GridCriteria {
  const base = normalizeCriteria(criteria);
  if (!preserveSelected || selectedIds.length === 0) return base;
  const idCriterion = {
    fieldName: CRITERIA_ID_FIELD,
    operator: CRITERIA_ID_IN_SET_OPERATOR,
    value: selectedIds,
  };
  const existing = Array.isArray(base.criteria) ? base.criteria : [];
  return { ...base, operator: base.operator ?? CRITERIA_AND_OPERATOR, criteria: [...existing, idCriterion] };
}

/**
 * Returns the parameters map with `name`'s `mandatory` flag set. Short-circuits
 * to the same reference when the parameter is missing or already at that value.
 */
export function withMandatory(prev: ParametersMap, name: string, required: boolean): ParametersMap {
  const parameter = prev[name];
  if (!parameter || parameter.mandatory === required) return prev;
  const updated = { ...parameter };
  updated.mandatory = required;
  return { ...prev, [name]: updated };
}

/**
 * Returns the parameters map with `name`'s `refList` (dropdown options) replaced.
 * Short-circuits to the same reference when the parameter is missing.
 */
export function withRefList(prev: ParametersMap, name: string, refList: ListOption[]): ParametersMap {
  const parameter = prev[name];
  if (!parameter) return prev;
  const updated = { ...parameter };
  updated.refList = refList;
  return { ...prev, [name]: updated };
}

/** Normalizes a single classic value-map entry into a `ListOption`. */
function toListOption(entry: unknown): ListOption {
  if (typeof entry === "string") {
    return { id: entry, value: entry, label: entry };
  }
  const option = entry as Partial<ListOption>;
  const value = option.value ?? option.id ?? "";
  return { id: option.id ?? value, value, label: option.label ?? String(value) };
}

/**
 * Normalizes a classic dropdown value-map into the new-UI `ListOption[]`.
 * Accepts an array (of strings or option-like objects) or a plain `{ id: label }`
 * object; anything else (null / undefined / primitive) yields an empty list.
 */
export function normalizeValueMap(map: unknown): ListOption[] {
  if (Array.isArray(map)) {
    return map.map(toListOption);
  }
  if (map && typeof map === "object") {
    return Object.entries(map as Record<string, unknown>).map(([key, label]) => ({
      id: key,
      value: key,
      label: String(label),
    }));
  }
  return [];
}

/**
 * Returns the parameters map with a dynamically-injected parameter added,
 * reusing the same mapping as the onLoad `_dynamicParameters` contract.
 */
export function addDynamicParameter(prev: ParametersMap, field: DynamicParameter): ParametersMap {
  const next = { ...prev };
  injectDynamicParameters([field], next);
  return next;
}

/**
 * Returns the parameters map with one parameter removed. `target` may be the
 * parameter name or a numeric position (classic `removeField(index)`); an
 * out-of-range or unknown target short-circuits to the same reference.
 */
export function removeParameter(prev: ParametersMap, target: number | string): ParametersMap {
  const name = typeof target === "number" ? Object.keys(prev)[target] : target;
  if (!name || !prev[name]) return prev;
  const next = { ...prev };
  delete next[name];
  return next;
}

/** Keys from the onLoad result that are handled separately and must not be treated as parameter values */
const RESERVED_RESULT_KEYS = new Set([
  "_gridSelection",
  "autoSelectConfig",
  "_dynamicParameters",
  "_filterExpressions",
  "error",
]);

/**
 * Pure reducer that computes the next `parameters` state from an onLoad result.
 *
 * 1. Injects any `_dynamicParameters` returned by the script as real parameter entries.
 * 2. For every other key in the result (excluding reserved ones), filters the
 *    static parameter's `refList` to only include the returned values.
 * 3. Dynamic params that appear as result keys have their value set via
 *    `setFormValue` (form.setValue) rather than through refList filtering.
 *
 * @param result       The raw object returned by executeStringFunction
 * @param prev         Current parameters map
 * @param setFormValue react-hook-form's `setValue` to set dynamic param defaults
 */
export function updateParametersFromOnLoadResult(
  result: Record<string, unknown>,
  prev: ParametersMap,
  setFormValue: (name: string, value: unknown) => void
): ParametersMap {
  const newParameters = { ...prev };

  const dynamicParamNames = injectDynamicParameters(
    Array.isArray(result._dynamicParameters) ? (result._dynamicParameters as DynamicParameter[]) : [],
    newParameters
  );

  for (const [parameterName, values] of Object.entries(result)) {
    if (RESERVED_RESULT_KEYS.has(parameterName)) continue;

    if (dynamicParamNames.has(parameterName)) {
      setFormValue(parameterName, values);
      continue;
    }

    if (!newParameters[parameterName]) continue;

    try {
      newParameters[parameterName] = applyStaticParameterValues(newParameters[parameterName], values);
    } catch (e) {
      // Non-critical: log and continue with remaining parameters
      console.warn("[ProcessModal] Malformed parameter data from onLoad for", parameterName, e);
    }
  }

  return newParameters;
}

// ---------------------------------------------------------------------------
// Helpers for WindowReferenceGrid – datasourceOptions useMemo
// ---------------------------------------------------------------------------

/**
 * Converts "Y"/"N" and short numeric strings to their typed equivalents.
 * Returns the original value for everything else (e.g. UUIDs, long strings).
 */
export function convertDatasourceValue(value: unknown): boolean | number | unknown {
  if (value === "Y") return true;
  if (value === "N") return false;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)) && value.length < 15) {
    return Number(value);
  }
  return value;
}

/**
 * Strips leading/trailing `@` from context key references used in filter
 * expressions (e.g. `"@AD_Org_ID@"` → `"AD_Org_ID"`).
 */
export function normalizeContextKey(contextKey: string): string {
  if (typeof contextKey === "string" && contextKey.startsWith("@") && contextKey.endsWith("@")) {
    return contextKey.slice(1, -1);
  }
  return contextKey;
}

/**
 * Looks up a context key in a record of string-keyed values, trying both the
 * bare key and the `inp`-prefixed variant that Etendo uses.
 */
export function resolveContextValue(key: string, recordValues: Record<string, unknown>): unknown {
  return recordValues[key] ?? recordValues[`inp${key}`];
}

/** Mapping of system parameter names to their datasource option names */
const SYSTEM_KEY_MAP: Record<string, string> = {
  inpadOrgId: "ad_org_id",
  inpadClientId: "ad_client_id",
};

/**
 * Applies a single merged parameter entry to the datasource options object.
 *
 * Handles three cases in order:
 * 1. `ad_org_id` → also sets `_org` for datasource compatibility
 * 2. System keys (`inpadOrgId`, `inpadClientId`) → mapped to `ad_org_id` / `ad_client_id`
 * 3. Process parameters matched by name → uses `dBColumnName` as options key
 *
 * @param key        Parameter name
 * @param value      Resolved value
 * @param parameters Current process parameters map
 * @param options    Datasource options object mutated in place
 */
export function applyMergedParam(
  key: string,
  value: unknown,
  parameters: ParametersMap,
  options: Record<string, unknown>
): void {
  if (key === "ad_org_id") {
    options._org = value;
  }

  if (key in SYSTEM_KEY_MAP) {
    options[SYSTEM_KEY_MAP[key]] = value;
    return;
  }

  // In real process metadata the `parameters` map is keyed by the form/field
  // shape (typically `dBColumnName`, e.g. `parameters["accounting_status"]`)
  // while `p.name` is the display label (e.g. `"Accounting Status"`). The
  // form keys arriving here can be either — the legacy search-by-name path
  // missed the dBColumnName-shaped form keys, which is exactly the case for
  // multi-record selectors. Try the direct map lookup first, then fall back
  // to scanning by `name` and `dBColumnName` for the test/legacy callers.
  const matchingParameter =
    parameters[key] ?? Object.values(parameters).find((p) => p.name === key || p.dBColumnName === key);

  if (matchingParameter && value !== "" && value !== null && value !== undefined) {
    const outKey = matchingParameter.dBColumnName || key;
    // Multi-record selectors store the selection internally as a single
    // comma-separated string (`"id1,id2,id3"`). Classic Etendo's
    // `OBMultiSelectorItem.getValue()` returns a JS array, which SmartClient
    // serializes as repeated form-urlencoded keys
    // (`accounting_status=id1&accounting_status=id2&...`) — and that's what
    // `OBPickAndExecuteDataSource` expects to drive its `IN (...)` filter.
    // Hand the proxy an array so `createFormData` (route.ts:132) emits the
    // same repeated-key shape; a CSV string would arrive as a single value
    // and silently match nothing.
    if (matchingParameter.reference === FIELD_REFERENCE_CODES.MULTI_SELECTOR.id && typeof value === "string") {
      const ids = value.split(",").filter((id) => id.length > 0);
      if (ids.length > 0) {
        options[outKey] = ids;
      }
      return;
    }
    options[outKey] = value;
  }
}

/** Shape of a single filter criteria entry */
export interface FilterCriteriaEntry {
  fieldName: string;
  operator: string;
  value: unknown;
}

/**
 * Converts a raw filter expression value (string / boolean string / unknown)
 * into a typed `FilterCriteriaEntry`.
 *
 * @param fieldName  The field this criteria targets
 * @param rawValue   The raw value from the filter expression map
 */
export function buildFilterCriteriaEntry(fieldName: string, rawValue: unknown): FilterCriteriaEntry {
  if (rawValue === "true") return { fieldName, operator: "equals", value: true };
  if (rawValue === "false") return { fieldName, operator: "equals", value: false };

  if (typeof rawValue === "string") {
    const isUUID = /^[0-9a-fA-F]{32}$/.test(rawValue);
    return { fieldName, operator: isUUID ? "equals" : "iContains", value: rawValue };
  }

  return { fieldName, operator: "equals", value: rawValue };
}
