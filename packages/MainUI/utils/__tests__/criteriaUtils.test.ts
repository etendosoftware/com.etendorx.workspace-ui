import { buildBaseCriteria, resolveParentFieldName } from "../criteriaUtils";
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

    it("should return _dummy when the backend reports no link column to the parent", () => {
      // Sii Monitor › Issued Invoices: C_Invoice has an isparent column (businessPartner) that
      // does not point at aeatsii_config, so ApplicationUtils.getParentProperty answers "".
      const tabWithoutLink = { ...childTab, parentColumns: ["businessPartner"], parentProperty: "" };
      const result = buildBaseCriteria({
        tab: tabWithoutLink,
        parentTab,
        parentId: "EEA0890DCD7F4BFDB27D5D3AF4032FC9",
      });

      expect(result[0].fieldName).toBe("_dummy");
      expect(result[0].operator).toBe("equals");
    });

    it("should use the backend parentProperty over the parentColumns heuristic", () => {
      const tabWithLink = { ...childTab, parentColumns: ["someOtherColumn"], parentProperty: "invoice" };
      const result = buildBaseCriteria({
        tab: tabWithLink,
        parentTab,
        parentId: "123",
      });

      expect(result[0]).toEqual({ fieldName: "invoice", value: "123", operator: "equals" });
    });
  });

  describe("resolveParentFieldName", () => {
    const parentTab: any = { entityName: "ParentEntity", id: "parent-tab-id" };

    it("prefers the backend-resolved parentProperty", () => {
      const tab: any = { parentColumns: ["businessPartner"], parentProperty: "invoice", fields: {} };
      expect(resolveParentFieldName(tab, parentTab)).toBe("invoice");
    });

    it("maps an empty parentProperty to 'id' so the caller falls back to _dummy", () => {
      const tab: any = { parentColumns: ["businessPartner"], parentProperty: "", fields: {} };
      expect(resolveParentFieldName(tab, parentTab)).toBe("id");
    });

    it("keeps the parentColumns heuristic when the backend does not send parentProperty", () => {
      const tab: any = { parentColumns: ["parent_id"], fields: {} };
      expect(resolveParentFieldName(tab, parentTab)).toBe("parent_id");
    });
  });
});
