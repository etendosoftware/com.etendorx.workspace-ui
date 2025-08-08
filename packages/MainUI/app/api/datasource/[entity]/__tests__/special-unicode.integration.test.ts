/**
 * Integration-like test: Datasource save with special/Unicode characters in payload.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('Save with special/Unicode fields', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json; charset=utf-8' },
      text: async () => JSON.stringify({ response: { status: 0 } }),
      json: async () => ({ response: { status: 0 } }),
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(url: string, bearer: string, jsonBody: any): NextRequest {
    const headers = new Map<string, string>();
    headers.set('Authorization', `Bearer ${bearer}`);
    headers.set('Content-Type', 'application/json');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it('encodes UTF-8 content correctly in form body', async () => {
    const url = 'http://localhost:3000/api/datasource/OrderLine?windowId=143&tabId=187&_operationType=add&language=es_ES';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      csrfToken: 'CSRF-Üñîçødé-🙂',
      data: {
        description: 'España – Región Norte ☕️',
        productName: 'Agua sin Gas 1L',
        currencySymbol: '€',
      },
      oldValues: {},
    };

    const req = makeRequest(url, 'Bearer-Token-UNICODE', body);
    const res: any = await POST(req, { params: { entity: 'OrderLine' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/OrderLine?windowId=143&tabId=187&_operationType=add&language=es_ES');
    expect(init.headers['Authorization']).toBe('Bearer Bearer-Token-UNICODE');
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.headers['X-CSRF-Token']).toBe('CSRF-Üñîçødé-🙂');
    const decoded = decodeURIComponent(init.body as string);
    // Spaces may be encoded as '+' in URL encoding; accept both forms
    expect(decoded.replace(/\+/g, ' ')).toContain('España – Región Norte ☕️');
    expect(decoded).toContain('€');
  });
});
