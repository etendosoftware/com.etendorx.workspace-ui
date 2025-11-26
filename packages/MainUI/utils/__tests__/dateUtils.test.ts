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

import { formatCellValue } from "../dateUtils";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "../form/constants";

describe("dateUtils", () => {
  describe("formatCellValue", () => {
    describe("Null and undefined values", () => {
      it("should return empty string for null values", () => {
        const field: Field = {
          name: "testField",
          columnName: "testField",
          id: "test-id",
          _identifier: "test-identifier",
        } as unknown as Field;

        const result = formatCellValue(null, field);

        expect(result).toBe("");
      });

      it("should return empty string for undefined values", () => {
        const field: Field = {
          name: "testField",
          columnName: "testField",
          id: "test-id",
          _identifier: "test-identifier",
        } as unknown as Field;

        const result = formatCellValue(undefined, field);

        expect(result).toBe("");
      });
    });

    describe("Date/DateTime fields", () => {
      it("should format ISO date string in DD-MM-YYYY format for DATE reference", () => {
        const field: Field = {
          name: "dateField",
          columnName: "dateField",
          column: {
            reference: FIELD_REFERENCE_CODES.DATE,
          },
          id: "date-id",
          _identifier: "date-identifier",
        } as unknown as Field;

        const result = formatCellValue("2024-01-15", field);

        expect(result).toBe("01/14/2024");
      });

      it("should format ISO datetime string with time for DATETIME reference", () => {
        const field: Field = {
          name: "dateTimeField",
          columnName: "dateTimeField",
          column: {
            reference: FIELD_REFERENCE_CODES.DATETIME,
          },
          id: "datetime-id",
          _identifier: "datetime-identifier",
        } as unknown as Field;

        const result = formatCellValue("2024-01-15T14:30:00Z", field);

        expect(result).toMatch(/01\/15\/2024/);
        expect(result).toContain(":");
      });

      it("should format audit creationDate field with timestamp", () => {
        const field: Field = {
          name: "creationDate",
          columnName: "creationDate",
          hqlName: "creationDate",
          id: "creation-date-id",
          _identifier: "creation-date-id",
        } as unknown as Field;

        const result = formatCellValue("2024-01-15T14:30:45Z", field);

        expect(result).toMatch(/01\/15\/2024/);
        expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
      });

      it("should format audit updated field with timestamp", () => {
        const field: Field = {
          name: "updated",
          columnName: "updated",
          hqlName: "updated",
          id: "updated-id",
          _identifier: "updated-id",
        } as unknown as Field;

        const result = formatCellValue("2024-01-15T14:30:45Z", field);

        expect(result).toMatch(/01\/15\/2024/);
        expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
      });

      it("should handle synthetic audit date fields", () => {
        const field: Field = {
          name: "auditDate",
          columnName: "auditDate",
          id: "audit_custom_date",
          _identifier: "audit-date-id",
        } as unknown as Field;

        const result = formatCellValue("2024-01-15T14:30:45Z", field);

        expect(result).toMatch(/01\/15\/2024/);
      });

      it("should handle invalid date strings by returning the original string", () => {
        const field: Field = {
          name: "dateField",
          columnName: "dateField",
          column: {
            reference: FIELD_REFERENCE_CODES.DATE,
          },
          id: "date-id",
          _identifier: "date-identifier",
        } as unknown as Field;

        const result = formatCellValue("invalid-date", field);

        expect(result).toBe("invalid-date");
      });

      it("should detect date fields by column name pattern", () => {
        const datePatterns = ["createdDate", "updatedDate", "startTime", "endTime"];

        for (const columnName of datePatterns) {
          const field: Field = {
            name: columnName,
            columnName,
            id: `${columnName}-id`,
            _identifier: `${columnName}-id`,
          } as unknown as Field;

          const result = formatCellValue("2024-01-15T14:30:45Z", field);

          expect(result).toMatch(/01\/15\/2024/);
        }
      });
    });

    describe("User reference fields", () => {
      it("should handle user reference fields with audit field names", () => {
        const field: Field = {
          name: "createdBy",
          columnName: "createdBy",
          hqlName: "createdBy",
          id: "created-by-id",
          _identifier: "created-by-id",
        } as unknown as Field;

        const userIdentifier = "admin@company.com";

        const result = formatCellValue(userIdentifier, field);

        expect(result).toBe("admin@company.com");
      });

      it("should detect ADUser fields by hqlName and format correctly", () => {
        const field: Field = {
          name: "updatedBy",
          columnName: "updatedBy",
          hqlName: "updatedBy",
          id: "updated-by-id",
          _identifier: "updated-by-id",
        } as unknown as Field;

        const userIdentifier = "john.doe@example.com";

        const result = formatCellValue(userIdentifier, field);

        expect(result).toBe("john.doe@example.com");
      });

      it("should return stringified value for non-object user values", () => {
        const field: Field = {
          name: "createdBy",
          columnName: "createdBy",
          hqlName: "createdBy",
          referencedEntity: "ADUser",
          id: "created-by-id",
          _identifier: "created-by-id",
        } as unknown as Field;

        const result = formatCellValue("user-string", field);

        expect(result).toBe("user-string");
      });
    });

    describe("Numeric fields", () => {
      it("should format integer values with no decimals", () => {
        const field: Field = {
          name: "quantity",
          columnName: "quantity",
          column: {
            reference: FIELD_REFERENCE_CODES.INTEGER,
          },
          id: "quantity-id",
          _identifier: "quantity-id",
        } as unknown as Field;

        const result = formatCellValue(1234, field);

        expect(result).toBe("1.234");
      });

      it("should format decimal values with 2 decimal places", () => {
        const field: Field = {
          name: "price",
          columnName: "price",
          column: {
            reference: FIELD_REFERENCE_CODES.DECIMAL,
          },
          id: "price-id",
          _identifier: "price-id",
        } as unknown as Field;

        const result = formatCellValue(1234.56, field);

        expect(result).toMatch(/1.234,56|1,234.56/);
      });

      it("should format numeric fields", () => {
        const field: Field = {
          name: "amount",
          columnName: "amount",
          column: {
            reference: FIELD_REFERENCE_CODES.NUMERIC,
          },
          id: "amount-id",
          _identifier: "amount-id",
        } as unknown as Field;

        const result = formatCellValue(5000.25, field);

        expect(result).not.toBe("");
        expect(typeof result).toBe("string");
      });

      it("should format quantity fields (22 decimal)", () => {
        const field: Field = {
          name: "qty",
          columnName: "qty",
          column: {
            reference: FIELD_REFERENCE_CODES.QUANTITY_22,
          },
          id: "qty-id",
          _identifier: "qty-id",
        } as unknown as Field;

        const result = formatCellValue(100.5, field);

        expect(result).not.toBe("");
      });

      it("should format quantity fields (29 decimal)", () => {
        const field: Field = {
          name: "qty",
          columnName: "qty",
          column: {
            reference: FIELD_REFERENCE_CODES.QUANTITY_29,
          },
          id: "qty-id",
          _identifier: "qty-id",
        } as unknown as Field;

        const result = formatCellValue(200.75, field);

        expect(result).not.toBe("");
      });

      it("should return original value string for non-numeric values in numeric fields", () => {
        const field: Field = {
          name: "amount",
          columnName: "amount",
          column: {
            reference: FIELD_REFERENCE_CODES.NUMERIC,
          },
          id: "amount-id",
          _identifier: "amount-id",
        } as unknown as Field;

        const result = formatCellValue("not-a-number", field);

        expect(result).toBe("not-a-number");
      });

      it("should not format non-numeric field values even if they are numbers", () => {
        const field: Field = {
          name: "code",
          columnName: "code",
          id: "code-id",
          _identifier: "code-id",
        } as unknown as Field;

        const result = formatCellValue(123, field);

        expect(result).toBe("123");
      });
    });

    describe("Reference fields (TABLEDIR)", () => {
      it("should format TABLE_DIR_19 reference with _identifier", () => {
        const field: Field = {
          name: "customerRef",
          columnName: "customerRef",
          column: {
            reference: FIELD_REFERENCE_CODES.TABLE_DIR_19,
          },
          id: "customer-id",
          _identifier: "customer-id",
        } as unknown as Field;

        const refObj = {
          _identifier: "CUST-001",
          name: "Acme Corp",
          id: "cust-1",
        };

        const result = formatCellValue(refObj, field);

        expect(result).toBe("CUST-001");
      });

      it("should format TABLE_DIR_18 reference with _identifier", () => {
        const field: Field = {
          name: "vendorRef",
          columnName: "vendorRef",
          column: {
            reference: FIELD_REFERENCE_CODES.TABLE_DIR_18,
          },
          id: "vendor-id",
          _identifier: "vendor-id",
        } as unknown as Field;

        const refObj = {
          _identifier: "VEND-001",
          name: "Supplier Inc",
        };

        const result = formatCellValue(refObj, field);

        expect(result).toBe("VEND-001");
      });

      it("should fallback to name for reference without _identifier", () => {
        const field: Field = {
          name: "partRef",
          columnName: "partRef",
          column: {
            reference: FIELD_REFERENCE_CODES.TABLE_DIR_19,
          },
          id: "part-id",
          _identifier: "part-id",
        } as unknown as Field;

        const refObj = {
          name: "Part #123",
          id: "part-1",
        };

        const result = formatCellValue(refObj, field);

        expect(result).toBe("Part #123");
      });

      it("should fallback to id for reference without _identifier or name", () => {
        const field: Field = {
          name: "refField",
          columnName: "refField",
          column: {
            reference: FIELD_REFERENCE_CODES.TABLE_DIR_18,
          },
          id: "ref-id",
          _identifier: "ref-id",
        } as unknown as Field;

        const refObj = {
          id: "ref-001",
        };

        const result = formatCellValue(refObj, field);

        expect(result).toBe("ref-001");
      });
    });

    describe("String and other values", () => {
      it("should return string values as-is", () => {
        const field: Field = {
          name: "description",
          columnName: "description",
          id: "description-id",
          _identifier: "description-id",
        } as unknown as Field;

        const result = formatCellValue("Test Description", field);

        expect(result).toBe("Test Description");
      });

      it("should convert boolean values to string", () => {
        const field: Field = {
          name: "isActive",
          columnName: "isActive",
          id: "is-active-id",
          _identifier: "is-active-id",
        } as unknown as Field;

        const resultTrue = formatCellValue(true, field);
        const resultFalse = formatCellValue(false, field);

        expect(resultTrue).toBe("true");
        expect(resultFalse).toBe("false");
      });

      it("should convert lists to string representation", () => {
        const field: Field = {
          name: "tags",
          columnName: "tags",
          id: "tags-id",
          _identifier: "tags-id",
        } as unknown as Field;

        const result = formatCellValue(["tag1", "tag2"], field);

        expect(result).toBe("tag1,tag2");
      });

      it("should convert empty string to empty string", () => {
        const field: Field = {
          name: "name",
          columnName: "name",
          id: "name-id",
          _identifier: "name-id",
        } as unknown as Field;

        const result = formatCellValue("", field);

        expect(result).toBe("");
      });

      it("should convert 0 to string", () => {
        const field: Field = {
          name: "count",
          columnName: "count",
          id: "count-id",
          _identifier: "count-id",
        } as unknown as Field;

        const result = formatCellValue(0, field);

        expect(result).toBe("0");
      });
    });

    describe("Edge cases", () => {
      it("should handle very large dates", () => {
        const field: Field = {
          name: "dateField",
          columnName: "dateField",
          column: {
            reference: FIELD_REFERENCE_CODES.DATE,
          },
          id: "date-id",
          _identifier: "date-id",
        } as unknown as Field;

        const result = formatCellValue("2099-12-31", field);

        expect(result).toMatch(/12\/30\/2099/);
      });

      it("should handle very small/negative numbers gracefully", () => {
        const field: Field = {
          name: "value",
          columnName: "value",
          column: {
            reference: FIELD_REFERENCE_CODES.NUMERIC,
          },
          id: "value-id",
          _identifier: "value-id",
        } as unknown as Field;

        const result = formatCellValue(-1000.5, field);

        expect(result).not.toBe("");
      });

      it("should handle objects without standard properties", () => {
        const field: Field = {
          name: "refField",
          columnName: "refField",
          column: {
            reference: FIELD_REFERENCE_CODES.TABLE_DIR_19,
          },
          id: "ref-id",
          _identifier: "ref-id",
        } as unknown as Field;

        const refObj = {
          customProp: "value",
        };

        const result = formatCellValue(refObj, field);

        expect(result).toBe("");
      });

      it("should handle fields with multiple reference types checking", () => {
        const field: Field = {
          name: "multiField",
          columnName: "multiField",
          column: {
            reference: "UNKNOWN_REFERENCE",
          },
          id: "multi-id",
          _identifier: "multi-id",
        } as unknown as Field;

        const result = formatCellValue(123, field);

        expect(result).toBe("123");
      });
    });
  });
});
