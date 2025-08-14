/**
 * Smoke test: Save flow to ERP via forward servlet using JSON → x-www-form-urlencoded conversion.
 */

// Import shared mocks to avoid duplicating jest.mock declarations
import "../../../_test-utils/test-shared-mocks";

import { POST } from "../route";
import { createMockApiRequest, setupApiTestEnvironment } from "../../../_test-utils/api-test-utils";
import { assertErpForwardCall } from "../../../_test-utils/fetch-assertions";

describe("Smoke: save flow via forward servlet", () => {
  setupApiTestEnvironment();

  it("forwards to /meta/forward/org.openbravo.service.datasource/:entity with encoded form body", async () => {
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add";
    const payload = {
      dataSource: "Invoice",
      operationType: "add",
      componentId: "form-Invoice",
      csrfToken: "CSRF-SMOKE-123",
      data: { id: "abc", description: "Test Ñ Ü ✓", amount: 100.5 },
      oldValues: {},
    };

    const req = createMockApiRequest({
      url,
      method: "POST",
      bearer: "Bearer-SMOKE-TOKEN",
      jsonBody: payload,
      contentType: "application/json; charset=utf-8",
    });
    const res: any = await POST(req as any, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);

    const { decoded } = assertErpForwardCall(
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice?windowId=10&tabId=20&_operationType=add",
      "Bearer Bearer-SMOKE-TOKEN",
      undefined,
      "application/json; charset=utf-8"
    );

    expect(decoded).toContain('"dataSource":"Invoice"');
    expect(decoded).toContain('"operationType":"add"');
    expect(decoded).toContain('"componentId":"form-Invoice"');
    // JSON payloads should appear in the form-encoded body
    expect(decoded).toContain('"data":{');
    expect(decoded).toContain('"oldValues":{}');
  });
});
