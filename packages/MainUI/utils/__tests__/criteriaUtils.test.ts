import { buildBaseCriteria } from "../criteriaUtils";
import { UIPattern } from "@workspaceui/api-client/src/api/types";

describe("criteriaUtils", () => {
  describe("buildBaseCriteria", () => {
    const parentTab: any = { entityName: "ParentEntity", id: "parent-tab-id" };
    const childTab: any = {
      entityName: "ChildEntity",
      id: "child-tab-id",
      parentColumns: ["parent_id"],
    };

    it("should return empty array if no parent tab is present", () => {
      expect(buildBaseCriteria({ tab: childTab })).toEqual([]);
    });

    it("should return criteria with parent field name and parentId", () => {
      const result = buildBaseCriteria({
        tab: childTab,
        parentTab,
        parentId: "123",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        fieldName: "parent_id",
        value: "123",
        operator: "equals",
      });
    });

    it("should return _dummy criteria if disableParentKeyProperty is true and parentId is present", () => {
      const tabWithDisable = { ...childTab, disableParentKeyProperty: true };
      const result = buildBaseCriteria({
        tab: tabWithDisable,
        parentTab,
        parentId: "123",
      });

      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("_dummy");
      expect(typeof result[0].value).toBe("number");
      expect(result[0].operator).toBe("equals");
    });

    it("should return empty array if parentId is missing", () => {
      const result = buildBaseCriteria({
        tab: childTab,
        parentTab,
        parentId: "",
      });
      expect(result).toEqual([]);
    });

    it("should fallback to '_dummy' if parentColumns is empty (no FK field resolved)", () => {
      const tabNoColumns = { ...childTab, parentColumns: [] };
      const result = buildBaseCriteria({
        tab: tabNoColumns,
        parentTab,
        parentId: "123",
      });

      // When no FK field can be resolved, _dummy is used so the server
      // falls back to @EntityName.id@ session variables for filtering.
      expect(result[0].fieldName).toBe("_dummy");
      expect(result[0].operator).toBe("equals");
    });

    it("should return id criteria for true 1:1 SR tabs (parentColumns includes PK)", () => {
      const srOneToOneTab: any = {
        ...childTab,
        uIPattern: UIPattern.EDIT_ONLY,
        parentColumns: ["id"],
        fields: { id: { column: { keyColumn: true } } },
      };
      const result = buildBaseCriteria({
        tab: srOneToOneTab,
        parentTab,
        parentId: "123",
      });

      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("id");
      expect(result[0].value).toBe("123");
    });

    it("should use FK resolution for non-1:1 SR tabs (e.g. Payment Plan)", () => {
      const srNonOneToOneTab: any = {
        ...childTab,
        uIPattern: UIPattern.EDIT_ONLY,
        parentColumns: ["invoice"],
        fields: {
          id: { column: { keyColumn: true } },
          invoice: { referencedEntity: "ParentEntity" },
        },
      };
      const result = buildBaseCriteria({
        tab: srNonOneToOneTab,
        parentTab,
        parentId: "123",
      });

      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("invoice");
      expect(result[0].value).toBe("123");
    });
  });
});
