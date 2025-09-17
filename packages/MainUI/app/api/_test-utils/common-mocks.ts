/**
 * Common mock configurations shared across multiple test files
 */

/**
 * Standard Next.js mocks for API route testing
 */
export const nextServerMocks = () => {
  jest.mock("next/server", () => ({
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
    },
  }));
};

/**
 * Standard Next.js cache mocks for API route testing
 */
export const nextCacheMocks = () => {
  jest.mock("next/cache", () => ({
    unstable_cache:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
  }));
};

/**
 * Standard auth mocks for API route testing
 */
export const authMocks = () => {
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
};

/**
 * Complete mock setup for datasource API route testing
 */
export const setupDatasourceMocks = () => {
  nextServerMocks();
  nextCacheMocks();
  authMocks();
};