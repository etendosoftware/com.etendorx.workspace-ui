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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  areCalloutValuesEqual,
  collectChangedFieldNames,
  getFormHighlightScope,
  getGridHighlightScope,
  toCalloutFieldValue,
} from "../calloutHighlight";

const fieldWithReference = (reference: string) => ({ column: { reference } }) as unknown as Field;
const BOOLEAN_FIELD = fieldWithReference(FIELD_REFERENCE_CODES.BOOLEAN.id);
const STRING_FIELD = fieldWithReference(FIELD_REFERENCE_CODES.STRING.id);

describe("calloutHighlight", () => {
  describe("highlight scopes", () => {
    it("builds a scope per tab form", () => {
      expect(getFormHighlightScope("TAB1")).toBe("form:TAB1");
    });

    it("builds a scope per grid row of a tab", () => {
      expect(getGridHighlightScope("TAB1", "ROW1")).toBe("grid:TAB1:ROW1");
    });
  });

  describe("toCalloutFieldValue", () => {
    it.each([
      ["Y", true],
      ["true", true],
      ["", false],
      ["false", false],
      ["N", "N"],
    ])("converts the boolean value %p to %p", (value, expected) => {
      expect(toCalloutFieldValue(BOOLEAN_FIELD, value)).toBe(expected);
    });

    it("keeps the value of a non-boolean field", () => {
      expect(toCalloutFieldValue(STRING_FIELD, "Y")).toBe("Y");
    });

    it("keeps the value of an unknown field", () => {
      expect(toCalloutFieldValue(undefined, "")).toBe("");
    });

    it("keeps a non-string value of a boolean field", () => {
      expect(toCalloutFieldValue(BOOLEAN_FIELD, true)).toBe(true);
    });
  });

  describe("areCalloutValuesEqual", () => {
    it.each([
      [null, undefined],
      [undefined, ""],
      ["ABC", "ABC"],
      [10, "10.00"],
      ["1.5", 1.5],
      [true, true],
      [false, false],
    ])("treats %p and %p as the same value", (previous, next) => {
      expect(areCalloutValuesEqual(previous, next)).toBe(true);
    });

    it.each([
      ["", "0"],
      [null, 0],
      ["ABC", "abc"],
      [10, "10.5"],
      [true, false],
      ["10", "ten"],
    ])("treats %p and %p as different values", (previous, next) => {
      expect(areCalloutValuesEqual(previous, next)).toBe(false);
    });
  });

  describe("collectChangedFieldNames", () => {
    it("returns only the fields whose value changed", () => {
      const previous = { price: 10, tax: "TAX1", active: true, description: "" };
      const next = { price: "12.5", tax: "TAX1", active: true, description: null };

      expect(collectChangedFieldNames(previous, next)).toEqual(["price"]);
    });

    it("reports a field the form did not hold yet when its new value is not empty", () => {
      expect(collectChangedFieldNames({}, { uom: "UOM1", note: "" })).toEqual(["uom"]);
    });

    it("returns nothing when there are no new values", () => {
      expect(collectChangedFieldNames({ price: 10 }, {})).toEqual([]);
    });
  });
});
