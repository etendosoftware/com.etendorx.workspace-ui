/**
 * Integration-like test: /api/datasource param coverage for reads (grids).
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
  getUserContext: jest.fn().mockResolvedValue({ userId: '100', clientId: '23C5', orgId: '0', roleId: 'ROLE', warehouseId: 'WH' }),
  extractBearerToken: jest.fn().mockReturnValue('token-params'),
}));

import { POST } from '../route';

describe('Grids: param coverage', () => {
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

  it('serializes typical params and forwards to ERP', async () => {
    const params = {
      _operationType: 'fetch',
      _startRow: '0',
      _endRow: '50',
      language: 'en_US',
      windowId: '167',
      tabId: '263',
      _noActiveFilter: 'true',
    };
    const body = { entity: 'Invoice', params };
    const req = makeRequest('token-params', body);
    const res: any = await POST(req as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice');
    expect(init.headers['Authorization']).toBe('Bearer token-params');
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('_operationType=fetch');
    expect(decoded).toContain('_startRow=0');
    expect(decoded).toContain('_endRow=50');
    expect(decoded).toContain('language=en_US');
    expect(decoded).toContain('windowId=167');
    expect(decoded).toContain('tabId=263');
    expect(decoded).toContain('_noActiveFilter=true');
    // no criteria since not provided
    expect(decoded).not.toContain('criteria=');
  });
});
