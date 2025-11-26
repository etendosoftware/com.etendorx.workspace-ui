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

import { isValidNumber, validateNumber } from "../quantitySelectorUtil";

describe("quantitySelectorUtil", () => {
  describe("isValidNumber", () => {
    it("should return true for valid positive integers", () => {
      expect(isValidNumber("123")).toBe(true);
      expect(isValidNumber("0")).toBe(true);
    });

    it("should return true for valid negative numbers", () => {
      expect(isValidNumber("-123")).toBe(true);
      expect(isValidNumber("-0")).toBe(true);
    });

    it("should return true for valid decimal numbers", () => {
      expect(isValidNumber("123.45")).toBe(true);
      expect(isValidNumber("-123.45")).toBe(true);
      expect(isValidNumber("0.5")).toBe(true);
    });

    it("should return false for invalid formats", () => {
      expect(isValidNumber("abc")).toBe(false);
      expect(isValidNumber("12.34.56")).toBe(false);
      expect(isValidNumber("")).toBe(false);
    });

    it("should return false for numbers ending with dot", () => {
      expect(isValidNumber("123.")).toBe(false);
      expect(isValidNumber("0.")).toBe(false);
    });
  });

  describe("validateNumber", () => {
    it("should return valid for valid numbers within range", () => {
      expect(validateNumber("10", 0, 100)).toEqual({ isValid: true, errorMessage: "" });
      expect(validateNumber("50.5", 0, 100)).toEqual({ isValid: true, errorMessage: "" });
    });

    it("should return error for invalid number format", () => {
      const result = validateNumber("abc", undefined, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Please enter a valid number");
    });

    it("should return error for negative numbers", () => {
      const result = validateNumber("-5", undefined, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be non-negative");
    });

    it("should return error when below minimum", () => {
      const result = validateNumber("5", 10, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be at least 10");
    });

    it("should return error when above maximum", () => {
      const result = validateNumber("150", undefined, 100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be at most 100");
    });

    it("should handle both min and max constraints", () => {
      expect(validateNumber("50", 10, 100)).toEqual({ isValid: true, errorMessage: "" });
      expect(validateNumber("5", 10, 100).isValid).toBe(false);
      expect(validateNumber("150", 10, 100).isValid).toBe(false);
    });

    it("should return error for NaN", () => {
      const result = validateNumber("123.", undefined, undefined);
      expect(result.isValid).toBe(false);
    });

    it("should handle zero correctly", () => {
      expect(validateNumber("0", 0, 100)).toEqual({ isValid: true, errorMessage: "" });
    });
  });
});
