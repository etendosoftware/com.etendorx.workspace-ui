/**
 * Tests for copilot API route authentication
 * Ensures proper Bearer token handling and JSESSIONID cookie forwarding
 */

import type { NextRequest } from "next/server";

jest.mock("next/server", () => {
  const mockNextResponse = {
    json: (body: unknown, init?: { status?: number }) => ({
      ok: true,
      status: init?.status ?? 200,
      body,
    }),
  };
  
  // Mock constructor for NextResponse
  const NextResponseConstructor = (body?: BodyInit, init?: ResponseInit) => {
    return {
      ok: true,
      status: init?.status ?? 200,
      body,
      headers: init?.headers || {},
    };
  };
  
  // Combine static methods with constructor
  Object.assign(NextResponseConstructor, mockNextResponse);
  
  return {
    NextResponse: NextResponseConstructor,
  };
});

// Mock getErpAuthHeaders
jest.mock("@/app/api/_utils/forwardConfig", () => ({
  getErpAuthHeaders: jest.fn((_request: unknown, userToken: string) => {
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

// Mock executeWithSessionRetry
jest.mock("@/app/api/_utils/sessionRetry", () => ({
  executeWithSessionRetry: jest.fn(async (_request, _userToken, fetchFunction) => {
    const cookieHeader = "JSESSIONID=test-session-id; other=cookie";
    const result = await fetchFunction(cookieHeader);
    
    // Check if the response is not ok (simulate server error)
    if (!result.response.ok) {
      return {
        success: false,
        error: result.data,
      };
    }
    
    return {
      success: true,
      data: result.data,
      recovered: undefined,
    };
  }),
}));

import { GET } from "../[...path]/route";

// Type definitions for better type safety
interface MockRequest {
  method: string;
  headers: { get: (k: string) => string | null };
  url: string;
}

interface MockResponse {
  status: number;
  body: { error?: string };
}

describe("API: /api/copilot authentication", () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };
    (global.fetch as jest.MockedFunction<typeof fetch>) = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "text/event-stream" },
      text: async () => "data: test response",
    } as unknown as Response);
  });

  afterAll(() => {
    process.env = OLD_ENV;
    global.fetch = originalFetch;
  });

  function makeRequest(path: string[], bearer?: string, query = ""): MockRequest {
    const headers = new Map<string, string>();
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    headers.set("Content-Type", "application/json");
    return {
      method: "GET",
      headers: { get: (k: string) => headers.get(k) || null },
      url: `http://localhost:3000/api/copilot/${path.join("/")}${query}`,
    };
  }

  it("returns 401 when no Bearer token or Basic auth provided", async () => {
    const req = makeRequest(["aquestion"]);
    const params = Promise.resolve({ path: ["aquestion"] });

    const result = (await GET(req as NextRequest, { params })) as MockResponse;
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Unauthorized - Missing Bearer token or Basic auth");
  });

  it("forwards request with Basic auth when no Bearer token", async () => {
    const headers = new Map<string, string>();
    headers.set("Authorization", "Basic YWRtaW46YWRtaW4=");
    headers.set("Content-Type", "application/json");
    const req: MockRequest = {
      method: "GET",
      headers: { get: (k: string) => headers.get(k) || null },
      url: "http://localhost:3000/api/copilot/assistants",
    };
    const params = Promise.resolve({ path: ["assistants"] });

    await GET(req as NextRequest, { params });

    const [dest, init] = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/copilot/assistants");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>)?.Authorization).toBe("Basic YWRtaW46YWRtaW4=");
    expect((init?.headers as Record<string, string>)?.Cookie).toBeUndefined(); // No cookies for Basic auth
    expect(init?.credentials).toBe("include");
  });

  it("forwards request with proper authentication when token provided", async () => {
    const req = makeRequest(["aquestion"], "token-with-session", "?question=test&app_id=123");
    const params = Promise.resolve({ path: ["aquestion"] });

    await GET(req as NextRequest, { params });

    const [dest, init] = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
    expect(String(dest)).toBe("http://erp.example/etendo/copilot/aquestion?question=test&app_id=123");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>)?.Cookie).toBe("JSESSIONID=test-session-id; other=cookie");
    expect(init?.credentials).toBe("include");
  });

  it("forwards query parameters correctly", async () => {
    const req = makeRequest(["aquestion"], "valid-token", "?question=Hola&app_id=B3BFC46BF0AC4586B983B62109E87EAA");
    const params = Promise.resolve({ path: ["aquestion"] });

    await GET(req as NextRequest, { params });

    const [dest] = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/copilot/aquestion?question=Hola&app_id=B3BFC46BF0AC4586B983B62109E87EAA"
    );
  });

  it("handles ERP server errors gracefully", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>) = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Invalid request parameters",
    } as Response);

    // Use Basic auth instead of Bearer token to test server error handling
    const headers = new Map<string, string>();
    headers.set("Authorization", "Basic YWRtaW46YWRtaW4=");
    headers.set("Content-Type", "application/json");
    const req: MockRequest = {
      method: "GET",
      headers: { get: (k: string) => headers.get(k) || null },
      url: "http://localhost:3000/api/copilot/aquestion",
    };
    const params = Promise.resolve({ path: ["aquestion"] });

    const result = (await GET(req as NextRequest, { params })) as MockResponse;
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid request parameters");
  });
});
