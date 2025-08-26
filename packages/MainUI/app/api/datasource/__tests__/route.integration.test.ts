// Early mocks so route.ts does not load real Next internals (avoids needing global Request)
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
}));
// Auth mock before importing route so real auth.ts (which uses cookies()) is not executed
jest.mock("@/lib/auth", () => ({
  getUserContext: jest.fn().mockResolvedValue({
    userId: "100",
    clientId: "23C5",
    orgId: "0",
    roleId: "ROLE",
    warehouseId: "WH",
  }),
  extractBearerToken: jest.fn().mockImplementation((req: any) => {
    try {
      const header = req?.headers?.get?.("Authorization") || "";
      return header.startsWith("Bearer ") ? header.slice(7) : "";
    } catch {
      return "";
    }
  }),
}));
/**
 * Integration-like test: Grids POST /api/datasource with criteria array → single JSON array string.
 */

import { createDatasourceTestSuite, assertDatasourceCall } from "../../_test-utils/datasource-test-utils";
import { setErpSessionCookie } from "../../_utils/sessionStore";
import { POST } from "../route";

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

    assertDatasourceCall("http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice", {
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
