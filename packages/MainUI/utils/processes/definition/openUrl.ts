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
 * The `openUrl` action: hand the user off to an external URL in a new window.
 *
 * Classic Manual processes reach this through a bare `window.open` inside their
 * button handler (OAuth consent screens, Swagger UI, Google Picker). In the new
 * UI a migrated script expresses the same intent declaratively, either as the
 * `onProcess` return value:
 *
 * ```js
 * return { type: "openUrl", url, closeModal: true, refreshRecord: true };
 * ```
 *
 * or as a server `responseActions` entry (`{ openUrl: { url } }`).
 *
 * The parser is pure and shape-tolerant because both shapes reach it; the
 * opener is isolated so the popup-blocked branch can be tested without a real
 * browser window.
 */

import type { MessageBarAction } from "./scriptProxies";

/** The `type` discriminator an `onProcess` returns to request an external window. */
export const OPEN_URL_RESULT_TYPE = "openUrl";

export interface OpenUrlPayload {
  /** Absolute or app-relative URL to open. */
  url: string;
  /** Close the process modal after opening. */
  closeModal?: boolean;
  /** Refresh the launching tab's grid/record after opening. */
  refreshRecord?: boolean;
  /** Classic `window.open` feature string (size/position of the popup). */
  windowFeatures?: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readOptionalBoolean = (value: unknown): boolean | undefined => (typeof value === "boolean" ? value : undefined);

const readOptionalString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/**
 * Normalizes a raw value into an {@link OpenUrlPayload}, or `null` when it is
 * not an open-url request.
 *
 * @param value - Either an `onProcess` return (`{ type: "openUrl", url, … }`) or a
 *   `responseActions` payload (`{ url, … }`, already identified by its key).
 * @param requireTypeDiscriminator - When `true` (the `onProcess` return path) the
 *   value must carry `type: "openUrl"`; when `false` the key already identified it.
 */
export const parseOpenUrlPayload = (value: unknown, requireTypeDiscriminator = true): OpenUrlPayload | null => {
  if (!isPlainObject(value)) return null;
  if (requireTypeDiscriminator && value.type !== OPEN_URL_RESULT_TYPE) return null;
  const url = readOptionalString(value.url);
  if (!url) return null;
  return {
    url,
    closeModal: readOptionalBoolean(value.closeModal),
    refreshRecord: readOptionalBoolean(value.refreshRecord),
    windowFeatures: readOptionalString(value.windowFeatures),
  };
};

/** Injectable `window.open`, so the blocked branch is reachable from tests. */
export type WindowOpener = (url: string, target: string, features?: string) => Window | null;

const defaultOpener: WindowOpener = (url, target, features) =>
  typeof window === "undefined" ? null : window.open(url, target, features);

/**
 * Opens `payload.url` in a new window.
 *
 * Returns `false` when the browser blocked it — the common case, because the
 * call happens after an `await` and therefore outside the user-gesture window.
 * Callers must handle that with {@link buildOpenUrlFallbackAction}; silently
 * dropping the URL would leave the process looking like it did nothing.
 */
export const openExternalWindow = (payload: OpenUrlPayload, opener: WindowOpener = defaultOpener): boolean => {
  const opened = opener(payload.url, "_blank", payload.windowFeatures);
  return !!opened;
};

/**
 * Builds the message-bar action that re-opens the URL from a direct user click,
 * which no popup blocker intercepts.
 */
export const buildOpenUrlFallbackAction = (
  payload: OpenUrlPayload,
  label: string,
  opener: WindowOpener = defaultOpener
): MessageBarAction => ({
  label,
  onClick: () => {
    opener(payload.url, "_blank", payload.windowFeatures);
  },
});
