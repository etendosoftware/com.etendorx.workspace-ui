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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview Pure helpers behind the Get Middleware Token chooser.
 *
 * Kept out of the component so the hand-off URL — the part that must match classic byte for byte —
 * can be asserted directly.
 */

import type { MiddlewareProvider, ScopeChoice } from "./types";

/** Window name the classic handler uses. Reusing it makes repeated clicks reuse the same popup. */
export const POPUP_WINDOW_NAME = "Authentication Popup";

/** Fraction of the screen the popup occupies, per ETRX_GetMiddlewareToken.js:6-7. */
const POPUP_SCREEN_RATIO = 0.5;

/**
 * Capitalizes a provider id for display, mirroring
 * `providerKey.charAt(0).toUpperCase() + providerKey.slice(1)` (ETRX_GetMiddlewareToken.js:28).
 *
 * @param providerId - The provider key as published by the middleware, e.g. `google`.
 */
const toProviderLabel = (providerId: string): string => providerId.charAt(0).toUpperCase() + providerId.slice(1);

/**
 * Flattens the nested provider/scope catalogue into the buttons the dialog renders.
 *
 * Scopes without a `scope` value are dropped: the middleware would reject the hand-off anyway, and a
 * button that cannot do anything is worse than an absent one.
 *
 * @param providers - Catalogue keyed by provider id, exactly as the middleware publishes it.
 * @returns One entry per renderable scope button, in catalogue order.
 */
export const flattenScopeChoices = (providers: Record<string, MiddlewareProvider>): ScopeChoice[] => {
  const choices: ScopeChoice[] = [];

  for (const [providerId, provider] of Object.entries(providers ?? {})) {
    for (const scopeData of provider?.scopes ?? []) {
      const scope = typeof scopeData?.scope === "string" ? scopeData.scope : "";
      if (!scope) continue;

      choices.push({
        providerId,
        providerLabel: toProviderLabel(provider?.name || providerId),
        scope,
        // Classic assigns `label = scopeName` unconditionally; falling back to the scope URL keeps a
        // nameless entry identifiable instead of rendering a blank caption.
        label: scopeData?.name || scope,
        description: scopeData?.description ?? "",
      });
    }
  }

  return choices;
};

/**
 * Groups the flattened choices back under their provider, preserving first-seen order, so the dialog
 * can render one card per provider as classic does.
 *
 * @param choices - Output of {@link flattenScopeChoices}.
 */
export const groupChoicesByProvider = (choices: ScopeChoice[]): Array<{ label: string; choices: ScopeChoice[] }> => {
  const groups = new Map<string, { label: string; choices: ScopeChoice[] }>();

  for (const choice of choices) {
    const group = groups.get(choice.providerId);
    if (group) {
      group.choices.push(choice);
    } else {
      groups.set(choice.providerId, { label: choice.providerLabel, choices: [choice] });
    }
  }

  return [...groups.values()];
};

/**
 * Produces the random half of the state payload.
 *
 * `crypto.randomUUID` only exists in a secure context, so an instance served over plain HTTP on a
 * host other than localhost does not have it — there the classic handler throws and the button does
 * nothing. The value only has to be unique and opaque (the middleware answers with its own signed
 * state), so falling back to `getRandomValues` keeps those instances working.
 */
const randomState = (): string => {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Builds the opaque `state` the middleware echoes back to the ERP callback.
 *
 * Mirrors ETRX_GetMiddlewareToken.js:18-19, including the fact that — unlike `ETRXGetToken` — it
 * carries no provider id.
 *
 * @param userId - `AD_User_ID` of the session user.
 * @returns The base64-encoded state payload.
 */
export const buildAuthState = (userId: string): string => btoa(JSON.stringify({ state: randomState(), userId }));

/**
 * Builds the popup geometry string: half the screen, centred, matching
 * ETRX_GetMiddlewareToken.js:6-9 (which rounds; `ETRXGetToken` does not).
 *
 * @param screen - Source of the screen dimensions, injectable for tests.
 */
export const buildPopupFeatures = (screen: { width: number; height: number }): string => {
  const popupWidth = Math.round(screen.width * POPUP_SCREEN_RATIO);
  const popupHeight = Math.round(screen.height * POPUP_SCREEN_RATIO);
  const left = Math.round((screen.width - popupWidth) / 2);
  const upperMargin = Math.round((screen.height - popupHeight) / 2);

  return `width=${popupWidth},height=${popupHeight},left=${left},top=${upperMargin}`;
};

export interface AuthUrlParams {
  startEndpoint: string;
  providerId: string;
  accountId: string;
  scope: string;
  redirectUri: string;
  state: string;
}

/**
 * Assembles the middleware hand-off URL.
 *
 * Same parameters and same order as ETRX_GetMiddlewareToken.js:123-131. `URLSearchParams` encodes
 * the scope URL and the redirect URI, which is what the middleware expects.
 *
 * @param params - The pieces resolved by the onLoad plus the per-click state.
 * @returns The absolute URL to open.
 */
export const buildAuthUrl = ({
  startEndpoint,
  providerId,
  accountId,
  scope,
  redirectUri,
  state,
}: AuthUrlParams): string => {
  const query = new URLSearchParams({
    provider: providerId.toLowerCase(),
    account_id: accountId,
    scope,
    redirect_uri: redirectUri,
    state,
  });

  return `${startEndpoint}?${query.toString()}`;
};
