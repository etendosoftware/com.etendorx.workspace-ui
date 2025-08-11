/**
 * Integration-like test: Grids POST /api/datasource with criteria array → single JSON array string.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock('next/cache', () => ({
  unstable_cache: (fn: any) => (...args: any[]) => fn(...args),
}));

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn().mockResolvedValue({
    userId: '100', clientId: '23C5', orgId: '0', roleId: 'ROLE', warehouseId: 'WH',
  }),
  extractBearerToken: jest.fn().mockReturnValue('token-grid'),
}));

import { POST } from '../route';

describe('Grids: /api/datasource criteria handling', () => {
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

  it('flattens multiple criteria entries into a single JSON array string', async () => {
    const criteria = [
      JSON.stringify({ fieldName: 'name', operator: 'iContains', value: 'abc' }),
      JSON.stringify({ fieldName: 'code', operator: 'iContains', value: '123' }),
    ];
    const body = { entity: 'Invoice', params: { criteria, _operationType: 'fetch', _startRow: '0', _endRow: '50' } };
    const req = makeRequest('token-grid', body);

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/org.openbravo.service.datasource/Invoice');
    expect(init.headers['Authorization']).toBe('Bearer token-grid');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const decoded = decodeURIComponent(init.body as string);
    // Should be a single criteria=[...] entry
    expect(decoded).toContain('criteria=[');
    expect(decoded.match(/criteria=/g)?.length).toBe(1);
    expect(decoded).toContain('"fieldName":"name"');
    expect(decoded).toContain('"fieldName":"code"');
  });
});
