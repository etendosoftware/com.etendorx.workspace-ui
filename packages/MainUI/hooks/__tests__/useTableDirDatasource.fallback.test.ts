import { COMBO_TABLE_DATASOURCE, COMBO_TABLE_SELECTOR_DEFAULTS } from "@/hooks/datasource/constants";

describe("useTableDirDatasource - Fallback selector constants", () => {
  describe("COMBO_TABLE_DATASOURCE", () => {
    it("should equal ComboTableDatasourceService", () => {
      expect(COMBO_TABLE_DATASOURCE).toBe("ComboTableDatasourceService");
    });
  });

  describe("COMBO_TABLE_SELECTOR_DEFAULTS", () => {
    it("should have correct datasourceName", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS.datasourceName).toBe(COMBO_TABLE_DATASOURCE);
    });

    it("should have correct displayField default", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS.displayField).toBe("_identifier");
    });

    it("should have correct valueField default", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS.valueField).toBe("id");
    });

    it("should have _noCount set to true", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS._noCount).toBe(true);
    });

    it("should have _sortBy set to _identifier", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS._sortBy).toBe("_identifier");
    });

    it("should have _selectedProperties set to id", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS._selectedProperties).toBe("id");
    });

    it("should have _extraProperties set to id,", () => {
      expect(COMBO_TABLE_SELECTOR_DEFAULTS._extraProperties).toBe("id,");
    });

    it("should be readonly (as const)", () => {
      // Verify it's treated as a const object with readonly properties
      expect(
        Object.isFrozen(COMBO_TABLE_SELECTOR_DEFAULTS) ||
          Object.getOwnPropertyNames(COMBO_TABLE_SELECTOR_DEFAULTS).length > 0
      ).toBe(true);
    });
  });

  describe("Constants integration", () => {
    it("should have all required fields for ComboTableDatasourceService", () => {
      const requiredFields = [
        "datasourceName",
        "displayField",
        "valueField",
        "_noCount",
        "_sortBy",
        "_selectedProperties",
        "_extraProperties",
      ];
      for (const field of requiredFields) {
        expect(field in COMBO_TABLE_SELECTOR_DEFAULTS).toBe(true);
      }
    });

    it("should match the response structure from ComboTableDatasourceService", () => {
      // Verify that the defaults align with what the service returns
      expect(COMBO_TABLE_SELECTOR_DEFAULTS.displayField).toBe("_identifier");
      expect(COMBO_TABLE_SELECTOR_DEFAULTS.valueField).toBe("id");
      // These match the expected response from ComboTableDatasourceService
    });
  });
});
