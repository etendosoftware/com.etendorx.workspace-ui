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

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
  },
}));
jest.mock("@/utils/logger");

import { GET } from "../route";

const FORCED_URL = "https://ui.example.com/";

describe("GET /api/auth/login-config", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "https://erp.example/etendo" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
    global.fetch = originalFetch;
  });

  const mockFetch = (implementation: () => Promise<unknown>) => {
    global.fetch = jest.fn(implementation) as unknown as typeof fetch;
  };

  it("answers the forced login address the ERP holds", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ forcedLoginUrl: FORCED_URL }) }));

    const response = (await GET()) as unknown as { body: unknown };

    expect(response.body).toEqual({ forcedLoginUrl: FORCED_URL });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://erp.example/etendo/sws/com.etendoerp.metadata.meta/login-config",
      { method: "POST" }
    );
  });

  it.each([
    ["the ERP refuses the request", async () => ({ ok: false, json: async () => ({}) })],
    ["the ERP answers without the address", async () => ({ ok: true, json: async () => ({}) })],
    ["the ERP cannot be reached", async () => Promise.reject(new Error("down"))],
  ])("answers the standard login when %s", async (_case, implementation) => {
    mockFetch(implementation);

    const response = (await GET()) as unknown as { body: unknown };

    expect(response.body).toEqual({ forcedLoginUrl: "" });
  });
});
