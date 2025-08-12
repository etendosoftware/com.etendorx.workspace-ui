import type { NextRequest } from 'next/server';

interface MockRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  bearer?: string;
  jsonBody?: any;
  contentType?: string;
  cookies?: Record<string, string>;
}

/**
 * Crea un mock de NextRequest para usar en las pruebas de API.
 */
export function createMockApiRequest({
  url,
  method = 'POST',
  bearer,
  jsonBody,
  contentType = 'application/json',
  cookies = {},
}: MockRequestOptions): NextRequest {
  const headers = new Map<string, string>();
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
  headers.set('Content-Type', contentType);

  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  if (cookieString) headers.set('cookie', cookieString);

  return {
    method,
    headers: { get: (k: string) => headers.get(k) || null } as any,
    url,
    json: async () => jsonBody,
    text: async () => JSON.stringify(jsonBody),
  } as unknown as NextRequest;
}

/**
 * Configura el entorno de prueba global para las pruebas de API.
 * Esto incluye mockear `fetch` y establecer variables de entorno.
 */
export function setupApiTestEnvironment() {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock por defecto: respuesta JSON 200 OK
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ response: { status: 0, data: [{ id: '1', name: 'Test' }] } }),
      text: async () => JSON.stringify({ response: { status: 0 } }),
    });

    process.env = { ...originalEnv, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });
}

// --- Compat helpers migrated from entity test-utils ---
export interface LegacyMockRequestOptions {
  url: string;
  bearer?: string;
  jsonBody: any;
  contentType?: string;
  method?: string;
  additionalHeaders?: Record<string, string>;
}

export function createMockRequest(options: LegacyMockRequestOptions): NextRequest {
  const {
    url,
    bearer,
    jsonBody,
    contentType = 'application/json',
    method = 'POST',
    additionalHeaders = {},
  } = options;

  const headers = new Map<string, string>();
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
  headers.set('Content-Type', contentType);
  Object.entries(additionalHeaders).forEach(([k, v]) => headers.set(k, v));

  return {
    method,
    headers: { get: (k: string) => headers.get(k) || null } as any,
    url,
    text: async () => JSON.stringify(jsonBody),
    json: async () => jsonBody,
  } as unknown as NextRequest;
}

export interface MockFetchResponse {
  ok?: boolean;
  status?: number;
  headers?: { get: (key: string) => string | null };
  text?: () => Promise<string>;
  json?: () => Promise<any>;
}

export function createMockFetchResponse(options: MockFetchResponse = {}): any {
  const {
    ok = true,
    status = 200,
    headers = { get: () => 'application/json' },
    text = async () => JSON.stringify({ response: { status: 0 } }),
    json = async () => ({ response: { status: 0 } }),
  } = options;

  return { ok, status, headers, text, json };
}

export function setupTestEnvironment() {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  const setup = () => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue(createMockFetchResponse());
  };

  const cleanup = () => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  };

  return { setup, cleanup, OLD_ENV, originalFetch };
}

export function setupNextJsMocks() {
  jest.mock('next/server', () => ({
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
    },
  }));
}

export const testData = {
  defaultPayload: {
    dataSource: 'isc_OBViewDataSource_0',
    operationType: 'add',
    componentId: 'isc_OBViewForm_0',
    data: {},
    oldValues: {},
    csrfToken: 'test-csrf-token',
  },
  invoicePayload: {
    dataSource: 'isc_OBViewDataSource_0',
    operationType: 'add',
    componentId: 'isc_OBViewForm_0',
    data: {
      paymentComplete: false,
      organization: 'E443A31992CB4635AFCAEABE7183CE85',
      transactionDocument: '7FCD49652E104E6BB06C3A0D787412E3',
      documentNo: '<1000394>',
      invoiceDate: '2025-08-07',
      businessPartner: 'A6750F0D15334FB890C254369AC750A8',
    },
    oldValues: {},
    csrfToken: '8FDC75ECD28E4C428690BF880FFAE82D',
  },
  urls: {
    invoice:
      'http://localhost:3000/api/datasource/Invoice?windowId=167&tabId=263&moduleId=0&_operationType=update&_noActiveFilter=true&sendOriginalIDBack=true&_extraProperties=&Constants_FIELDSEPARATOR=%24&_className=OBViewDataSource&Constants_IDENTIFIER=_identifier&isc_dataFormat=json',
    order: 'http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add',
    simple: 'http://localhost:3000/api/datasource/Invoice?windowId=1&tabId=2&_operationType=add',
  },
  expectedUrls: {
    invoice:
      'http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=167&tabId=263&moduleId=0&_operationType=update&_noActiveFilter=true&sendOriginalIDBack=true&_extraProperties=&Constants_FIELDSEPARATOR=%24&_className=OBViewDataSource&Constants_IDENTIFIER=_identifier&isc_dataFormat=json',
  },
};

export function assertFetchCall(
  fetchMock: jest.Mock,
  expectedUrl: string,
  expectedMethod = 'POST',
  expectedHeaders: Record<string, string | undefined> = {}
) {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe(expectedUrl);
  expect(init.method).toBe(expectedMethod);
  Object.entries(expectedHeaders).forEach(([header, expectedValue]) => {
    if (expectedValue === undefined) {
      expect(init.headers[header]).toBeUndefined();
    } else {
      expect(init.headers[header]).toBe(expectedValue);
    }
  });
}

export function assertRequestBody(fetchMock: jest.Mock, expectedContent: Record<string, string>) {
  const [, init] = fetchMock.mock.calls[0];
  const rawBody = init.body as string;
  Object.entries(expectedContent).forEach(([key, value]) => {
    expect(rawBody).toContain(`"${key}":"${value}"`);
  });
}

export function createTestSuite(suiteName: string) {
  const { setup, cleanup } = setupTestEnvironment();
  return {
    describe: (callback: () => void) => {
      describe(suiteName, () => {
        beforeEach(setup);
        afterAll(cleanup);
        callback();
      });
    },
    setup,
    cleanup,
  };
}
