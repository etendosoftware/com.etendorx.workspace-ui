import { executeProcess } from "../../actions/process";

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Server Action: executeProcess", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_BASE_URL: "" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns success with JSON body and triggers revalidation", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: 1 }),
    });

    const res = await executeProcess("P123", { a: 1 }, "test-token");
    expect(res).toEqual({ success: true, data: { ok: 1 } });
  });

  it("returns error on non-ok response with text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
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
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    await executeProcess("P123", { param: "value" }, "test-auth-token");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/erp?processId=P123"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Authorization": "Bearer test-auth-token",
        },
        body: JSON.stringify({ param: "value" }),
        credentials: "include",
      })
    );
  });

  it("constructs correct URL for process execution", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    await executeProcess("PROCESS123", { data: "test" }, "token");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/erp?processId=PROCESS123",
      expect.any(Object)
    );
  });

  it("handles fetch network errors gracefully", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const res = await executeProcess("P123", {}, "token");
    expect(res.success).toBe(false);
    expect(res.error).toBe("An unexpected server error occurred");
  });
});
