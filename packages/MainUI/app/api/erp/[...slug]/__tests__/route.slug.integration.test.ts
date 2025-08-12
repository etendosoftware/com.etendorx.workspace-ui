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
const routeModule = require("../route");

describe("ERP slug: query append for mutations", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };
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
    const headers = new Map<string, string>();
    headers.set("Authorization", `Bearer ${bearer}`);
    headers.set("Content-Type", "application/json");
    return {
      method,
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => body,
    } as unknown as NextRequest;
  }

  it("PUT appends query", async () => {
    const req = makeRequest("PUT", "http://localhost:3000/api/erp/meta/tab/186?language=en_US", "tok", '{"a":1}');
    await PUT(req, { params: Promise.resolve({ slug: ["meta", "tab", "186"] }) } as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/meta/tab/186?language=en_US");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"a":1}');
  });

  it("DELETE appends query", async () => {
    const req = makeRequest("DELETE", "http://localhost:3000/api/erp/meta/tab/186?lang=es", "tok2", "");
    await DELETE(req, { params: Promise.resolve({ slug: ["meta", "tab", "186"] }) } as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/meta/tab/186?lang=es");
    expect(init.method).toBe("DELETE");
  });

  it("POST appends query and preserves JSON body", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/erp/meta/window/143?language=en_US", "tok3", '{"z":9}');
    await routeModule.POST(req, { params: Promise.resolve({ slug: ["meta", "window", "143"] }) } as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/meta/window/143?language=en_US");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"z":9}');
  });
});
