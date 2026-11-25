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
  getLocaleDatePlaceholder,
  getLocaleDatetimePlaceholder,
  AUDIT_DATE_FIELD_NAMES,
  getLocaleDateOrder,
  parseLocaleDate,
  toISODate,
  type DateOrder,
} from "../dateFormatter";

const PART_TYPES: Record<string, Intl.DateTimeFormatPartTypes> = { d: "day", m: "month", y: "year" };

/** Makes the browser locale format dates in the given order of parts, e.g. "mdy" for the US. */
const mockLocaleOrder = (order: string) =>
  jest.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue(
    order.split("").flatMap((letter, index) => {
      const part = { type: PART_TYPES[letter], value: "01" };
      return index === 0 ? [part] : [{ type: "literal" as const, value: "/" }, part];
    })
  );

/** Checks that a parsed value is the given local day. */
const expectDay = (date: Date | null, year: number, month: number, day: number) => {
  expect(date).not.toBeNull();
  expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([year, month - 1, day]);
};

describe("dateFormatter", () => {
  describe("parseOBDate", () => {
    it("returns null for falsy values", () => {
      expect(parseOBDate(null)).toBeNull();
      expect(parseOBDate(undefined)).toBeNull();
      expect(parseOBDate("")).toBeNull();
      expect(parseOBDate(0)).toBeNull();
    });

    it("returns the same Date if input is a valid Date", () => {
      const d = new Date(2025, 9, 6);
      expect(parseOBDate(d)).toBe(d);
    });

    it("returns null if input is an invalid Date", () => {
      expect(parseOBDate(new Date("invalid"))).toBeNull();
    });

    it("parses plain date string yyyy-MM-dd", () => {
      const result = parseOBDate("2025-10-06");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(9);
      expect(result?.getDate()).toBe(6);
    });

    it("parses ISO 8601 datetime string", () => {
      const result = parseOBDate("2025-10-06T10:20:00-03:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("returns null for strings that are whitespace only", () => {
      expect(parseOBDate("   ")).toBeNull();
    });

    it("returns null for strings that don't match any date format", () => {
      expect(parseOBDate("not-a-date")).toBeNull();
      expect(parseOBDate("06/10/2025")).toBeNull();
    });
  });

  describe("formatBrowserDate", () => {
    it("returns empty string for null", () => {
      expect(formatBrowserDate(null)).toBe("");
    });

    it("returns empty string for invalid Date", () => {
      expect(formatBrowserDate(new Date("invalid"))).toBe("");
    });

    it("returns a non-empty string for a valid Date", () => {
      const result = formatBrowserDate(new Date(2025, 9, 6));
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatBrowserDateTime", () => {
    it("returns empty string for null", () => {
      expect(formatBrowserDateTime(null)).toBe("");
    });

    it("returns empty string for invalid Date", () => {
      expect(formatBrowserDateTime(new Date("invalid"))).toBe("");
    });

    it("returns a date-only string when includeTime is false", () => {
      const result = formatBrowserDateTime(new Date(2025, 9, 6), false);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns a date+time string when includeTime is true", () => {
      const result = formatBrowserDateTime(new Date(2025, 9, 6, 10, 20, 0), true);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatClassicDate", () => {
    it("returns empty string for null/undefined values", () => {
      expect(formatClassicDate(null)).toBe("");
      expect(formatClassicDate(undefined)).toBe("");
      expect(formatClassicDate("")).toBe("");
    });

    it("formats a valid plain date string without time", () => {
      const result = formatClassicDate("2025-10-06");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats a valid date string with time when includeTime is true", () => {
      const result = formatClassicDate("2025-10-06T10:20:00-03:00", true);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("isDateLike", () => {
    it("returns false for falsy values", () => {
      expect(isDateLike(null)).toBe(false);
      expect(isDateLike(undefined)).toBe(false);
      expect(isDateLike("")).toBe(false);
      expect(isDateLike(0)).toBe(false);
    });

    it("returns true for plain date format", () => {
      expect(isDateLike("2025-10-06")).toBe(true);
    });

    it("returns true for ISO datetime format", () => {
      expect(isDateLike("2025-10-06T10:20:00-03:00")).toBe(true);
    });

    it("returns false for non-date strings", () => {
      expect(isDateLike("hello")).toBe(false);
      expect(isDateLike("06/10/2025")).toBe(false);
      expect(isDateLike(12345)).toBe(false);
    });
  });

  describe("isKnownDateField", () => {
    it("returns true for audit date field names", () => {
      for (const field of AUDIT_DATE_FIELD_NAMES) {
        expect(isKnownDateField(field)).toBe(true);
      }
    });

    it("returns true for column names containing 'date'", () => {
      expect(isKnownDateField("birthDate")).toBe(true);
      expect(isKnownDateField("invoicedate")).toBe(true);
    });

    it("returns true for column names containing 'time'", () => {
      expect(isKnownDateField("startTime")).toBe(true);
      expect(isKnownDateField("timestamp")).toBe(true);
    });

    it("returns false for unrelated column names", () => {
      expect(isKnownDateField("name")).toBe(false);
      expect(isKnownDateField("amount")).toBe(false);
    });
  });

  describe("getLocaleDatePlaceholder", () => {
    it("returns a non-empty string with placeholder tokens", () => {
      const result = getLocaleDatePlaceholder();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getLocaleDatetimePlaceholder", () => {
    it("returns a non-empty string with date and time placeholder tokens", () => {
      const result = getLocaleDatetimePlaceholder();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getLocaleDateOrder", () => {
    afterEach(() => jest.restoreAllMocks());

    it.each<DateOrder>(["dmy", "mdy", "ymd"])("returns the %s order of the browser locale", (order) => {
      mockLocaleOrder(order);
      expect(getLocaleDateOrder()).toBe(order);
    });

    it("falls back to day-month-year for an unknown order", () => {
      mockLocaleOrder("ydm");
      expect(getLocaleDateOrder()).toBe("dmy");
    });

    it("falls back to day-month-year when the locale cannot be read", () => {
      jest.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockImplementation(() => {
        throw new Error("no locale");
      });
      expect(getLocaleDateOrder()).toBe("dmy");
    });
  });

  describe("parseLocaleDate", () => {
    afterEach(() => jest.restoreAllMocks());

    it("reads day-month-year dates with any separator and one or two digits", () => {
      mockLocaleOrder("dmy");
      expectDay(parseLocaleDate("13/10/2026"), 2026, 10, 13);
      expectDay(parseLocaleDate("13-10-2026"), 2026, 10, 13);
      expectDay(parseLocaleDate(" 1.2.2026 "), 2026, 2, 1);
    });

    it("reads month-day-year dates in a US locale", () => {
      mockLocaleOrder("mdy");
      expectDay(parseLocaleDate("10/13/2026"), 2026, 10, 13);
    });

    it("reads year-month-day dates in a locale that starts with the year", () => {
      mockLocaleOrder("ymd");
      expectDay(parseLocaleDate("2026/10/13"), 2026, 10, 13);
    });

    it("always reads ISO dates as year-month-day", () => {
      mockLocaleOrder("mdy");
      expectDay(parseLocaleDate("2026-10-13"), 2026, 10, 13);
    });

    it.each(["31/02/2026", "13/13/2026", "00/10/2026", "13/10/26", "130/10/2026", "abc", "", "13/10/2026x"])(
      "returns null for %p",
      (text) => {
        mockLocaleOrder("dmy");
        expect(parseLocaleDate(text)).toBeNull();
      }
    );
  });

  describe("toISODate", () => {
    it("formats the local day as YYYY-MM-DD with padding", () => {
      expect(toISODate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    });
  });
});
