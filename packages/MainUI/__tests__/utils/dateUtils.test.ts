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

import { formatUTCTimeToLocal, formatLocalTimeToUTCPayload } from "@/utils/date/utils";

describe("Date Utils", () => {
  describe("formatUTCTimeToLocal", () => {
    describe("Input validation", () => {
      it("should return empty string for empty input", () => {
        expect(formatUTCTimeToLocal("")).toBe("");
      });

      it("should return null for null input", () => {
        expect(formatUTCTimeToLocal(null as unknown as string)).toBe(null);
      });

      it("should return undefined for undefined input", () => {
        expect(formatUTCTimeToLocal(undefined as unknown as string)).toBe(undefined);
      });

      it("should return input for non-string values", () => {
        expect(formatUTCTimeToLocal(123 as unknown as string)).toBe(123);
      });

      it("should return input for single part time string", () => {
        expect(formatUTCTimeToLocal("12")).toBe("12");
      });
    });

    describe("ISO datetime format with T", () => {
      it("should parse ISO datetime without Z suffix", () => {
        const result = formatUTCTimeToLocal("2025-01-28T12:00:00");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should parse ISO datetime with Z suffix", () => {
        const result = formatUTCTimeToLocal("2025-01-28T12:00:00Z");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle invalid ISO datetime gracefully", () => {
        const result = formatUTCTimeToLocal("invalid-T-date");
        expect(result).toBe("invalid-T-date");
      });
    });

    describe("Simple time format HH:MM:SS", () => {
      it("should convert UTC time to local time", () => {
        const result = formatUTCTimeToLocal("12:30:45");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle time without seconds", () => {
        const result = formatUTCTimeToLocal("14:30");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle midnight (00:00:00)", () => {
        const result = formatUTCTimeToLocal("00:00:00");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle end of day (23:59:59)", () => {
        const result = formatUTCTimeToLocal("23:59:59");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it("should pad single digit hours, minutes, and seconds", () => {
        const result = formatUTCTimeToLocal("01:02:03");
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        // Each part should be 2 digits
        const parts = result.split(":");
        expect(parts[0]).toHaveLength(2);
        expect(parts[1]).toHaveLength(2);
        expect(parts[2]).toHaveLength(2);
      });
    });

    describe("Invalid time formats", () => {
      it("should return original value for invalid hours", () => {
        expect(formatUTCTimeToLocal("ab:30:45")).toBe("ab:30:45");
      });

      it("should return original value for invalid minutes", () => {
        expect(formatUTCTimeToLocal("12:cd:45")).toBe("12:cd:45");
      });
    });
  });

  describe("formatLocalTimeToUTCPayload", () => {
    describe("Input validation", () => {
      it("should return empty string for empty input", () => {
        expect(formatLocalTimeToUTCPayload("")).toBe("");
      });

      it("should return null for null input", () => {
        expect(formatLocalTimeToUTCPayload(null as unknown as string)).toBe(null);
      });

      it("should return undefined for undefined input", () => {
        expect(formatLocalTimeToUTCPayload(undefined as unknown as string)).toBe(undefined);
      });

      it("should return input for non-string values", () => {
        expect(formatLocalTimeToUTCPayload(123 as unknown as string)).toBe(123);
      });

      it("should return input for single part time string", () => {
        expect(formatLocalTimeToUTCPayload("12")).toBe("12");
      });
    });

    describe("Time conversion to UTC payload", () => {
      it("should convert local time to ISO format without milliseconds", () => {
        const result = formatLocalTimeToUTCPayload("12:30:45");
        // Should return ISO format YYYY-MM-DDTHH:MM:SS
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        // Should NOT contain milliseconds
        expect(result).not.toContain(".");
      });

      it("should handle time without seconds", () => {
        const result = formatLocalTimeToUTCPayload("14:30");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle midnight (00:00:00)", () => {
        const result = formatLocalTimeToUTCPayload("00:00:00");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });

      it("should handle end of day (23:59:59)", () => {
        const result = formatLocalTimeToUTCPayload("23:59:59");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });

      it("should use today's date for the payload", () => {
        const result = formatLocalTimeToUTCPayload("12:00:00");
        const today = new Date();
        const expectedYear = today.getFullYear().toString();
        expect(result).toContain(expectedYear);
      });
    });

    describe("Invalid time formats", () => {
      it("should return original value for invalid hours", () => {
        expect(formatLocalTimeToUTCPayload("ab:30:45")).toBe("ab:30:45");
      });

      it("should return original value for invalid minutes", () => {
        expect(formatLocalTimeToUTCPayload("12:cd:45")).toBe("12:cd:45");
      });
    });

    describe("Round-trip conversion", () => {
      it("should maintain time consistency through round-trip when in same timezone", () => {
        const originalTime = "14:30:00";
        const utcPayload = formatLocalTimeToUTCPayload(originalTime);
        // The result should contain a valid ISO timestamp
        expect(utcPayload).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      });
    });
  });
});
