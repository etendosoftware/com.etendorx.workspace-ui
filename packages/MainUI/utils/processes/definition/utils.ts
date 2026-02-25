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

import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Auth credentials required to build the process context.
 */
export interface ProcessContextCredentials {
  token: string;
  getCsrfToken: () => string;
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
  const { token, getCsrfToken } = credentials;

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

  return { callAction, callDatasource, callServlet };
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

/** Keys from the onLoad result that are handled separately and must not be treated as parameter values */
const RESERVED_RESULT_KEYS = new Set(["_gridSelection", "autoSelectConfig", "_dynamicParameters", "error"]);

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

  const matchingParameter = Object.values(parameters).find((p) => p.name === key);
  if (matchingParameter && value !== "" && value !== null && value !== undefined) {
    options[matchingParameter.dBColumnName || key] = value;
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
