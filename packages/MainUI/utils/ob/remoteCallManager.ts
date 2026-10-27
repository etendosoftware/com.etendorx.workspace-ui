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

import type { OBRemoteCallManager, RemoteCallback } from "./types";

/** Classic SmartClient RPC status: `>= 0` is success, `< 0` is a transport error. */
const RPC_STATUS_SUCCESS = 0;
const RPC_STATUS_FAILURE = -1;

/** Thrown when the shim is built without a transport (a wiring bug, not a runtime failure). */
const REMOTE_CALL_NO_TRANSPORT = "OB.RemoteCallManager.call requires a remoteCall dependency";

/** Request parameter written by the transport itself; a caller-provided value never overrides it. */
const ACTION_PARAM = "_action";

/** Transport injected so this module stays free of any React / fetch layer. */
export interface RemoteCallDeps {
  /** Performs the kernel action call (e.g. the modal's `callAction`), with optional URL query parameters. */
  remoteCall?: (
    handler: string,
    params: Record<string, unknown>,
    queryParams?: Record<string, string>
  ) => Promise<{ data: unknown }>;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Encodes classic `requestParams` as URL query parameters, the way classic
 * `OB.RemoteCallManager.call` does (SmartClient `encodeParameter`): strings are
 * sent as-is and any other value is JSON-encoded, so an object such as
 * `context` arrives as JSON and a boolean as `"true"` / `"false"`. Empty
 * values and the reserved `_action` key are skipped.
 */
export function encodeRequestParams(requestParams: unknown): Record<string, string> {
  const encoded: Record<string, string> = {};
  if (!isPlainObject(requestParams)) {
    return encoded;
  }
  for (const [key, value] of Object.entries(requestParams)) {
    if (key === ACTION_PARAM || value === undefined || value === null) {
      continue;
    }
    encoded[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return encoded;
}

/**
 * Builds the `OB.RemoteCallManager` namespace. `call` is a callback-style
 * adapter over the injected `remoteCall` (the kernel action call), so migrated
 * classic scripts keep their `(response, data, request)` callback contract:
 *
 * - On success it invokes `callback({ status: 0 }, data, { clientContext })`,
 *   where `data` is the parsed JSON body. Business errors arrive as a normal
 *   response (HTTP 200 with `data.message.severity === 'error'`) and the script
 *   inspects `data`, exactly like classic.
 * - On a transport failure (rejected call) it invokes `errorCallback` when one
 *   was provided, otherwise `callback`, with `{ status: -1 }` so classic
 *   `response.status < 0` error branches keep working.
 *
 * `data` is the POST body and `requestParams` travels as URL query parameters
 * (see `encodeRequestParams`), so action handlers reading
 * `parameters.get(...)` receive them as in classic.
 */
export function createRemoteCallManager(deps: RemoteCallDeps): OBRemoteCallManager {
  const call = (
    actionName: string,
    data?: Record<string, unknown>,
    requestParams?: unknown,
    callback?: RemoteCallback,
    callerContext?: unknown,
    errorCallback?: RemoteCallback
  ): void => {
    const remoteCall = deps.remoteCall;
    if (!remoteCall) {
      throw new Error(REMOTE_CALL_NO_TRANSPORT);
    }
    const request = { clientContext: callerContext };
    remoteCall(actionName, data ?? {}, encodeRequestParams(requestParams))
      .then((result) => {
        callback?.({ status: RPC_STATUS_SUCCESS }, result.data, request);
      })
      .catch(() => {
        const onError = typeof errorCallback === "function" ? errorCallback : callback;
        onError?.({ status: RPC_STATUS_FAILURE }, null, request);
      });
  };

  return { call };
}
