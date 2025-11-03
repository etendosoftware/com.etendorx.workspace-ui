import { FALLBACK_URL } from "../constants";

describe("constants", () => {
  describe("FALLBACK_URL", () => {
    it("should be defined", () => {
      expect(FALLBACK_URL).toBeDefined();
    });

    it("should be a string", () => {
      expect(typeof FALLBACK_URL).toBe("string");
    });

    it("should be a valid URL format", () => {
      expect(FALLBACK_URL).toMatch(/^https?:\/\//);
    });

    it("should use localhost:3000 in test environment (no window)", () => {
      // In Jest/Node.js environment, window is not defined
      expect(FALLBACK_URL).toBe("http://localhost:3000");
    });
  });
});
