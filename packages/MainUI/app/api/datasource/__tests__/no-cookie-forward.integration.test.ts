/**
 * When ERP_FORWARD_COOKIES=false, the proxy must NOT forward Cookie header to ERP.
 */

import type { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache:
    (fn: any) =>
    (...args: any[]) =>
      fn(...args),
}));

jest.mock("@/lib/auth", () => ({
  getUserContext: jest
    .fn()
    .mockResolvedValue({ userId: "100", clientId: "C", orgId: "O", roleId: "R", warehouseId: "W" }),
  extractBearerToken: jest.fn().mockReturnValue("token-nocookie"),
}));

import { POST } from "../route";

describe("Datasource (grid) does not forward Cookie when ERP_FORWARD_COOKIES=false", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo", ERP_FORWARD_COOKIES: "false" };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ response: { status: 0 } }),
      json: async () => ({ response: { status: 0 } }),
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(bearer: string, jsonBody: any, cookie = "JSESSIONID=abc"): NextRequest {
    const headers = new Map<string, string>();
    headers.set("Authorization", `Bearer ${bearer}`);
    headers.set("Content-Type", "application/json");
    headers.set("cookie", cookie);
    return {
      method: "POST",
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url: "http://localhost:3000/api/datasource",
      text: async () => JSON.stringify(jsonBody),
      json: async () => jsonBody,
    } as unknown as NextRequest;
  }

  it("omits Cookie header in ERP forward", async () => {
    const params = { _operationType: "fetch", _startRow: "0", _endRow: "10" };
    const body = { entity: "Invoice", params };
    const req = makeRequest("token-nocookie", body);
    const res: any = await POST(req as any);
    expect(res.status).toBe(200);
    const [_dest, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer token-nocookie");
    expect(init.headers["Cookie"]).toBeUndefined();
  });
});
