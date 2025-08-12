/**
 * Specific utilities for datasource API tests
 */

import type { NextRequest } from "next/server";

interface JsonBody {
  [key: string]: unknown;
}

interface ErpRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  bearer: string;
  body?: string;
  contentType?: string;
  cookie?: string;
}

/**
 * Common mock configuration for datasource tests
 */
export function setupDatasourceMocks() {
  jest.mock("next/server", () => ({
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        ok: true,
        status: init?.status ?? 200,
        body,
      }),
    },
  }));

  jest.mock("next/cache", () => ({
    unstable_cache:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
  }));
}

/**
 * Common auth mock configuration for datasource tests
 */
export function setupDatasourceAuthMock(tokenSuffix = "default") {
  jest.mock("@/lib/auth", () => ({
    getUserContext: jest.fn().mockResolvedValue({
      userId: "100",
      clientId: "23C5",
      orgId: "0",
      roleId: "ROLE",
      warehouseId: "WH",
    }),
    extractBearerToken: jest.fn().mockReturnValue(`token-${tokenSuffix}`),
  }));
}

/**
 * Generic test environment configuration
 */
export function setupTestEnvironment(
  config: {
    status?: number;
    response?: unknown;
    etendoUrl?: string;
  } = {}
) {
  const { status = 200, response = { response: { status: 0 } }, etendoUrl = "http://erp.example/etendo" } = config;

  const OLD_ENV = process.env;
  const originalFetch = global.fetch as jest.Mock;

  const setup = () => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: etendoUrl };
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      status,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify(response),
      json: async () => response,
    });
  };

  const cleanup = () => {
    process.env = OLD_ENV;
    (global.fetch as jest.Mock) = originalFetch;
  };

  return { setup, cleanup };
}

/**
 * Common test environment configuration for datasource
 */
export function setupDatasourceTestEnvironment() {
  return setupTestEnvironment({
    status: 200,
    response: { response: { status: 0 } },
  });
}

/**
 * Common test environment configuration for API
 */
export function setupApiTestEnvironment() {
  return setupTestEnvironment({
    status: 201,
    response: { api: "test", success: true },
  });
}

/**
 * Helper function to create headers map for NextRequest mocks
 */
function createRequestHeaders(bearer: string, contentType = "application/json", cookie?: string): Map<string, string> {
  const headers = new Map<string, string>();
  headers.set("Authorization", `Bearer ${bearer}`);
  headers.set("Content-Type", contentType);
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return headers;
}

/**
 * Creates a NextRequest mock for datasource tests
 */
export function createDatasourceRequest(bearer: string, jsonBody: JsonBody): NextRequest {
  const headers = createRequestHeaders(bearer);

  return {
    method: "POST",
    headers: { get: (k: string) => headers.get(k) || null } as NextRequest["headers"],
    url: "http://localhost:3000/api/datasource",
    text: async () => JSON.stringify(jsonBody),
    json: async () => jsonBody,
  } as unknown as NextRequest;
}

/**
 * Creates a generic NextRequest mock for ERP tests
 */
export function createErpRequest({
  url,
  method = "POST",
  bearer,
  body = "",
  contentType = "application/json",
  cookie,
}: ErpRequestOptions): NextRequest {
  const headers = createRequestHeaders(bearer, contentType, cookie);

  return {
    method,
    headers: { get: (k: string) => headers.get(k) || null } as NextRequest["headers"],
    url,
    text: async () => body,
    json: async () => (body ? JSON.parse(body) : {}),
  } as unknown as NextRequest;
}

/**
 * Complete test suite for datasource with common configuration
 */
export function createDatasourceTestSuite(suiteName: string, tokenSuffix = "default") {
  setupDatasourceMocks();
  setupDatasourceAuthMock(tokenSuffix);

  const { setup, cleanup } = setupDatasourceTestEnvironment();

  return {
    describe: (callback: () => void) => {
      describe(suiteName, () => {
        beforeEach(setup);
        afterAll(cleanup);
        callback();
      });
    },
    createRequest: createDatasourceRequest,
    createErpRequest,
    setup,
    cleanup,
  };
}

/**
 * Common assertions for datasource tests
 */
export function assertDatasourceCall(
  expectedUrl: string,
  expectedHeaders: Record<string, string> = {},
  expectedParams: Record<string, string> = {}
) {
  const fetchMock = global.fetch as jest.Mock;
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [dest, init] = fetchMock.mock.calls[0];
  expect(String(dest)).toBe(expectedUrl);

  // Verify headers
  for (const [header, value] of Object.entries(expectedHeaders)) {
    expect(init.headers[header]).toBe(value);
  }

  // Verify parameters in body (if present)
  if (Object.keys(expectedParams).length > 0) {
    const decoded = decodeURIComponent(init.body as string);
    for (const [param, value] of Object.entries(expectedParams)) {
      expect(decoded).toContain(`${param}=${value}`);
    }
  }
}
