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

/**
 * Pure parser for the structured `responseActions[]` array emitted by
 * Etendo Classic process handlers (see ResponseActionsBuilder.java). The
 * hook layer turns the normalized output of this module into side effects
 * (toasts, refreshes, navigation). Keeping the parser pure makes it easy
 * to test exhaustively and keeps the hook free of nested type guards.
 */

export const RESPONSE_ACTION_KEYS = {
  SHOW_MSG_IN_PROCESS_VIEW: "showMsgInProcessView",
  SHOW_MSG_IN_VIEW: "showMsgInView",
  OPEN_DIRECT_TAB: "openDirectTab",
  REFRESH_GRID: "refreshGrid",
  REFRESH_GRID_PARAMETER: "refreshGridParameter",
  SET_SELECTOR_VALUE_FROM_RECORD: "setSelectorValueFromRecord",
  SMARTCLIENT_SAY: "smartclientSay",
  BROWSE_REPORT: "OBUIAPP_browseReport",
  DOWNLOAD_REPORT: "OBUIAPP_downloadReport",
} as const;

/** Render mode a report action requests from the kernel report handler. */
export const REPORT_ACTION_MODES = {
  BROWSE: "BROWSE",
  DOWNLOAD: "DOWNLOAD",
} as const;

export type ReportActionMode = (typeof REPORT_ACTION_MODES)[keyof typeof REPORT_ACTION_MODES];

export interface ProcessActionMessage {
  msgType?: string;
  msgTitle?: string;
  msgText?: string;
  force?: boolean;
}

export interface OpenDirectTabPayload {
  tabId?: string;
  recordId?: string;
  command?: "DEFAULT" | "NEW" | string;
  criteria?: unknown;
  wait?: boolean;
}

export interface RefreshGridParameterPayload {
  gridName?: string;
}

export interface SetSelectorValuePayload {
  record?: { value?: string; map?: string | Record<string, unknown> };
}

export interface SmartClientSayPayload {
  message?: string;
}

/**
 * Payload of the `OBUIAPP_browseReport` / `OBUIAPP_downloadReport` actions.
 * The kernel report handler receives the inner `processParameters` plus the
 * temporary/target file names; the URL is assembled by {@link buildReportActionUrl}.
 */
export interface ReportActionPayload {
  processParameters?: {
    actionHandler?: string;
    reportId?: string;
    processId?: string;
  };
  tmpfileName?: string;
  fileName?: string;
  tabTitle?: string;
}

export type DispatchedAction =
  | { kind: "message"; channel: "processView" | "view"; payload: ProcessActionMessage }
  | { kind: "openDirectTab"; payload: OpenDirectTabPayload }
  | { kind: "refreshGrid"; payload: Record<string, unknown> }
  | { kind: "refreshGridParameter"; payload: RefreshGridParameterPayload }
  | { kind: "setSelectorValueFromRecord"; payload: SetSelectorValuePayload }
  | { kind: "smartclientSay"; payload: SmartClientSayPayload }
  | { kind: "browseReport"; payload: ReportActionPayload }
  | { kind: "downloadReport"; payload: ReportActionPayload };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Reads the `responseActions` array from any of the three nested paths used
 * by Etendo Classic handlers. Returns an empty array when the field is
 * absent or not an array — callers should not have to unwrap further.
 */
export const readResponseActions = (data: unknown): unknown[] => {
  if (!isPlainObject(data)) return [];
  if (Array.isArray(data.responseActions)) return data.responseActions;
  const response = isPlainObject(data.response) ? data.response : undefined;
  if (response && Array.isArray(response.responseActions)) return response.responseActions;
  const nested = response && isPlainObject(response.data) ? response.data : undefined;
  if (nested && Array.isArray(nested.responseActions)) return nested.responseActions;
  return [];
};

/**
 * Action keys already handled by the modal's success/banner/navigation flow
 * (toast/banner from the response message, tab navigation). The generic
 * registry-first dispatch of `responseActions` must skip them so a process that
 * also lists them in `responseActions` does not fire the effect twice.
 */
export const LEGACY_FLOW_ACTION_KEYS = [
  RESPONSE_ACTION_KEYS.SHOW_MSG_IN_PROCESS_VIEW,
  RESPONSE_ACTION_KEYS.SHOW_MSG_IN_VIEW,
  RESPONSE_ACTION_KEYS.OPEN_DIRECT_TAB,
] as const;

/**
 * Returns the raw `{ name: payload }` `responseActions` entries minus the keys
 * already handled by the modal's success flow. The result is dispatched
 * registry-first through `OB.Utilities.Action.executeJSON`, so process-specific
 * actions registered via `OB.Utilities.Action.set` (e.g. `showVATGrid`) run
 * alongside the built-in ones (`refreshGrid`, `refreshGridParameter`) — mirroring
 * the classic `executeJSON(responseActions)` call. Built-in-only `dispatchSingle`
 * would silently drop the registered actions, so it cannot be used here.
 */
export const readDispatchableResponseActions = (data: unknown): unknown[] => {
  const skip = new Set<string>(LEGACY_FLOW_ACTION_KEYS);
  return readResponseActions(data).filter((entry) => {
    if (!isPlainObject(entry)) return false;
    const key = Object.keys(entry)[0];
    return key !== undefined && !skip.has(key);
  });
};

/**
 * Parses a single `{ actionType: payload }` entry into a normalized
 * {@link DispatchedAction}, or `null` for an unrecognized / malformed entry.
 * Exported so the script-facing `executeJSON` path can route a lone entry
 * through the same logic as the `responseActions[]` array.
 */
export const dispatchSingle = (raw: unknown): DispatchedAction | null => {
  if (!isPlainObject(raw)) return null;
  const [key, payload] = Object.entries(raw)[0] ?? [];
  if (!key || !isPlainObject(payload)) return null;
  switch (key) {
    case RESPONSE_ACTION_KEYS.SHOW_MSG_IN_PROCESS_VIEW:
      return { kind: "message", channel: "processView", payload: payload as ProcessActionMessage };
    case RESPONSE_ACTION_KEYS.SHOW_MSG_IN_VIEW:
      return { kind: "message", channel: "view", payload: payload as ProcessActionMessage };
    case RESPONSE_ACTION_KEYS.OPEN_DIRECT_TAB:
      return { kind: "openDirectTab", payload: payload as OpenDirectTabPayload };
    case RESPONSE_ACTION_KEYS.REFRESH_GRID:
      return { kind: "refreshGrid", payload };
    case RESPONSE_ACTION_KEYS.REFRESH_GRID_PARAMETER:
      return { kind: "refreshGridParameter", payload: payload as RefreshGridParameterPayload };
    case RESPONSE_ACTION_KEYS.SET_SELECTOR_VALUE_FROM_RECORD:
      return { kind: "setSelectorValueFromRecord", payload: payload as SetSelectorValuePayload };
    case RESPONSE_ACTION_KEYS.SMARTCLIENT_SAY:
      return { kind: "smartclientSay", payload: payload as SmartClientSayPayload };
    case RESPONSE_ACTION_KEYS.BROWSE_REPORT:
      return { kind: "browseReport", payload: payload as ReportActionPayload };
    case RESPONSE_ACTION_KEYS.DOWNLOAD_REPORT:
      return { kind: "downloadReport", payload: payload as ReportActionPayload };
    default:
      return null;
  }
};

/**
 * Iterates `responseActions` and returns a normalized list of dispatched
 * actions. Unknown keys are silently skipped — adding a new backend action
 * later is a single new case in {@link dispatchSingle}.
 */
export const dispatchResponseActions = (data: unknown): DispatchedAction[] => {
  const out: DispatchedAction[] = [];
  for (const item of readResponseActions(data)) {
    const dispatched = dispatchSingle(item);
    if (dispatched) out.push(dispatched);
  }
  return out;
};

/**
 * Convenience helper: returns the first message action (process-view or
 * top-level view) found in the response, preserving the legacy contract
 * that `extractMessageFromProcessView` exposed before Phase 3.
 */
export const findFirstMessage = (
  actions: DispatchedAction[]
): { channel: "processView" | "view"; payload: ProcessActionMessage } | null => {
  for (const action of actions) {
    if (action.kind === "message") return { channel: action.channel, payload: action.payload };
  }
  return null;
};

/**
 * Convenience helper: returns the first structured `openDirectTab` action.
 * Used by the modal to navigate after success — wins over the legacy
 * SmartClient HTML parser fallback when both are present.
 */
export const findFirstOpenDirectTab = (actions: DispatchedAction[]): OpenDirectTabPayload | null => {
  for (const action of actions) {
    if (action.kind === "openDirectTab") return action.payload;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Side-effect routing
// ---------------------------------------------------------------------------

/**
 * The set of side-effect handlers a host (the process modal) wires to the
 * live React layer. The dispatcher routes each parsed action to exactly one of
 * these, so the modal stays free of action-type branching and this module
 * stays free of React. Mirrors the classic action-type definitions in
 * ob-utilities-action-def.js.
 */
export interface ActionDispatchContext {
  /** Message in the process popup's bar (classic `showMsgInProcessView`). */
  showMessageInProcessView: (payload: ProcessActionMessage) => void;
  /** Message in the parent/active view (classic `showMsgInView`). */
  showMessageInView: (payload: ProcessActionMessage) => void;
  /** Navigate to a tab/record (classic `openDirectTab`). */
  openDirectTab: (payload: OpenDirectTabPayload) => void;
  /** Refresh the grid of the tab that hosts the process button (classic `refreshGrid`). */
  refreshParentGrid: () => void;
  /** Refresh a grid parameter inside the modal (classic `refreshGridParameter`). */
  refreshGridParameter: (payload: RefreshGridParameterPayload) => void;
  /** Set a value into the caller selector (classic `setSelectorValueFromRecord`). */
  setSelectorValueFromRecord: (payload: SetSelectorValuePayload) => void;
  /** Show an info dialog (classic `smartclientSay`). */
  say: (message: string) => void;
  /** Open a generated report in a new tab (classic `OBUIAPP_browseReport`). */
  browseReport: (payload: ReportActionPayload) => void;
  /** Download a generated report file (classic `OBUIAPP_downloadReport`). */
  downloadReport: (payload: ReportActionPayload) => void;
}

/**
 * Routes one normalized action to its handler in {@link ActionDispatchContext}.
 * A single flat switch keeps cognitive complexity low; each case delegates to a
 * named handler rather than performing the side effect inline.
 */
export const dispatchResponseAction = (action: DispatchedAction, ctx: ActionDispatchContext): void => {
  switch (action.kind) {
    case "message":
      if (action.channel === "processView") ctx.showMessageInProcessView(action.payload);
      else ctx.showMessageInView(action.payload);
      return;
    case "openDirectTab":
      ctx.openDirectTab(action.payload);
      return;
    case "refreshGrid":
      ctx.refreshParentGrid();
      return;
    case "refreshGridParameter":
      ctx.refreshGridParameter(action.payload);
      return;
    case "setSelectorValueFromRecord":
      ctx.setSelectorValueFromRecord(action.payload);
      return;
    case "smartclientSay":
      if (action.payload.message) ctx.say(action.payload.message);
      return;
    case "browseReport":
      ctx.browseReport(action.payload);
      return;
    case "downloadReport":
      ctx.downloadReport(action.payload);
      return;
  }
};

/** Query-string keys for the kernel report endpoint (classic param names). */
const REPORT_URL_KEYS = {
  ACTION: "_action",
  REPORT_ID: "reportId",
  PROCESS_ID: "processId",
  TMP_FILE_NAME: "tmpfileName",
  FILE_NAME: "fileName",
  MODE: "mode",
} as const;

const KERNEL_REPORT_PATH = "/api/erp/org.openbravo.client.kernel";

/**
 * Builds the kernel URL a report action opens or downloads, mirroring the
 * classic `obManualURL` / hidden-form params. Only the keys present in the
 * payload are appended, so a partial payload still yields a valid URL.
 */
export const buildReportActionUrl = (payload: ReportActionPayload, mode: ReportActionMode): string => {
  const params = new URLSearchParams();
  const processParameters = payload.processParameters ?? {};
  if (processParameters.actionHandler) params.set(REPORT_URL_KEYS.ACTION, processParameters.actionHandler);
  if (processParameters.reportId) params.set(REPORT_URL_KEYS.REPORT_ID, processParameters.reportId);
  if (processParameters.processId) params.set(REPORT_URL_KEYS.PROCESS_ID, processParameters.processId);
  if (payload.tmpfileName) params.set(REPORT_URL_KEYS.TMP_FILE_NAME, payload.tmpfileName);
  if (payload.fileName) params.set(REPORT_URL_KEYS.FILE_NAME, payload.fileName);
  params.set(REPORT_URL_KEYS.MODE, mode);
  return `${KERNEL_REPORT_PATH}?${params.toString()}`;
};
