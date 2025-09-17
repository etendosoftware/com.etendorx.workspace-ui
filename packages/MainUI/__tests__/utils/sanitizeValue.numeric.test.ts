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
 *************************************************************************/

import { sanitizeValue } from "@/utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { Field } from "@workspaceui/api-client/src/api/types";

describe("sanitizeValue numeric field handling", () => {
  const createMockField = (reference: string): Field =>
    ({
      id: "test-field",
      name: "testField",
      inputName: "testField",
      column: {
        reference,
      },
    }) as Field;

  describe("INTEGER fields", () => {
    const integerField = createMockField(FIELD_REFERENCE_CODES.INTEGER);

    it("should convert string numbers to numeric values", () => {
      expect(sanitizeValue("123", integerField)).toBe(123);
      expect(sanitizeValue("0", integerField)).toBe(0);
      expect(sanitizeValue("-456", integerField)).toBe(-456);
    });

    it("should preserve numeric values", () => {
      expect(sanitizeValue(123, integerField)).toBe(123);
      expect(sanitizeValue(0, integerField)).toBe(0);
      expect(sanitizeValue(-456, integerField)).toBe(-456);
    });

    it("should handle null, undefined, and empty string", () => {
      expect(sanitizeValue(null, integerField)).toBeNull();
      expect(sanitizeValue(undefined, integerField)).toBeNull();
      expect(sanitizeValue("", integerField)).toBeNull();
    });

    it("should preserve invalid numeric strings", () => {
      expect(sanitizeValue("not-a-number", integerField)).toBe("not-a-number");
      expect(sanitizeValue("abc123", integerField)).toBe("abc123");
    });
  });

  describe("NUMERIC fields", () => {
    const numericField = createMockField(FIELD_REFERENCE_CODES.NUMERIC);

    it("should convert string numbers to numeric values", () => {
      expect(sanitizeValue("123.45", numericField)).toBe(123.45);
      expect(sanitizeValue("0.0", numericField)).toBe(0);
      expect(sanitizeValue("-456.78", numericField)).toBe(-456.78);
    });

    it("should preserve numeric values", () => {
      expect(sanitizeValue(123.45, numericField)).toBe(123.45);
      expect(sanitizeValue(0.0, numericField)).toBe(0);
      expect(sanitizeValue(-456.78, numericField)).toBe(-456.78);
    });
  });

  describe("DECIMAL fields", () => {
    const decimalField = createMockField(FIELD_REFERENCE_CODES.DECIMAL);

    it("should convert string numbers to numeric values", () => {
      expect(sanitizeValue("999.999", decimalField)).toBe(999.999);
      expect(sanitizeValue("0.001", decimalField)).toBe(0.001);
    });

    it("should preserve numeric values", () => {
      expect(sanitizeValue(999.999, decimalField)).toBe(999.999);
      expect(sanitizeValue(0.001, decimalField)).toBe(0.001);
    });
  });

  describe("QUANTITY fields", () => {
    const quantityField = createMockField(FIELD_REFERENCE_CODES.QUANTITY_29);

    it("should convert string numbers to numeric values", () => {
      expect(sanitizeValue("10.5", quantityField)).toBe(10.5);
      expect(sanitizeValue("100", quantityField)).toBe(100);
    });

    it("should preserve numeric values", () => {
      expect(sanitizeValue(10.5, quantityField)).toBe(10.5);
      expect(sanitizeValue(100, quantityField)).toBe(100);
    });
  });

  describe("consumptionDays specific scenario", () => {
    const consumptionDaysField = createMockField(FIELD_REFERENCE_CODES.INTEGER);

    it("should handle the specific case that was causing the error", () => {
      // This was the problematic case: "0" string being sent to backend
      // which expects java.lang.Long
      expect(sanitizeValue("0", consumptionDaysField)).toBe(0);
      expect(sanitizeValue("30", consumptionDaysField)).toBe(30);
      expect(sanitizeValue("365", consumptionDaysField)).toBe(365);
    });
  });

  describe("non-numeric fields should not be affected", () => {
    const textField = createMockField("10"); // String reference

    it("should preserve string values for text fields", () => {
      expect(sanitizeValue("some text", textField)).toBe("some text");
      expect(sanitizeValue("123", textField)).toBe("123");
    });

    it("should handle boolean conversion for text fields", () => {
      expect(sanitizeValue(true, textField)).toBe("Y");
      expect(sanitizeValue(false, textField)).toBe("N");
    });
  });
});
