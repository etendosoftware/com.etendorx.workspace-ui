// Early mocks so route.ts does not load real Next internals
import { setupDatasourceMocks } from "../../_test-utils/common-mocks";
setupDatasourceMocks();
/**
 * Integration-like test: Grids POST /api/datasource with criteria array → single JSON array string.
 */

import { createDatasourceTestSuite, assertDatasourceCall } from "../../_test-utils/datasource-test-utils";
import { setErpSessionCookie } from "../../_utils/sessionStore";
import { POST } from "../route";
import { getExpectedDatasourceUrl } from "../../_test-utils/endpoint-test-utils";

const testSuite = createDatasourceTestSuite("Grids: /api/datasource criteria handling", "grid");

testSuite.describe(() => {
  it("flattens multiple criteria entries into a single JSON array string", async () => {
    const BEARER_TOKEN = "Bearer-Token-XYZ";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const criteria = [
      JSON.stringify({ fieldName: "name", operator: "iContains", value: "abc" }),
      JSON.stringify({ fieldName: "code", operator: "iContains", value: "123" }),
    ];
    const body = {
      entity: "Invoice",
      params: {
        criteria,
        _operationType: "fetch",
        _startRow: "0",
        _endRow: "50",
      },
    };
    const req = testSuite.createRequest(BEARER_TOKEN, body);

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    assertDatasourceCall(getExpectedDatasourceUrl("Invoice", undefined, {}), {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });

    // Verificaciones específicas para criteria
    const fetchMock = global.fetch as jest.Mock;
    const [, init] = fetchMock.mock.calls[0];
    const decoded = decodeURIComponent(init.body as string);

    // Should be a single criteria=[...] entry
    expect(decoded).toContain("criteria=[");
    expect(decoded.match(/criteria=/g)?.length).toBe(1);
    expect(decoded).toContain('"fieldName":"name"');
    expect(decoded).toContain('"fieldName":"code"');
  });
});
