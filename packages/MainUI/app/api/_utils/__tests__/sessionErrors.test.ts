import { handleLoginError } from "../sessionErrors";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status ?? 200 })),
  },
}));

describe("handleLoginError", () => {
  it("returns 500 for a generic Error", () => {
    const result = handleLoginError(new Error("Something went wrong")) as any;
    expect(result.body.error).toBe("Something went wrong");
    expect(result.status).toBe(500);
  });

  it("returns 500 for a non-Error value", () => {
    const result = handleLoginError("unexpected string") as any;
    expect(result.body.error).toBe("Internal Server Error");
    expect(result.status).toBe(500);
  });

  it("returns status from error cause when available", () => {
    const cause = { status: 401 };
    const error = new Error("Login failed", { cause });
    const result = handleLoginError(error) as any;
    expect(result.body.error).toBe("Login failed");
    expect(result.status).toBe(401);
  });

  it("returns 500 when cause has no status", () => {
    const cause = { message: "no status" };
    const error = new Error("some error", { cause });
    const result = handleLoginError(error) as any;
    expect(result.status).toBe(500);
  });

  it("returns 500 when cause status is not a number", () => {
    const cause = { status: "four-oh-one" };
    const error = new Error("some error", { cause });
    const result = handleLoginError(error) as any;
    expect(result.status).toBe(500);
  });
});
