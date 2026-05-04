import { evaluateParameterDefaults } from "../evaluateParameterDefaults";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn((expr: string) => {
    return (context: Record<string, unknown>, values: Record<string, unknown>) => {
      if (expr === "@AD_Org_ID@") return context.AD_Org_ID;
      if (expr === "fail") throw new Error("compile error");
      if (expr === "empty") return "";
      if (expr === "null") return null;
      return `evaluated:${expr}`;
    };
  }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn() },
}));

const makeParam = (name: string, defaultValue?: string): ProcessParameter =>
  ({ name, defaultValue }) as unknown as ProcessParameter;

describe("evaluateParameterDefaults", () => {
  const context = { AD_Org_ID: "org-1" };
  const emptyValues: Record<string, unknown> = {};

  it("returns evaluated defaults for parameters with defaultValue", () => {
    const params = { p1: makeParam("p1", "@AD_Org_ID@") };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({ p1: "org-1" });
  });

  it("skips parameters without defaultValue", () => {
    const params = { p1: makeParam("p1") };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({});
  });

  it("skips parameters that already have a non-empty value", () => {
    const params = { p1: makeParam("p1", "@AD_Org_ID@") };
    const result = evaluateParameterDefaults(params, context, { p1: "existing" });
    expect(result).toEqual({});
  });

  it("evaluates when existing value is empty string", () => {
    const params = { p1: makeParam("p1", "someExpr") };
    const result = evaluateParameterDefaults(params, context, { p1: "" });
    expect(result).toEqual({ p1: "evaluated:someExpr" });
  });

  it("evaluates when existing value is null", () => {
    const params = { p1: makeParam("p1", "someExpr") };
    const result = evaluateParameterDefaults(params, context, { p1: null });
    expect(result).toEqual({ p1: "evaluated:someExpr" });
  });

  it("evaluates when existing value is undefined", () => {
    const params = { p1: makeParam("p1", "someExpr") };
    const result = evaluateParameterDefaults(params, context, { p1: undefined });
    expect(result).toEqual({ p1: "evaluated:someExpr" });
  });

  it("skips results that are empty string", () => {
    const params = { p1: makeParam("p1", "empty") };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({});
  });

  it("skips results that are null", () => {
    const params = { p1: makeParam("p1", "null") };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({});
  });

  it("handles compilation errors gracefully", () => {
    const params = { p1: makeParam("p1", "fail") };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({});
  });

  it("handles multiple parameters", () => {
    const params = {
      p1: makeParam("p1", "@AD_Org_ID@"),
      p2: makeParam("p2", "someExpr"),
      p3: makeParam("p3"),
    };
    const result = evaluateParameterDefaults(params, context, emptyValues);
    expect(result).toEqual({ p1: "org-1", p2: "evaluated:someExpr" });
  });
});
