/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
 * @fileoverview Shared API helpers for warehouse process sandboxes.
 *
 * Both useWarehousePlugin (onLoad context) and GenericWarehouseProcess (onScan/onProcess context)
 * need the same callAction and fetchDatasource helpers. This module provides factory functions
 * that create them bound to a given token and processId, avoiding duplication.
 */

export type CallActionFn = (actionHandler: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;

export type FetchDatasourceFn = (entity: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;

/**
 * Creates a sandboxed callAction function bound to the given token and default processId.
 *
 * Params are wrapped in `_params` by default. Pass `_topLevel: true` to send them
 * flat in the request body — required for handlers like ValidateActionHandler that
 * read params at the root level instead of from `_params`.
 */
export function createCallAction(token: string, defaultProcessId: string): CallActionFn {
  return async (actionHandler, params) => {
    const { processId: pidOverride, _entityName, _topLevel, ...innerParams } = params;
    const pid = (pidOverride as string) || defaultProcessId;

    const body = _topLevel
      ? JSON.stringify({
          _buttonValue: "DONE",
          ...innerParams,
          ...(_entityName ? { _entityName } : {}),
        })
      : JSON.stringify({
          _buttonValue: "DONE",
          _params: innerParams,
          ...(_entityName ? { _entityName } : {}),
        });

    const res = await fetch(`/api/erp/org.openbravo.client.kernel?processId=${pid}&_action=${actionHandler}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });
    if (!res.ok) throw new Error(`callAction failed: ${res.status}`);
    return res.json();
  };
}

/**
 * Creates a sandboxed fetchDatasource function for entity lookups (e.g. resolving IDs).
 * Proxies through /api/datasource — no direct backend access.
 */
export function createFetchDatasource(token: string): FetchDatasourceFn {
  return async (entity, params) => {
    const res = await fetch("/api/datasource", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entity, params }),
    });
    if (!res.ok) throw new Error(`fetchDatasource failed: ${res.status}`);
    return res.json();
  };
}
