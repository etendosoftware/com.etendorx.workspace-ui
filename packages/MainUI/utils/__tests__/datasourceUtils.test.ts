import { transformValueToClassicFormat } from "../datasourceUtils";

describe("datasourceUtils", () => {
  describe("transformValueToClassicFormat", () => {
    it("should handle null and undefined", () => {
      expect(transformValueToClassicFormat(null)).toBe("null");
      expect(transformValueToClassicFormat(undefined)).toBe("null");
    });

    it("should transform booleans perfectly", () => {
      expect(transformValueToClassicFormat(true)).toBe("Y");
      expect(transformValueToClassicFormat("true")).toBe("Y");
      expect(transformValueToClassicFormat(false)).toBe("N");
      expect(transformValueToClassicFormat("false")).toBe("N");
    });

    it("should transform 'null' string to 'null'", () => {
      expect(transformValueToClassicFormat("null")).toBe("null");
    });

    it("should transform ISO dates to DD-MM-YYYY format", () => {
      expect(transformValueToClassicFormat("2023-11-25")).toBe("25-11-2023");
    });

    it("should return the string representation for other values", () => {
      expect(transformValueToClassicFormat("Hello")).toBe("Hello");
      expect(transformValueToClassicFormat(123)).toBe("123");
    });
  });
});
