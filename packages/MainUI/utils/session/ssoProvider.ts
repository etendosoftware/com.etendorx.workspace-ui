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

import type { SSOConfig } from "@/hooks/useSSO";
import { isPreferenceYes } from "@/utils/preferences/classicPreferences";

/** Classic preference (com.etendoerp.etendorx) that offers linking the account and closes the provider session. */
export const ALLOW_SSO_LOGIN_PREFERENCE = "ETRX_AllowSSOLogin";

/** Route the provider sends the user back to after linking the account (not a login). */
export const SSO_LINK_CALLBACK_PATH = "/sso/link-callback";

/** Time classic gives the provider to close its session before removing the popup or frame. */
export const PROVIDER_LOGOUT_DELAY_MS = 1000;

/** Key of the `state` of an Auth0 authorization, checked when the provider sends the user back. */
export const SSO_STATE_KEY = "sso_state";

/**
 * Whether the profile offers linking the account and the logout closes the provider session, as classic
 * `link-sso-account.js` and `log-out-from-sso.js`: only with `ETRX_AllowSSOLogin` = Y and single sign-on
 * configured.
 *
 * @param config - Single sign-on configuration of the server
 */
export function isSsoAccountLinkingEnabled(config: SSOConfig | null): config is Extract<SSOConfig, { enabled: true }> {
  return config?.enabled === true && isPreferenceYes(ALLOW_SSO_LOGIN_PREFERENCE);
}

/**
 * Body of the link request from the address the provider sent the user back to: an Auth0 `code` (whose `state`
 * must be the one stored when the authorization started) or a middleware `access_token`.
 *
 * @param params - Query of the callback address
 * @param expectedState - `state` stored when the Auth0 authorization started
 * @param origin - Origin of the new UI, part of the Auth0 redirect address
 * @returns The body, or `null` when the address carries nothing valid to link
 */
export function buildSsoLinkBody(
  params: URLSearchParams,
  expectedState: string | null,
  origin: string
): Record<string, string> | null {
  const code = params.get("code");
  if (code) {
    if (!expectedState || params.get("state") !== expectedState) {
      return null;
    }
    return { code, redirectUri: `${origin}${SSO_LINK_CALLBACK_PATH}` };
  }
  const accessToken = params.get("access_token");
  return accessToken ? { accessToken } : null;
}

/**
 * Closes the session of the single sign-on provider on a manual logout, as classic `log-out-from-sso.js`:
 * Auth0 through its logout address in a small popup (it cannot be framed), the Etendo middleware through a
 * hidden frame; both are removed after a second. Nothing happens unless account linking is enabled.
 *
 * @param config - Single sign-on configuration of the server
 */
export function closeSsoProviderSession(config: SSOConfig | null): void {
  if (!isSsoAccountLinkingEnabled(config)) {
    return;
  }
  if (config.authType === "Auth0") {
    const url = new URL(`https://${config.domain}/v2/logout`);
    url.search = new URLSearchParams({ client_id: config.clientId, returnTo: window.location.origin }).toString();
    const popup = window.open(url.toString(), "_blank", "width=1,height=1");
    window.setTimeout(() => popup?.close(), PROVIDER_LOGOUT_DELAY_MS);
    return;
  }
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = `${config.middlewareUrl}/logout`;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), PROVIDER_LOGOUT_DELAY_MS);
}
