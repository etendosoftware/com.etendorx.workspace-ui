import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import {
  convertToISODateFormat,
  createParameterMap,
  createParameterNameMap,
  processDefaultValue,
  processDefaultValueLegacy,
  convertProcessDefaultsToEntityData,
  extractLogicFields,
} from "../processDefaultsUtils";

const makeParam = (overrides: Partial<ProcessParameter>): ProcessParameter =>
  ({
    id: "param-1",
    name: "testField",
    dBColumnName: "test_field",
    reference: "Text",
    ...overrides,
  }) as ProcessParameter;

describe("processDefaultsUtils", () => {
  describe("convertToISODateFormat", () => {
    it("should return already-ISO dates unchanged", () => {
      expect(convertToISODateFormat("2025-10-27")).toBe("2025-10-27");
    });

    it("should extract date from ISO datetime", () => {
      expect(convertToISODateFormat("2025-10-27T14:30:00Z")).toBe("2025-10-27");
    });

    it("should convert DD-MM-YYYY to YYYY-MM-DD", () => {
      expect(convertToISODateFormat("27-10-2025")).toBe("2025-10-27");
    });

    it("should convert DD/MM/YYYY to YYYY-MM-DD", () => {
      expect(convertToISODateFormat("27/10/2025")).toBe("2025-10-27");
    });

    it("should return unrecognized formats unchanged", () => {
      expect(convertToISODateFormat("Oct 27, 2025")).toBe("Oct 27, 2025");
    });
  });

  describe("createParameterMap", () => {
    it("should return empty map for undefined parameters", () => {
      const map = createParameterMap();
      expect(map.size).toBe(0);
    });

    it("should create map from array of parameters", () => {
      const params = [makeParam({ name: "field1", dBColumnName: "col1", id: "id1" })];
      const map = createParameterMap(params);
      expect(map.get("field1")).toBeDefined();
      expect(map.get("col1")).toBeDefined();
      expect(map.get("id1")).toBeDefined();
    });

    it("should create map from record of parameters", () => {
      const params = { field1: makeParam({ name: "field1" }) };
      const map = createParameterMap(params);
      expect(map.get("field1")).toBeDefined();
    });

    it("should not create duplicate entries when names match", () => {
      const param = makeParam({ name: "field1", dBColumnName: "field1", id: "field1" });
      const map = createParameterMap([param]);
      expect(map.size).toBe(1);
    });
  });

  describe("createParameterNameMap", () => {
    it("should return empty object for undefined parameters", () => {
      expect(createParameterNameMap()).toEqual({});
    });

    it("should map by name and dBColumnName", () => {
      const params = { p1: makeParam({ name: "field1", dBColumnName: "col1" }) };
      const map = createParameterNameMap(params);
      expect(map.field1).toBeDefined();
      expect(map.col1).toBeDefined();
    });
  });

  describe("processDefaultValue", () => {
    const paramMap = new Map<string, ProcessParameter>();
    paramMap.set("testField", makeParam({ name: "testField", reference: "Text" }));
    paramMap.set("dateField", makeParam({ name: "dateField", reference: "Date" }));

    it("should skip display_logic fields", () => {
      const result = processDefaultValue("field_display_logic", "Y", paramMap);
      expect(result).toBeNull();
    });

    it("should skip readonly_logic fields", () => {
      const result = processDefaultValue("field_readonly_logic", "N", paramMap);
      expect(result).toBeNull();
    });

    it("should process simple string values", () => {
      const result = processDefaultValue("testField", "hello", paramMap);
      expect(result).toEqual({ fieldName: "testField", fieldValue: "hello" });
    });

    it("should process reference values", () => {
      const value = { value: "id-123", identifier: "Display Name" };
      const result = processDefaultValue("testField", value, paramMap);
      expect(result).toEqual({
        fieldName: "testField",
        fieldValue: "id-123",
        identifier: "Display Name",
      });
    });

    it("should convert date values to ISO format", () => {
      const result = processDefaultValue("dateField", "27-10-2025", paramMap);
      expect(result).toEqual({ fieldName: "dateField", fieldValue: "2025-10-27" });
    });

    it("should use fieldName as fallback when parameter not found", () => {
      const result = processDefaultValue("unknownField", "value", paramMap);
      expect(result?.fieldName).toBe("unknownField");
    });

    it("should handle boolean values", () => {
      const result = processDefaultValue("testField", true, paramMap);
      expect(result?.fieldValue).toBe(true);
    });

    it("should handle unexpected object values as fallback", () => {
      const value = { custom: "data" } as any;
      const result = processDefaultValue("testField", value, paramMap);
      expect(result).not.toBeNull();
      expect(typeof result?.fieldValue).toBe("string");
    });
  });

  describe("processDefaultValueLegacy", () => {
    const paramNameMap: Record<string, ProcessParameter> = {
      testField: makeParam({ name: "testField" }),
    };

    it("should skip logic fields", () => {
      expect(processDefaultValueLegacy("field_display_logic", "Y", paramNameMap)).toBeNull();
      expect(processDefaultValueLegacy("field_readonly_logic", "N", paramNameMap)).toBeNull();
    });

    it("should process simple values", () => {
      const result = processDefaultValueLegacy("testField", "hello", paramNameMap);
      expect(result).toEqual({ fieldName: "testField", fieldValue: "hello" });
    });

    it("should process reference values", () => {
      const value = { value: "id-1", identifier: "Name" };
      const result = processDefaultValueLegacy("testField", value, paramNameMap);
      expect(result).toEqual({ fieldName: "testField", fieldValue: "id-1", identifier: "Name" });
    });

    it("should handle unknown fields", () => {
      const result = processDefaultValueLegacy("unknown", "val", paramNameMap);
      expect(result?.fieldName).toBe("unknown");
    });
  });

  describe("convertProcessDefaultsToEntityData", () => {
    it("should convert defaults to entity data", () => {
      const paramMap = new Map<string, ProcessParameter>();
      paramMap.set("name", makeParam({ name: "name" }));

      const defaults = { name: "Test Name" };
      const result = convertProcessDefaultsToEntityData(defaults, paramMap);
      expect(result.name).toBe("Test Name");
    });

    it("should store identifiers with $_identifier suffix", () => {
      const paramMap = new Map<string, ProcessParameter>();
      paramMap.set("partner", makeParam({ name: "partner" }));

      const defaults = { partner: { value: "id-1", identifier: "Partner Name" } };
      const result = convertProcessDefaultsToEntityData(defaults, paramMap);
      expect(result.partner).toBe("id-1");
      expect(result["partner$_identifier"]).toBe("Partner Name");
    });

    it("should skip logic fields", () => {
      const paramMap = new Map<string, ProcessParameter>();
      const defaults = { field_display_logic: "Y" as any };
      const result = convertProcessDefaultsToEntityData(defaults, paramMap);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("extractLogicFields", () => {
    it("should extract display_logic fields", () => {
      const defaults = { myField_display_logic: "Y" as any };
      const result = extractLogicFields(defaults);
      expect(result["myField.display"]).toBe(true);
    });

    it("should extract readonly_logic fields", () => {
      const defaults = { myField_readonly_logic: "N" as any };
      const result = extractLogicFields(defaults);
      expect(result["myField.readonly"]).toBe(false);
    });

    it("should ignore non-logic fields", () => {
      const defaults = { regularField: "value" as any };
      const result = extractLogicFields(defaults);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should handle multiple logic fields", () => {
      const defaults = {
        field1_display_logic: "Y" as any,
        field1_readonly_logic: "Y" as any,
        field2_display_logic: "N" as any,
      };
      const result = extractLogicFields(defaults);
      expect(result["field1.display"]).toBe(true);
      expect(result["field1.readonly"]).toBe(true);
      expect(result["field2.display"]).toBe(false);
    });
  });
});
