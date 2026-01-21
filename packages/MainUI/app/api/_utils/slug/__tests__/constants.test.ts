import { SLUGS_CATEGORIES, SLUGS_METHODS } from "../constants";

describe("slug constants", () => {
  describe("SLUGS_CATEGORIES", () => {
    it("should have COPILOT category", () => {
      expect(SLUGS_CATEGORIES.COPILOT).toBe("copilot");
    });

    it("should have UTILITY category", () => {
      expect(SLUGS_CATEGORIES.UTILITY).toBe("utility");
    });

    it("should have NOTES category", () => {
      expect(SLUGS_CATEGORIES.NOTES).toBe("notes");
    });

    it("should have ATTACHMENTS category", () => {
      expect(SLUGS_CATEGORIES.ATTACHMENTS).toBe("attachments");
    });

    it("should have SWS category", () => {
      expect(SLUGS_CATEGORIES.SWS).toBe("sws");
    });

    it("should have LEGACY category", () => {
      expect(SLUGS_CATEGORIES.LEGACY).toBe("meta/legacy");
    });

    it("should have OPENBRAVO_KERNEL category", () => {
      expect(SLUGS_CATEGORIES.OPENBRAVO_KERNEL).toBe("org.openbravo.client.kernel");
    });

    it("should contain all expected categories", () => {
      const categories = Object.keys(SLUGS_CATEGORIES);
      expect(categories).toHaveLength(7);
      expect(categories).toContain("COPILOT");
      expect(categories).toContain("UTILITY");
      expect(categories).toContain("NOTES");
      expect(categories).toContain("ATTACHMENTS");
      expect(categories).toContain("SWS");
      expect(categories).toContain("LEGACY");
      expect(categories).toContain("OPENBRAVO_KERNEL");
    });
  });

  describe("SLUGS_METHODS", () => {
    it("should have CREATE method", () => {
      expect(SLUGS_METHODS.CREATE).toBe("create");
    });

    it("should have UPDATE method", () => {
      expect(SLUGS_METHODS.UPDATE).toBe("update");
    });

    it("should have DELETE method", () => {
      expect(SLUGS_METHODS.DELETE).toBe("delete");
    });

    it("should contain all expected methods", () => {
      const methods = Object.keys(SLUGS_METHODS);
      expect(methods).toHaveLength(3);
      expect(methods).toContain("CREATE");
      expect(methods).toContain("UPDATE");
      expect(methods).toContain("DELETE");
    });
  });
});
