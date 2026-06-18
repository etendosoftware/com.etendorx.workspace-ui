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
} as const;

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

export type DispatchedAction =
  | { kind: "message"; channel: "processView" | "view"; payload: ProcessActionMessage }
  | { kind: "openDirectTab"; payload: OpenDirectTabPayload }
  | { kind: "refreshGrid"; payload: Record<string, unknown> }
  | { kind: "refreshGridParameter"; payload: RefreshGridParameterPayload }
  | { kind: "setSelectorValueFromRecord"; payload: SetSelectorValuePayload }
  | { kind: "smartclientSay"; payload: SmartClientSayPayload };

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

const dispatchSingle = (raw: unknown): DispatchedAction | null => {
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
