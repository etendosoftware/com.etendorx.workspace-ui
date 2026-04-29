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
 * All portions are Copyright © 2024–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { parseDynamicExpression } from "../index";

// Compile a parsed expression into a callable function for testing.
// Uses no shims — plain objects as context/currentValues.
function compile(expr: string): (ctx: Record<string, unknown>, vals: Record<string, unknown>) => unknown {
  // biome-ignore lint/complexity/noBannedTypes: test helper using new Function intentionally
  return new Function("context", "currentValues", `return ${parseDynamicExpression(expr)};`) as (
    ctx: Record<string, unknown>,
    vals: Record<string, unknown>
  ) => unknown;
}

// Execute a parsed expression with a single values object used for both args.
function run(expr: string, values: Record<string, unknown>): unknown {
  return compile(expr)(values, values);
}

describe("parseDynamicExpression — @field_name@ tokenization", () => {
  describe("single field reference", () => {
    it("resolves a field and evaluates equality to true", () => {
      expect(run("@isActive@='Y'", { isActive: "Y" })).toBe(true);
    });

    it("resolves a field and evaluates equality to false", () => {
      expect(run("@isActive@='Y'", { isActive: "N" })).toBe(false);
    });

    it("returns empty string for a missing field (no throw)", () => {
      expect(() => run("@missingField@='X'", {})).not.toThrow();
      // empty string != 'X'
      expect(run("@missingField@='X'", {})).toBe(false);
    });

    it("does not throw when field is undefined in values", () => {
      expect(() => run("@qty@", { qty: undefined })).not.toThrow();
    });
  });

  describe("falsy-but-valid values", () => {
    it("treats numeric 0 as the real value, not as missing", () => {
      // @qty@=0 — qty IS zero, should match
      expect(run("@qty@=0", { qty: 0 })).toBe(true);
    });

    it("treats empty string as the real value, not as missing", () => {
      expect(run("@name@=''", { name: "" })).toBe(true);
    });

    it("treats boolean false as the real value (not shadowed by context fallback)", () => {
      // Both args receive the same object; false ?? false === false
      expect(run("@active@", { active: false })).toBe(false);
    });

    it("does not shadow boolean false with a context value", () => {
      const ctx = { active: "Y" };
      const vals = { active: false };
      // vals["active"] (false) ?? ctx["active"] ("Y") → false, since false is not null/undefined
      expect(compile("@active@")(ctx, vals)).toBe(false);
    });
  });

  describe("multiple field references", () => {
    it("evaluates AND of two conditions both true", () => {
      expect(run("@docStatus@='CO' && @isActive@='Y'", { docStatus: "CO", isActive: "Y" })).toBe(true);
    });

    it("evaluates AND when one condition is false", () => {
      expect(run("@docStatus@='CO' && @isActive@='Y'", { docStatus: "DR", isActive: "Y" })).toBe(false);
    });

    it("evaluates OR of two conditions where one is true", () => {
      expect(run("@docStatus@='CO' || @docStatus@='CL'", { docStatus: "CL" })).toBe(true);
    });

    it("evaluates OR when both conditions are false", () => {
      expect(run("@docStatus@='CO' || @docStatus@='CL'", { docStatus: "DR" })).toBe(false);
    });
  });

  describe("inequality operator", () => {
    it("evaluates != correctly for a non-matching value", () => {
      expect(run("@status@!='VO'", { status: "CO" })).toBe(true);
    });

    it("evaluates != correctly for a matching value (should be false)", () => {
      expect(run("@status@!='VO'", { status: "VO" })).toBe(false);
    });

    it("handles @FieldA@!@FieldB@ (two-field inequality without spaces)", () => {
      expect(run("@inventoryStatus@!@toStateId@", { inventoryStatus: "A", toStateId: "B" })).toBe(true);
      expect(run("@inventoryStatus@!@toStateId@", { inventoryStatus: "X", toStateId: "X" })).toBe(false);
    });
  });

  describe("session variables (#/$ prefix)", () => {
    it("resolves #-prefixed session variable from context", () => {
      const ctx = { "#AD_Org_ID": "1000000" };
      expect(compile("@#AD_Org_ID@='1000000'")(ctx, {})).toBe(true);
    });

    it("resolves $-prefixed context variable", () => {
      const ctx = { $C_Currency_ID: "102" };
      expect(compile("@$C_Currency_ID@='102'")(ctx, {})).toBe(true);
    });
  });

  describe("logical operators & bitwise single-char normalisation", () => {
    it("converts single & to &&", () => {
      expect(run("@a@='1' & @b@='2'", { a: "1", b: "2" })).toBe(true);
    });

    it("converts single | to ||", () => {
      expect(run("@a@='1' | @b@='2'", { a: "0", b: "2" })).toBe(true);
    });
  });

  describe("logical negation preservation", () => {
    it("does not corrupt standalone ! negation (legacy expression guard)", () => {
      // After tokenisation, !(currentValues["x"] ?? ...) must stay as logical NOT,
      // not become the invalid JS token !=(...).
      expect(() => parseDynamicExpression("!@x@")).not.toThrow();
      const fn = compile("!@x@");
      expect(fn({}, { x: "Y" })).toBeFalsy();
      expect(fn({}, { x: "" })).toBeTruthy();
    });
  });

  describe("reactive updates (same compiled function, different inputs)", () => {
    it("re-evaluates when input values change without cache corruption", () => {
      const fn = compile("@docStatus@='CO'");
      expect(fn({}, { docStatus: "CO" })).toBe(true);
      expect(fn({}, { docStatus: "DR" })).toBe(false);
      expect(fn({}, { docStatus: "CO" })).toBe(true);
    });

    it("handles undefined then defined values for the same field", () => {
      const fn = compile("@qty@=5");
      // qty not yet in form → treated as "" → false
      expect(fn({}, {})).toBe(false);
      // qty provided
      expect(fn({}, { qty: 5 })).toBe(true);
    });
  });
});
