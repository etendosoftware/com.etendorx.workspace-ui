/**
 * Integration-like test: POST with application/json; charset triggers JSON→form conversion.
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from '../route';
import { createMockApiRequest, setupApiTestEnvironment } from '../../../_test-utils/api-test-utils';

describe('POST JSON with charset → form conversion', () => {
  setupApiTestEnvironment();

  it('converts JSON to x-www-form-urlencoded with charset content-type', async () => {
    const url = 'http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add';
    const body = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      data: { hello: 'world' },
      oldValues: {},
    };
    const req = createMockApiRequest({
      url,
      method: 'POST',
      bearer: 'post-charset',
      jsonBody: body,
      contentType: 'application/json; charset=utf-8',
    });
    const res: any = await POST(req, { params: { entity: 'Order' } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe('http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=10&tabId=20&_operationType=add');
    expect(init.headers['Authorization']).toBe('Bearer post-charset');
    expect(init.headers['Content-Type']).toBeUndefined();
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('dataSource=isc_OBViewDataSource_0');
    expect(decoded).toContain('operationType=add');
    expect(decoded).toContain('data=');
  });
});
