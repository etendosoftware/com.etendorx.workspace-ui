import { parseCsvIds, parseCsvIdentifiers, toCsv, toCsvIdentifiers } from "../multiSelectorCsv";

describe("multiSelectorCsv helpers", () => {
  describe("parseCsvIds", () => {
    it("splits comma-separated IDs without spaces", () => {
      expect(parseCsvIds("a,b,c")).toEqual(["a", "b", "c"]);
    });

    it("returns empty array on empty string", () => {
      expect(parseCsvIds("")).toEqual([]);
    });

    it("returns empty array on undefined", () => {
      expect(parseCsvIds(undefined)).toEqual([]);
    });

    it("returns empty array on null", () => {
      expect(parseCsvIds(null)).toEqual([]);
    });

    it("returns empty array on non-string input", () => {
      expect(parseCsvIds(123)).toEqual([]);
      expect(parseCsvIds(["a"])).toEqual([]);
      expect(parseCsvIds({})).toEqual([]);
    });

    it("handles single ID", () => {
      expect(parseCsvIds("only-id")).toEqual(["only-id"]);
    });
  });

  describe("parseCsvIdentifiers", () => {
    it("splits on ', ' to preserve labels containing commas-as-content (Classic convention)", () => {
      expect(parseCsvIdentifiers("Drafted, Completed, Voided")).toEqual(["Drafted", "Completed", "Voided"]);
    });

    it("returns empty array on empty string", () => {
      expect(parseCsvIdentifiers("")).toEqual([]);
    });

    it("returns empty array on undefined", () => {
      expect(parseCsvIdentifiers(undefined)).toEqual([]);
    });

    it("returns empty array on null", () => {
      expect(parseCsvIdentifiers(null)).toEqual([]);
    });
  });

  describe("toCsv", () => {
    it("joins IDs with ','", () => {
      expect(toCsv(["a", "b"])).toBe("a,b");
    });

    it("returns empty string for empty array", () => {
      expect(toCsv([])).toBe("");
    });

    it("handles single element", () => {
      expect(toCsv(["only-id"])).toBe("only-id");
    });
  });

  describe("toCsvIdentifiers", () => {
    it("joins identifiers with ', '", () => {
      expect(toCsvIdentifiers(["X", "Y"])).toBe("X, Y");
    });

    it("returns empty string for empty array", () => {
      expect(toCsvIdentifiers([])).toBe("");
    });
  });

  describe("roundtrip", () => {
    it("parseCsvIds(toCsv(arr)) === arr", () => {
      const arr = ["a", "b", "c"];
      expect(parseCsvIds(toCsv(arr))).toEqual(arr);
    });

    it("parseCsvIdentifiers(toCsvIdentifiers(arr)) === arr", () => {
      const arr = ["Drafted", "Completed"];
      expect(parseCsvIdentifiers(toCsvIdentifiers(arr))).toEqual(arr);
    });
  });
});
