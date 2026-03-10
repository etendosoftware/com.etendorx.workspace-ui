import {
  convertDatasourceValue,
  normalizeContextKey,
  resolveContextValue,
  applyMergedParam,
  buildFilterCriteriaEntry,
  applyGridSelection,
} from "../utils";

describe("Process Definition Utils", () => {
  describe("convertDatasourceValue", () => {
    it("should convert 'Y' to true", () => {
      expect(convertDatasourceValue("Y")).toBe(true);
    });

    it("should convert 'N' to false", () => {
      expect(convertDatasourceValue("N")).toBe(false);
    });

    it("should convert numeric strings to numbers", () => {
      expect(convertDatasourceValue("123")).toBe(123);
      expect(convertDatasourceValue("45.67")).toBe(45.67);
    });

    it("should keep long strings as strings (e.g. UUIDs)", () => {
      const uuid = "40449D6B3C094B15AC74A7E09F6E84C4";
      expect(convertDatasourceValue(uuid)).toBe(uuid);
    });

    it("should return original value for non-matching types", () => {
      const obj = { foo: "bar" };
      expect(convertDatasourceValue(obj)).toBe(obj);
      expect(convertDatasourceValue("")).toBe("");
    });
  });

  describe("normalizeContextKey", () => {
    it("should strip @ symbols from both ends", () => {
      expect(normalizeContextKey("@AD_Org_ID@")).toBe("AD_Org_ID");
    });

    it("should return original key if no @ symbols", () => {
      expect(normalizeContextKey("AD_Org_ID")).toBe("AD_Org_ID");
    });

    it("should return original key it doesn't match both ends", () => {
      expect(normalizeContextKey("@AD_Org_ID")).toBe("@AD_Org_ID");
    });
  });

  describe("resolveContextValue", () => {
    it("should find bare key in record", () => {
      const record = { foo: "bar" };
      expect(resolveContextValue("foo", record)).toBe("bar");
    });

    it("should find inp-prefixed key in record", () => {
      const record = { inpfoo: "bar" };
      expect(resolveContextValue("foo", record)).toBe("bar");
    });

    it("should prioritize bare key over inp-prefixed key", () => {
      const record = { foo: "direct", inpfoo: "prefixed" };
      expect(resolveContextValue("foo", record)).toBe("direct");
    });
  });

  describe("applyMergedParam", () => {
    it("should map system keys like inpadOrgId", () => {
      const options: any = {};
      applyMergedParam("inpadOrgId", "456", {}, options);
      expect(options.ad_org_id).toBe("456");
    });

    it("should use parameter's dBColumnName if matched", () => {
      const parameters: any = {
        p1: { name: "Param1", dBColumnName: "db_p1" },
      };
      const options: any = {};
      applyMergedParam("Param1", "val1", parameters, options);
      expect(options.db_p1).toBe("val1");
    });
  });

  describe("buildFilterCriteriaEntry", () => {
    it("should build boolean criteria for 'true'/'false' strings", () => {
      expect(buildFilterCriteriaEntry("field", "true")).toEqual({
        fieldName: "field",
        operator: "equals",
        value: true,
      });
      expect(buildFilterCriteriaEntry("field", "false")).toEqual({
        fieldName: "field",
        operator: "equals",
        value: false,
      });
    });

    it("should use 'equals' and UUID value for UUID-like strings", () => {
      const uuid = "40449D6B3C094B15AC74A7E09F6E84C4";
      expect(buildFilterCriteriaEntry("field", uuid)).toEqual({
        fieldName: "field",
        operator: "equals",
        value: uuid,
      });
    });

    it("should use 'iContains' for other strings", () => {
      expect(buildFilterCriteriaEntry("field", "some text")).toEqual({
        fieldName: "field",
        operator: "iContains",
        value: "some text",
      });
    });

    it("should default to 'equals' for non-string values", () => {
      expect(buildFilterCriteriaEntry("field", 123)).toEqual({
        fieldName: "field",
        operator: "equals",
        value: 123,
      });
    });
  });

  describe("applyGridSelection", () => {
    it("should convert ID arrays to EntityData objects", () => {
      const prev = {};
      const mapping = { grid1: ["id1", "id2"] };
      const result = applyGridSelection(prev, mapping);

      expect(result.grid1._selection).toHaveLength(2);
      expect(result.grid1._selection[0]).toEqual({ id: "id1" });
      expect(result.grid1._selection[1]).toEqual({ id: "id2" });
    });

    it("should preserve allRows if grid already exists", () => {
      const prev: any = { grid1: { _selection: [], _allRows: [{ id: "row1" }] } };
      const mapping = { grid1: ["id1"] };
      const result = applyGridSelection(prev, mapping);

      expect(result.grid1._allRows).toEqual([{ id: "row1" }]);
    });
  });
});
