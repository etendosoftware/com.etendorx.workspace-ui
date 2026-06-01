import { compileOnRefreshFunction } from "../processView";

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

describe("compileOnRefreshFunction", () => {
  it("returns undefined when the code is null", () => {
    expect(compileOnRefreshFunction(null)).toBeUndefined();
  });

  it("returns undefined when the code is an empty string", () => {
    expect(compileOnRefreshFunction("")).toBeUndefined();
  });

  it("returns undefined when the code is undefined", () => {
    expect(compileOnRefreshFunction(undefined)).toBeUndefined();
  });

  it("compiles a valid function expression into a callable", () => {
    const fn = compileOnRefreshFunction("(view) => view.value + 1");
    expect(typeof fn).toBe("function");
    expect(fn!({ value: 10 } as unknown)).toBe(11);
  });

  it("threads the context into the compiled function", () => {
    const fn = compileOnRefreshFunction(
      "(view) => helper(view.value)",
      { helper: (n: number) => n * 3 }
    );
    expect(fn!({ value: 4 } as unknown)).toBe(12);
  });

  it("swallows compilation errors and returns undefined", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // `({})` evaluates to an object, not a function — compile fails.
    expect(compileOnRefreshFunction("({})")).toBeUndefined();
    consoleSpy.mockRestore();
  });
});
