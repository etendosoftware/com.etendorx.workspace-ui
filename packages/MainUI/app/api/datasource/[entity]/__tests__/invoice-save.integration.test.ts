/**
 * Integration-like test: Invoice save parity with legacy UI payload shape.
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));
import { 
  createMockRequest, 
  setupTestEnvironment, 
  testData,
  assertFetchCall,
  assertRequestBody
} from '../../../_test-utils/api-test-utils';
import { POST } from '../route';

describe('Invoice save parity: /api/datasource/Invoice', () => {
  const { setup, cleanup } = setupTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it('forwards to ERP with expected URL, headers and form body', async () => {
    const req = createMockRequest({
      url: testData.urls.invoice,
      bearer: 'Bearer-Token-123',
      jsonBody: testData.invoicePayload,
    });

    const res: any = await POST(req, { params: { entity: 'Invoice' } });
    expect(res.status).toBe(200);

    const fetchMock = (global as any).fetch;
    
    assertFetchCall(fetchMock, testData.expectedUrls.invoice, 'POST', {
      'Authorization': 'Bearer Bearer-Token-123',
      'Content-Type': 'application/json',
      'X-CSRF-Token': undefined,
    });

    assertRequestBody(fetchMock, {
      'dataSource': 'isc_OBViewDataSource_0',
      'operationType': 'add',
      'componentId': 'isc_OBViewForm_0',
      'csrfToken': '8FDC75ECD28E4C428690BF880FFAE82D',
    });
  });
});
