import { compileParameterHook } from "../compileParameterHook";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

describe("compileParameterHook", () => {
  it("compiles a function-expression body with the injected context", () => {
    const add = jest.fn((a: number, b: number) => a + b);
    const hook = compileParameterHook("(x) => add(x, 1)", { add });
    expect(hook).not.toBeNull();
    expect(hook?.(41)).toBe(42);
    expect(add).toHaveBeenCalledWith(41, 1);
  });

  it("returns null for empty/null/whitespace bodies", () => {
    expect(compileParameterHook(null, {})).toBeNull();
    expect(compileParameterHook(undefined, {})).toBeNull();
    expect(compileParameterHook("", {})).toBeNull();
    expect(compileParameterHook("   \n  ", {})).toBeNull();
  });

  it("returns null (does not throw) when the body is not a function", () => {
    expect(compileParameterHook("{ not: 'a function' }", {})).toBeNull();
  });
});
