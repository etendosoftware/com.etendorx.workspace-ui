/**
 * Tests for /api/erp base route forward logic.
 * Verifies special-case forward for FormInitializationComponent and query passthrough.
 */

import type { NextRequest } from "next/server";

jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
    },
  };
});

// Mock getErpAuthHeaders to return both cookie and CSRF token
jest.mock("@/app/api/_utils/forwardConfig", () => ({
  getErpAuthHeaders: jest.fn((request: any, userToken: string) => {
    if (userToken === "token-with-session") {
      return {
        cookieHeader: "JSESSIONID=test-session-id; other=cookie",
        csrfToken: "CSRF-TEST-123",
      };
    }
    return {
      cookieHeader: "",
      csrfToken: null,
    };
  }),
}));

// Mock unstable_cache to directly invoke the wrapped function
jest.mock("next/cache", () => ({
  unstable_cache:
    (fn: any) =>
    (...args: any[]) =>
      fn(...args),
}));

import { POST } from "../route";
import { setErpSessionCookie } from "../../_utils/sessionStore";

describe("API: /api/erp base forward", () => {
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

  function makeRequest(url: string, bearer: string, body = ""): NextRequest {
    const headers = new Map<string, string>();
    headers.set("Authorization", `Bearer ${bearer}`);
    headers.set("Content-Type", "application/json");
    return {
      method: "POST",
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => body,
    } as unknown as NextRequest;
  }

  it("forwards FormInitializationComponent to kernel forward path", async () => {
    const BEARER_TOKEN = "Bearer-Token-Form-Init";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const url =
      "http://localhost:3000/api/erp?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent&language=en_US";
    const req = makeRequest(url, BEARER_TOKEN, '{"foo":"bar"}');
    await POST(req as any);
    const [dest] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent&language=en_US"
    );
  });

  it("forwards non-special POST to base ERP URL + query", async () => {
    const BEARER_TOKEN = "Bearer-Token-Non-Special";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const url = "http://localhost:3000/api/erp?foo=bar&x=1";
    const req = makeRequest(url, "token-abc", '{"k":"v"}');
    await POST(req as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel?foo=bar&x=1"
    );
    expect(init.method).toBe("POST");
    expect(init.headers["Cookie"]).toBeUndefined(); // No session for token-abc
    expect(init.body).toBe('{"k":"v"}');
  });

  it("forwards GET to base ERP URL + query with Authorization", async () => {
    const url = "http://localhost:3000/api/erp?foo=bar&x=1";
    const headers = new Map<string, string>();
    headers.set("Authorization", "Bearer get-token");
    const req = {
      method: "GET",
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => "",
    } as unknown as NextRequest;
    const { GET } = await import("../route");
    await GET(req as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel?foo=bar&x=1"
    );
    expect(init.method).toBe("GET");
    expect(init.headers["Authorization"]).toBe("Bearer get-token");
  });

  describe("Process execution", () => {
    it("forwards process execution to kernel with correct parameters", async () => {
      const url = "http://localhost:3000/api/erp?processId=EC2C48FB84274D3CB3A3F5FD49808926";
      const req = makeRequest(url, "process-token", '{"param1":"value1","param2":"value2"}');

      await POST(req as any);

      const [dest, init] = (global as any).fetch.mock.calls[0];
      expect(String(dest)).toBe(
        "http://erp.example/etendo/org.openbravo.client.kernel?processId=EC2C48FB84274D3CB3A3F5FD49808926&_action=org.openbravo.client.application.process.ExecuteProcessActionHandler"
      );
      expect(init.method).toBe("POST");
      expect(init.headers["Cookie"]).toBeUndefined(); // No session for process-token
      expect(init.body).toBe('{"param1":"value1","param2":"value2"}');
    });

    it("includes cookies when token has session", async () => {
      const url = "http://localhost:3000/api/erp?processId=EC2C48FB84274D3CB3A3F5FD49808926";
      const req = makeRequest(url, "token-with-session", '{"param":"value"}');

      await POST(req as any);

      const [, init] = (global as any).fetch.mock.calls[0];
      expect(init.headers["Cookie"]).toBe("JSESSIONID=test-session-id; other=cookie");
    });

    it("handles custom action handlers correctly", async () => {
      const url = "http://localhost:3000/api/erp?processId=TEST123&_action=com.etendoerp.copilot.process.SyncAssistant";
      const body = '{"recordIds":["REC123"],"_buttonValue":"DONE","_params":{},"_entityName":"ETCOP_App"}';
      const req = makeRequest(url, "token-with-session", body);

      await POST(req as any);

      const [dest, init] = (global as any).fetch.mock.calls[0];
      expect(String(dest)).toBe(
        "http://erp.example/etendo/org.openbravo.client.kernel?processId=TEST123&_action=com.etendoerp.copilot.process.SyncAssistant"
      );
      expect(init.body).toBe(body);
      expect(init.headers["Cookie"]).toBe("JSESSIONID=test-session-id; other=cookie");
    });

    it("returns 401 when no Bearer token provided for process execution", async () => {
      const url = "http://localhost:3000/api/erp?processId=SOME_PROCESS_ID";
      const headers = new Map<string, string>();
      headers.set("Content-Type", "application/json");
      const req = {
        method: "POST",
        headers: { get: (k: string) => headers.get(k) || null } as any,
        url,
        text: async () => '{"data":"test"}',
      } as unknown as NextRequest;

      const result = (await POST(req as any)) as any;
      expect(result.status).toBe(401);
      expect(result.body.error).toBe("Unauthorized - Missing Bearer token");
    });

    it("handles ERP server errors gracefully for process execution", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Process execution failed",
      });

      const url = "http://localhost:3000/api/erp?processId=FAILING_PROCESS";
      const req = makeRequest(url, "valid-token", '{"param":"value"}');

      const result = (await POST(req as any)) as any;
      expect(result.status).toBe(500);
      expect(result.body.error).toBe("ERP request failed: 500 Internal Server Error");
    });

    it("handles non-JSON responses from ERP server for process execution", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "OK - Process completed successfully",
      });

      const url = "http://localhost:3000/api/erp?processId=TEXT_RESPONSE_PROCESS";
      const req = makeRequest(url, "valid-token", '{"param":"value"}');

      const result = (await POST(req as any)) as any;
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe("OK - Process completed successfully");
    });
  });
});
