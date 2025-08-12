/**
 * Integration-like test: Save without csrfToken should not set X-CSRF-Token nor csrfToken form field.
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ 
      ok: true, 
      status: init?.status ?? 200, 
      body 
    }),
  },
}));

import { 
  createMockRequest, 
  setupTestEnvironment, 
  testData,
  assertFetchCall,
} from '../../../_test-utils/api-test-utils';
import { POST } from '../route';

describe('Save without csrfToken', () => {
  const { setup, cleanup } = setupTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it('omits CSRF header and field when csrfToken is absent', async () => {
    const { csrfToken, ...bodyWithoutCsrf } = testData.defaultPayload;

    const req = createMockRequest({
      url: testData.urls.simple,
      bearer: 'Bearer-Token-NoCSRF',
      jsonBody: bodyWithoutCsrf,
    });

    const res: any = await POST(req, { params: { entity: 'Invoice' } });
    expect(res.status).toBe(200);

    const fetchMock = (global as any).fetch;
    
    assertFetchCall(fetchMock, 
      'http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=1&tabId=2&_operationType=add',
      'POST',
      {
        'Authorization': 'Bearer Bearer-Token-NoCSRF',
        'X-CSRF-Token': undefined,
      }
    );

    // Verify that the body does not contain csrfToken
    const [, requestInit] = fetchMock.mock.calls[0];
    const rawBody = requestInit.body as string;
    expect(rawBody).not.toContain('csrfToken');
    expect(rawBody).toContain('dataSource=isc_OBViewDataSource_0');
  });
});
