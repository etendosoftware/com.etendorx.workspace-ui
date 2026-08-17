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

import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import { extractContextPath } from "@/utils/url/utils";
import type { MessageBarAction } from "./scriptProxies";

/** The `type` discriminator an `onProcess` returns to request an external window. */
export const OPEN_URL_RESULT_TYPE = "openUrl";

export interface OpenUrlPayload {
  /** Absolute or app-relative URL to open. */
  url: string;
  /**
   * Marks `url` as a path on the Etendo Classic host (e.g.
   * `/web/com.etendoerp.openapi/?tag=Foo`) rather than a ready-to-open URL.
   *
   * Classic scripts build these with
   * `OB.Utilities.getLocationUrlWithoutFragment() + <erp path>`, which works there
   * because the classic UI *is* served from the ERP host. The new UI is a separate
   * app, so the host is resolved at dispatch time by {@link resolveErpHostedUrl}.
   * External hand-offs (OAuth consent screens, Google Picker) must NOT set this.
   */
  erpHosted?: boolean;
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
    erpHosted: readOptionalBoolean(value.erpHosted),
    closeModal: readOptionalBoolean(value.closeModal),
    refreshRecord: readOptionalBoolean(value.refreshRecord),
    windowFeatures: readOptionalString(value.windowFeatures),
  };
};

/**
 * Resolves the URL to actually open, expanding an {@link OpenUrlPayload.erpHosted}
 * path into a full Etendo Classic URL. Any other payload is returned untouched, so
 * external hand-offs are never rewritten.
 *
 * With a token the URL goes through the `/meta/legacy/redirect` endpoint, which
 * validates the JWT, primes a Classic session and then redirects the browser to
 * `location`. Both halves matter: the ERP page lands on its real Classic path (so
 * anything deriving a context path from `window.location` — like the Swagger UI —
 * computes it correctly), and it carries a session cookie, so its own authenticated
 * requests succeed. Without a token the plain Classic URL is the best available
 * answer: the page still loads, only its authenticated calls may fail.
 *
 * @param payload - The parsed open-url request.
 * @param params.classicHost - Etendo Classic base URL (`config.etendoClassicHost`),
 *   e.g. `http://localhost:8080/etendo`. Empty when the runtime config has not
 *   loaded yet, in which case the path is left alone rather than opening a broken URL.
 * @param params.token - JWT of the current session, when available.
 */
export const resolveErpHostedUrl = (
  payload: OpenUrlPayload,
  params: { classicHost?: string | null; token?: string | null }
): string => {
  const { classicHost, token } = params;
  if (!payload.erpHosted || !classicHost) return payload.url;

  const base = classicHost.endsWith("/") ? classicHost.slice(0, -1) : classicHost;
  const path = payload.url.startsWith("/") ? payload.url : `/${payload.url}`;

  if (!token) return `${base}${path}`;

  // The servlet rejects absolute locations, so it receives the context-path-relative
  // form (`/etendo/web/...`) that the browser will land on after the redirect.
  const location = `${extractContextPath(base)}${path}`;
  return `${base}${API_IFRAME_FORWARD_PATH}/redirect?location=${encodeURIComponent(location)}&token=${token}`;
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
