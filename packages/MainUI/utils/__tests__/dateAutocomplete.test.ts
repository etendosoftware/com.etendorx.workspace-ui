import { autocompleteDate } from "../dateAutocomplete";

describe("autocompleteDate", () => {
  const FIXED_YEAR = new Date().getFullYear();
  const FIXED_MONTH = new Date().getMonth();

  describe("empty / null input", () => {
    it("returns null for an empty string", () => {
      expect(autocompleteDate("")).toBeNull();
    });

    it("returns null for a whitespace-only string", () => {
      expect(autocompleteDate("   ")).toBeNull();
    });
  });

  describe("single part (day only)", () => {
    it("parses a day and uses current month and year", () => {
      const result = autocompleteDate("15");
      expect(result).toEqual(new Date(FIXED_YEAR, FIXED_MONTH, 15));
    });

    it("returns null for an invalid day (NaN)", () => {
      const result = autocompleteDate("abc");
      expect(result).toBeNull();
    });
  });

  describe("two parts", () => {
    it("parses dd/mm using default dd/mm/yyyy format", () => {
      const result = autocompleteDate("15/08");
      expect(result).toEqual(new Date(FIXED_YEAR, 7, 15)); // August = month 7
    });

    it("parses mm/dd using mm/dd/yyyy format", () => {
      const result = autocompleteDate("08/15", "mm/dd/yyyy");
      expect(result).toEqual(new Date(FIXED_YEAR, 7, 15));
    });

    it("uses dot separator", () => {
      const result = autocompleteDate("15.08");
      expect(result).toEqual(new Date(FIXED_YEAR, 7, 15));
    });

    it("uses dash separator", () => {
      const result = autocompleteDate("15-08");
      expect(result).toEqual(new Date(FIXED_YEAR, 7, 15));
    });
  });

  describe("three parts (full date)", () => {
    it("parses dd/mm/yyyy correctly", () => {
      const result = autocompleteDate("15/08/2023");
      expect(result).toEqual(new Date(2023, 7, 15));
    });

    it("parses mm/dd/yyyy correctly", () => {
      const result = autocompleteDate("08/15/2023", "mm/dd/yyyy");
      expect(result).toEqual(new Date(2023, 7, 15));
    });

    it("parses yyyy/mm/dd correctly", () => {
      const result = autocompleteDate("2023/08/15", "yyyy/mm/dd");
      expect(result).toEqual(new Date(2023, 7, 15));
    });

    it("expands a 2-digit year to 20xx", () => {
      const result = autocompleteDate("15/08/23");
      expect(result).toEqual(new Date(2023, 7, 15));
    });

    it("uses dot separator for full date", () => {
      const result = autocompleteDate("15.08.2023");
      expect(result).toEqual(new Date(2023, 7, 15));
    });

    it("uses dash separator for full date", () => {
      const result = autocompleteDate("15-08-2023");
      expect(result).toEqual(new Date(2023, 7, 15));
    });
  });

  describe("invalid dates", () => {
    it("returns null for month 13 (out of range)", () => {
      expect(autocompleteDate("15/13/2023")).toBeNull();
    });

    it("returns null for month 0 (out of range)", () => {
      expect(autocompleteDate("15/00/2023")).toBeNull();
    });

    it("returns null for February 30 (date rollover)", () => {
      expect(autocompleteDate("30/02/2023")).toBeNull();
    });

    it("returns null for NaN day component", () => {
      expect(autocompleteDate("xx/08/2023")).toBeNull();
    });

    it("returns null for NaN month component", () => {
      expect(autocompleteDate("15/xx/2023")).toBeNull();
    });
  });
});
