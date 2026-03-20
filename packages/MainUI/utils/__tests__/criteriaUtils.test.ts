import { buildBaseCriteria } from "../criteriaUtils";

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

    it("should fallback to 'id' if parentColumns is empty", () => {
      const tabNoColumns = { ...childTab, parentColumns: [] };
      const result = buildBaseCriteria({
        tab: tabNoColumns,
        parentTab,
        parentId: "123",
      });

      expect(result[0].fieldName).toBe("id");
    });
  });
});
