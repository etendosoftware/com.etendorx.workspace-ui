/**
 * Tests for /api/datasource/:entity save/update flow.
 * Verifies JSON → form conversion, CSRF header propagation, and query passthrough.
 */

import type { NextRequest } from "next/server";

// Mock next/server to avoid depending on Next runtime
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
    },
  };
});

// Import after mocking
import { POST } from "../route";

describe("API: /api/datasource/:entity save/update", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ response: { status: 0 } }),
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(url: string, bearer: string, jsonBody: any): NextRequest {
    // Build a minimal NextRequest-like object (runtime doesn't check instance)
    const headers = new Map<string, string>();
    headers.set("Authorization", `Bearer ${bearer}`);
    headers.set("Content-Type", "application/json");
    return {
      method: "POST",
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it("forwards to ERP with form-urlencoded body and X-CSRF-Token header", async () => {
    const body = {
      dataSource: "isc_OBViewDataSource_0",
      operationType: "add",
      componentId: "isc_OBViewForm_0",
      csrfToken: "CSRF123",
      data: { key: "val" },
      oldValues: { prev: 1 },
    };
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=167&tabId=263&_operationType=add";
    const request = makeRequest(url, "token-abc", body);

    const res: any = await POST(request, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);
    expect((global as any).fetch).toHaveBeenCalledTimes(1);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=167&tabId=263&_operationType=add"
    );
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-abc");
    expect(init.headers.Accept).toBe("application/json");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('"operationType":"add"');
    expect(decoded).toContain('"componentId":"isc_OBViewForm_0"');
    expect(decoded).toContain('"csrfToken":"CSRF123"');
    expect(decoded).toContain('"data":{"key":"val"}');
    expect(decoded).toContain('"oldValues":{"prev":1}');
  });

  it("passes through non-JSON bodies with original content-type", async () => {
    const headers = new Map<string, string>();
    headers.set("Authorization", "Bearer token-xyz");
    headers.set("Content-Type", "application/x-custom");
    const rawBody = "raw-binary-or-custom";
    const request = {
      method: "POST",
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url: "http://localhost:3000/api/datasource/Order?windowId=1&tabId=2&_operationType=update",
      text: async () => rawBody,
    } as unknown as NextRequest;

    await POST(request, { params: { entity: "Order" } } as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=1&tabId=2&_operationType=update"
    );
    expect(init.headers["Content-Type"]).toBe("application/x-custom");
    expect(init.body).toBe(rawBody);
  });
});
