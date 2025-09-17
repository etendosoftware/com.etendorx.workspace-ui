// Early mocks so route.ts does not load real Next internals
import { setupDatasourceMocks } from "../../_test-utils/common-mocks";
setupDatasourceMocks();
/**
 * Integration-like test: /api/datasource param coverage for reads (grids).
 */

import { createDatasourceTestSuite, assertDatasourceCall } from "../../_test-utils/datasource-test-utils";
import { setErpSessionCookie } from "../../_utils/sessionStore";
import { POST } from "../route";
import { getExpectedDatasourceUrl } from "../../_test-utils/endpoint-test-utils";

const testSuite = createDatasourceTestSuite("Grids: param coverage", "params");

testSuite.describe(() => {
  it("serializes typical params and forwards to ERP", async () => {
    const BEARER_TOKEN = "Bearer-Token-Params";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const params = {
      _operationType: "fetch",
      _startRow: "0",
      _endRow: "50",
      language: "en_US",
      windowId: "167",
      tabId: "263",
      _noActiveFilter: "true",
    };
    const body = { entity: "Invoice", params };
    const req = testSuite.createRequest(BEARER_TOKEN, body);

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);

    assertDatasourceCall(
      getExpectedDatasourceUrl("Invoice", undefined, {
    }),
      { Authorization: `Bearer ${BEARER_TOKEN}` },
      {
        _operationType: "fetch",
        _startRow: "0",
        _endRow: "50",
        language: "en_US",
        windowId: "167",
        tabId: "263",
        _noActiveFilter: "true",
      }
    );

    // Verificar que no hay criteria ya que no se proporcionó
    const fetchMock = global.fetch as jest.Mock;
    const [, init] = fetchMock.mock.calls[0];
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).not.toContain("criteria=");
  });
});
