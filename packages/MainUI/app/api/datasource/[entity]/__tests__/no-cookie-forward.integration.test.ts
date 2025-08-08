/**
 * When ERP_FORWARD_COOKIES=false, the save/update proxy must NOT forward Cookie header to ERP.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock('@/lib/auth', () => ({
  extractBearerToken: jest.fn().mockReturnValue('token-nocookie-entity'),
}));

import { POST } from '../route';

describe('Datasource [entity] save does not forward Cookie when ERP_FORWARD_COOKIES=false', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo', ERP_FORWARD_COOKIES: 'false' } as any;
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

  function makeRequest(url: string, body: any, cookie = 'JSESSIONID=abc'): NextRequest {
    const headers = new Map<string, string>();
    headers.set('Authorization', `Bearer token-nocookie-entity`);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('cookie', cookie);
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(body),
    } as unknown as NextRequest;
  }

  it('omits Cookie header in ERP forward', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add';
    const payload = { dataSource: 'Invoice', operationType: 'add', data: { id: '1' } };
    const req = makeRequest(url, payload);
    const res: any = await POST(req as any, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);
    const [_dest, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer token-nocookie-entity');
    expect(init.headers['Cookie']).toBeUndefined();
  });
});

