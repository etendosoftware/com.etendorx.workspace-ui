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

import { applySessionResponsePolicy } from "./sessionResponsePolicy";

export interface SessionAwareFetchInit extends RequestInit {
  /**
   * The calling screen shows its own message when the request fails, so no generic one is shown.
   * An authentication failure still closes the session.
   */
  handlesOwnError?: boolean;
}

/**
 * `fetch` for requests made outside the API clients, with the same session rule as the client
 * interceptor: a 401 closes the session and a server error is shown without closing it.
 *
 * @param input the resource to fetch
 * @param init the fetch options, plus whether the caller shows its own error
 * @returns the untouched response
 */
export async function sessionAwareFetch(input: RequestInfo | URL, init: SessionAwareFetchInit = {}): Promise<Response> {
  const { handlesOwnError = false, ...requestInit } = init;
  const response = await fetch(input, requestInit);
  applySessionResponsePolicy(response, { handlesOwnError });
  return response;
}
