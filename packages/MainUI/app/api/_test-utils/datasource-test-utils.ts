/**
 * Utilidades específicas para tests de datasource API
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
 * Configuración común de mocks para tests de datasource
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
 * Configuración común de auth mock para tests de datasource
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
 * Configuración común del entorno de test para datasource
 */
export function setupDatasourceTestEnvironment() {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as jest.Mock;

  const setup = () => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ response: { status: 0 } }),
      json: async () => ({ response: { status: 0 } }),
    });
  };

  const cleanup = () => {
    process.env = OLD_ENV;
    (global.fetch as jest.Mock) = originalFetch;
  };

  return { setup, cleanup };
}

/**
 * Crea un NextRequest mock para tests de datasource
 */
export function createDatasourceRequest(bearer: string, jsonBody: JsonBody): NextRequest {
  const headers = new Map<string, string>();
  headers.set("Authorization", `Bearer ${bearer}`);
  headers.set("Content-Type", "application/json");

  return {
    method: "POST",
    headers: { get: (k: string) => headers.get(k) || null } as NextRequest["headers"],
    url: "http://localhost:3000/api/datasource",
    text: async () => JSON.stringify(jsonBody),
    json: async () => jsonBody,
  } as unknown as NextRequest;
}

/**
 * Crea un NextRequest mock genérico para tests de ERP
 */
export function createErpRequest({
  url,
  method = "POST",
  bearer,
  body = "",
  contentType = "application/json",
  cookie,
}: ErpRequestOptions): NextRequest {
  const headers = new Map<string, string>();
  headers.set("Authorization", `Bearer ${bearer}`);
  headers.set("Content-Type", contentType);
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return {
    method,
    headers: { get: (k: string) => headers.get(k) || null } as NextRequest["headers"],
    url,
    text: async () => body,
    json: async () => (body ? JSON.parse(body) : {}),
  } as unknown as NextRequest;
}

/**
 * Suite de test completa para datasource con configuración común
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
 * Aserciones comunes para tests de datasource
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

  // Verificar headers
  for (const [header, value] of Object.entries(expectedHeaders)) {
    expect(init.headers[header]).toBe(value);
  }

  // Verificar parámetros en el body (si están presentes)
  if (Object.keys(expectedParams).length > 0) {
    const decoded = decodeURIComponent(init.body as string);
    for (const [param, value] of Object.entries(expectedParams)) {
      expect(decoded).toContain(`${param}=${value}`);
    }
  }
}

/**
 * Configuración de entorno genérica para tests de API
 */
export function setupApiTestEnvironment() {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as jest.Mock;

  const setup = () => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: "http://erp.example/etendo" };
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ response: { status: 0 } }),
      json: async () => ({ response: { status: 0 } }),
    });
  };

  const cleanup = () => {
    process.env = OLD_ENV;
    (global.fetch as jest.Mock) = originalFetch;
  };

  return { setup, cleanup };
}
