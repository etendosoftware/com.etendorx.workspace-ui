import { buildContextString } from "../contextUtils";

// Mock the CONTEXT_CONSTANTS
jest.mock("@workspaceui/api-client/src/api/copilot", () => ({
  CONTEXT_CONSTANTS: {
    TAG_START: "<CONTEXT>",
    TAG_END: "</CONTEXT>",
  },
}));

describe("contextUtils", () => {
  describe("buildContextString", () => {
    it("should return empty string when no context items", () => {
      const result = buildContextString({
        contextItems: [],
        registersText: "records",
      });

      expect(result).toBe("");
    });

    it("should build context string with single item", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Item 1" }],
        registersText: "records",
      });

      expect(result).toContain("<CONTEXT>");
      expect(result).toContain("</CONTEXT>");
      expect(result).toContain("1 records");
      expect(result).toContain("Item 1");
    });

    it("should build context string with multiple items separated by separator", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Item 1" }, { contextString: "Item 2" }, { contextString: "Item 3" }],
        registersText: "records",
      });

      expect(result).toContain("3 records");
      expect(result).toContain("Item 1");
      expect(result).toContain("Item 2");
      expect(result).toContain("Item 3");
      expect(result).toContain("---"); // separator
    });

    it("should use custom registers text", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Data" }],
        registersText: "items",
      });

      expect(result).toContain("1 items");
    });

    it("should format output with correct structure", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Test" }],
        registersText: "records",
      });

      expect(result).toMatch(/<CONTEXT> \(1 records\):\n\nTest<\/CONTEXT>/);
    });

    it("should join multiple items with separator", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "A" }, { contextString: "B" }],
        registersText: "records",
      });

      expect(result).toContain("A\n\n---\n\nB");
    });

    it("should handle context items with complex strings", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Name: John\nAge: 30" }, { contextString: "Name: Jane\nAge: 25" }],
        registersText: "users",
      });

      expect(result).toContain("2 users");
      expect(result).toContain("Name: John");
      expect(result).toContain("Name: Jane");
    });
  });
});
