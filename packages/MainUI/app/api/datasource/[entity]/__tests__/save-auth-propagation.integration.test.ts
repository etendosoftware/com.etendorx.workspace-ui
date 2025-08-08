/**
 * Integration-like test: Authorization header propagation on save.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('Save: Authorization propagation', () => {
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
    headers.set('Content-Type', 'application/json');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it('forwards Authorization unchanged', async () => {
    const url = 'http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add';
    const body = { dataSource: 'isc_OBViewDataSource_0', operationType: 'add', componentId: 'isc_OBViewForm_0', data: {}, oldValues: {}, csrfToken: 'X' };
    const req = makeRequest(url, 'Bearer-AUTH-TOKEN', body);
    const res: any = await POST(req, { params: { entity: 'Order' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=10&tabId=20&_operationType=add');
    expect(init.headers['Authorization']).toBe('Bearer Bearer-AUTH-TOKEN');
  });
});
