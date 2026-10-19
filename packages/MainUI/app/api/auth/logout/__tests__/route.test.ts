/**
 * Logout route: forwards revocation to com.etendoerp.metadata.meta/logout,
 * best-effort — must always clear local state even if the upstream call fails.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import type { NextRequest } from "next/server";
import { POST } from "../route";
import { getErpSessionCookie, setErpSessionCookie } from "@/app/api/_utils/sessionStore";

describe("POST /api/auth/logout", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;
  const TOKEN = "user-jwt";

  beforeEach(() => {
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "https://erp.example/etendo" };
    setErpSessionCookie(TOKEN, { cookieHeader: "JSESSIONID=ABC123", csrfToken: "CSRF" });
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(bearer: string | null): NextRequest {
    const headers = new Headers();
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
    return { method: "POST", headers, url: "https://localhost:3000/api/auth/logout" } as NextRequest;
  }

  it("calls the upstream revoke endpoint and clears the local session", async () => {
    const res = await POST(makeRequest(TOKEN));

    expect(global.fetch).toHaveBeenCalledWith(
      "https://erp.example/etendo/sws/com.etendoerp.metadata.meta/logout",
      expect.objectContaining({ method: "POST", headers: { Authorization: `Bearer ${TOKEN}` } })
    );
    expect(getErpSessionCookie(TOKEN)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("still clears local state and returns 200 when revocation fails", async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("upstream down"));

    const res = await POST(makeRequest(TOKEN));

    expect(getErpSessionCookie(TOKEN)).toBeNull();
    expect(res.status).toBe(200);
  });

  it("rejects requests without a bearer token before calling upstream", async () => {
    const res = await POST(makeRequest(null));

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
