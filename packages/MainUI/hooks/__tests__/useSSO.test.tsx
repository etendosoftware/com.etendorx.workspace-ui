import { act, renderHook, waitFor } from "@testing-library/react";
import { useSSO } from "../useSSO";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({ Metadata: { setToken: jest.fn() } }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { setToken: jest.fn() } }));
jest.mock("@workspaceui/api-client/src/api/copilot/client", () => ({ CopilotClient: { setToken: jest.fn() } }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));
jest.mock("../useTranslation", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const setLoginErrorText = jest.fn();
const setLoginErrorDescription = jest.fn();
const setToken = jest.fn();
jest.mock("@/stores/userStore", () => {
  const store = (selector: (s: unknown) => unknown) =>
    selector({
      setLoginErrorText: (...a: unknown[]) => setLoginErrorText(...a),
      setLoginErrorDescription: (...a: unknown[]) => setLoginErrorDescription(...a),
    });
  (store as unknown as { getState: () => unknown }).getState = () => ({
    setToken: (...a: unknown[]) => setToken(...a),
  });
  return { useUserStore: store };
});

const AUTH0 = {
  enabled: true,
  authType: "Auth0",
  domain: "etendo.auth0.com",
  clientId: "abc123",
  callbackUrl: "http://cb",
};
const MIDDLEWARE = {
  enabled: true,
  authType: "Middleware",
  middlewareUrl: "https://sso.etendo.cloud",
  redirectUri: "http://backend/cb",
  accountId: "acc-1",
  providers: [{ id: "google-oauth2", name: "google" }],
};

const assign = jest.fn();

// The jest env ships a no-op Storage; install a real Map-backed one.
function installStorage(name: "localStorage" | "sessionStorage") {
  const m = new Map<string, string>();
  Object.defineProperty(window, name, {
    configurable: true,
    value: {
      getItem: (k: string) => (m.has(k) ? m.get(k) : null),
      setItem: (k: string, v: string) => m.set(k, String(v)),
      removeItem: (k: string) => m.delete(k),
      clear: () => m.clear(),
    },
  });
}

function mockLocation(search = "") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000", pathname: "/", search, assign },
  });
}

function mockFetch(configResponse: unknown, callbackResponse?: { ok: boolean; body: unknown }) {
  (global.fetch as jest.Mock) = jest.fn((url: string) => {
    if (url.includes("/config")) {
      return Promise.resolve({ json: () => Promise.resolve(configResponse) });
    }
    return Promise.resolve({
      ok: callbackResponse?.ok ?? true,
      json: () => Promise.resolve(callbackResponse?.body ?? {}),
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLocation("");
  window.history.replaceState = jest.fn();
  installStorage("localStorage");
  installStorage("sessionStorage");
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { randomUUID: () => "test-state" },
  });
});

describe("useSSO", () => {
  it("loads the config on mount", async () => {
    mockFetch(MIDDLEWARE);
    const { result } = renderHook(() => useSSO());
    await waitFor(() => expect(result.current.config).toEqual(MIDDLEWARE));
  });

  it("falls back to disabled when the config request fails", async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.reject(new Error("boom")));
    const { result } = renderHook(() => useSSO());
    await waitFor(() => expect(result.current.config).toEqual({ enabled: false }));
  });

  it("startAuth0 redirects to the authorize URL with a stored state", async () => {
    mockFetch(AUTH0);
    const { result } = renderHook(() => useSSO());
    await waitFor(() => expect(result.current.config).toEqual(AUTH0));
    act(() => result.current.startAuth0());
    const url = assign.mock.calls[0][0] as string;
    expect(url).toContain("https://etendo.auth0.com/authorize");
    expect(url).toContain("client_id=abc123");
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000");
    expect(url).toContain("state=test-state");
  });

  it("startMiddleware redirects to the middleware login URL", async () => {
    mockFetch(MIDDLEWARE);
    const { result } = renderHook(() => useSSO());
    await waitFor(() => expect(result.current.config).toEqual(MIDDLEWARE));
    act(() => result.current.startMiddleware("google-oauth2"));
    const url = assign.mock.calls[0][0] as string;
    expect(url).toContain("https://sso.etendo.cloud/login");
    expect(url).toContain("provider=google-oauth2");
    expect(url).toContain("account_id=acc-1");
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000");
  });

  it("startLink points the redirect at the link-callback route", async () => {
    mockFetch(MIDDLEWARE);
    const { result } = renderHook(() => useSSO());
    await waitFor(() => expect(result.current.config).toEqual(MIDDLEWARE));
    act(() => result.current.startLink("google-oauth2"));
    const url = assign.mock.calls[0][0] as string;
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fsso%2Flink-callback");
  });

  it("does not auto-exchange without the autoCallback flag", async () => {
    mockLocation("?access_token=tok");
    mockFetch(MIDDLEWARE, { ok: true, body: { token: "jwt" } });
    renderHook(() => useSSO());
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(setToken).not.toHaveBeenCalled();
  });

  it("auto-exchanges an access_token and plumbs the JWT", async () => {
    mockLocation("?access_token=tok");
    mockFetch(MIDDLEWARE, { ok: true, body: { token: "jwt-123" } });
    renderHook(() => useSSO({ autoCallback: true }));
    await waitFor(() => expect(setToken).toHaveBeenCalledWith("jwt-123"));
    expect(Metadata.setToken).toHaveBeenCalledWith("jwt-123");
  });

  it("shows the not-linked error on a 404 no_user_linked callback", async () => {
    mockLocation("?access_token=tok");
    mockFetch(MIDDLEWARE, { ok: false, body: { error: "no_user_linked" } });
    renderHook(() => useSSO({ autoCallback: true }));
    await waitFor(() => expect(setLoginErrorText).toHaveBeenCalledWith("login.sso.errors.notLinked.title"));
    expect(setToken).not.toHaveBeenCalled();
  });

  it("rejects a code return whose state does not match", async () => {
    window.sessionStorage.setItem("sso_state", "expected");
    mockLocation("?code=abc&state=WRONG");
    mockFetch(MIDDLEWARE);
    renderHook(() => useSSO({ autoCallback: true }));
    await waitFor(() => expect(setLoginErrorText).toHaveBeenCalledWith("login.sso.errors.failed.title"));
    // the token exchange must not run on a state mismatch
    expect(setToken).not.toHaveBeenCalled();
  });

  it("exchanges a code when the state matches", async () => {
    window.sessionStorage.setItem("sso_state", "ok-state");
    mockLocation("?code=the-code&state=ok-state");
    mockFetch(MIDDLEWARE, { ok: true, body: { token: "jwt-code" } });
    renderHook(() => useSSO({ autoCallback: true }));
    await waitFor(() => expect(setToken).toHaveBeenCalledWith("jwt-code"));
    const callbackCall = (global.fetch as jest.Mock).mock.calls.find((c) => String(c[0]).includes("/callback"));
    expect(JSON.parse(callbackCall[1].body)).toEqual({ code: "the-code", redirectUri: "http://localhost:3000" });
  });
});
