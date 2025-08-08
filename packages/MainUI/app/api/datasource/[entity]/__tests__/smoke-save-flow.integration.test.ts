/**
 * Smoke test: Save flow to ERP via forward servlet using JSON → x-www-form-urlencoded conversion.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock('@/lib/auth', () => ({
  extractBearerToken: jest.fn().mockReturnValue('Bearer-SMOKE-TOKEN'),
}));

import { POST } from '../route';

describe('Smoke: save flow via forward servlet', () => {
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

  function makeRequest(url: string, jsonBody: any): NextRequest {
    const headers = new Map<string, string>();
    headers.set('Authorization', `Bearer Bearer-SMOKE-TOKEN`);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it('forwards to /meta/forward/org.openbravo.service.datasource/:entity with encoded form body', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add';
    const payload = {
      dataSource: 'Invoice',
      operationType: 'add',
      componentId: 'form-Invoice',
      csrfToken: 'CSRF-SMOKE-123',
      data: { id: 'abc', description: 'Test Ñ Ü ✓', amount: 100.5 },
      oldValues: {},
    };

    const req = makeRequest(url, payload);
    const res: any = await POST(req as any, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      'http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=10&tabId=20&_operationType=add'
    );
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer Bearer-SMOKE-TOKEN');
    expect(init.headers['Accept']).toBe('application/json');
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.headers['X-CSRF-Token']).toBe('CSRF-SMOKE-123');

    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('dataSource=Invoice');
    expect(decoded).toContain('operationType=add');
    expect(decoded).toContain('componentId=form-Invoice');
    // JSON payloads should appear in the form-encoded body
    expect(decoded).toContain('data={');
    expect(decoded).toContain('oldValues={}');
  });
});
