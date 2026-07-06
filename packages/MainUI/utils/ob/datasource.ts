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

import type { DatasourceCallback, DatasourceConfig, OBDatasource, OBDatasourceInstance } from "./types";

/** Classic SmartClient datasource status: `>= 0` is success, `< 0` is a transport error. */
const DS_STATUS_SUCCESS = 0;
const DS_STATUS_FAILURE = -1;

/** Separator used to derive the entity name from a classic `dataURL`. */
const DS_PATH_SEPARATOR = "/";
/** Operation requested on a `fetchData` call. */
const DS_DEFAULT_OPERATION = "fetch";
/**
 * Default pagination window. The server aborts unpaged manual datasource fetches,
 * and the classic SmartClient framework always paged automatically, so the façade
 * supplies a bounded range (overridable via `config.requestProperties.params`).
 */
const DS_DEFAULT_START_ROW = 0;
const DS_DEFAULT_END_ROW = 100;

/** Thrown when the shim is built without a transport (a wiring bug, not a runtime failure). */
const DATASOURCE_NO_TRANSPORT = "OB.Datasource.create(...).fetchData requires a fetchDatasource dependency";

/** Transport injected so this module stays free of any React / fetch layer. */
export interface DatasourceDeps {
  /** Performs the datasource fetch (e.g. the modal's `callDatasource`). */
  fetchDatasource?: (entity: string, payload: Record<string, unknown>) => Promise<{ data: unknown }>;
}

/** Parsed shape of the classic datasource reply envelope `{ response: { ... } }`. */
interface DatasourceReply {
  status: number;
  rows: unknown[];
  totalRows: number;
}

/**
 * Resolves the entity name from a classic config: the last segment of `dataURL`
 * (e.g. `.../org.openbravo.service.datasource/CharacteristicValue`), or the
 * explicit `entity` / `dataSource` field.
 */
function resolveEntityName(config: DatasourceConfig): string {
  const url = config.dataURL;
  if (typeof url === "string" && url.length > 0) {
    const segments = url.split(DS_PATH_SEPARATOR);
    return segments[segments.length - 1];
  }
  const fallback = config.entity ?? config.dataSource;
  return typeof fallback === "string" ? fallback : "";
}

/**
 * Supports the classic `fetchData(callback)` overload: when the first argument
 * is a function it is the callback and there is no criteria.
 */
function normalizeFetchArgs(
  criteria?: unknown,
  callback?: DatasourceCallback
): { criteria: unknown; callback?: DatasourceCallback } {
  if (typeof criteria === "function") {
    return { criteria: undefined, callback: criteria as DatasourceCallback };
  }
  return { criteria, callback };
}

/** Adds the criteria to the request payload only when one was provided. */
function buildCriteriaPayload(criteria: unknown): Record<string, unknown> {
  if (criteria === undefined || criteria === null) {
    return {};
  }
  return { criteria };
}

/** Reads the classic reply envelope, falling back to safe defaults. */
function readReply(result: { data: unknown }): DatasourceReply {
  const envelope = result.data as { response?: { status?: number; data?: unknown[]; totalRows?: number } };
  const response = envelope?.response ?? {};
  const rows = Array.isArray(response.data) ? response.data : [];
  const totalRows = typeof response.totalRows === "number" ? response.totalRows : rows.length;
  const status = typeof response.status === "number" ? response.status : DS_STATUS_SUCCESS;
  return { status, rows, totalRows };
}

/**
 * Builds the `OB.Datasource` namespace. `create(config)` returns a façade with
 * the classic surface (`fetchData` / `setCacheData`) over the injected
 * `fetchDatasource` (the datasource HTTP call), so migrated scripts keep their
 * `(response, data, request)` callback contract:
 *
 * - On success it invokes `callback({ status, totalRows }, rows, { criteria })`,
 *   parsing the classic reply envelope `{ response: { status, data, totalRows } }`.
 *   The reply `status` is passed through, so business errors (HTTP 200 with a
 *   negative status) reach the script unchanged, exactly like classic.
 * - On a transport failure (rejected call) it invokes the callback with
 *   `{ status: -1, totalRows: 0 }` and an empty row array, so classic
 *   `response.status < 0` error branches keep working.
 *
 * `setCacheData(records)` mirrors a classic client-only datasource: once set,
 * `fetchData` resolves from the cached records without hitting the network.
 */
export function createDatasourceManager(deps: DatasourceDeps): OBDatasource {
  const create = (config: DatasourceConfig = {}): OBDatasourceInstance => {
    const entity = resolveEntityName(config);
    const baseParams = config.requestProperties?.params ?? {};
    let cachedRecords: unknown[] | null = null;

    const setCacheData = (records: unknown[]): void => {
      cachedRecords = Array.isArray(records) ? records : [];
    };

    const fetchData = (criteria?: unknown, callback?: DatasourceCallback): void => {
      const resolved = normalizeFetchArgs(criteria, callback);
      const request = { criteria: resolved.criteria };

      if (cachedRecords) {
        resolved.callback?.({ status: DS_STATUS_SUCCESS, totalRows: cachedRecords.length }, cachedRecords, request);
        return;
      }

      const fetchDatasource = deps.fetchDatasource;
      if (!fetchDatasource) {
        throw new Error(DATASOURCE_NO_TRANSPORT);
      }

      const payload = {
        _operationType: DS_DEFAULT_OPERATION,
        _startRow: DS_DEFAULT_START_ROW,
        _endRow: DS_DEFAULT_END_ROW,
        ...baseParams,
        ...buildCriteriaPayload(resolved.criteria),
      };
      fetchDatasource(entity, payload)
        .then((result) => {
          const reply = readReply(result);
          resolved.callback?.({ status: reply.status, totalRows: reply.totalRows }, reply.rows, request);
        })
        .catch(() => {
          resolved.callback?.({ status: DS_STATUS_FAILURE, totalRows: 0 }, [], request);
        });
    };

    return { fetchData, setCacheData };
  };

  return { create };
}
