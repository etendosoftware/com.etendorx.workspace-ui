/**
 * Integration-like test: Authorization header propagation on save.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      ok: true,
      status: init?.status ?? 200,
      body,
    }),
  },
}));

import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import {
  createMockRequest,
  setupTestEnvironment,
  testData,
  assertFetchCall,
} from "../../../_test-utils/api-test-utils";
import { POST } from "../route";

describe("Save: Authorization propagation", () => {
  const { setup, cleanup } = setupTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it("forwards Authorization unchanged", async () => {
    const BEARER_TOKEN = "Bearer-Token-XYZ";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const req = createMockRequest({
      url: testData.urls.order,
      bearer: BEARER_TOKEN,
      jsonBody: testData.defaultPayload,
    });

    const res: any = await POST(req, { params: { entity: "Order" } });
    expect(res.status).toBe(200);

    const fetchMock = (global as any).fetch;
    assertFetchCall(
      fetchMock,
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=10&tabId=20&_operationType=add",
      "POST",
      { Authorization: `Bearer ${BEARER_TOKEN}` }
    );
  });
});
