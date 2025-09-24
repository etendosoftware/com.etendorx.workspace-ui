/**
 * Tests for /api/datasource/:entity save/update flow.
 * Verifies JSON → form conversion, CSRF header propagation, and query passthrough.
 */

import type { NextRequest } from "next/server";

// Import shared mocks before importing the module under test to ensure mocks are applied
import "../../../_test-utils/test-shared-mocks";

// Import after mocking
import { POST } from "../route";
import { assertErpForwardCall } from "../../../_test-utils/fetch-assertions";
import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import { getExpectedDatasourceUrl } from "../../../_test-utils/endpoint-test-utils";

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
    const BEARER_TOKEN = "Bearer-Token-123";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const body = {
      dataSource: "isc_OBViewDataSource_0",
      operationType: "add",
      componentId: "isc_OBViewForm_0",
      csrfToken: "CSRF123",
      data: { key: "val" },
      oldValues: { prev: 1 },
    };
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=167&tabId=263&_operationType=add";
    const request = makeRequest(url, BEARER_TOKEN, body);

    const res: any = await POST(request, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);
    expect((global as any).fetch).toHaveBeenCalledTimes(1);

    const expectedUrl = getExpectedDatasourceUrl("Invoice", "add", {
      windowId: "167",
      tabId: "263",
      _operationType: "add",
    });

    const { decoded } = assertErpForwardCall(expectedUrl, `Bearer ${BEARER_TOKEN}`, undefined, "application/json");
    expect(decoded).toContain('"operationType":"add"');
    expect(decoded).toContain('"componentId":"isc_OBViewForm_0"');
    expect(decoded).toContain('"csrfToken":"CSRF-TEST-123"'); // Should be replaced with token from session store
    expect(decoded).toContain('"data":{"key":"val"}');
    expect(decoded).toContain('"oldValues":{"prev":1}');
  });

  it("passes through non-JSON bodies with original content-type", async () => {
    const BEARER_TOKEN = "Bearer-Token-XYZ";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const headers = new Map<string, string>();
    headers.set("Authorization", `Bearer ${BEARER_TOKEN}`);
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

    const expectedUrl = getExpectedDatasourceUrl("Order", "update", {
      windowId: "1",
      tabId: "2",
      _operationType: "update",
    });

    expect(String(dest)).toBe(expectedUrl);
    expect(init.headers["Content-Type"]).toBe("application/x-custom");
    expect(init.body).toBe(`${rawBody}&csrfToken=CSRF-TEST-123`);
  });
});
