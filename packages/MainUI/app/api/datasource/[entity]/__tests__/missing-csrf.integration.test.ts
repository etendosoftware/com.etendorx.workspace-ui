/**
 * Integration-like test: Save without csrfToken should not set X-CSRF-Token nor csrfToken form field.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('Save without csrfToken', () => {
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

  it('omits CSRF header and field when csrfToken is absent', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=1&tabId=2&_operationType=add';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      data: { foo: 'bar' },
      // csrfToken intentionally omitted
    };
    const req = makeRequest(url, 'token-no-csrf', body);
    const res: any = await POST(req, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=1&tabId=2&_operationType=add');
    expect(init.headers['X-CSRF-Token']).toBeUndefined();
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).not.toContain('csrfToken=');
  });
});
