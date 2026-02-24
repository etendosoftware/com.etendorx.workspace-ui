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

import { normalizeDates, transformDates } from "../normalizeDates";

describe("normalizeDates", () => {
  // ============================================================================
  // Test Data Factories
  // ============================================================================

  const createNestedObject = (dateValue: string) => ({
    level1: {
      level2: {
        date: dateValue,
      },
    },
  });

  // ============================================================================
  // normalizeDates Tests
  // ============================================================================

  describe("string handling", () => {
    describe("ISO datetime strings with milliseconds", () => {
      it.each([
        {
          input: "2025-10-06T10:20:00.123Z",
          description: "UTC with milliseconds",
        },
        {
          input: "2025-10-06T10:20:00.999Z",
          description: "UTC with different milliseconds",
        },
        {
          input: "2025-10-06T10:20:00.1Z",
          description: "UTC with single digit milliseconds",
        },
      ])("should normalize $description to local datetime", ({ input }) => {
        const result = normalizeDates(input);
        expect(typeof result).toBe("string");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        expect(result).not.toContain("Z");
        expect(result).not.toContain(".");
      });
    });

    describe("ISO datetime strings with timezone offset", () => {
      it.each([
        { input: "2025-10-06T10:20:00.123+03:00", tz: "+03:00" },
        { input: "2025-10-06T10:20:00.456-05:00", tz: "-05:00" },
        { input: "2025-10-06T10:20:00.789+00:00", tz: "+00:00" },
      ])("should normalize datetime with $tz offset", ({ input }) => {
        const result = normalizeDates(input);
        expect(typeof result).toBe("string");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });
    });

    describe("strings that should NOT be modified", () => {
      it.each([
        { input: "2025-10-06", description: "plain date" },
        { input: "2025-10-06T10:20:00", description: "simple datetime without milliseconds" },
        { input: "Hello World", description: "regular text" },
        { input: "", description: "empty string" },
        { input: "2025/10/06", description: "non-ISO date format" },
        { input: "10:20:00", description: "time only" },
      ])("should not modify $description", ({ input }) => {
        expect(normalizeDates(input)).toBe(input);
      });
    });
  });

  describe("array handling", () => {
    it("should recursively normalize dates in arrays", () => {
      const input = ["2025-10-06T10:20:00.123Z", "plain text", "2025-10-06"];
      const result = normalizeDates(input) as string[];

      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(result[1]).toBe("plain text");
      expect(result[2]).toBe("2025-10-06");
    });

    it("should handle nested arrays", () => {
      const input = [["2025-10-06T10:20:00.123Z"]];
      const result = normalizeDates(input) as string[][];

      expect(result[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it("should handle empty arrays", () => {
      expect(normalizeDates([])).toEqual([]);
    });
  });

  describe("object handling", () => {
    it("should recursively normalize dates in objects", () => {
      const input = {
        createdAt: "2025-10-06T10:20:00.123Z",
        name: "Test",
        date: "2025-10-06",
      };
      const result = normalizeDates(input) as Record<string, unknown>;

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(result.name).toBe("Test");
      expect(result.date).toBe("2025-10-06");
    });

    it("should handle deeply nested objects", () => {
      const input = createNestedObject("2025-10-06T10:20:00.123Z");
      const result = normalizeDates(input) as typeof input;

      expect(result.level1.level2.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it("should handle null values", () => {
      expect(normalizeDates(null)).toBeNull();
    });

    it("should handle empty objects", () => {
      expect(normalizeDates({})).toEqual({});
    });

    it("should only process own properties", () => {
      const proto = { inheritedDate: "2025-10-06T10:20:00.123Z" };
      const input = Object.create(proto);
      input.ownDate = "2025-10-06T10:20:00.456Z";

      const result = normalizeDates(input) as Record<string, unknown>;

      expect(result.inheritedDate).toBeUndefined();
      expect(result.ownDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe("primitive handling", () => {
    it.each([
      { input: 123, description: "number" },
      { input: true, description: "boolean true" },
      { input: false, description: "boolean false" },
      { input: undefined, description: "undefined" },
    ])("should return $description unchanged", ({ input }) => {
      expect(normalizeDates(input)).toBe(input);
    });
  });
});

describe("transformDates", () => {
  // ============================================================================
  // transformDates Tests
  // ============================================================================

  describe("date format conversion", () => {
    it.each([
      { input: "06-10-2025", expected: "2025-10-06", description: "DD-MM-YYYY to YYYY-MM-DD" },
      { input: "31-12-2025", expected: "2025-12-31", description: "end of year date" },
      { input: "01-01-2025", expected: "2025-01-01", description: "beginning of year date" },
    ])("should convert $description", ({ input, expected }) => {
      expect(transformDates(input)).toBe(expected);
    });
  });

  describe("strings that should NOT be transformed", () => {
    it.each([
      { input: "2025-10-06", description: "already YYYY-MM-DD format" },
      { input: "Hello World", description: "regular text" },
      { input: "", description: "empty string" },
      { input: "06/10/2025", description: "slash separated date" },
      { input: "6-10-2025", description: "single digit day" },
      { input: "06-1-2025", description: "single digit month" },
    ])("should not modify $description", ({ input }) => {
      expect(transformDates(input)).toBe(input);
    });
  });

  describe("array handling", () => {
    it("should recursively transform dates in arrays", () => {
      const input = ["06-10-2025", "plain text"];
      const result = transformDates(input) as string[];

      expect(result[0]).toBe("2025-10-06");
      expect(result[1]).toBe("plain text");
    });

    it("should handle empty arrays", () => {
      expect(transformDates([])).toEqual([]);
    });
  });

  describe("object handling", () => {
    it("should recursively transform dates in objects", () => {
      const input = {
        date: "06-10-2025",
        name: "Test",
      };
      const result = transformDates(input) as Record<string, unknown>;

      expect(result.date).toBe("2025-10-06");
      expect(result.name).toBe("Test");
    });

    it("should handle null values", () => {
      expect(transformDates(null)).toBeNull();
    });
  });

  describe("primitive handling", () => {
    it.each([
      { input: 123, description: "number" },
      { input: true, description: "boolean" },
      { input: undefined, description: "undefined" },
    ])("should return $description unchanged", ({ input }) => {
      expect(transformDates(input)).toBe(input);
    });
  });
});
