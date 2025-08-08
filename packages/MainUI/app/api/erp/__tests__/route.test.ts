/**
 * Tests for /api/erp base route forward logic.
 * Verifies special-case forward for FormInitializationComponent and query passthrough.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
    },
  };
});

// Mock unstable_cache to directly invoke the wrapped function
jest.mock('next/cache', () => ({
  unstable_cache: (fn: any) => (...args: any[]) => fn(...args),
}));

import { POST } from '../route';

describe('API: /api/erp base forward', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => JSON.stringify({ ok: true }),
    });
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(url: string, bearer: string, body = ''): NextRequest {
    const headers = new Map<string, string>();
    headers.set('Authorization', `Bearer ${bearer}`);
    headers.set('Content-Type', 'application/json');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => body,
    } as unknown as NextRequest;
  }

  it('forwards FormInitializationComponent to kernel forward path', async () => {
    const url = 'http://localhost:3000/api/erp?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent&language=en_US';
    const req = makeRequest(url, 'token-zzz', '{"foo":"bar"}');
    await POST(req as any);
    const [dest] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.client.kernel?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent&language=en_US');
  });

  it('forwards non-special POST to base ERP URL + query', async () => {
    const url = 'http://localhost:3000/api/erp?foo=bar&x=1';
    const req = makeRequest(url, 'token-abc', '{"k":"v"}');
    await POST(req as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo?foo=bar&x=1');
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer token-abc');
    expect(init.body).toBe('{"k":"v"}');
  });

  it('forwards GET to base ERP URL + query with Authorization', async () => {
    const url = 'http://localhost:3000/api/erp?foo=bar&x=1';
    const headers = new Map<string, string>();
    headers.set('Authorization', 'Bearer get-token');
    const req = {
      method: 'GET',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => '',
    } as unknown as NextRequest;
    const { GET } = await import('../route');
    await GET(req as any);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo?foo=bar&x=1');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer get-token');
  });
});
