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
  setupDatasourceTestEnvironment,
  createDatasourceRequest,
  assertDatasourceCall,
} from "../../_test-utils/datasource-test-utils";
import { setErpSessionCookie } from "../../_utils/sessionStore";
import { POST } from "../route";
import { getExpectedDatasourceUrl } from "../../_test-utils/endpoint-test-utils";

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
    // extractBearerToken is mocked to return 'token-cache-policy' above
    const BEARER_TOKEN = "token-cache-policy";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const body = { entity: "Invoice", params: { _operationType: "fetch", _startRow: "0", _endRow: "50" } };
    const req = createDatasourceRequest(BEARER_TOKEN, body);

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    // ensure fetch was called (direct call to ERP)
    assertDatasourceCall(getExpectedDatasourceUrl("Invoice", undefined, {
    }), {
      Authorization: `Bearer ${BEARER_TOKEN}`,
    });

    // cached function must not be used
    expect(cachedCallGuard).not.toHaveBeenCalled();
  });
});
