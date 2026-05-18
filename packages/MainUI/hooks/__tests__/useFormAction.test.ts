import { extractServerErrorMessage } from "../useFormAction";

describe("extractServerErrorMessage", () => {
  it("returns message from response.error.message (process/callout errors)", () => {
    const response = { error: { message: "Process failed" } };
    expect(extractServerErrorMessage(response)).toBe("Process failed");
  });

  it("returns joined field messages from response.errors (validation errors)", () => {
    const response = {
      status: -4,
      errors: { description: "Order.description: Value too long. Length 359, maximum allowed 255" },
    };
    expect(extractServerErrorMessage(response)).toBe(
      "Order.description: Value too long. Length 359, maximum allowed 255"
    );
  });

  it("joins multiple field errors with semicolons", () => {
    const response = {
      status: -4,
      errors: { name: "Name is required", amount: "Amount must be positive" },
    };
    expect(extractServerErrorMessage(response)).toBe("Name is required; Amount must be positive");
  });

  it("prefers error.message over errors when both exist", () => {
    const response = {
      error: { message: "General error" },
      errors: { field: "Field error" },
    };
    expect(extractServerErrorMessage(response)).toBe("General error");
  });

  it("returns fallback for undefined response", () => {
    expect(extractServerErrorMessage(undefined)).toBe("Unknown server error");
  });

  it("returns fallback for empty response", () => {
    expect(extractServerErrorMessage({})).toBe("Unknown server error");
  });

  it("returns fallback when errors object is empty", () => {
    const response = { status: -4, errors: {} };
    expect(extractServerErrorMessage(response)).toBe("Unknown server error");
  });
});
