import { extractDependenciesFromExpression } from "../dependencies";
import type { Field } from "@workspaceui/api-client/src/api/types";

const makeField = (overrides: Partial<Field>): Field =>
  ({
    name: "",
    hqlName: "",
    columnName: "",
    column: { dBColumnName: "" },
    ...overrides,
  }) as unknown as Field;

describe("extractDependenciesFromExpression", () => {
  it("should return empty array for undefined/null/empty expression", () => {
    expect(extractDependenciesFromExpression()).toEqual([]);
    expect(extractDependenciesFromExpression("")).toEqual([]);
  });

  describe("Classic @Token@ patterns", () => {
    it("should extract simple @FieldName@ tokens", () => {
      const result = extractDependenciesFromExpression("@C_BPartner_ID@='123'");
      expect(result).toContain("C_BPartner_ID");
    });

    it("should extract multiple tokens", () => {
      const result = extractDependenciesFromExpression("@Field1@ = 'Y' & @Field2@ = 'N'");
      expect(result).toContain("Field1");
      expect(result).toContain("Field2");
    });

    it("should skip session tokens starting with # or $", () => {
      const result = extractDependenciesFromExpression("@#User_Client@ = @C_BPartner_ID@");
      expect(result).not.toContain("#User_Client");
      expect(result).toContain("C_BPartner_ID");
    });

    it("should deduplicate tokens", () => {
      const result = extractDependenciesFromExpression("@Field1@ = @Field1@");
      expect(result).toHaveLength(1);
      expect(result).toContain("Field1");
    });

    it("should resolve DB column names to HQL names using fields metadata", () => {
      const fields: Record<string, Field> = {
        businessPartner: makeField({
          name: "businessPartner",
          hqlName: "businessPartner",
          column: { dBColumnName: "C_BPartner_ID" } as any,
          columnName: "C_BPartner_ID",
        }),
      };
      const result = extractDependenciesFromExpression("@C_BPartner_ID@='123'", fields);
      expect(result).toContain("businessPartner");
    });
  });

  describe("JS accessor patterns", () => {
    it("should extract currentValues.fieldName patterns", () => {
      const result = extractDependenciesFromExpression('currentValues.myField === "test"');
      expect(result).toContain("myField");
    });

    it("should extract currentValues['fieldName'] patterns", () => {
      const result = extractDependenciesFromExpression("currentValues['myField'] === 'test'");
      expect(result).toContain("myField");
    });

    it('should extract currentValues["fieldName"] patterns', () => {
      const result = extractDependenciesFromExpression('currentValues["myField"] === "test"');
      expect(result).toContain("myField");
    });
  });

  describe("OB.Utilities.getValue patterns", () => {
    it("should extract getValue accessor patterns", () => {
      const result = extractDependenciesFromExpression("getValue(currentValues, 'myField')");
      expect(result).toContain("myField");
    });

    it("should handle double quotes in getValue", () => {
      const result = extractDependenciesFromExpression('getValue(currentValues, "myField")');
      expect(result).toContain("myField");
    });
  });

  describe("mixed patterns", () => {
    it("should extract from multiple pattern types in the same expression", () => {
      const result = extractDependenciesFromExpression("@Field1@ && currentValues.field2 && getValue(ctx, 'field3')");
      expect(result).toContain("Field1");
      expect(result).toContain("field2");
      expect(result).toContain("field3");
    });
  });
});
