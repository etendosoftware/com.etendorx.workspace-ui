/**
 * Login route: after an initial username/password login, the token is aligned with the user's
 * Classic login defaults (com.etendoerp.metadata.meta/login-defaults), best-effort.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
  },
}));

import type { NextRequest } from "next/server";
import { POST } from "../route";
import { getErpSessionCookie } from "@/app/api/_utils/sessionStore";

const ERP_URL = "https://erp.example/etendo";
const LOGIN_URL = `${ERP_URL}/sws/login`;
const LOGIN_DEFAULTS_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/login-defaults`;
const CHANGE_PROFILE_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/change-profile`;
const CREDENTIALS = { username: "user", password: "secret" };
const FIRST_TOKEN = "first-token";
const ALIGNED_TOKEN = "aligned-token";
const ORG_HAS_NO_WAREHOUSES_ERROR = "SMFSWS_OrgHasNoRole";
const CLASSIC_DEFAULTS = { role: "role-min", organization: "org-max", warehouse: "wh-min", current: false };

type FakeResponse = { ok: boolean; status: number; headers: Headers; json: () => Promise<unknown> };

function erpResponse(body: unknown, { ok = true, jsessionId }: { ok?: boolean; jsessionId?: string } = {}): FakeResponse {
  const headers = new Headers();
  if (jsessionId) headers.set("set-cookie", `JSESSIONID=${jsessionId}; Path=/`);
  return { ok, status: ok ? 200 : 500, headers, json: async () => body };
}

function makeRequest(body: unknown): NextRequest {
  return { headers: new Headers(), url: "https://localhost:3000/api/auth/login", json: async () => body } as NextRequest;
}

/** Routes every fetched URL to a queue of fake responses, in call order. */
function mockErp(routes: Record<string, FakeResponse[]>): jest.Mock {
  const fetchMock = jest.fn(async (url: string) => {
    const response = routes[url]?.shift();
    if (!response) throw new Error(`Unexpected request to ${url}`);
    return response;
  });
  (global as any).fetch = fetchMock;
  return fetchMock;
}

function requestBodies(fetchMock: jest.Mock, url: string): unknown[] {
  return fetchMock.mock.calls.filter(([calledUrl]) => calledUrl === url).map(([, init]) => JSON.parse(init.body));
}

describe("POST /api/auth/login — Classic login defaults", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: ERP_URL };
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  it("keeps the original token when it already uses the Classic defaults", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN })],
      [LOGIN_DEFAULTS_URL]: [erpResponse({ ...CLASSIC_DEFAULTS, current: true })],
    });

    const res = await POST(makeRequest(CREDENTIALS));

    expect(res.body).toEqual({ token: FIRST_TOKEN });
    expect(fetchMock).toHaveBeenCalledWith(
      LOGIN_DEFAULTS_URL,
      expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: `Bearer ${FIRST_TOKEN}` }) })
    );
    expect(requestBodies(fetchMock, LOGIN_URL)).toHaveLength(1);
  });

  it("switches the token to the Classic defaults and hands the ERP session over", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [
        erpResponse({ token: FIRST_TOKEN }, { jsessionId: "FIRST" }),
        erpResponse({ token: ALIGNED_TOKEN }, { jsessionId: "ALIGNED" }),
      ],
      [LOGIN_DEFAULTS_URL]: [erpResponse(CLASSIC_DEFAULTS)],
    });

    const res = await POST(makeRequest(CREDENTIALS));

    expect(res.body).toEqual({ token: ALIGNED_TOKEN });
    expect(requestBodies(fetchMock, LOGIN_URL)[1]).toEqual({ role: "role-min", organization: "org-max", warehouse: "wh-min" });
    const switchHeaders = fetchMock.mock.calls[2][1].headers;
    expect(switchHeaders).toEqual(expect.objectContaining({ Authorization: `Bearer ${FIRST_TOKEN}`, Cookie: "JSESSIONID=FIRST" }));
    expect(getErpSessionCookie(ALIGNED_TOKEN)).toBe("JSESSIONID=ALIGNED");
    expect(getErpSessionCookie(FIRST_TOKEN)).toBeNull();
  });

  it("omits the warehouse when the Classic defaults have none", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN }), erpResponse({ token: ALIGNED_TOKEN })],
      [LOGIN_DEFAULTS_URL]: [erpResponse({ role: "role-min", organization: "org-max", current: false })],
    });

    await POST(makeRequest(CREDENTIALS));

    expect(requestBodies(fetchMock, LOGIN_URL)[1]).toEqual({ role: "role-min", organization: "org-max" });
  });

  it("falls back to change-profile when the default organization has no warehouses", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [
        erpResponse({ token: FIRST_TOKEN }),
        erpResponse({ status: "error", message: ORG_HAS_NO_WAREHOUSES_ERROR }),
      ],
      [LOGIN_DEFAULTS_URL]: [erpResponse(CLASSIC_DEFAULTS)],
      [CHANGE_PROFILE_URL]: [erpResponse({ token: ALIGNED_TOKEN })],
    });

    const res = await POST(makeRequest(CREDENTIALS));

    expect(res.body).toEqual({ token: ALIGNED_TOKEN });
    expect(requestBodies(fetchMock, CHANGE_PROFILE_URL)).toEqual([
      { role: "role-min", organization: "org-max", warehouse: "wh-min" },
    ]);
  });

  async function expectOriginalTokenKept(routes: Record<string, FakeResponse[]>, switchResponses: FakeResponse[] = []) {
    mockErp({ ...routes, [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN }), ...switchResponses] });

    const res = await POST(makeRequest(CREDENTIALS));

    expect(res.body).toEqual({ token: FIRST_TOKEN });
  }

  it("keeps the original token when the defaults request fails", async () => {
    await expectOriginalTokenKept({ [LOGIN_DEFAULTS_URL]: [erpResponse(null, { ok: false })] });
  });

  it("keeps the original token when the defaults request throws", async () => {
    await expectOriginalTokenKept({});
  });

  it("keeps the original token when the switch returns another error", async () => {
    await expectOriginalTokenKept({ [LOGIN_DEFAULTS_URL]: [erpResponse(CLASSIC_DEFAULTS)] }, [
      erpResponse({ status: "error", message: "Other" }),
    ]);
  });

  it("keeps the original token when the switch request fails", async () => {
    await expectOriginalTokenKept({ [LOGIN_DEFAULTS_URL]: [erpResponse(CLASSIC_DEFAULTS)] }, [
      erpResponse(null, { ok: false }),
    ]);
  });

  it("does not ask for the defaults when the request names a role", async () => {
    const fetchMock = mockErp({ [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN })] });

    const res = await POST(makeRequest({ ...CREDENTIALS, role: "role-1" }));

    expect(res.body).toEqual({ token: FIRST_TOKEN });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
