/**
 * Integration-like test: ERP error passthrough on save (non-200).
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('Save error passthrough', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ response: { status: -1, error: { message: 'Invalid data' } } }),
      json: async () => ({ response: { status: -1, error: { message: 'Invalid data' } } }),
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

  it('returns same status when ERP returns error', async () => {
    const url = 'http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add';
    const body = { dataSource: 'isc_OBViewDataSource_0', operationType: 'add', componentId: 'isc_OBViewForm_0', data: {}, oldValues: {}, csrfToken: 'X' };
    const req = makeRequest(url, 'err-token', body);
    const res: any = await POST(req, { params: { entity: 'Order' } } as any);
    // Proxy should surface ERP error status; expect 400 here
    expect(res.status).toBe(400);
    const [_, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer err-token');
  });
});
