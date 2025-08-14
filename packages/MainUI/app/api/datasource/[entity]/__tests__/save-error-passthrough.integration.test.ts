/**
 * Integration-like test: ERP error passthrough on save (non-200).
 */

import { POST } from "../route";
import { createMockRequest, setupTestEnvironment, assertFetchCall } from "../../../_test-utils/api-test-utils";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

describe("Save error passthrough", () => {
  const { setup, cleanup } = setupTestEnvironment();

  beforeEach(() => {
    setup();
    // Override with error response for this specific test
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ response: { status: -1, error: { message: "Invalid data" } } }),
      json: async () => ({ response: { status: -1, error: { message: "Invalid data" } } }),
    });
  });

  afterAll(cleanup);

  it("returns same status when ERP returns error", async () => {
    const url = "http://localhost:3000/api/datasource/Order?windowId=10&tabId=20&_operationType=add";
    const body = {
      dataSource: "isc_OBViewDataSource_0",
      operationType: "add",
      componentId: "isc_OBViewForm_0",
      data: {},
      oldValues: {},
      csrfToken: "X",
    };

    const req = createMockRequest({
      url,
      bearer: "err-token",
      jsonBody: body,
    });

    const res: any = await POST(req, { params: { entity: "Order" } } as any);

    // Proxy should surface ERP error status; expect 400 here
    expect(res.status).toBe(400);

    assertFetchCall(
      global.fetch as jest.Mock,
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Order?windowId=10&tabId=20&_operationType=add",
      "POST",
      { Authorization: "Bearer err-token" }
    );
  });
});
