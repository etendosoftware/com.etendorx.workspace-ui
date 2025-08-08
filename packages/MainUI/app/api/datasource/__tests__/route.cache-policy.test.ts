/**
 * Test: /api/datasource respects cache policy helper and bypasses cache when disabled.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

// Make cached function throw if used, so we can detect accidental cache usage
const cachedCallGuard = jest.fn();
jest.mock('next/cache', () => ({
  unstable_cache: (fn: any) => (...args: any[]) => {
    cachedCallGuard();
    throw new Error('Cached function should not be called when caching is disabled');
  },
}));

// Force policy to disable caching
jest.mock('@/app/api/_utils/datasourceCache', () => ({
  shouldCacheDatasource: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn().mockResolvedValue({ userId: '100' }),
  extractBearerToken: jest.fn().mockReturnValue('token-cache-policy'),
}));

import { POST } from '../route';

describe('Datasource cache policy (disabled)', () => {
  const OLD_ENV = process.env;
  const originalFetch = global.fetch as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ETENDO_CLASSIC_URL: 'http://erp.example/etendo' };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ response: { status: 0, data: [] } }),
      json: async () => ({ response: { status: 0, data: [] } }),
    });
    cachedCallGuard.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    (global as any).fetch = originalFetch;
  });

  function makeRequest(bearer: string, jsonBody: any): NextRequest {
    const headers = new Map<string, string>();
    headers.set('Authorization', `Bearer ${bearer}`);
    headers.set('Content-Type', 'application/json');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url: 'http://localhost:3000/api/datasource',
      text: async () => JSON.stringify(jsonBody),
      json: async () => jsonBody,
    } as unknown as NextRequest;
  }

  it('bypasses cached function and calls ERP directly when policy is false', async () => {
    const body = { entity: 'Invoice', params: { _operationType: 'fetch', _startRow: '0', _endRow: '50' } };
    const req = makeRequest('token-cache-policy', body);

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);

    // ensure fetch was called (direct call to ERP)
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice');
    expect(init.headers['Authorization']).toBe('Bearer token-cache-policy');

    // cached function must not be used
    expect(cachedCallGuard).not.toHaveBeenCalled();
  });
});
