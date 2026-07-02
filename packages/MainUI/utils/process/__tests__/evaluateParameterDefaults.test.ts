import {
  evaluateParameterDefaults,
  seedBooleanParameterDefaults,
  seedSessionColumnDefaults,
} from "../evaluateParameterDefaults";
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

  describe("global session columns (@AD_Client_ID@ / @AD_Org_ID@)", () => {
    // The session keeps the current client/org under the "#"-prefixed key.
    const sessionContext = { "#AD_Client_ID": "client-1", "#AD_Org_ID": "org-9" };

    it("resolves a bare @AD_Client_ID@ from the session context", () => {
      const params = { p1: makeParam("p1", "@AD_Client_ID@") };
      const result = evaluateParameterDefaults(params, sessionContext, emptyValues);
      expect(result).toEqual({ p1: "client-1" });
    });

    it("resolves a bare @AD_Org_ID@ from the #-prefixed session key", () => {
      const params = { p1: makeParam("p1", "@AD_Org_ID@") };
      const result = evaluateParameterDefaults(params, sessionContext, emptyValues);
      expect(result).toEqual({ p1: "org-9" });
    });

    it("prefers a matching parent-record field over the session value", () => {
      // currentValues carries the inp-prefixed record field (inpadClientId).
      const params = { p1: makeParam("p1", "@AD_Client_ID@") };
      const result = evaluateParameterDefaults(params, sessionContext, { inpadClientId: "rec-client" });
      expect(result).toEqual({ p1: "rec-client" });
    });

    it("does not hijack a real parent-record reference with an unrelated session value", () => {
      // @C_BPartner_ID@ is not a session column: it must not resolve to any
      // session value, so it falls through to the expression compiler.
      const params = { p1: makeParam("p1", "@C_BPartner_ID@") };
      const result = evaluateParameterDefaults(params, sessionContext, emptyValues);
      expect(result).toEqual({ p1: "evaluated:@C_BPartner_ID@" });
    });
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

describe("seedSessionColumnDefaults", () => {
  const CLIENT_NAME = "Client";
  const ORG_NAME = "Organization";
  const CLIENT_COLUMN = "AD_Client_ID";
  const ORG_COLUMN = "AD_Org_ID";
  const SESSION = { "#AD_Client_ID": "client-1", "#AD_Org_ID": "org-1" };

  const makeColumnParam = (name: string, dBColumnName: string): ProcessParameter =>
    ({ name, dBColumnName }) as unknown as ProcessParameter;

  const clientParam = makeColumnParam(CLIENT_NAME, CLIENT_COLUMN);
  const orgParam = makeColumnParam(ORG_NAME, ORG_COLUMN);

  it("seeds AD_Client_ID from the #-prefixed session key when blank", () => {
    const params = { client: clientParam };
    const values: Record<string, unknown> = {};
    seedSessionColumnDefaults(values, params, SESSION);
    expect(values[CLIENT_NAME]).toBe("client-1");
  });

  it("seeds AD_Org_ID from the #-prefixed session key when blank", () => {
    const params = { org: orgParam };
    const values: Record<string, unknown> = {};
    seedSessionColumnDefaults(values, params, SESSION);
    expect(values[ORG_NAME]).toBe("org-1");
  });

  it("falls back to the un-prefixed session key", () => {
    const params = { client: clientParam };
    const values: Record<string, unknown> = {};
    seedSessionColumnDefaults(values, params, { AD_Client_ID: "raw-client" });
    expect(values[CLIENT_NAME]).toBe("raw-client");
  });

  it("does not overwrite an existing value", () => {
    const params = { client: clientParam };
    const values: Record<string, unknown> = { [CLIENT_NAME]: "already-set" };
    seedSessionColumnDefaults(values, params, SESSION);
    expect(values[CLIENT_NAME]).toBe("already-set");
  });

  it("treats an empty string as blank and seeds it", () => {
    const params = { client: clientParam };
    const values: Record<string, unknown> = { [CLIENT_NAME]: "" };
    seedSessionColumnDefaults(values, params, SESSION);
    expect(values[CLIENT_NAME]).toBe("client-1");
  });

  it("ignores parameters whose column is not a session-global column", () => {
    const params = { bp: makeColumnParam("Business Partner", "C_BPartner_ID") };
    const values: Record<string, unknown> = {};
    seedSessionColumnDefaults(values, params, SESSION);
    expect("Business Partner" in values).toBe(false);
  });

  it("leaves the value blank when the session has no matching key", () => {
    const params = { client: clientParam };
    const values: Record<string, unknown> = {};
    seedSessionColumnDefaults(values, params, {});
    expect(CLIENT_NAME in values).toBe(false);
  });
});
