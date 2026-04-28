/**
 * Comprehensive coverage tests for /api/erp/[...slug]/route.ts
 */

import { NextResponse } from "next/server";
import { GET, POST, PATCH } from "../route";

if (typeof global.ReadableStream === "undefined") {
  (global as any).ReadableStream = class ReadableStream {};
}

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      ok: true,
      status: init?.status ?? 200,
      body,
      isNextResponse: true,
    })),
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

jest.mock("@/lib/auth", () => ({
  extractBearerToken: jest.fn(),
}));

jest.mock("../../../_utils/forwardConfig", () => ({
  getErpAuthHeaders: jest.fn(),
}));

// Provide access to mocks
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../../_utils/forwardConfig";
const mockedExtractToken = extractBearerToken as jest.Mock;
const mockedGetAuthHeaders = getErpAuthHeaders as jest.Mock;

describe("ERP slug route coverage", () => {
  const OLD_ENV = process.env;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "https://erp.example", ETENDO_CLASSIC_HOST: "https://erp.example" };

    originalFetch = global.fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
      text: async () => JSON.stringify({ success: true }),
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    mockedExtractToken.mockReturnValue("test-token");
    mockedGetAuthHeaders.mockReturnValue({
      cookieHeader: "JSESSIONID=123",
      csrfToken: "csrf-token-123",
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    global.fetch = originalFetch;
  });

  function createMockRequest(method: string, url: string, headers: Record<string, string> = {}, body?: any): Request {
    const reqHeaders = new Headers(headers);
    if (!reqHeaders.has("Content-Type") && body) {
      reqHeaders.set("Content-Type", "application/json");
    }

    return {
      method,
      url,
      headers: reqHeaders,
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
      body: body instanceof ReadableStream ? body : null,
    } as unknown as Request;
  }

  describe("Authentication", () => {
    it("returns 401 Unauthorized if token is missing", async () => {
      mockedExtractToken.mockReturnValue(null);
      const req = createMockRequest("GET", "https://localhost/api/erp/test");

      const response: any = await GET(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(response.status).toBe(401);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    });
  });

  describe("HTTP Methods Coverage", () => {
    it("handles PATCH requests", async () => {
      const req = createMockRequest("PATCH", "https://localhost/api/erp/test", {}, { val: 1 });
      await PATCH(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sws/com.etendoerp.metadata.test"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  describe("Error Handling", () => {
    it("throws ErpRequestError on non-ok response and returns JSON error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Backend crashed",
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });
      const response: any = await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(response.status).toBe(500);
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("ERP request failed"),
          details: "Backend crashed",
        }),
        { status: 500 }
      );
    });

    it("handles generic errors in catch block", async () => {
      mockedExtractToken.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const req = createMockRequest("GET", "https://localhost/api/erp/test");
      const response: any = await GET(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(response.status).toBe(500);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: "Unexpected error" }, { status: 500 });
    });
  });

  describe("URL Building logic (buildErpUrl / buildCachedErpUrl)", () => {
    it("handles copilot slug", async () => {
      const req = createMockRequest("GET", "https://localhost/api/erp/copilot/chat");
      await GET(req, { params: Promise.resolve({ slug: ["copilot", "chat"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/sws/copilot/chat", expect.any(Object));
    });

    it("handles attachments slug", async () => {
      const req = createMockRequest("POST", "https://localhost/api/erp/attachments/upload", {}, { f: 1 });
      await POST(req, { params: Promise.resolve({ slug: ["attachments", "upload"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/attachments/upload", expect.any(Object));
    });

    it("handles legacy slug", async () => {
      const req = createMockRequest("GET", "https://localhost/api/erp/meta/legacy/ad_forms/x");
      await GET(req, { params: Promise.resolve({ slug: ["meta", "legacy", "ad_forms", "x"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/meta/legacy/ad_forms/x", expect.any(Object));
    });

    it("handles Openbravo kernel slug", async () => {
      const req = createMockRequest("GET", "https://localhost/api/erp/org.openbravo.client.kernel/x");
      await GET(req, { params: Promise.resolve({ slug: ["org.openbravo.client.kernel", "x"] }) });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://erp.example/org.openbravo.client.kernel/x",
        expect.any(Object)
      );
    });

    it("handles static resources slug web/...", async () => {
      const req = createMockRequest("GET", "https://localhost/api/erp/web/js/x.js");
      await GET(req, { params: Promise.resolve({ slug: ["web", "js", "x.js"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/web/js/x.js", expect.any(Object));
    });

    it("handles utility slug", async () => {
      const req = createMockRequest("GET", "https://localhost/api/erp/utility/x");
      await GET(req, { params: Promise.resolve({ slug: ["utility", "x"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/utility/x", expect.any(Object));
    });

    it("handles POST to das/ bypassing cache", async () => {
      const req = createMockRequest("POST", "https://localhost/api/erp/das/x", {}, { val: 1 });
      await POST(req, { params: Promise.resolve({ slug: ["das", "x"] }) });

      expect(global.fetch).toHaveBeenCalledWith("https://erp.example/das/x", expect.any(Object));
    });
  });

  describe("Response Types", () => {
    it("handles HTML response (isHtmlContent)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        arrayBuffer: async () => new TextEncoder().encode("<html><head></head><body></body></html>").buffer,
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });
      const response: any = await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      // response should be the one from `handleHtmlContentResponse`
      // Since it creates a new Response object:
      expect(response).toBeInstanceOf(Response);
      const ct =
        typeof response.headers.get === "function"
          ? response.headers.get("Content-Type")
          : response.headers["Content-Type"];
      expect(ct?.toLowerCase()).toBe("text/html; charset=utf-8");
    });

    it("handles Response with Set-Cookie in HTML handler", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html", "set-cookie": "test=123" }),
        arrayBuffer: async () => new TextEncoder().encode("<html></html>").buffer,
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });
      const response = await POST(req, { params: Promise.resolve({ slug: ["test"] }) });
      expect((response as Response).headers.get("Set-Cookie")).toBe("test=123");
    });

    it("handles EventStream for copilot", async () => {
      const mockStream = new ReadableStream();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: mockStream,
      });

      // Copilot mutation requests aren't cached
      const req = createMockRequest("POST", "https://localhost/api/erp/copilot/chat", {}, { val: 1 });
      const response: any = await POST(req, { params: Promise.resolve({ slug: ["copilot", "chat"] }) });

      expect(response).toBeInstanceOf(Response);
      const ct =
        typeof response.headers.get === "function"
          ? response.headers.get("Content-Type")
          : response.headers["Content-Type"];
      const conn =
        typeof response.headers.get === "function"
          ? response.headers.get("Connection")
          : response.headers["Connection"];
      expect(ct).toBe("text/event-stream");
      expect(conn).toBe("keep-alive");
    });

    it("handles Binary content", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/pdf",
          "content-disposition": "attachment; filename=test.pdf",
        }),
        body: "binary-data",
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test/download", {}, { val: 1 });
      const response: any = await POST(req, { params: Promise.resolve({ slug: ["test", "download"] }) });

      expect(response).toBeInstanceOf(Response);
      const ct =
        typeof response.headers.get === "function"
          ? response.headers.get("Content-Type")
          : response.headers["Content-Type"];
      const cd =
        typeof response.headers.get === "function"
          ? response.headers.get("Content-Disposition")
          : response.headers["Content-Disposition"];
      expect(ct).toBe("application/pdf");
      expect(cd).toBe("attachment; filename=test.pdf");
    });

    it("handles manual redirects", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 302,
        headers: new Headers({ location: "https://erp.example/redirected" }),
      });
      // 2nd config for the redirect
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
          has: () => false,
        },
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ redirected: true })).buffer,
        text: async () => JSON.stringify({ redirected: true }),
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });
      await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      // fetch should have been called twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, "https://erp.example/redirected", expect.any(Object));
      expect(NextResponse.json).toHaveBeenCalledWith({ redirected: true });
    });

    it("handles Etendo SystemException format response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
          has: () => false,
        },
        arrayBuffer: async () =>
          new TextEncoder().encode("OB.KernelUtilities.handleSystemException('A custom exception');").buffer,
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });

      const response: any = await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(response.status).toBe(500); // Because handleMutationRequest throws ErpRequestError but parseFinalMutationResponse throws an Error.
      expect(NextResponse.json).toHaveBeenCalledWith({ error: "Backend error: A custom exception" }, { status: 500 });
    });

    it("handles invalid JSON response from mutation", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
          has: () => false,
        },
        arrayBuffer: async () => new TextEncoder().encode("this is not json").buffer,
      });

      const req = createMockRequest("POST", "https://localhost/api/erp/test", {}, { val: 1 });

      const response: any = await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      expect(response.status).toBe(500);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: expect.stringContaining("Invalid JSON response from backend: this is not json") },
        { status: 500 }
      );
    });
  });

  describe("Cached Requests (GET)", () => {
    it("handles copilot error in cached request (returns 404)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: async () => "Not Installed",
      });

      const req = createMockRequest("GET", "https://localhost/api/erp/copilot/test");
      const response: any = await GET(req, { params: Promise.resolve({ slug: ["copilot", "test"] }) });

      // The status should default to 404 because slugContainsCopilot is true inside `getCachedErpData`.
      expect(response.status).toBe(404);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ details: "Not Installed" }), {
        status: 404,
      });
    });
  });

  describe("Headers Building", () => {
    it("builds correct headers with spoofed referer for meta window request", async () => {
      const req = createMockRequest(
        "POST",
        "https://localhost/api/erp/meta/window/123",
        {
          "X-CSRF-Token": "test-csrf",
          referer: "https://localhost/other",
        },
        { val: 1 }
      );

      await POST(req, { params: Promise.resolve({ slug: ["meta", "window", "123"] }) });

      // Look at the second call to fetch since it's a mutation
      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers["referer"]).toBe("https://localhost/window?wi_0=123");
    });

    it("preserves stream body on mutation requests", async () => {
      const readableStream = new ReadableStream();
      const req = createMockRequest(
        "POST",
        "https://localhost/api/erp/test",
        {
          "Content-Type": "application/octet-stream",
        },
        readableStream
      );

      await POST(req, { params: Promise.resolve({ slug: ["test"] }) });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.body).toBe(readableStream);
      expect(fetchOptions.duplex).toBe("half");
    });

    it("sends Accept: text/html for ad_forms/ slug (About modal)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        arrayBuffer: async () =>
          new TextEncoder().encode("<html><head></head><body><p>About Etendo 25.1</p></body></html>").buffer,
      });

      const req = createMockRequest(
        "GET",
        "http://localhost/api/erp/ad_forms/about.html?IsPopUpCall=1&token=test-token",
        {}
      );

      const response = await GET(req, { params: Promise.resolve({ slug: ["ad_forms", "about.html"] }) });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers["Accept"]).toContain("text/html");
      expect(response).toBeInstanceOf(Response);
    });

    it("returns HTML content type for About modal proxy (local and deployed environments)", async () => {
      const aboutHtml = "<HTML><HEAD><TITLE>About</TITLE></HEAD><BODY><p>Etendo 25.1</p></BODY></HTML>";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        arrayBuffer: async () => new TextEncoder().encode(aboutHtml).buffer,
      });

      const req = createMockRequest(
        "GET",
        "http://localhost/api/erp/ad_forms/about.html?IsPopUpCall=1&token=test-token",
        {}
      );

      const response = await GET(req, {
        params: Promise.resolve({ slug: ["ad_forms", "about.html"] }),
      });

      expect(response).toBeInstanceOf(Response);
      const ct = (response as Response).headers.get("Content-Type");
      expect(ct?.toLowerCase()).toContain("text/html");
      // Verify no JSON error was returned (would not be a Response instance if it errored)
      expect(response.status).toBe(200);
    });
  });
});
