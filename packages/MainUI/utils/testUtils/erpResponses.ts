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

/** Shared ERP-response builders for the session tests. */

export interface ErpResponseOptions {
  /** Cookies returned by `getSetCookie()`, the Node 18+ API that keeps Set-Cookie headers separate. */
  setCookie?: string[];
  /** Value returned by `headers.get("set-cookie")`, where several cookies arrive concatenated. */
  singleSetCookie?: string;
  /** Value returned for either casing of the CSRF header. */
  csrf?: string;
  /** Omits `getSetCookie` entirely, the way a runtime that predates Node 18 would. */
  withoutGetSetCookie?: boolean;
  ok?: boolean;
  status?: number;
  /** Body resolved by `json()`. */
  body?: unknown;
  /** Makes `json()` reject, the way it does for an empty or malformed payload. */
  malformedBody?: boolean;
}

/**
 * Builds a minimal ERP-like response.
 *
 * Only the surface the session helpers actually touch is implemented — `ok`, `status`, `json()` and
 * the two ways a Set-Cookie header can be read — so a test never has to stand up a real `Response`.
 *
 * @param options What the response should carry
 * @returns A response the session helpers accept
 */
export function buildErpResponse(options: ErpResponseOptions = {}): Response {
  const headers: Record<string, unknown> = {
    get: (name: string) => {
      const lowered = name.toLowerCase();
      if (lowered === "x-csrf-token") return options.csrf ?? null;
      if (lowered === "set-cookie") return options.singleSetCookie ?? null;
      return null;
    },
  };

  if (!options.withoutGetSetCookie) {
    headers.getSetCookie = () => options.setCookie;
  }

  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers,
    json: () =>
      options.malformedBody
        ? Promise.reject(new SyntaxError("Unexpected end of JSON input"))
        : Promise.resolve(options.body),
  } as unknown as Response;
}
