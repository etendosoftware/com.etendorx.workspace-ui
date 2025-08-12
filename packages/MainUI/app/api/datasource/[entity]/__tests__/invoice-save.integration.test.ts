/**
 * Integration-like test: Invoice save parity with legacy UI payload shape.
 */

import type { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';

describe('Invoice save parity: /api/datasource/Invoice', () => {
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

  it('forwards to ERP with expected URL, headers and form body', async () => {
    const url = 'http://localhost:3000/api/datasource/Invoice?windowId=167&tabId=263&moduleId=0&_operationType=update&_noActiveFilter=true&sendOriginalIDBack=true&_extraProperties=&Constants_FIELDSEPARATOR=%24&_className=OBViewDataSource&Constants_IDENTIFIER=_identifier&isc_dataFormat=json';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      data: {
        paymentComplete: false,
        organization: 'E443A31992CB4635AFCAEABE7183CE85',
        transactionDocument: '7FCD49652E104E6BB06C3A0D787412E3',
        documentNo: '<1000394>',
        invoiceDate: '2025-08-07',
        businessPartner: 'A6750F0D15334FB890C254369AC750A8',
      },
      oldValues: {},
      csrfToken: '8FDC75ECD28E4C428690BF880FFAE82D',
    };

    const req = makeRequest(url, 'Bearer-Token-123', body);
    const res: any = await POST(req, { params: { entity: 'Invoice' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      'http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=167&tabId=263&moduleId=0&_operationType=update&_noActiveFilter=true&sendOriginalIDBack=true&_extraProperties=&Constants_FIELDSEPARATOR=%24&_className=OBViewDataSource&Constants_IDENTIFIER=_identifier&isc_dataFormat=json'
    );
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer Bearer-Token-123');
    expect(init.headers['Content-Type']).toContain('application/json');
    expect(init.headers['X-CSRF-Token']).toBeUndefined();
    const raw = init.body as string;
    expect(raw).toContain('"dataSource":"isc_OBViewDataSource_0"');
    expect(raw).toContain('"operationType":"add"');
    expect(raw).toContain('"componentId":"isc_OBViewForm_0"');
    expect(raw).toContain('"csrfToken":"8FDC75ECD28E4C428690BF880FFAE82D"');
  });
});
