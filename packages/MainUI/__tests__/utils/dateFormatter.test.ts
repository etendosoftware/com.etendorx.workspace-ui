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
import {
  parseOBDate,
  formatBrowserDate,
  formatBrowserDateTime,
  formatClassicDate,
  isDateLike,
  isKnownDateField,
  AUDIT_DATE_FIELD_NAMES,
} from "../../utils/dateFormatter";

describe("dateFormatter utilities", () => {
  describe("parseOBDate", () => {
    it("should parse plain date format (yyyy-MM-dd)", () => {
      const result = parseOBDate("2025-10-06");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(9); // October (0-based)
      expect(result?.getDate()).toBe(6);
    });

    it("should parse ISO datetime format with timezone", () => {
      const result = parseOBDate("2025-10-06T10:20:00-03:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(9);
    });

    it("should parse ISO datetime format without timezone", () => {
      const result = parseOBDate("2025-10-06T10:20:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("should return null for null input", () => {
      expect(parseOBDate(null)).toBeNull();
      expect(parseOBDate(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseOBDate("")).toBeNull();
    });

    it("should return null for invalid date", () => {
      expect(parseOBDate("invalid-date")).toBeNull();
    });

    it("should return null for numeric timestamps (only strings allowed)", () => {
      const timestamp = new Date("2025-10-06").getTime();
      const result = parseOBDate(timestamp);
      expect(result).toBeNull();
    });

    it("should return null for numbers (only strings allowed)", () => {
      expect(parseOBDate(123456)).toBeNull();
      expect(parseOBDate(50159)).toBeNull();
    });
  });

  describe("formatBrowserDate", () => {
    it("should format a valid date", () => {
      const date = new Date(2025, 9, 6); // October 6, 2025
      const result = formatBrowserDate(date);
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}|[\d\/.]/);
    });

    it("should return empty string for null", () => {
      expect(formatBrowserDate(null)).toBe("");
    });

    it("should return empty string for invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(formatBrowserDate(invalidDate)).toBe("");
    });

    it("should use browser locale format", () => {
      const date = new Date(2025, 9, 6);
      const result = formatBrowserDate(date);
      // Should contain digits and separators
      expect(result).toMatch(/\d/);
    });
  });

  describe("formatBrowserDateTime", () => {
    it("should format date without time when includeTime is false", () => {
      const date = new Date(2025, 9, 6, 10, 20, 0);
      const result = formatBrowserDateTime(date, false);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}|[\d\/.]/);
      // Should not contain time separators
      expect(result).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it("should format date with time when includeTime is true", () => {
      const date = new Date(2025, 9, 6, 10, 20, 0);
      const result = formatBrowserDateTime(date, true);
      expect(result).toBeTruthy();
      // Should contain time information
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should return empty string for null date", () => {
      expect(formatBrowserDateTime(null, false)).toBe("");
      expect(formatBrowserDateTime(null, true)).toBe("");
    });

    it("should return empty string for invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(formatBrowserDateTime(invalidDate, true)).toBe("");
    });
  });

  describe("formatClassicDate", () => {
    it("should format plain date string", () => {
      const result = formatClassicDate("2025-10-06");
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}|[\d\/.]/);
    });

    it("should format ISO datetime string without time", () => {
      const result = formatClassicDate("2025-10-06T10:20:00-03:00", false);
      expect(result).toBeTruthy();
      // Should not include time
      expect(result).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it("should format ISO datetime string with time", () => {
      const result = formatClassicDate("2025-10-06T10:20:00-03:00", true);
      expect(result).toBeTruthy();
      // Should include time
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should return empty string for null input", () => {
      expect(formatClassicDate(null)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(formatClassicDate(undefined)).toBe("");
    });

    it("should return empty string for invalid date", () => {
      expect(formatClassicDate("invalid-date")).toBe("");
    });
  });

  describe("isDateLike", () => {
    it("should return true for plain date format", () => {
      expect(isDateLike("2025-10-06")).toBe(true);
    });

    it("should return true for ISO datetime format", () => {
      expect(isDateLike("2025-10-06T10:20:00-03:00")).toBe(true);
    });

    it("should return true for ISO datetime without timezone", () => {
      expect(isDateLike("2025-10-06T10:20:00")).toBe(true);
    });

    it("should return false for non-date strings", () => {
      expect(isDateLike("hello world")).toBe(false);
      expect(isDateLike("123456")).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isDateLike(null)).toBe(false);
      expect(isDateLike(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isDateLike("")).toBe(false);
    });
  });

  describe("isKnownDateField", () => {
    it("should return true for audit date field names", () => {
      expect(isKnownDateField("creationDate")).toBe(true);
      expect(isKnownDateField("updated")).toBe(true);
      expect(isKnownDateField("recordTime")).toBe(true);
    });

    it("should return true for columns containing 'date'", () => {
      expect(isKnownDateField("invoiceDate")).toBe(true);
      expect(isKnownDateField("accountingDate")).toBe(true);
      expect(isKnownDateField("lastModifiedDate")).toBe(true);
    });

    it("should return true for columns containing 'time'", () => {
      expect(isKnownDateField("creationTime")).toBe(true);
      expect(isKnownDateField("updateTime")).toBe(true);
    });

    it("should return false for non-date columns", () => {
      expect(isKnownDateField("name")).toBe(false);
      expect(isKnownDateField("description")).toBe(false);
      expect(isKnownDateField("amount")).toBe(false);
    });
  });

  describe("AUDIT_DATE_FIELD_NAMES constant", () => {
    it("should contain common audit date fields", () => {
      expect(AUDIT_DATE_FIELD_NAMES).toContain("creationDate");
      expect(AUDIT_DATE_FIELD_NAMES).toContain("updated");
      expect(AUDIT_DATE_FIELD_NAMES).toContain("recordTime");
    });

    it("should be an array", () => {
      expect(Array.isArray(AUDIT_DATE_FIELD_NAMES)).toBe(true);
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle Invoice sample data correctly", () => {
      const invoiceDate = "2025-10-06";
      const accountingDate = "2025-10-06";
      const creationDate = "2025-10-06T10:20:00-03:00";
      const updated = "2025-10-06T15:03:15-03:00";

      expect(formatClassicDate(invoiceDate)).toBeTruthy();
      expect(formatClassicDate(accountingDate)).toBeTruthy();
      expect(formatClassicDate(creationDate, true)).toBeTruthy();
      expect(formatClassicDate(updated, true)).toBeTruthy();
    });

    it("should handle different date formats in the same table row", () => {
      const data = {
        invoiceDate: "2025-10-06",
        creationDate: "2025-10-06T10:20:00-03:00",
        updated: "2025-10-06T15:03:15-03:00",
      };

      const formatted = {
        invoiceDate: formatClassicDate(data.invoiceDate),
        creationDate: formatClassicDate(data.creationDate, true),
        updated: formatClassicDate(data.updated, true),
      };

      for (const value of Object.values(formatted)) {
        expect(value).toBeTruthy();
      }
    });

    it("should preserve empty values in data", () => {
      const data = {
        invoiceDate: "2025-10-06",
        finalSettlementDate: null,
      };

      expect(formatClassicDate(data.invoiceDate)).toBeTruthy();
      expect(formatClassicDate(data.finalSettlementDate)).toBe("");
    });

    it("should NOT format numeric documentNo as date", () => {
      // This was the issue: documentNo is a number like 50159, 50161, 60032, etc.
      // It should NOT be treated as a date
      const documentNo1 = 50159;
      const documentNo2 = 50161;
      const documentNo3 = 60032;

      expect(formatClassicDate(documentNo1)).toBe("");
      expect(formatClassicDate(documentNo2)).toBe("");
      expect(formatClassicDate(documentNo3)).toBe("");
    });
  });
});
