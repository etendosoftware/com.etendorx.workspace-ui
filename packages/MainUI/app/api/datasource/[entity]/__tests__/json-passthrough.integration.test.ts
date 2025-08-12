/**
 * When ERP_FORWARD_JSON_PASSTHROUGH=true, JSON body must be forwarded unchanged.
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

import {
  createMockRequest,
  setupTestEnvironment,
  assertFetchCall,
  assertRequestBody,
} from "../../../_test-utils/api-test-utils";
import { POST } from "../route";

describe("Datasource [entity] JSON pass-through", () => {
  const { setup, cleanup } = setupTestEnvironment();

  beforeEach(setup);
  afterAll(cleanup);

  it("forwards Content-Type application/json and raw JSON body", async () => {
    const payload = { dataSource: "Invoice", operationType: "add", data: { id: "1" } };

    const req = createMockRequest({
      url: "http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add&isc_dataFormat=json",
      bearer: "token-json-pt",
      jsonBody: payload,
      contentType: "application/json; charset=utf-8",
    });

    const res: any = await POST(req, { params: { entity: "Invoice" } });
    expect(res.status).toBe(200);

    const fetchMock = (global as any).fetch;

    assertFetchCall(
      fetchMock,
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=10&tabId=20&_operationType=add&isc_dataFormat=json",
      "POST",
      { "Content-Type": "application/json; charset=utf-8" }
    );

    assertRequestBody(fetchMock, {
      dataSource: "Invoice",
      operationType: "add",
    });
  });
});
