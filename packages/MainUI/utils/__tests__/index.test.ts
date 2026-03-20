/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  getFieldReference,
  sanitizeValue,
  parseDynamicExpression,
  buildPayloadByInputName,
} from "../index";
import { FieldType } from "@workspaceui/api-client/src/api/types";

describe("utils index", () => {
  describe("getFieldReference", () => {
    it("should return correct FieldType for references", () => {
      expect(getFieldReference("10")).toBe(FieldType.TEXT);
      expect(getFieldReference("19")).toBe(FieldType.TABLEDIR);
      expect(getFieldReference("15")).toBe(FieldType.DATE);
      expect(getFieldReference("16")).toBe(FieldType.DATETIME);
      expect(getFieldReference("20")).toBe(FieldType.BOOLEAN);
      expect(getFieldReference("11")).toBe(FieldType.NUMBER);
      expect(getFieldReference("17")).toBe(FieldType.LIST);
      expect(getFieldReference("30")).toBe(FieldType.SELECT);
    });

    it("should default to TEXT", () => {
      expect(getFieldReference("unknown")).toBe(FieldType.TEXT);
    });
  });

  describe("sanitizeValue", () => {
    it("should handle boolean conversions", () => {
      const field = { column: { reference: "20" } } as any;
      expect(sanitizeValue(true, field)).toBe("Y");
      expect(sanitizeValue(false, field)).toBe("N");
      expect(sanitizeValue(null, field)).toBe(null);
    });

    it("should handle numeric conversions", () => {
      const field = { column: { reference: "11" } } as any;
      expect(sanitizeValue("123", field)).toBe(123);
      expect(sanitizeValue(123, field)).toBe(123);
      expect(sanitizeValue("", field)).toBe(null);
    });

    it("should handle DATE reversal", () => {
      const field = { column: { reference: "15" } } as any;
      expect(sanitizeValue("2023-05-20", field)).toBe("20-05-2023");
    });
  });

  describe("parseDynamicExpression", () => {
    it("should transform @field@ syntax", () => {
      const expr = "@isActive@='Y'";
      const result = parseDynamicExpression(expr);
      expect(result).toContain('(currentValues["isActive"] || context["isActive"])');
      expect(result).toContain("==");
    });

    it("should transform logical operators", () => {
      const expr = "A&B|C";
      const result = parseDynamicExpression(expr);
      expect(result).toBe("A&&B||C");
    });

    it("should transform negation syntax !'Y'", () => {
      const expr = "@field@!'Y'";
      const result = parseDynamicExpression(expr);
      expect(result).toContain("!='Y'");
    });

    it("should transform boolean comparisons to Y/N", () => {
      const expr = "context.IsSold === true";
      const result = parseDynamicExpression(expr);
      expect(result).toBe("context.IsSold === 'Y'");
    });

    it("should handle complex expressions", () => {
      const expr = "@Quantity@ > 0 & @Status@='A'";
      const result = parseDynamicExpression(expr);
      expect(result).toContain("&&");
      expect(result).toContain("==");
    });
  });

  describe("buildPayloadByInputName", () => {
    it("should map values to input names", () => {
      const values = { field1: "val1", field2: true };
      const fields = {
        field1: { inputName: "inpField1" },
        field2: { inputName: "inpField2", column: { reference: "20" } },
      } as any;

      const payload = buildPayloadByInputName(values, fields);
      expect(payload).toEqual({
        inpField1: "val1",
        inpField2: "Y",
      });
    });

    it("should handle property fields", () => {
      const values = { propField: "val" };
      const fields = {
        propField: {
          inputName: "inp_propertyField_type_Type",
          column: { propertyPath: "file.type" }
        }
      } as any;

      const payload = buildPayloadByInputName(values, fields);
      expect(payload).toEqual({
        inp_propertyField_type_Type: "val",
      });
    });

    it("should rename documentAction to DocAction", () => {
      const values = { documentAction: "CO" };
      const payload = buildPayloadByInputName(values, {});
      expect(payload).toEqual({ DocAction: "CO" });
    });
  });
});
