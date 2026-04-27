/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { parseDynamicExpression } from "../../utils";
import { createSmartContext } from "../../utils/expressions";

// Minimal compile helper: transforms expression and wraps in a Function.
// Intentionally excludes the OB shim — we only need to verify @field_name@ handling.
const compile = (expression: string): ((ctx: object, vals: object) => unknown) =>
  new Function("context", "currentValues", `return ${parseDynamicExpression(expression)};`) as any;

// Compile helper that includes the Y/N normalization added in compileExpression (BaseSelector).
// 'Y'→true, 'N'→false, any other truthy/falsy value → Boolean(value).
const compileNormalized = (expression: string): ((ctx: object, vals: object) => boolean) =>
  new Function(
    "context",
    "currentValues",
    `var __r = (${parseDynamicExpression(expression)}); return __r === 'N' ? false : __r === 'Y' ? true : Boolean(__r);`,
  ) as any;

describe("parseDynamicExpression — @field_name@ transformation", () => {
  describe("Transformation output", () => {
    it("transforms camelCase @fieldName@ to currentValues/context lookup", () => {
      const result = parseDynamicExpression("@fieldName@='Y'");
      expect(result).toContain('currentValues["fieldName"]');
      expect(result).toContain('context["fieldName"]');
    });

    it("transforms snake_case @field_name@ to currentValues/context lookup", () => {
      const result = parseDynamicExpression("@field_name@='Y'");
      expect(result).toContain('currentValues["field_name"]');
      expect(result).toContain('context["field_name"]');
    });

    it("transforms UPPER_SNAKE @FIELD_NAME@ to currentValues/context lookup", () => {
      const result = parseDynamicExpression("@FIELD_NAME@='Y'");
      expect(result).toContain('currentValues["FIELD_NAME"]');
      expect(result).toContain('context["FIELD_NAME"]');
    });

    it("transforms the documented error case @trxtype_display_logic@", () => {
      const result = parseDynamicExpression("@trxtype_display_logic@='Y'");
      expect(result).toContain('currentValues["trxtype_display_logic"]');
    });

    it("transforms @ad_org_id_display_logic@", () => {
      const result = parseDynamicExpression("@ad_org_id_display_logic@='Y'");
      expect(result).toContain('currentValues["ad_org_id_display_logic"]');
    });

    it("transforms bare @ACCT_DIMENSION_DISPLAY@ (no comparison)", () => {
      const result = parseDynamicExpression("@ACCT_DIMENSION_DISPLAY@");
      expect(result).toContain('currentValues["ACCT_DIMENSION_DISPLAY"]');
    });

    it("transforms logical & between two @field@ refs to &&", () => {
      const result = parseDynamicExpression("@Processed@='Y' & @DocStatus@='CO'");
      expect(result).toContain("&&");
      expect(result).toContain('currentValues["Processed"]');
      expect(result).toContain('currentValues["DocStatus"]');
    });

    it("transforms logical | between refs to ||", () => {
      const result = parseDynamicExpression("@Status@='A' | @Type@='B'");
      expect(result).toContain("||");
    });

    it("handles nested logical expression with parentheses", () => {
      const result = parseDynamicExpression("@Processed@='Y' | (@Status@='A' & @Type@='I')");
      expect(result).toContain("||");
      expect(result).toContain("&&");
    });

    it("preserves # prefix for session variables", () => {
      const result = parseDynamicExpression("@#AD_Org_ID@='1'");
      expect(result).toContain('"#AD_Org_ID"');
    });

    it("preserves $ prefix for context variables", () => {
      const result = parseDynamicExpression("@$contextVar@='X'");
      expect(result).toContain('"$contextVar"');
    });
  });

  describe("Produces valid JavaScript (no SyntaxError)", () => {
    const validCases = [
      "@fieldName@='Y'",
      "@field_name@='Y'",
      "@FIELD_NAME@='Y'",
      "@trxtype_display_logic@='Y'",
      "@ad_org_id_display_logic@='Y'",
      "@ACCT_DIMENSION_DISPLAY@",
      "@Processed@='Y' & @DocStatus@='CO'",
      "@Processed@='Y' | (@Status@='A' & @Type@='I')",
      "@#AD_Org_ID@='1'",
      "@field@!='N'",
      "@f1@!@f2@",
    ];

    for (const expr of validCases) {
      it(`"${expr}" compiles without SyntaxError`, () => {
        expect(() => compile(expr)).not.toThrow();
      });
    }
  });

  describe("Full pipeline — parsed expression evaluates correctly with SmartContext", () => {
    it("@IsSOTrx@='Y' returns true when field has value 'Y'", () => {
      const ctx = createSmartContext({ values: { IsSOTrx: "Y" } });
      expect(compile("@IsSOTrx@='Y'")(ctx, ctx)).toBe(true);
    });

    it("@IsSOTrx@='Y' returns false when field has value 'N'", () => {
      const ctx = createSmartContext({ values: { IsSOTrx: "N" } });
      expect(compile("@IsSOTrx@='Y'")(ctx, ctx)).toBe(false);
    });

    it("@trxtype_display_logic@='Y' resolves via auxiliaryInputs snake-key alias", () => {
      // auxiliaryInputs stores camelCase; SmartContext generates SNAKE alias → matches
      const ctx = createSmartContext({ auxiliaryInputs: { trxtypeDisplayLogic: "Y" } });
      expect(compile("@trxtype_display_logic@='Y'")(ctx, ctx)).toBe(true);
    });

    it("@trxtype_display_logic@='Y' returns false when auxiliaryInput is 'N'", () => {
      const ctx = createSmartContext({ auxiliaryInputs: { trxtypeDisplayLogic: "N" } });
      expect(compile("@trxtype_display_logic@='Y'")(ctx, ctx)).toBe(false);
    });

    it("@C_BPartner_ID@ resolves via DB column → HQL mapping", () => {
      const ctx = createSmartContext({
        values: { cBpartner: "123" },
        fields: {
          cBpartner: {
            hqlName: "cBpartner",
            columnName: "C_BPARTNER_ID",
            column: { dBColumnName: "C_BPARTNER_ID" },
          } as any,
        },
      });
      // Expression accesses by DB column name; mapFields sets evalContext["C_BPARTNER_ID"]
      expect(compile("@C_BPartner_ID@!=''")(ctx, ctx)).toBe(true);
    });

    it("@Processed@='Y' & @DocStatus@='CO' — AND requires both conditions", () => {
      const ctxBoth = createSmartContext({ values: { Processed: "Y", DocStatus: "CO" } });
      expect(compile("@Processed@='Y' & @DocStatus@='CO'")(ctxBoth, ctxBoth)).toBe(true);

      const ctxOne = createSmartContext({ values: { Processed: "Y", DocStatus: "DR" } });
      expect(compile("@Processed@='Y' & @DocStatus@='CO'")(ctxOne, ctxOne)).toBe(false);
    });

    it("unresolvable @missing_field@='Y' returns false without throwing", () => {
      const ctx = createSmartContext({});
      expect(() => compile("@missing_field@='Y'")(ctx, ctx)).not.toThrow();
      expect(compile("@missing_field@='Y'")(ctx, ctx)).toBe(false);
    });
  });
});

describe("Y/N normalization in compileExpression (bare @field@ fix)", () => {
  it("bare @FIELD@ with value 'N' returns false (was previously truthy bug)", () => {
    const ctx = createSmartContext({ values: { ACCT_DIMENSION_DISPLAY: "N" } });
    expect(compileNormalized("@ACCT_DIMENSION_DISPLAY@")(ctx, ctx)).toBe(false);
  });

  it("bare @FIELD@ with value 'Y' returns true", () => {
    const ctx = createSmartContext({ values: { ACCT_DIMENSION_DISPLAY: "Y" } });
    expect(compileNormalized("@ACCT_DIMENSION_DISPLAY@")(ctx, ctx)).toBe(true);
  });

  it("bare @FIELD@ with empty/unresolved returns false", () => {
    const ctx = createSmartContext({});
    expect(compileNormalized("@ACCT_DIMENSION_DISPLAY@")(ctx, ctx)).toBe(false);
  });

  it("comparison @field@='Y' still works correctly after normalization", () => {
    const ctxY = createSmartContext({ values: { IsSOTrx: "Y" } });
    expect(compileNormalized("@IsSOTrx@='Y'")(ctxY, ctxY)).toBe(true);

    const ctxN = createSmartContext({ values: { IsSOTrx: "N" } });
    expect(compileNormalized("@IsSOTrx@='Y'")(ctxN, ctxN)).toBe(false);
  });

  it("comparison @field@='N' still works correctly", () => {
    const ctx = createSmartContext({ values: { IsSOTrx: "N" } });
    expect(compileNormalized("@IsSOTrx@='N'")(ctx, ctx)).toBe(true);
  });

  it("inequality @field@!='Y' still works correctly", () => {
    const ctx = createSmartContext({ values: { Posted: "N" } });
    expect(compileNormalized("@Posted@!='Y'")(ctx, ctx)).toBe(true);
  });

  it("AND expression still works correctly", () => {
    const ctx = createSmartContext({ values: { Processed: "Y", DocStatus: "CO" } });
    expect(compileNormalized("@Processed@='Y' & @DocStatus@='CO'")(ctx, ctx)).toBe(true);

    const ctxPartial = createSmartContext({ values: { Processed: "Y", DocStatus: "DR" } });
    expect(compileNormalized("@Processed@='Y' & @DocStatus@='CO'")(ctxPartial, ctxPartial)).toBe(false);
  });

  it("auxiliary input @trxtype_display_logic@ with 'N' hides field", () => {
    const ctx = createSmartContext({ auxiliaryInputs: { trxtypeDisplayLogic: "N" } });
    expect(compileNormalized("@trxtype_display_logic@")(ctx, ctx)).toBe(false);
  });

  it("auxiliary input @trxtype_display_logic@ with 'Y' shows field", () => {
    const ctx = createSmartContext({ auxiliaryInputs: { trxtypeDisplayLogic: "Y" } });
    expect(compileNormalized("@trxtype_display_logic@")(ctx, ctx)).toBe(true);
  });
});
