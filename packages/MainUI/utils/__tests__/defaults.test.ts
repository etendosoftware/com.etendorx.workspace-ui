import { EMPTY_ARRAY, EMPTY_OBJECT, EMPTY_STRING } from "../defaults";

describe("defaults", () => {
  describe("EMPTY_ARRAY", () => {
    it("should be defined", () => {
      expect(EMPTY_ARRAY).toBeDefined();
    });

    it("should be an empty array", () => {
      expect(EMPTY_ARRAY).toEqual([]);
      expect(Array.isArray(EMPTY_ARRAY)).toBe(true);
      expect(EMPTY_ARRAY).toHaveLength(0);
    });
  });

  describe("EMPTY_OBJECT", () => {
    it("should be defined", () => {
      expect(EMPTY_OBJECT).toBeDefined();
    });

    it("should be an empty object", () => {
      expect(EMPTY_OBJECT).toEqual({});
      expect(typeof EMPTY_OBJECT).toBe("object");
      expect(Object.keys(EMPTY_OBJECT)).toHaveLength(0);
    });
  });

  describe("EMPTY_STRING", () => {
    it("should be defined", () => {
      expect(EMPTY_STRING).toBeDefined();
    });

    it("should be an empty string", () => {
      expect(EMPTY_STRING).toBe("");
      expect(typeof EMPTY_STRING).toBe("string");
      expect(EMPTY_STRING).toHaveLength(0);
    });
  });
});
