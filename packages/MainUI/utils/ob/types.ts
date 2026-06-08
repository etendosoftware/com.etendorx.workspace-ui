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
 * Shared type definitions for the `OB.*` shim exposed to migrated
 * "Defined Process" scripts in the new UI. See `obShim.ts` for the composition.
 */

/** Positional substitution params accepted by `OB.I18N.getLabel`. */
export type LabelParams = Array<string | number>;

/** A function registered through `OB.Utilities.Action.set`. */
export type ActionFn = (params?: unknown) => unknown;

/** Dependencies injected into the shim at modal-open time. */
export interface OBShimDeps {
  /**
   * Raw label resolver (e.g. `useLanguage().getLabel`). Returns the template
   * string for a key, or the key itself when not found. Positional `%n`
   * substitution is applied by the shim, not by this function.
   */
  getLabel?: (key: string) => string;
  /** Current UI language code (e.g. `"en_US"`, `"es_ES"`). */
  language?: string | null;
  /**
   * Routes a built-in action type (everything not registered via
   * `Action.set`) to the host's side-effect handlers. Injected so `utils/ob`
   * stays free of any React-layer dependency. Returns `true` when handled.
   */
  dispatchBuiltinAction?: (name: string, payload: unknown) => boolean;
  /**
   * Performs the kernel action call backing `OB.RemoteCallManager.call`
   * (e.g. the modal's `callAction`). Injected so `utils/ob` stays free of any
   * React / fetch layer. Resolves with the parsed response body as `data`.
   */
  remoteCall?: (handler: string, params: Record<string, unknown>) => Promise<{ data: unknown }>;
  /**
   * Performs the datasource fetch backing `OB.Datasource.create(...).fetchData`
   * (e.g. the modal's `callDatasource`). Injected so `utils/ob` stays free of
   * any React / fetch layer. Resolves with the parsed response body as `data`.
   */
  fetchDatasource?: (entity: string, payload: Record<string, unknown>) => Promise<{ data: unknown }>;
}

export interface OBI18N {
  getLabel: (key: string, params?: LabelParams) => string;
}

export interface OBFormat {
  defaultDecimalSymbol: string;
  defaultGroupingSymbol: string;
  defaultGroupingSize: number;
  defaultNumericMask: string;
}

export interface OBUtilitiesNumber {
  JSToOBMasked: (
    value: unknown,
    mask?: string,
    decSeparator?: string,
    groupSeparator?: string,
    groupInterval?: number
  ) => unknown;
}

export interface OBAction {
  set: (name: string, action: ActionFn) => boolean;
  execute: (name: string, params?: unknown, delay?: number) => unknown;
  /**
   * Dispatches an action JSON array (or a single action object). Each entry
   * `{ name: payload }` runs its registered function (via `set`) or, failing
   * that, the built-in handler for that type. Returns `true` once processed.
   */
  executeJSON: (jsonArray: unknown, threadId?: unknown, delay?: number, processView?: unknown) => boolean;
}

export interface OBUtilities {
  Number: OBUtilitiesNumber;
  Action: OBAction;
  generateRandomString: (
    stringLength: number,
    allowLowerCaseChars?: boolean,
    allowUpperCaseChars?: boolean,
    allowDigits?: boolean,
    allowSpecialChars?: boolean
  ) => string;
}

export interface OBPropertyStore {
  get: (key: string) => string | undefined;
  set: (key: string, value: unknown) => void;
}

export interface OBTestRegistry {
  /** No-op: test infrastructure is not migrated. */
  register: (name: string, obj?: unknown) => void;
}

/** Minimal classic RPC response sentinel; scripts check `status < 0` for errors. */
export type RemoteCallResponse = { status: number };
/** Minimal classic RPC request sentinel exposing the caller context. */
export type RemoteCallRequest = { clientContext?: unknown };
/** Classic `OB.RemoteCallManager.call` callback shape. */
export type RemoteCallback = (response: RemoteCallResponse, data: unknown, request: RemoteCallRequest) => void;

export interface OBRemoteCallManager {
  /**
   * Calls a server action handler and invokes `callback(response, data, request)`
   * with the classic contract. `requestParams` is accepted for compatibility but
   * not used for routing; `errorCallback` (when a function) receives transport
   * failures instead of `callback`.
   */
  call: (
    actionName: string,
    data?: Record<string, unknown>,
    requestParams?: unknown,
    callback?: RemoteCallback,
    callerContext?: unknown,
    errorCallback?: RemoteCallback
  ) => void;
}

/** Minimal classic datasource response sentinel; scripts check `status < 0` for errors. */
export type DatasourceResponse = { status: number; totalRows: number };
/** Minimal classic datasource request sentinel exposing the criteria back to the callback. */
export type DatasourceRequest = { criteria?: unknown };
/** Classic `dataSource.fetchData` callback shape. */
export type DatasourceCallback = (response: DatasourceResponse, data: unknown[], request: DatasourceRequest) => void;

/** Subset of the classic `OB.Datasource.create` config consumed by the façade. */
export interface DatasourceConfig {
  /** Classic datasource URL; its last path segment is the entity name. */
  dataURL?: string;
  /** Explicit entity name (fallback when no `dataURL` is given). */
  entity?: string;
  /** Alternate explicit entity name (fallback). */
  dataSource?: string;
  /** Extra request params merged into every `fetchData` payload. */
  requestProperties?: { params?: Record<string, unknown> };
  [key: string]: unknown;
}

export interface OBDatasourceInstance {
  /**
   * Imperative fetch. `criteria` is sent in the request payload (the classic
   * `fetchData(callback)` overload is also honoured); `callback(response, data,
   * request)` receives `{ status, totalRows }`, the row array, and `{ criteria }`.
   */
  fetchData: (criteria?: unknown, callback?: DatasourceCallback) => void;
  /** Preloads client-only records; once set, `fetchData` resolves from them. */
  setCacheData: (records: unknown[]) => void;
}

export interface OBDatasource {
  /** Creates a REST datasource façade backed by the injected `fetchDatasource`. */
  create: (config?: DatasourceConfig) => OBDatasourceInstance;
}

/**
 * The `OB` object injected into compiled process scripts. The index signature
 * tolerates module-namespace writes such as `OB.APRM = OB.APRM || {}` performed
 * by migrated scripts.
 */
export interface OBShim {
  PropertyStore: OBPropertyStore;
  I18N: OBI18N;
  Format: OBFormat;
  Utilities: OBUtilities;
  Styles: Record<string, unknown>;
  /** Classic `OB.MessageBar.TYPE_*` severity constants. */
  MessageBar: Record<string, string>;
  TestRegistry: OBTestRegistry;
  RemoteCallManager: OBRemoteCallManager;
  Datasource: OBDatasource;
  [namespace: string]: unknown;
}
