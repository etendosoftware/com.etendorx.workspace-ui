// Early mocks so route.ts does not load real Next internals (avoid Request global requirement)
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
 * Integration-like test: /api/datasource param coverage for reads (grids).
 */

import { createDatasourceTestSuite, assertDatasourceCall } from "../../_test-utils/datasource-test-utils";
import { POST } from "../route";

const testSuite = createDatasourceTestSuite("Grids: param coverage", "params");

testSuite.describe(() => {
  it("serializes typical params and forwards to ERP", async () => {
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
    const req = testSuite.createRequest("token-params", body);

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);

    assertDatasourceCall(
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice",
      { Authorization: "Bearer token-params" },
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
