import { evaluateMathExpression, isMathExpression, sanitizeMathExpression } from "../mathExpression";

describe("mathExpression", () => {
  it("detects expressions by the = prefix", () => {
    expect(isMathExpression("=2*5")).toBe(true);
    expect(isMathExpression("  =1")).toBe(true);
    expect(isMathExpression("25")).toBe(false);
  });

  it("drops characters that cannot be part of an expression", () => {
    expect(sanitizeMathExpression("=2*5abc")).toBe("=2*5");
  });

  it.each([
    ["=2*5", 10],
    ["2+3*4", 14],
    ["=(2+3)*4", 20],
    ["=10/4", 2.5],
    ["=-3+5", 2],
    ["=1.5*2", 3],
  ])("evaluates %s", (text, expected) => {
    expect(evaluateMathExpression(text)).toBe(expected);
  });

  it("accepts a comma as the decimal mark", () => {
    expect(evaluateMathExpression("=1,5*2", ",")).toBe(3);
  });

  it.each(["=", "=2*", "=(2+3", "=2)", "=1/0", "=2 3", "=abc"])("rejects %s", (text) => {
    expect(evaluateMathExpression(text)).toBeNull();
  });
});
