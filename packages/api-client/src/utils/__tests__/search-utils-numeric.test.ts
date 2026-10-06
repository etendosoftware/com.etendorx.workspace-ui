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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Column } from "../../api/types";
import { setNumericFilterFormat } from "../numeric-filter-utils";
import { LegacyColumnFilterUtils } from "../search-utils";

const FIELD = "grandTotalAmount";
const OTHER_FIELD = "documentNo";

const buildColumn = (overrides: Partial<Column> = {}, columnName = FIELD): Column =>
  ({ id: columnName, columnName, name: columnName, ...overrides }) as unknown as Column;

const numericColumn = buildColumn({ type: "number" });
const textColumn = buildColumn({ type: "string" }, OTHER_FIELD);

/** Exposes the private operator inversion used by the `!` prefix of non numeric columns. */
const { invertOperator } = LegacyColumnFilterUtils as unknown as { invertOperator: (operator: string) => string };

/** Builds the datasource criteria for the given filter value on the given column. */
const buildCriteria = (value: unknown, column: Column = numericColumn) =>
  LegacyColumnFilterUtils.createColumnFilterCriteria([{ id: column.columnName, value }], [column]);

describe("LegacyColumnFilterUtils - classic numeric filter syntax", () => {
  afterEach(() => setNumericFilterFormat({ decimalSymbol: ".", groupingSymbol: "," }));

  describe("isNumericField", () => {
    it.each(["11", "12", "22", "29", "800008", "800019"])("detects numeric reference %s", (reference) => {
      expect(LegacyColumnFilterUtils.isNumericField(buildColumn({ type: "text", reference }))).toBe(true);
    });

    it("detects the numeric reference nested in column metadata", () => {
      const column = buildColumn({ type: "text", column: { reference: "800019" } });
      expect(LegacyColumnFilterUtils.isNumericField(column)).toBe(true);
    });

    it("keeps detecting numeric columns by type", () => {
      expect(LegacyColumnFilterUtils.isNumericField(numericColumn)).toBe(true);
    });

    it("does not flag non numeric references", () => {
      expect(LegacyColumnFilterUtils.isNumericField(buildColumn({ type: "text", reference: "10" }))).toBe(false);
      expect(LegacyColumnFilterUtils.isNumericField(buildColumn({ type: "text" }))).toBe(false);
    });
  });

  describe("criteria generation", () => {
    it.each([
      ["100", "equals", 100],
      ["=100", "equals", 100],
      ["==100", "equals", 100],
      ["!100", "notEqual", 100],
      [">100", "greaterThan", 100],
      ["<100", "lessThan", 100],
      [">=100", "greaterOrEqual", 100],
      ["<=100", "lessOrEqual", 100],
      ["  >-50  ", "greaterThan", -50],
    ])("maps %p to %s", (value, operator, expected) => {
      expect(buildCriteria(value)).toEqual([{ fieldName: FIELD, operator, value: expected }]);
    });

    it("maps an inclusive range to a single betweenInclusive criterion", () => {
      expect(buildCriteria("100...500")).toEqual([
        { fieldName: FIELD, operator: "betweenInclusive", value: undefined, start: 100, end: 500 },
      ]);
    });

    it("maps # to isNull", () => {
      expect(buildCriteria("#")).toEqual([{ fieldName: FIELD, operator: "isNull", value: undefined }]);
    });

    it.each([
      [">=100 and <=500", "and"],
      [">=100 & <=500", "and"],
      ["<100 or >500", "or"],
      ["<100 | >500", "or"],
    ])("combines %p with %s", (value, operator) => {
      const [criteria] = buildCriteria(value) as unknown as [{ operator: string; criteria: unknown[] }];
      expect(criteria.operator).toBe(operator);
      expect(criteria.criteria).toHaveLength(2);
    });

    it("combines a range with a null check", () => {
      expect(buildCriteria("1...5 or #")).toEqual([
        {
          operator: "or",
          criteria: [
            { fieldName: FIELD, operator: "betweenInclusive", value: undefined, start: 1, end: 5 },
            { fieldName: FIELD, operator: "isNull", value: undefined },
          ],
        },
      ]);
    });

    it("reads values with the user's number format", () => {
      setNumericFilterFormat({ decimalSymbol: ",", groupingSymbol: "." });
      expect(buildCriteria(">1.234,5")).toEqual([{ fieldName: FIELD, operator: "greaterThan", value: 1234.5 }]);
    });

    it("applies the syntax to General Quantity columns detected by reference", () => {
      const column = buildColumn({ type: "text", column: { reference: "800019" } });
      expect(buildCriteria("100", column)).toEqual([{ fieldName: FIELD, operator: "equals", value: 100 }]);
    });

    it.each(["^100", "~100", "!#", ">=100 and ^5", "100abc", "100...", ">"])("applies no filter for %p", (value) => {
      expect(buildCriteria(value)).toEqual([]);
    });

    it("keeps the numeric filter combined with other column filters", () => {
      const criteria = LegacyColumnFilterUtils.createColumnFilterCriteria(
        [
          { id: FIELD, value: "100...500" },
          { id: OTHER_FIELD, value: "SO" },
        ],
        [numericColumn, textColumn]
      );
      expect(criteria).toEqual([
        { fieldName: FIELD, operator: "betweenInclusive", value: undefined, start: 100, end: 500 },
        { fieldName: OTHER_FIELD, operator: "iContains", value: "SO" },
      ]);
    });

    it("does not split values longer than the logical filter limit", () => {
      const longValue = `${"1".repeat(2001)} or 2`;
      expect(buildCriteria(longValue)).toEqual([]);
    });

    it("keeps comparison operators on the existing parser for text columns", () => {
      expect(buildCriteria(">=B", textColumn)).toEqual([
        { fieldName: OTHER_FIELD, operator: "greaterOrEqual", value: "B" },
      ]);
    });

    it("leaves text columns on the existing parser", () => {
      expect(buildCriteria("100", textColumn)).toEqual([
        { fieldName: OTHER_FIELD, operator: "iContains", value: "100" },
      ]);
    });
  });

  describe("hasUnsupportedNumericOperator", () => {
    it.each(["^100", " ~100", "!#", "1*", "<100 or ^5", ">1 & /x/"])("flags %p", (value) => {
      expect(LegacyColumnFilterUtils.hasUnsupportedNumericOperator(value, numericColumn)).toBe(true);
    });

    it.each(["100", "100...500", "#", ">=100 and <=500", "", ">"])("accepts %p", (value) => {
      expect(LegacyColumnFilterUtils.hasUnsupportedNumericOperator(value, numericColumn)).toBe(false);
    });

    it("ignores non numeric columns and non string values", () => {
      expect(LegacyColumnFilterUtils.hasUnsupportedNumericOperator("^abc", textColumn)).toBe(false);
      expect(LegacyColumnFilterUtils.hasUnsupportedNumericOperator(["^100"], numericColumn)).toBe(false);
    });
  });

  describe("hasInvalidNumericValue", () => {
    it.each(["100 100", "1 2 and >5", ">", "100abc", "100...", "1,5", "^100"])("flags %p", (value) => {
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue(value, numericColumn)).toBe(true);
    });

    it.each(["100", " 100 ", "100...500", "#", ">=100 and <=500", "<100 | >500", "", "   "])("accepts %p", (value) => {
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue(value, numericColumn)).toBe(false);
    });

    it("ignores non numeric columns and non string values", () => {
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue("100 100", textColumn)).toBe(false);
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue(100, numericColumn)).toBe(false);
    });

    it("reads values with the user's number format", () => {
      setNumericFilterFormat({ decimalSymbol: ",", groupingSymbol: "." });
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue("1.234,5", numericColumn)).toBe(false);
      expect(LegacyColumnFilterUtils.hasInvalidNumericValue("1,234.5", numericColumn)).toBe(true);
    });
  });

  describe("invertOperator", () => {
    it.each([
      ["equals", "notEqual"],
      ["unknownOperator", "notEqual"],
      ["iContains", "notContains"],
    ])("inverts %s to %s", (operator, expected) => {
      expect(invertOperator(operator)).toBe(expected);
    });
  });
});
