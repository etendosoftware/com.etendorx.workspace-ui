/**
 * When ERP_FORWARD_JSON_PASSTHROUGH=true, JSON body must be forwarded unchanged.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock('@/lib/auth', () => ({
  extractBearerToken: jest.fn().mockReturnValue('token-json-pt'),
}));

import { POST } from '../route';

describe('Datasource [entity] JSON pass-through', () => {
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
    headers.set('Authorization', `Bearer token-json-pt`);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return {
      method: 'POST',
      headers: { get: (k: string) => headers.get(k) || null } as any,
      url,
      text: async () => JSON.stringify(jsonBody),
    } as unknown as NextRequest;
  }

  it('forwards Content-Type application/json and raw JSON body', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add&isc_dataFormat=json';
    const payload = { dataSource: 'Invoice', operationType: 'add', data: { id: '1' } };
    const req = makeRequest(url, payload);
    const res: any = await POST(req as any, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);
    const [_dest, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers['Content-Type']).toContain('application/json');
    const sent = init.body as string;
    expect(sent).toContain('"dataSource":"Invoice"');
    expect(sent).toContain('"operationType":"add"');
    expect(sent).toContain('"data"');
  });
});
