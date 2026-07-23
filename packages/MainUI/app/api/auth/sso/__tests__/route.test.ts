import { GET, POST } from "../[...slug]/route";
import { setErpSessionCookie, setErpCsrfToken } from "@/app/api/_utils/sessionStore";

jest.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));
jest.mock("@/app/api/_utils/sessionStore", () => ({
  setErpSessionCookie: jest.fn(),
  setErpCsrfToken: jest.fn(),
}));

const params = (slug: string[]) => Promise.resolve({ slug });
const headers = (opts: { setCookie?: string[]; csrf?: string } = {}) => ({
  get: (h: string) => (h.toLowerCase() === "x-csrf-token" ? (opts.csrf ?? null) : (opts.setCookie?.[0] ?? null)),
  getSetCookie: () => opts.setCookie,
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ETENDO_CLASSIC_URL = "https://erp/etendo";
});

describe("SSO proxy route", () => {
  it("GET forwards to the metadata SSO servlet and returns the payload", async () => {
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({ status: 200, json: () => Promise.resolve({ enabled: true }) })
    );
    const res = await GET({} as never, { params: params(["config"]) });
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toBe("https://erp/etendo/sws/com.etendoerp.metadata.meta/sso/config");
    expect(res).toEqual({ body: { enabled: true }, status: 200 });
  });

  it("GET returns 502 when the backend is unreachable", async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.reject(new Error("down")));
    const res = await GET({} as never, { params: params(["config"]) });
    expect(res).toEqual({ body: { error: "sso_proxy_error" }, status: 502 });
  });

  it("POST stores the ERP session cookie on a successful callback", async () => {
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: headers({ setCookie: ["JSESSIONID=abc123; Path=/"], csrf: "csrf-1" }),
        json: () => Promise.resolve({ token: "jwt-xyz" }),
      })
    );
    const request = { text: () => Promise.resolve(JSON.stringify({ accessToken: "mw" })) };
    const res = await POST(request as never, { params: params(["callback"]) });
    expect(res.status).toBe(200);
    expect(setErpSessionCookie).toHaveBeenCalledWith("jwt-xyz", {
      cookieHeader: "JSESSIONID=abc123",
      csrfToken: "csrf-1",
    });
  });

  it("POST passes through the backend error status without storing a cookie", async () => {
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        headers: headers(),
        json: () => Promise.resolve({ error: "no_user_linked" }),
      })
    );
    const request = { text: () => Promise.resolve("{}") };
    const res = await POST(request as never, { params: params(["callback"]) });
    expect(res).toEqual({ body: { error: "no_user_linked" }, status: 404 });
    expect(setErpSessionCookie).not.toHaveBeenCalled();
    expect(setErpCsrfToken).not.toHaveBeenCalled();
  });
});
