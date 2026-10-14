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

import {
  type NumericFilterFormat,
  getNumericFilterFormat,
  isUnsupportedNumericTerm,
  parseLocaleNumber,
  parseNumericTerm,
  setNumericFilterFormat,
} from "../numeric-filter-utils";

const FIELD = "grandTotalAmount";
const EN_FORMAT: NumericFilterFormat = { decimalSymbol: ".", groupingSymbol: "," };
const ES_FORMAT: NumericFilterFormat = { decimalSymbol: ",", groupingSymbol: "." };

describe("numeric-filter-utils", () => {
  afterEach(() => setNumericFilterFormat(EN_FORMAT));

  describe("numeric filter format", () => {
    it("defaults to dot decimal and comma grouping", () => {
      expect(getNumericFilterFormat()).toEqual(EN_FORMAT);
    });

    it("stores a copy of the given format", () => {
      const format = { ...ES_FORMAT };
      setNumericFilterFormat(format);
      format.decimalSymbol = "x";
      expect(getNumericFilterFormat()).toEqual(ES_FORMAT);
    });
  });

  describe("parseLocaleNumber", () => {
    it.each([
      ["100", EN_FORMAT, 100],
      [" 100 ", EN_FORMAT, 100],
      ["-50", EN_FORMAT, -50],
      ["+7", EN_FORMAT, 7],
      ["1,234.56", EN_FORMAT, 1234.56],
      ["1234.5", EN_FORMAT, 1234.5],
      [".5", EN_FORMAT, 0.5],
      ["1.234,56", ES_FORMAT, 1234.56],
      ["1234,5", ES_FORMAT, 1234.5],
      ["0", ES_FORMAT, 0],
    ])("parses %p with the given format", (text, format, expected) => {
      expect(parseLocaleNumber(text, format)).toBe(expected);
    });

    it.each([
      ["", EN_FORMAT],
      ["-", EN_FORMAT],
      ["100.", EN_FORMAT],
      ["100abc", EN_FORMAT],
      ["1,5", EN_FORMAT],
      ["1.5", ES_FORMAT],
      [",123", EN_FORMAT],
    ])("rejects %p", (text, format) => {
      expect(parseLocaleNumber(text, format)).toBeNull();
    });

    it("uses the current format when none is given", () => {
      setNumericFilterFormat(ES_FORMAT);
      expect(parseLocaleNumber("1.234,5")).toBe(1234.5);
    });
  });

  describe("isUnsupportedNumericTerm", () => {
    it.each(["^100", "~100", "!~1", "!^1", "!@1", "!#", "=(1,2)", "!=(1)", "=.field", "/1/", "1*", " ^100"])(
      "flags %p as unsupported",
      (term) => {
        expect(isUnsupportedNumericTerm(term)).toBe(true);
      }
    );

    it.each(["100", "!100", ">=1", "=1", "#", "1...2", "-5", ">"])("accepts %p", (term) => {
      expect(isUnsupportedNumericTerm(term)).toBe(false);
    });
  });

  describe("parseNumericTerm", () => {
    it.each([
      ["100", "equals", 100],
      ["=100", "equals", 100],
      ["==100", "equals", 100],
      ["!100", "notEqual", 100],
      [">100", "greaterThan", 100],
      ["<100", "lessThan", 100],
      [">=100", "greaterOrEqual", 100],
      ["<=100", "lessOrEqual", 100],
      ["> 100", "greaterThan", 100],
      ["<-50", "lessThan", -50],
    ])("maps %p to %s", (term, operator, value) => {
      expect(parseNumericTerm(FIELD, term, EN_FORMAT)).toEqual({ fieldName: FIELD, operator, value });
    });

    it("maps # to an isNull criterion without value", () => {
      expect(parseNumericTerm(FIELD, " # ", EN_FORMAT)).toEqual({
        fieldName: FIELD,
        operator: "isNull",
        value: undefined,
      });
    });

    it("maps a...b to a betweenInclusive criterion", () => {
      expect(parseNumericTerm(FIELD, "100 ... 500", EN_FORMAT)).toEqual({
        fieldName: FIELD,
        operator: "betweenInclusive",
        value: undefined,
        start: 100,
        end: 500,
      });
    });

    it("reads range limits and negatives with the given format", () => {
      expect(parseNumericTerm(FIELD, "-1.000,5...2.000", ES_FORMAT)).toMatchObject({ start: -1000.5, end: 2000 });
    });

    it("reads comparison values with the current format by default", () => {
      setNumericFilterFormat(ES_FORMAT);
      expect(parseNumericTerm(FIELD, ">1.234,5")).toEqual({ fieldName: FIELD, operator: "greaterThan", value: 1234.5 });
    });

    it.each(["", "   ", ">", "-", "100...", "...500", "1...2...3", "100abc", ">1x", "^100", "!#", "!>100"])(
      "returns null for %p",
      (term) => {
        expect(parseNumericTerm(FIELD, term, EN_FORMAT)).toBeNull();
      }
    );
  });
});
