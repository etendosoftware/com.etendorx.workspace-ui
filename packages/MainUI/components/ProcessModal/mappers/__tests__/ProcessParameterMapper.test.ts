import { ProcessParameterMapper } from "../ProcessParameterMapper";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

describe("ProcessParameterMapper", () => {
  const mockParameter = {
    id: "test-id",
    name: "Test Parameter",
    dBColumnName: "test_column",
    reference: "String",
    mandatory: true,
    defaultValue: "",
    refList: []
  } as any;

  describe("mapToField", () => {
    it("should map basic ProcessParameter to Field interface", () => {
      const field = ProcessParameterMapper.mapToField(mockParameter);

      expect(field.hqlName).toBe("test_column");
      expect(field.inputName).toBe("test_column");
      expect(field.columnName).toBe("test_column");
      expect(field.id).toBe("test-id");
      expect(field.name).toBe("Test Parameter");
      expect(field.isMandatory).toBe(true);
      expect(field.displayed).toBe(true);
      expect(field.isDisplayed).toBe(true);
    });

    it("should handle missing dBColumnName by using name", () => {
      const parameterWithoutDbColumn = { ...mockParameter };
      delete parameterWithoutDbColumn.dBColumnName;

      const field = ProcessParameterMapper.mapToField(parameterWithoutDbColumn);

      expect(field.hqlName).toBe("Test Parameter");
      expect(field.inputName).toBe("Test Parameter");
      expect(field.columnName).toBe("Test Parameter");
    });

    it("should map reference types correctly", () => {
      const passwordParam = { ...mockParameter, reference: "Password" };
      const passwordField = ProcessParameterMapper.mapToField(passwordParam);
      expect(passwordField.column.reference).toBe(FIELD_REFERENCE_CODES.PASSWORD);

      const booleanParam = { ...mockParameter, reference: "Yes/No" };
      const booleanField = ProcessParameterMapper.mapToField(booleanParam);
      expect(booleanField.column.reference).toBe(FIELD_REFERENCE_CODES.BOOLEAN);

      const numericParam = { ...mockParameter, reference: "Amount" };
      const numericField = ProcessParameterMapper.mapToField(numericParam);
      expect(numericField.column.reference).toBe(FIELD_REFERENCE_CODES.DECIMAL);
    });

    it("should preserve refList for list fields", () => {
      const listParam = {
        ...mockParameter,
        reference: "List",
        refList: [
          { id: "1", label: "Option 1", value: "opt1" },
          { id: "2", label: "Option 2", value: "opt2" }
        ]
      };

      const field = ProcessParameterMapper.mapToField(listParam);
      expect(field.refList).toHaveLength(2);
      expect(field.refList[0]).toEqual({ id: "1", label: "Option 1", value: "opt1" });
    });

    it("should handle display and readonly logic", () => {
      const paramWithLogic = {
        ...mockParameter,
        displayLogic: "@someField@='Y'",
        readOnlyLogicExpression: "@anotherField@='N'"
      };

      const field = ProcessParameterMapper.mapToField(paramWithLogic);
      expect(field.displayLogicExpression).toBe("@someField@='Y'");
      expect(field.readOnlyLogicExpression).toBe("@anotherField@='N'");
    });
  });

  describe("canMapParameter", () => {
    it("should return true for valid parameters", () => {
      expect(ProcessParameterMapper.canMapParameter(mockParameter)).toBe(true);
    });

    it("should return false for null/undefined parameters", () => {
      expect(ProcessParameterMapper.canMapParameter(null as any)).toBe(false);
      expect(ProcessParameterMapper.canMapParameter(undefined as any)).toBe(false);
    });

    it("should return false for parameters without name", () => {
      const paramWithoutName = { ...mockParameter };
      delete paramWithoutName.name;
      expect(ProcessParameterMapper.canMapParameter(paramWithoutName)).toBe(false);
    });

    it("should return true for supported reference types", () => {
      const supportedTypes = [
        "String", "Password", "Yes/No", "Boolean", "Amount", "Integer", "Decimal", 
        "Quantity", "Date", "DateTime", "List", "Select", "Product", "TableDir", 
        "Table Directory", "Window"
      ];
      
      supportedTypes.forEach(referenceType => {
        const param = { ...mockParameter, reference: referenceType };
        expect(ProcessParameterMapper.canMapParameter(param)).toBe(true);
      });
    });

    it("should return true for parameters without reference (defaults to String)", () => {
      const paramWithoutReference = { ...mockParameter };
      delete paramWithoutReference.reference;
      expect(ProcessParameterMapper.canMapParameter(paramWithoutReference)).toBe(true);
    });
  });

  describe("getFieldType", () => {
    it("should return correct field types for mapping", () => {
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Password" })).toBe("password");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Yes/No" })).toBe("boolean");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Boolean" })).toBe("boolean");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Amount" })).toBe("numeric");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Integer" })).toBe("numeric");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Decimal" })).toBe("numeric");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Quantity" })).toBe("quantity");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Date" })).toBe("date");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "DateTime" })).toBe("datetime");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Select" })).toBe("select");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Product" })).toBe("product");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "TableDir" })).toBe("tabledir");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Table Directory" })).toBe("tabledir");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "List" })).toBe("list");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Window" })).toBe("window");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "String" })).toBe("text");
      expect(ProcessParameterMapper.getFieldType({ ...mockParameter, reference: "Unknown" })).toBe("text");
    });

    it("should default to text for undefined reference", () => {
      const paramWithoutReference = { ...mockParameter };
      delete paramWithoutReference.reference;
      expect(ProcessParameterMapper.getFieldType(paramWithoutReference)).toBe("text");
    });
  });

  describe("mapSelectorInfo", () => {
    it("should map Product reference to ProductByPriceAndWarehouse datasource", () => {
      const productParam = { ...mockParameter, reference: "Product" };
      const field = ProcessParameterMapper.mapToField(productParam);
      
      expect(field.selector).toBeDefined();
      expect(field.selector.datasourceName).toBe("ProductByPriceAndWarehouse");
    });

    it("should map TableDir reference to ComboTableDatasourceService", () => {
      const tableDirParam = { ...mockParameter, reference: "TableDir" };
      const field = ProcessParameterMapper.mapToField(tableDirParam);
      
      expect(field.selector).toBeDefined();
      expect(field.selector.datasourceName).toBe("ComboTableDatasourceService");
    });

    it("should map Select reference to ComboTableDatasourceService", () => {
      const selectParam = { ...mockParameter, reference: "Select" };
      const field = ProcessParameterMapper.mapToField(selectParam);
      
      expect(field.selector).toBeDefined();
      expect(field.selector.datasourceName).toBe("ComboTableDatasourceService");
    });

    it("should not map selector for non-datasource field types", () => {
      const textParam = { ...mockParameter, reference: "String" };
      const field = ProcessParameterMapper.mapToField(textParam);
      
      expect(field.selector).toBeUndefined();
    });

    it("should preserve existing selector info if provided", () => {
      const paramWithSelector = { 
        ...mockParameter, 
        reference: "Product",
        selector: {
          datasourceName: "CustomDatasource",
          customProperty: "test"
        }
      };
      const field = ProcessParameterMapper.mapToField(paramWithSelector);
      
      expect(field.selector.datasourceName).toBe("CustomDatasource");
      expect(field.selector.customProperty).toBe("test");
    });
  });
});