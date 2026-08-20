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
 * Helpers to read the ERP session material (JSESSIONID + CSRF token) out of an ERP response
 * and persist it in the per-token store.
 *
 * The store in `sessionStore.ts` is keyed by the JWT, so any endpoint that makes the ERP issue a
 * *new* token must move the session material across to the new key — otherwise every later
 * `/api/datasource` and `/api/erp` call silently loses its JSESSIONID and CSRF token.
 */

import {
  setErpSessionCookie,
  setErpCsrfToken,
  getErpSessionCookie,
  getErpCsrfToken,
  clearErpSessionCookie,
} from "./sessionStore";

const JSESSIONID_PATTERN = /JSESSIONID=([^;]+)/;
const CSRF_HEADER = "X-CSRF-Token";
const CSRF_HEADER_LOWERCASE = "x-csrf-token";

/**
 * Extracts the JSESSIONID value from an ERP response.
 *
 * Prefers `getSetCookie()` (the Node 18+ API that keeps multiple Set-Cookie headers separate) and
 * falls back to `headers.get("set-cookie")`, which concatenates them.
 *
 * @param response The HTTP response from the ERP
 * @returns The JSESSIONID value, or null when the response carries none
 */
export function extractJSessionId(response: Response): string | null {
  // biome-ignore lint/suspicious/noExplicitAny: getSetCookie is not in the DOM lib typings
  const cookies = (response.headers as any).getSetCookie?.() as string[] | undefined;
  if (cookies) {
    for (const cookie of cookies) {
      const match = cookie.match(JSESSIONID_PATTERN);
      if (match) return match[1];
    }
  }

  const single = response.headers.get("set-cookie");
  if (single) {
    const match = single.match(JSESSIONID_PATTERN);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extracts the CSRF token from an ERP response, accepting either header casing.
 *
 * @param response The HTTP response from the ERP
 * @returns The CSRF token, or null when the response carries none
 */
export function extractCsrfToken(response: Response): string | null {
  return response.headers.get(CSRF_HEADER) || response.headers.get(CSRF_HEADER_LOWERCASE) || null;
}

/**
 * Stores the ERP session material carried by a response under the given token.
 *
 * When the response has no JSESSIONID, only the CSRF token is stored, so the store is never
 * poisoned with a literal "JSESSIONID=null".
 *
 * @param response The HTTP response from the ERP
 * @param token The JWT the session material belongs to
 * @throws Error when the session material cannot be stored
 */
export function storeErpSession(response: Response, token: string): void {
  try {
    const jsessionId = extractJSessionId(response);
    const csrfToken = extractCsrfToken(response);

    if (!jsessionId) {
      if (csrfToken) {
        setErpCsrfToken(token, csrfToken);
      }
      return;
    }

    setErpSessionCookie(token, { cookieHeader: `JSESSIONID=${jsessionId}`, csrfToken });
  } catch (e) {
    console.error("Error storing session cookie:", e);
    throw new Error("Failed to store session cookie");
  }
}

/**
 * Resolves which cookie header the new token should get: a JSESSIONID freshly issued by the ERP
 * wins, otherwise the one already stored for the previous token is carried over.
 */
function resolveCookieHeader(jsessionId: string | null, previousToken: string): string | null {
  if (jsessionId) {
    return `JSESSIONID=${jsessionId}`;
  }

  return getErpSessionCookie(previousToken);
}

/**
 * Resolves which CSRF token the new token should get: one freshly issued by the ERP wins,
 * otherwise the one already stored for the previous token is carried over.
 *
 * Carrying it over explicitly matters: `setErpSessionCookie` generates a brand new CSRF token when
 * it receives a null one, which would discard the token the ERP already knows about.
 */
function resolveCsrfToken(responseCsrfToken: string | null, previousToken: string): string | null {
  if (responseCsrfToken) {
    return responseCsrfToken;
  }

  return getErpCsrfToken(previousToken);
}

/**
 * Moves the ERP session material from a previous token to a newly issued one, carrying over
 * whatever the ERP response did not supply, and drops the previous entry so the store does not
 * grow unbounded.
 *
 * @param response The HTTP response from the ERP that issued the new token
 * @param newToken The newly issued JWT
 * @param previousToken The JWT being replaced
 */
export function handOffErpSession(response: Response, newToken: string, previousToken: string): void {
  const cookieHeader = resolveCookieHeader(extractJSessionId(response), previousToken);
  const csrfToken = resolveCsrfToken(extractCsrfToken(response), previousToken);

  if (cookieHeader) {
    setErpSessionCookie(newToken, { cookieHeader, csrfToken });
  } else if (csrfToken) {
    setErpCsrfToken(newToken, csrfToken);
  }

  if (previousToken && previousToken !== newToken) {
    clearErpSessionCookie(previousToken);
  }
}
