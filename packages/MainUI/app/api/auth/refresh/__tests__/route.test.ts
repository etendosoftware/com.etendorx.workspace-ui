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

import { POST } from "../route";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { handOffErpSession } from "@/app/api/_utils/erpSession";
import { buildErpResponse as erpResponse } from "@/utils/testUtils/erpResponses";

jest.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));
jest.mock("@/lib/auth", () => ({ extractBearerToken: jest.fn() }));
jest.mock("@/app/api/_utils/forwardConfig", () => ({ getErpAuthHeaders: jest.fn() }));
jest.mock("@/app/api/_utils/erpSession", () => ({ handOffErpSession: jest.fn() }));

const OLD_TOKEN = "old-jwt";
const NEW_TOKEN = "new-jwt";
const COOKIE_HEADER = "JSESSIONID=ABC";
const CSRF_TOKEN = "csrf-1";
const ERP_BASE_URL = "https://erp/etendo";
const LOGIN_URL = `${ERP_BASE_URL}/sws/login`;
const CHANGE_PROFILE_URL = `${ERP_BASE_URL}/sws/com.etendoerp.metadata.meta/change-profile`;
const ORG_HAS_NO_WAREHOUSES_ERROR = "SMFSWS_OrgHasNoRole";

/** Queues the given ERP responses, in order, for successive fetch calls. */
function mockErpResponses(...responses: Response[]) {
  const fetchMock = jest.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  (global.fetch as jest.Mock) = fetchMock;

  return fetchMock;
}

const request = {} as never;

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ETENDO_CLASSIC_URL = ERP_BASE_URL;
    (extractBearerToken as jest.Mock).mockReturnValue(OLD_TOKEN);
    (getErpAuthHeaders as jest.Mock).mockReturnValue({ cookieHeader: COOKIE_HEADER, csrfToken: CSRF_TOKEN });
    // Always a spy, so "was the ERP contacted at all?" is assertable in every test.
    (global.fetch as jest.Mock) = jest.fn();
  });

  it("returns 401 when the request carries no Bearer token", async () => {
    (extractBearerToken as jest.Mock).mockReturnValue(null);

    const res = await POST(request);

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forwards the token, cookie and CSRF header to the ERP login endpoint", async () => {
    const fetchMock = mockErpResponses(erpResponse({ body: { status: "success", token: NEW_TOKEN } }));

    const res = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(LOGIN_URL);
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
    expect(init.headers.Authorization).toBe(`Bearer ${OLD_TOKEN}`);
    expect(init.headers.Cookie).toBe(COOKIE_HEADER);
    expect(init.headers["X-CSRF-Token"]).toBe(CSRF_TOKEN);
    expect(res).toEqual({ body: { token: NEW_TOKEN }, status: 200 });
  });

  // Sending an empty Cookie or CSRF header is not the same as sending none: the ERP would read them
  // as a request to use a blank session, so they must be omitted entirely.
  it("omits the Cookie and CSRF headers when no ERP session is stored yet", async () => {
    (getErpAuthHeaders as jest.Mock).mockReturnValue({ cookieHeader: "", csrfToken: null });
    const fetchMock = mockErpResponses(erpResponse({ body: { status: "success", token: NEW_TOKEN } }));

    const res = await POST(request);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty("Cookie");
    expect(init.headers).not.toHaveProperty("X-CSRF-Token");
    expect(init.headers.Authorization).toBe(`Bearer ${OLD_TOKEN}`);
    expect(res.status).toBe(200);
  });

  it("hands the ERP session over from the old token to the new one", async () => {
    const response = erpResponse({ body: { status: "success", token: NEW_TOKEN } });
    mockErpResponses(response);

    await POST(request);

    expect(handOffErpSession).toHaveBeenCalledWith(response, NEW_TOKEN, OLD_TOKEN);
  });

  it("falls back to change-profile when the organization has no warehouses", async () => {
    const fetchMock = mockErpResponses(
      erpResponse({ body: { status: "error", message: ORG_HAS_NO_WAREHOUSES_ERROR } }),
      erpResponse({ body: { token: NEW_TOKEN } })
    );

    const res = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(CHANGE_PROFILE_URL);
    expect(res).toEqual({ body: { token: NEW_TOKEN }, status: 200 });
  });

  describe("failures", () => {
    // The store must survive a failed renewal: the current token is still usable until it expires.
    it("returns 401 and leaves the session store untouched when the ERP rejects the token", async () => {
      mockErpResponses(erpResponse({ ok: false, status: 401, body: null }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("returns 401 and leaves the session store untouched on an ERP server error", async () => {
      mockErpResponses(erpResponse({ ok: false, status: 500, body: null }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    // /sws/login reports failures as HTTP 200 with {status: "error"}.
    it("returns 401 when the ERP answers 200 with an error payload", async () => {
      mockErpResponses(erpResponse({ body: { status: "error", message: "SMFSWS_InvalidToken" } }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    // A 200 whose body cannot be parsed must be read as a failure, never as a renewal with an
    // undefined token — that would hand the ERP session over to "undefined" and lock the user out.
    it("returns 401 when the ERP answers 200 with a body that is not valid JSON", async () => {
      mockErpResponses(erpResponse({ malformedBody: true }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("returns 401 when the change-profile fallback answers with a body that is not valid JSON", async () => {
      mockErpResponses(
        erpResponse({ body: { status: "error", message: ORG_HAS_NO_WAREHOUSES_ERROR } }),
        erpResponse({ malformedBody: true })
      );

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("returns 401 when the ERP answers with an empty token", async () => {
      mockErpResponses(erpResponse({ body: { status: "success", token: "" } }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("returns 401 when the ERP answers without a token", async () => {
      mockErpResponses(erpResponse({ body: { status: "success" } }));

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("returns 401 when the change-profile fallback also fails", async () => {
      mockErpResponses(
        erpResponse({ body: { status: "error", message: ORG_HAS_NO_WAREHOUSES_ERROR } }),
        erpResponse({ ok: false, status: 401, body: null })
      );

      const res = await POST(request);

      expect(res.status).toBe(401);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });

    it("reports a server error when ETENDO_CLASSIC_URL is not configured", async () => {
      process.env.ETENDO_CLASSIC_URL = "";

      const res = await POST(request);

      expect(res.status).toBe(500);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("reports an error when the ERP is unreachable", async () => {
      (global.fetch as jest.Mock) = jest.fn(() => Promise.reject(new Error("down")));

      const res = await POST(request);

      expect(res.status).toBe(500);
      expect(handOffErpSession).not.toHaveBeenCalled();
    });
  });
});
