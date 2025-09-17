/**
 * Smoke test: Save flow to ERP via forward servlet using JSON → x-www-form-urlencoded conversion.
 */

// Import shared mocks to avoid duplicating jest.mock declarations
import "../../../_test-utils/test-shared-mocks";

import { POST } from "../route";
import { createMockApiRequest, setupApiTestEnvironment } from "../../../_test-utils/api-test-utils";
import { assertErpForwardCall } from "../../../_test-utils/fetch-assertions";
import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import { getExpectedDatasourceUrl } from "../../../_test-utils/endpoint-test-utils";

describe("Smoke: save flow via forward servlet", () => {
  setupApiTestEnvironment();

  it("forwards to /meta/forward/org.openbravo.service.datasource/:entity with encoded form body", async () => {
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add";
    const CSRF_TOKEN = "CSRF-SMOKE-123";
    const BEARER_TOKEN = "Bearer-SMOKE-TOKEN";

    const payload = {
      dataSource: "Invoice",
      operationType: "add",
      componentId: "form-Invoice",
      csrfToken: CSRF_TOKEN,
      data: { id: "abc", description: "Test Ñ Ü ✓", amount: 100.5 },
      oldValues: {},
    };
    setErpSessionCookie(BEARER_TOKEN, { cookieHeader: "123", csrfToken: CSRF_TOKEN });

    const req = createMockApiRequest({
      url,
      method: "POST",
      bearer: BEARER_TOKEN,
      jsonBody: payload,
      contentType: "application/json; charset=utf-8",
    });
    const res: any = await POST(req as any, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);

    const { decoded } = assertErpForwardCall(
      getExpectedDatasourceUrl("Invoice", "add", {
        windowId: "10",
        tabId: "20",
        _operationType: "add",
      }),
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
