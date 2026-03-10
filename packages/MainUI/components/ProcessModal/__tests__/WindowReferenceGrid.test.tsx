import { 
  extractActualValue, 
  mergeDefaultsIntoParams, 
  mergeCurrentValuesIntoParams, 
  resolveParentContextId,
  applyDynamicKeys,
  buildValidColumnNames,
  applyRecordValues,
  evaluateFieldReadOnlyLogic,
  buildGridCriteria
} from "../WindowReferenceGrid";

describe("WindowReferenceGrid Utilities", () => {
  describe("extractActualValue", () => {
    it("extracts value from object with 'value' property", () => {
      expect(extractActualValue({ value: "test" })).toBe("test");
    });

    it("returns the value directly if not an object with 'value' property", () => {
      expect(extractActualValue("test")).toBe("test");
      expect(extractActualValue(123)).toBe(123);
      expect(extractActualValue(null)).toBe(null);
    });
  });

  describe("mergeDefaultsIntoParams", () => {
    it("merges default values into params object", () => {
      const defaults = { a: 1, b: { value: 2 } };
      const mergedParams = {};
      mergeDefaultsIntoParams(defaults, mergedParams);
      expect(mergedParams).toEqual({ a: 1, b: 2 });
    });
  });

  describe("mergeCurrentValuesIntoParams", () => {
    it("merges current values, overriding existing ones", () => {
      const currentValues = { a: 10, b: { value: 20 }, c: null };
      const mergedParams: any = { a: 1, d: 4 };
      mergeCurrentValuesIntoParams(currentValues, mergedParams);
      // null overrides but undefined shouldn't (though implementation only checks for !null/!undefined)
      expect(mergedParams).toEqual({ a: 10, b: 20, d: 4 });
    });
  });

  describe("resolveParentContextId", () => {
    it("resolves parent context ID from multiple potential keys", () => {
      const dbName = "C_Order_ID";
      const recordValues = { C_Order_ID: "12345678901234567890123456789012" };
      const currentValues = {};
      const result = resolveParentContextId(dbName, recordValues, currentValues);
      expect(result.parentContextId).toBe("12345678901234567890123456789012");
    });

    it("resolves document number from context", () => {
      const dbName = "Dummy";
      const recordValues = { inpdocumentno: "DOC001" };
      const result = resolveParentContextId(dbName, recordValues, {});
      expect(result.contextDocNo).toBe("DOC001");
    });
  });

  describe("applyDynamicKeys", () => {
    it("applies org and client keys", () => {
      const recordValues = { inpadOrgId: "ORG1", inpadClientId: "CLIENT1" };
      const options: any = {};
      applyDynamicKeys(recordValues, undefined, options);
      expect(options.ad_org_id).toBe("ORG1");
      expect(options.ad_client_id).toBe("CLIENT1");
    });
  });

  describe("buildValidColumnNames", () => {
    it("builds a set of valid column names from tab fields and prop fields", () => {
      const tabFields = { f1: { columnName: "COL1" } };
      const propFields = [{ name: "PROP1" }];
      const result = buildValidColumnNames(tabFields, propFields);
      expect(result.has("col1")).toBe(true);
      expect(result.has("prop1")).toBe(true);
      expect(result.has("ad_org_id")).toBe(true); // standard key
    });
  });

  describe("applyRecordValues", () => {
    it("applies record values to options if they match valid column names", () => {
      const parameters = { p1: { name: "param1", dBColumnName: "COL1" } };
      const recordValues = { param1: "VAL1" };
      const validColumnNames = new Set(["col1"]);
      const options: any = {};
      applyRecordValues(parameters, recordValues, validColumnNames, options);
      expect(options.COL1).toBe("VAL1");
    });
  });

  describe("evaluateFieldReadOnlyLogic", () => {
    it("returns true for static read-only flags", () => {
      expect(evaluateFieldReadOnlyLogic({ readOnly: true }, {})).toBe(true);
      expect(evaluateFieldReadOnlyLogic({ isReadOnly: true }, {})).toBe(true);
    });
  });

  describe("buildGridCriteria", () => {
    it("returns empty array if no filter expressions", () => {
      expect(buildGridCriteria(undefined, "TEST")).toEqual([]);
    });

    it("builds criteria from filter expressions map", () => {
      const filterExpressions = {
        grid1: { field1: "val1" }
      };
      const result = buildGridCriteria(filterExpressions, "grid1");
      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("field1");
    });
  });
});
