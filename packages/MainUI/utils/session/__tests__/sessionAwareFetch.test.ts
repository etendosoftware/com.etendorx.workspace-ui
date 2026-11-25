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

import { sessionAwareFetch } from "../sessionAwareFetch";
import { applySessionResponsePolicy } from "../sessionResponsePolicy";
import { sessionResponse } from "@/utils/tests/sessionResponseMocks";

jest.mock("../sessionResponsePolicy", () => ({
  applySessionResponsePolicy: jest.fn(),
}));

const URL = "/api/process/report-and-process";

describe("utils/session/sessionAwareFetch", () => {
  const originalFetch = global.fetch;
  const response = sessionResponse(500);

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response);
    (applySessionResponsePolicy as jest.Mock).mockClear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns the untouched response and applies the session rule to it", async () => {
    await expect(sessionAwareFetch(URL, { method: "POST" })).resolves.toBe(response);

    expect(global.fetch).toHaveBeenCalledWith(URL, { method: "POST" });
    expect(applySessionResponsePolicy).toHaveBeenCalledWith(response, { handlesOwnError: false });
  });

  it("passes the own-error flag to the rule and never to fetch", async () => {
    await sessionAwareFetch(URL, { method: "GET", handlesOwnError: true });

    expect(global.fetch).toHaveBeenCalledWith(URL, { method: "GET" });
    expect(applySessionResponsePolicy).toHaveBeenCalledWith(response, { handlesOwnError: true });
  });

  it("works without options", async () => {
    await sessionAwareFetch(URL);

    expect(global.fetch).toHaveBeenCalledWith(URL, {});
  });
});
