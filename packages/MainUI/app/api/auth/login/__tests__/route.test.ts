/**
 * Login route: credentials go through the Classic failed-attempt protections
 * (com.etendoerp.metadata.meta/login-guard) before /sws/login; after an initial username/password
 * login, the token is aligned with the user's Classic login defaults
 * (com.etendoerp.metadata.meta/login-defaults) and the login is recorded in the Classic session
 * registry (com.etendoerp.metadata.meta/login-session), both best-effort.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
  },
}));

import type { NextRequest } from "next/server";
import { POST } from "../route";
import {
  clearAllErpSessions,
  getErpLoginSessionId,
  getErpSessionCookie,
  setErpLoginSessionId,
} from "@/app/api/_utils/sessionStore";

const ERP_URL = "https://erp.example/etendo";
const LOGIN_URL = `${ERP_URL}/sws/login`;
const LOGIN_DEFAULTS_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/login-defaults`;
const CHANGE_PROFILE_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/change-profile`;
const LOGIN_GUARD_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/login-guard`;
const LOGIN_SESSION_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/login-session`;
const META_LOGIN_URL = `${ERP_URL}/sws/com.etendoerp.metadata.meta/login`;
const LOGIN_SESSION_ID = "login-session-id";
const CREDENTIALS = { username: "user", password: "secret" };
const FIRST_TOKEN = "first-token";
const ALIGNED_TOKEN = "aligned-token";
const ORG_HAS_NO_WAREHOUSES_ERROR = "SMFSWS_OrgHasNoRole";
const CLASSIC_DEFAULTS = { role: "role-min", organization: "org-max", warehouse: "wh-min", current: false };

type FakeResponse = { ok: boolean; status: number; headers: Headers; json: () => Promise<unknown> };

function erpResponse(
  body: unknown,
  { ok = true, jsessionId, status }: { ok?: boolean; jsessionId?: string; status?: number } = {}
): FakeResponse {
  const headers = new Headers();
  if (jsessionId) headers.set("set-cookie", `JSESSIONID=${jsessionId}; Path=/`);
  return { ok, status: status ?? (ok ? 200 : 500), headers, json: async () => body };
}

function makeRequest(body: unknown, bearer?: string): NextRequest {
  const headers = new Headers();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  return {
    headers,
    url: "https://localhost:3000/api/auth/login",
    json: async () => body,
  } as NextRequest;
}

/**
 * Routes every fetched URL to a queue of fake responses, in call order. Unless the test routes them
 * itself, the login guard accepts the credentials and the login session is recorded.
 */
function mockErp(routes: Record<string, FakeResponse[]>): jest.Mock {
  const allRoutes: Record<string, FakeResponse[]> = {
    [LOGIN_GUARD_URL]: [erpResponse({})],
    [LOGIN_SESSION_URL]: [erpResponse({ sessionId: LOGIN_SESSION_ID })],
    ...routes,
  };
  const fetchMock = jest.fn(async (url: string) => {
    const response = allRoutes[url]?.shift();
    if (!response) throw new Error(`Unexpected request to ${url}`);
    return response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function callsTo(fetchMock: jest.Mock, url: string): [string, RequestInit][] {
  return fetchMock.mock.calls.filter(([calledUrl]) => calledUrl === url);
}

function requestBodies(fetchMock: jest.Mock, url: string): unknown[] {
  return callsTo(fetchMock, url).map(([, init]) => JSON.parse(init.body as string));
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
    global.fetch = originalFetch;
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
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: `Bearer ${FIRST_TOKEN}` }),
      })
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
    expect(requestBodies(fetchMock, LOGIN_URL)[1]).toEqual({
      role: "role-min",
      organization: "org-max",
      warehouse: "wh-min",
    });
    const switchHeaders = callsTo(fetchMock, LOGIN_URL)[1][1].headers;
    expect(switchHeaders).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${FIRST_TOKEN}`, Cookie: "JSESSIONID=FIRST" })
    );
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
    expect(callsTo(fetchMock, LOGIN_DEFAULTS_URL)).toHaveLength(0);
  });
});

describe("POST /api/auth/login — Classic failed-attempt protections and session registry", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch;
  const ROLE_SWITCH_TOKEN = "role-switch-token";

  beforeEach(() => {
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: ERP_URL };
    clearAllErpSessions();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    global.fetch = originalFetch;
  });

  /** Logs in with credentials whose token already uses the Classic defaults. */
  async function loginWith(routes: Record<string, FakeResponse[]>) {
    const fetchMock = mockErp({
      [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN })],
      [LOGIN_DEFAULTS_URL]: [erpResponse({ ...CLASSIC_DEFAULTS, current: true })],
      ...routes,
    });
    const res = await POST(makeRequest(CREDENTIALS));
    return { fetchMock, res };
  }

  it("checks only the credentials with the login guard before /sws/login", async () => {
    const { fetchMock } = await loginWith({});

    expect(requestBodies(fetchMock, LOGIN_GUARD_URL)).toEqual([CREDENTIALS]);
    expect(fetchMock.mock.calls[0][0]).toBe(LOGIN_GUARD_URL);
  });

  it("refuses the login with the guard message without calling /sws/login", async () => {
    const { fetchMock, res } = await loginWith({
      [LOGIN_GUARD_URL]: [erpResponse({ error: "User is locked" }, { ok: false, status: 401 })],
    });

    expect(res).toEqual({ status: 401, body: { message: "User is locked" } });
    expect(callsTo(fetchMock, LOGIN_URL)).toHaveLength(0);
  });

  it("refuses the login with the default message when the guard refusal has no body", async () => {
    const { res } = await loginWith({
      [LOGIN_GUARD_URL]: [{ ...erpResponse(null, { ok: false, status: 401 }), json: async () => Promise.reject() }],
    });

    expect(res).toEqual({ status: 401, body: { message: "Login failed" } });
  });

  it.each([
    ["answers another error", { [LOGIN_GUARD_URL]: [erpResponse(null, { ok: false, status: 404 })] }],
    ["is unreachable", { [LOGIN_GUARD_URL]: [] }],
  ])("goes on with the login when the guard %s", async (_case, routes) => {
    const { res } = await loginWith(routes);

    expect(res.body).toEqual({ token: FIRST_TOKEN });
  });

  it("records the session of a /sws/login token and keeps its id on the server", async () => {
    const { fetchMock, res } = await loginWith({});

    expect(res.body).toEqual({ token: FIRST_TOKEN });
    expect(callsTo(fetchMock, LOGIN_SESSION_URL)[0][1].headers).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${FIRST_TOKEN}` })
    );
    expect(getErpLoginSessionId(FIRST_TOKEN)).toBe(LOGIN_SESSION_ID);
  });

  it("records the session of the token aligned with the Classic defaults", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [erpResponse({ token: FIRST_TOKEN }), erpResponse({ token: ALIGNED_TOKEN })],
      [LOGIN_DEFAULTS_URL]: [erpResponse(CLASSIC_DEFAULTS)],
    });

    await POST(makeRequest(CREDENTIALS));

    expect(callsTo(fetchMock, LOGIN_SESSION_URL)[0][1].headers).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${ALIGNED_TOKEN}` })
    );
    expect(getErpLoginSessionId(ALIGNED_TOKEN)).toBe(LOGIN_SESSION_ID);
  });

  it("keeps the login when the session cannot be recorded", async () => {
    const { res } = await loginWith({ [LOGIN_SESSION_URL]: [erpResponse(null, { ok: false })] });

    expect(res.body).toEqual({ token: FIRST_TOKEN });
    expect(getErpLoginSessionId(FIRST_TOKEN)).toBeNull();
  });

  it("uses the session recorded by the /meta/login fallback and does not return its id", async () => {
    const fetchMock = mockErp({
      [LOGIN_URL]: [erpResponse({ status: "error", message: ORG_HAS_NO_WAREHOUSES_ERROR })],
      [META_LOGIN_URL]: [erpResponse({ token: ALIGNED_TOKEN, sessionId: "fallback-session" })],
    });

    const res = await POST(makeRequest(CREDENTIALS));

    expect(res.body).toEqual({ token: ALIGNED_TOKEN });
    expect(getErpLoginSessionId(ALIGNED_TOKEN)).toBe("fallback-session");
    expect(callsTo(fetchMock, LOGIN_SESSION_URL)).toHaveLength(0);
  });

  it("carries the login session over a role switch without checking credentials", async () => {
    setErpLoginSessionId(FIRST_TOKEN, LOGIN_SESSION_ID);
    const fetchMock = mockErp({ [LOGIN_URL]: [erpResponse({ token: ROLE_SWITCH_TOKEN })] });

    await POST(makeRequest({ role: "role-1" }, FIRST_TOKEN));

    expect(getErpLoginSessionId(ROLE_SWITCH_TOKEN)).toBe(LOGIN_SESSION_ID);
    expect(callsTo(fetchMock, LOGIN_GUARD_URL)).toHaveLength(0);
    expect(callsTo(fetchMock, LOGIN_SESSION_URL)).toHaveLength(0);
  });
});
