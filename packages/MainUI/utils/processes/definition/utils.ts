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
