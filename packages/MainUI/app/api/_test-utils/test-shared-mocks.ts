/**
 * Shared test mocks used by datasource tests to avoid duplication.
 * - Mocks NextResponse.json to avoid depending on Next runtime.
 * - Mocks auth helper extractBearerToken for consistent test tokens.
 */

// Mock next/server NextResponse.json
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

// Mock auth extraction helper
jest.mock("@/lib/auth", () => ({
  // Return the token string extracted from the Authorization header of the provided request-like object.
  // This mirrors the real helper behavior so tests that construct request headers still work.
  extractBearerToken: (req: any) => {
    if (!req) return null;
    // Support both Map-like headers with get() and plain objects
    const header =
      typeof req.headers?.get === "function" ? req.headers.get("Authorization") : req.headers?.Authorization;
    if (!header) return null;
    return header.startsWith("Bearer ") ? header.slice(7) : header;
  },
}));
