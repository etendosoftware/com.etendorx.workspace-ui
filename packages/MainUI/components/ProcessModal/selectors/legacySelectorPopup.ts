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

import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "../legacyMessageProtocol";

/** Record chosen in the Classic selector popup. */
export interface SelectorPick {
  id: string;
  identifier: string;
}

/** Validated `selectorValuePicked` envelope (mirrors the backend shim payload). */
export interface SelectorMessage {
  action: string;
  id: string;
  identifier: string;
}

// Classic `validateSelector` actions: SAVE confirms a row, CLEAR cancels/empties.
export const SELECTOR_SAVE_ACTION = "SAVE";
// Classic info-window opening command.
const SELECTOR_DEFAULT_COMMAND = "DEFAULT";
const COMMAND_PARAM = "Command";
const CURRENT_ID_PARAM = "inpIDValue";
const TOKEN_PARAM = "token";
// Separate browser window (like the Classic UI), not an iframe modal.
const POPUP_WINDOW_NAME = "etendoLegacySelector";
const POPUP_FEATURES = "width=1000,height=600,resizable=yes,scrollbars=yes";

/**
 * Extracts a `selectorValuePicked` payload from a `postMessage` event payload.
 * Returns `null` for any envelope that is not a well-formed selector message, so
 * callers can ignore unrelated messages without chained conditionals.
 */
export const parseSelectorPayload = (data: unknown): SelectorMessage | null => {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const envelope = data as Record<string, unknown>;
  if (envelope.type !== LEGACY_MESSAGE_TYPE || envelope.action !== LEGACY_ACTIONS.SELECTOR_VALUE_PICKED) {
    return null;
  }
  const payload = envelope.payload;
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const { action, id, identifier } = payload as Record<string, unknown>;
  return {
    action: typeof action === "string" ? action : "",
    id: typeof id === "string" ? id : "",
    identifier: typeof identifier === "string" ? identifier : "",
  };
};

interface BuildSelectorUrlParams {
  publicHost: string;
  /** Classic info-window URL emitted in the selector metadata (e.g. `/info/Product.html`). */
  legacySearchUrl: string;
  /** Current field value, forwarded so the popup can pre-highlight it. */
  currentId?: string;
  token?: string | null;
}

/**
 * Builds the legacy popup URL: the `/meta/legacy` forward authenticates with the token and
 * primes the Classic session, then the info-window renders inside it. The Dojo grid's
 * STRUCTURE/DATA requests are served as XML by the backend so the grid populates.
 */
export const buildLegacySelectorUrl = ({
  publicHost,
  legacySearchUrl,
  currentId,
  token,
}: BuildSelectorUrlParams): string => {
  const params = new URLSearchParams({ [COMMAND_PARAM]: SELECTOR_DEFAULT_COMMAND });
  if (currentId) {
    params.set(CURRENT_ID_PARAM, currentId);
  }
  if (token) {
    params.set(TOKEN_PARAM, token);
  }
  return `${publicHost}${API_IFRAME_FORWARD_PATH}${legacySearchUrl}?${params.toString()}`;
};

/**
 * Opens the Classic selector popup in a separate browser window, delegating the render to
 * the legacy UI (the same pattern used for manual processes and reports). Returns the window
 * handle so the caller can close it once a row is picked.
 */
export const openLegacySelectorPopup = (url: string): Window | null =>
  window.open(url, POPUP_WINDOW_NAME, POPUP_FEATURES);
