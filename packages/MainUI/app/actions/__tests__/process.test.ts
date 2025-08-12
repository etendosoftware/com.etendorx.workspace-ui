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

    const res = await executeProcess("P123", { a: 1 });
    expect(res).toEqual({ success: true, data: { ok: 1 } });
  });

  it("returns error on non-ok response with text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => "boom",
    });

    const res = await executeProcess("PERR", { x: 1 });
    expect(res.success).toBe(false);
    expect(res.error).toContain("boom");
  });
});
