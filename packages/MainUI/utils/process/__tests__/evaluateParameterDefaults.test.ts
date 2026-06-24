import { evaluateParameterDefaults, seedBooleanParameterDefaults } from "../evaluateParameterDefaults";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn((expr: string) => {
    return (context: Record<string, unknown>, _values: Record<string, unknown>) => {
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

const makeParam = (name: string, defaultValue?: string, reference?: string): ProcessParameter =>
  ({ name, defaultValue, reference }) as unknown as ProcessParameter;

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

  it("skips multi-record selector parameters even when defaultValue evaluates to a non-empty scalar", () => {
    // Real-world case: NotPostedDocuments.accounting_status carries
    // defaultValue: '"N"' in metadata. Classic's OBMultiSelectorItem silently
    // drops scalar defaults; we must do the same so the picker starts empty.
    const params = {
      accountingStatus: makeParam("accountingStatus", '"N"', "87E6CFF8F71548AFA33F181C317970B5"),
    };
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

describe("seedBooleanParameterDefaults", () => {
  // ref "20" is FIELD_REFERENCE_CODES.BOOLEAN.id (Yes/No).
  const BOOLEAN_REF = "20";

  it("seeds false into a Yes/No parameter with no resolved value", () => {
    const params = { setAmount: makeParam("Set Amount", undefined, BOOLEAN_REF) };
    const values: Record<string, unknown> = {};
    seedBooleanParameterDefaults(values, params);
    expect(values["Set Amount"]).toBe(false);
  });

  it("seeds false when the value is null or empty string", () => {
    const params = { a: makeParam("A", undefined, BOOLEAN_REF), b: makeParam("B", undefined, BOOLEAN_REF) };
    const values: Record<string, unknown> = { A: null, B: "" };
    seedBooleanParameterDefaults(values, params);
    expect(values.A).toBe(false);
    expect(values.B).toBe(false);
  });

  it("keeps an existing boolean value (true or false) untouched", () => {
    const params = { on: makeParam("On", undefined, BOOLEAN_REF), off: makeParam("Off", undefined, BOOLEAN_REF) };
    const values: Record<string, unknown> = { On: true, Off: false };
    seedBooleanParameterDefaults(values, params);
    expect(values.On).toBe(true);
    expect(values.Off).toBe(false);
  });

  it("leaves non-boolean parameters untouched", () => {
    const params = { currency: makeParam("Currency", undefined, "95E2A8B50A254B2AAE6774B8C2F28120") };
    const values: Record<string, unknown> = {};
    seedBooleanParameterDefaults(values, params);
    expect("Currency" in values).toBe(false);
  });

  it("mutates the values object in place", () => {
    const params = { flag: makeParam("Flag", undefined, BOOLEAN_REF) };
    const values: Record<string, unknown> = {};
    const returned = seedBooleanParameterDefaults(values, params);
    expect(returned).toBeUndefined();
    expect(values.Flag).toBe(false);
  });
});
