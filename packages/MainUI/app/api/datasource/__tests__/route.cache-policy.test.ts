// Early mocks so route.ts does not load real Next internals
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
// Mock auth BEFORE importing route to avoid using real Next cookies/session in tests
jest.mock("@/lib/auth", () => ({
  getUserContext: jest.fn().mockResolvedValue({
    userId: "100",
    clientId: "23C5",
    orgId: "0",
    roleId: "ROLE",
    warehouseId: "WH",
  }),
  extractBearerToken: jest.fn().mockReturnValue("token-cache-policy"),
}));
/**
 * Test: /api/datasource respects cache policy helper and bypasses cache when disabled.
 */

import {
  setupDatasourceMocks,
  setupDatasourceAuthMock,
  setupDatasourceTestEnvironment,
  createDatasourceRequest,
  assertDatasourceCall,
} from "../../_test-utils/datasource-test-utils";
import { POST } from "../route";

// Setup base mocks
setupDatasourceMocks();

// Make cached function throw if used, so we can detect accidental cache usage
const cachedCallGuard = jest.fn();
jest.mock("next/cache", () => ({
  unstable_cache:
    (_fn: (...args: unknown[]) => unknown) =>
    (..._args: unknown[]) => {
      cachedCallGuard();
      throw new Error("Cached function should not be called when caching is disabled");
    },
}));

// Force policy to disable caching
jest.mock("@/app/api/_utils/datasourceCache", () => ({
  shouldCacheDatasource: jest.fn().mockReturnValue(false),
}));


describe("Datasource cache policy (disabled)", () => {
  const { setup, cleanup } = setupDatasourceTestEnvironment();

  beforeEach(() => {
    setup();
    cachedCallGuard.mockClear();
  });

  afterAll(cleanup);

  it("bypasses cached function and calls ERP directly when policy is false", async () => {
    const body = { entity: "Invoice", params: { _operationType: "fetch", _startRow: "0", _endRow: "50" } };
    const req = createDatasourceRequest("token-cache-policy", body);

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    // ensure fetch was called (direct call to ERP)
    assertDatasourceCall("http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/Invoice", {
      Authorization: "Bearer token-cache-policy",
    });

    // cached function must not be used
    expect(cachedCallGuard).not.toHaveBeenCalled();
  });
});
