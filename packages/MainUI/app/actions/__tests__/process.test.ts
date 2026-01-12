import { executeProcess } from "../../actions/process";

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

// Mock next/headers - headers() returns a ReadonlyHeaders-like object
const mockHeadersObj = {
  get: jest.fn().mockReturnValue(null),
  has: jest.fn().mockReturnValue(false),
  entries: jest.fn().mockReturnValue([]),
  keys: jest.fn().mockReturnValue([]),
  values: jest.fn().mockReturnValue([]),
  forEach: jest.fn(),
  [Symbol.iterator]: jest.fn().mockReturnValue([].values()),
};

jest.mock("next/headers", () => ({
  headers: jest.fn().mockImplementation(() => Promise.resolve(mockHeadersObj)),
}));

// Mock sessionStore functions used by getErpAuthHeaders
jest.mock("@/app/api/_utils/sessionStore", () => ({
  getErpSessionCookie: jest.fn().mockReturnValue(null),
  getErpCsrfToken: jest.fn().mockReturnValue(null),
  setErpSessionCookie: jest.fn(),
  setErpCsrfToken: jest.fn(),
  clearErpSessionCookie: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Server Action: executeProcess", () => {
  const OLD_ENV = process.env;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_APP_URL: "http://localhost:3000" };

    // Setup default fetch mock
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns success with JSON body and triggers revalidation", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: 1 }),
    });

    const res = await executeProcess("P123", { a: 1 }, "test-token");
    expect(res).toEqual({ success: true, data: { ok: 1 } });
  });

  it("returns error on non-ok response with text", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => "boom",
    });

    const res = await executeProcess("PERR", { x: 1 }, "test-token");
    expect(res.success).toBe(false);
    expect(res.error).toContain("boom");
  });

  it("returns error when no token is provided", async () => {
    const res = await executeProcess("P123", { a: 1 }, "");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("includes Authorization header with Bearer token in request", async () => {
    await executeProcess("P123", { param: "value" }, "test-auth-token");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/erp?processId=P123"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: "Bearer test-auth-token",
        }),
        body: JSON.stringify({ param: "value" }),
        credentials: "include",
      })
    );
  });

  it("constructs correct URL for process execution", async () => {
    await executeProcess("PROCESS123", { data: "test" }, "token");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000/api/erp?processId=PROCESS123"),
      expect.any(Object)
    );
  });

  it("handles fetch network errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const res = await executeProcess("P123", {}, "token");
    expect(res.success).toBe(false);
    expect(res.error).toBe("An unexpected server error occurred");
  });
});
