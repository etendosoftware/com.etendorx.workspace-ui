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

import { shouldCacheDatasource } from "../datasourceCache";

describe("datasourceCache", () => {
  describe("shouldCacheDatasource", () => {
    it("should return false for any entity (current implementation)", () => {
      expect(shouldCacheDatasource("TestEntity")).toBe(false);
      expect(shouldCacheDatasource("AnotherEntity")).toBe(false);
      expect(shouldCacheDatasource("User")).toBe(false);
      expect(shouldCacheDatasource("Product")).toBe(false);
    });

    it("should return false for empty string entity", () => {
      expect(shouldCacheDatasource("")).toBe(false);
    });

    it("should handle entity names with special characters", () => {
      expect(shouldCacheDatasource("Test-Entity")).toBe(false);
      expect(shouldCacheDatasource("test_entity")).toBe(false);
      expect(shouldCacheDatasource("TestEntity123")).toBe(false);
      expect(shouldCacheDatasource("Entity.With.Dots")).toBe(false);
    });

    it("should handle very long entity names", () => {
      const longEntityName = "A".repeat(1000);
      expect(shouldCacheDatasource(longEntityName)).toBe(false);
    });

    it("should handle entity names with Unicode characters", () => {
      expect(shouldCacheDatasource("测试实体")).toBe(false);
      expect(shouldCacheDatasource("Entity🚀")).toBe(false);
      expect(shouldCacheDatasource("EntidadPrueba")).toBe(false);
    });

    it("should ignore parameters parameter (not currently used)", () => {
      expect(shouldCacheDatasource("Entity", { param1: "value1" })).toBe(false);
      expect(shouldCacheDatasource("Entity", null)).toBe(false);
      expect(shouldCacheDatasource("Entity", {})).toBe(false);
      expect(shouldCacheDatasource("Entity", { complex: { nested: "object" } })).toBe(false);
    });

    it("should handle case-sensitive entity names consistently", () => {
      expect(shouldCacheDatasource("testentity")).toBe(false);
      expect(shouldCacheDatasource("TestEntity")).toBe(false);
      expect(shouldCacheDatasource("TESTENTITY")).toBe(false);
      expect(shouldCacheDatasource("tESTENTITY")).toBe(false);
    });

    it("should work with common entity names", () => {
      const commonEntities = [
        "User",
        "Product",
        "Order",
        "Customer",
        "Invoice",
        "Payment",
        "Inventory",
        "Organization",
        "BusinessPartner",
        "Window",
        "Tab",
        "Field",
        "Process",
      ];

      for (const entity of commonEntities) {
        expect(shouldCacheDatasource(entity)).toBe(false);
      }
    });

    // Future-proofing tests for when caching logic is implemented
    describe("future caching logic considerations", () => {
      it("should be ready for entity-specific caching configuration", () => {
        // These tests document the expected interface when caching is implemented
        // Currently all return false, but the structure is ready for future changes

        // Example: Static/reference data might be cached
        expect(shouldCacheDatasource("Country")).toBe(false);
        expect(shouldCacheDatasource("Currency")).toBe(false);
        expect(shouldCacheDatasource("Language")).toBe(false);

        // Example: Transactional data should not be cached
        expect(shouldCacheDatasource("Order")).toBe(false);
        expect(shouldCacheDatasource("Payment")).toBe(false);
        expect(shouldCacheDatasource("Invoice")).toBe(false);
      });

      it("should be ready for parameter-based caching decisions", () => {
        // Example: Read-only operations might be cached differently
        expect(shouldCacheDatasource("Product", { operation: "fetch" })).toBe(false);
        expect(shouldCacheDatasource("Product", { operation: "update" })).toBe(false);

        // Example: User-specific data might affect caching
        expect(shouldCacheDatasource("UserPreferences", { userId: "123" })).toBe(false);
        expect(shouldCacheDatasource("UserPreferences", { userId: "456" })).toBe(false);
      });
    });
  });
});
