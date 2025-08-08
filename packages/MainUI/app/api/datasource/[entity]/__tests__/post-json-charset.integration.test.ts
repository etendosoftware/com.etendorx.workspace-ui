/**
 * Integration-like test: POST with application/json; charset triggers JSON→form conversion.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('POST JSON with charset → form conversion', () => {
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
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
      json: async () => jsonBody,
    } as unknown as NextRequest;
  }

  it('converts JSON to x-www-form-urlencoded with charset content-type', async () => {
    const url = 'http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      data: { hello: 'world' },
      oldValues: {},
    };
    const req = makeRequest(url, 'post-charset', body);
    const res: any = await POST(req, { params: { entity: 'Order' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=10&tabId=20&_operationType=add');
    expect(init.headers['Authorization']).toBe('Bearer post-charset');
    expect(init.headers['Content-Type']).toBeUndefined();
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('dataSource=isc_OBViewDataSource_0');
    expect(decoded).toContain('operationType=add');
    expect(decoded).toContain('data=');
  });
});
