/**
 * Integration-like tests: /api/erp/[...slug] should append query for PUT/DELETE.
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

import { PUT, DELETE } from "../route";
import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
const routeModule = require("../route");

describe("ERP slug: query append for mutations", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;
  const BEARER_TOKEN = "Bearer-Token-XYZ";

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };

    // Configure session cookie for tests
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({}),
      text: async () => JSON.stringify({ ok: true }),
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(method: string, url: string, bearer: string, body = ""): NextRequest {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${bearer}`);
    headers.set("Content-Type", "application/json");

    return {
      method,
      headers,
      url,
      body: null, // Not a stream for these tests
      text: async () => body,
      json: async () => (body ? JSON.parse(body) : {}),
    } as NextRequest;
  }

  it("PUT appends query", async () => {
    const req = makeRequest(
      "PUT",
      "http://localhost:3000/api/erp/meta/tab/186?language=en_US",
      BEARER_TOKEN,
      '{"a":1}'
    );
    await PUT(req, { params: Promise.resolve({ slug: ["meta", "tab", "186"] }) });
    const [dest, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/sws/com.etendoerp.metadata.meta/tab/186?language=en_US");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"a":1}');
  });

  it("DELETE appends query", async () => {
    const req = makeRequest("DELETE", "http://localhost:3000/api/erp/meta/tab/186?lang=es", BEARER_TOKEN, "");
    await DELETE(req, { params: Promise.resolve({ slug: ["meta", "tab", "186"] }) });
    const [dest, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/sws/com.etendoerp.metadata.meta/tab/186?lang=es");
    expect(init.method).toBe("DELETE");
  });

  it("POST appends query and preserves JSON body", async () => {
    const req = makeRequest(
      "POST",
      "http://localhost:3000/api/erp/meta/window/143?language=en_US",
      BEARER_TOKEN,
      '{"z":9}'
    );
    await routeModule.POST(req, { params: Promise.resolve({ slug: ["meta", "window", "143"] }) });
    const [dest, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/sws/com.etendoerp.metadata.meta/window/143?language=en_US");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"z":9}');
  });
});
