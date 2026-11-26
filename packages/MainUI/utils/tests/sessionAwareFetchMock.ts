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

import type { SessionAwareFetchInit } from "@/utils/session/sessionAwareFetch";

/**
 * Module mock of `@/utils/session/sessionAwareFetch` that forwards to the global `fetch` without the
 * own-error flag, so the fetch mocks of a test keep working while the flag of each call can be checked:
 *
 * ```ts
 * jest.mock("@/utils/session/sessionAwareFetch", () => require("@/utils/tests/sessionAwareFetchMock").sessionAwareFetchModule);
 * ```
 */
export const sessionAwareFetchModule = {
  sessionAwareFetch: jest.fn(
    (input: RequestInfo | URL, { handlesOwnError: _flag, ...init }: SessionAwareFetchInit = {}) => fetch(input, init)
  ),
};

/**
 * Asserts that a request to a URL containing `urlPart` went through `sessionAwareFetch` with the given flag.
 *
 * @param urlPart part of the requested URL that identifies the call
 * @param handlesOwnError whether the call was expected to say its screen shows its own error
 */
export const expectSessionAwareFetchFor = (urlPart: string, handlesOwnError: boolean) => {
  const call = sessionAwareFetchModule.sessionAwareFetch.mock.calls.find(([input]) => String(input).includes(urlPart));
  expect(call).toBeDefined();
  expect(Boolean(call?.[1]?.handlesOwnError)).toBe(handlesOwnError);
};
