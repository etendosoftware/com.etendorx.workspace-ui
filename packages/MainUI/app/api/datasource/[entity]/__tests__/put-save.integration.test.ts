/**
 * Integration-like test: Datasource save with PUT + JSON body should convert to form-url-encoded.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { PUT } from '../route';

describe('Save via PUT JSON→form conversion', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
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
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return {
      method: 'PUT',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it('encodes JSON to form-urlencoded on PUT', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=1&tabId=2&_operationType=update';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'update',
      componentId: 'isc_OBViewForm_0',
      csrfToken: 'PUT-123',
      data: { docNo: '100', note: 'hello' },
      oldValues: { docNo: '99' },
    };
    const req = makeRequest(url, 'put-token', body);
    const res: any = await PUT(req, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=1&tabId=2&_operationType=update');
    expect(init.method).toBe('PUT');
    expect(init.headers['Authorization']).toBe('Bearer put-token');
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.headers['X-CSRF-Token']).toBe('PUT-123');
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('operationType=update');
    expect(decoded).toContain('dataSource=isc_OBViewDataSource_0');
    expect(decoded).toContain('data=');
    expect(decoded).toContain('oldValues=');
  });
});
