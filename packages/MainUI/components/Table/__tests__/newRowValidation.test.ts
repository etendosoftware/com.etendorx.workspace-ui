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

import {
  validateNewRowForSave,
  validateExistingRowForSave,
  hasRequiredFieldsForNewRow,
  validationErrorsToRecord,
} from "../utils/validationUtils";
import type { EntityData, Column } from "@workspaceui/api-client/src/api/types";

describe("New Row Validation", () => {
  const mockColumns: Column[] = [
    {
      name: "id",
      header: "ID",
      displayType: "string",
      isMandatory: false,
      columnName: "id",
    },
    {
      name: "name",
      header: "Name",
      displayType: "string",
      isMandatory: true,
      columnName: "name",
    },
    {
      name: "email",
      header: "Email",
      displayType: "string",
      isMandatory: true,
      columnName: "email",
    },
    {
      name: "age",
      header: "Age",
      displayType: "number",
      isMandatory: false,
      columnName: "age",
    },
    {
      name: "active",
      header: "Active",
      displayType: "boolean",
      isMandatory: false,
      columnName: "active",
    },
    {
      name: "creationDate",
      header: "Creation Date",
      displayType: "date",
      isMandatory: false,
      columnName: "creation_date",
    },
  ];

  describe("validateNewRowForSave", () => {
    it("should pass validation for valid new row data", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        active: true,
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail validation for missing required fields", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        // email is missing but required
        age: 30,
        active: true,
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: "email",
        message: "Email is required",
        type: "required",
      });
    });

    it("should fail validation for multiple missing required fields", () => {
      const rowData: EntityData = {
        id: "new_123",
        // name and email are missing but required
        age: 30,
        active: true,
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.field)).toContain("name");
      expect(result.errors.map((e) => e.field)).toContain("email");
    });

    it("should skip system fields during validation", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        email: "john@example.com",
        // System fields should be ignored even if missing
        creationDate: undefined,
        createdBy: undefined,
        updated: undefined,
        updatedBy: undefined,
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle empty string values as invalid for required fields", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "", // Empty string should be invalid for required field
        email: "john@example.com",
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("name");
    });

    it("should handle null values as invalid for required fields", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: null, // Null should be invalid for required field
        email: "john@example.com",
      };

      const result = validateNewRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("name");
    });
  });

  describe("validateExistingRowForSave", () => {
    it("should pass validation when no fields are modified", () => {
      const originalData: EntityData = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      const currentData: EntityData = { ...originalData };

      const result = validateExistingRowForSave(mockColumns, currentData, originalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate only modified fields", () => {
      const originalData: EntityData = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      const currentData: EntityData = {
        ...originalData,
        name: "", // Modified to invalid value
        // email unchanged, so should not be validated even if it were invalid
      };

      const result = validateExistingRowForSave(mockColumns, currentData, originalData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("name");
    });

    it("should pass validation for valid modified fields", () => {
      const originalData: EntityData = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      const currentData: EntityData = {
        ...originalData,
        name: "Jane Doe", // Valid modification
        age: 25, // Valid modification
      };

      const result = validateExistingRowForSave(mockColumns, currentData, originalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should skip system fields during validation", () => {
      const originalData: EntityData = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        creationDate: "2023-01-01",
        createdBy: "admin",
      };
      const currentData: EntityData = {
        ...originalData,
        creationDate: "", // System field modification should be ignored
        createdBy: "", // System field modification should be ignored
      };

      const result = validateExistingRowForSave(mockColumns, currentData, originalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("hasRequiredFieldsForNewRow", () => {
    it("should return true when all required fields are filled", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        email: "john@example.com",
        age: null, // Optional field can be null
        active: false,
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(true);
    });

    it("should return false when required fields are missing", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        // email is missing but required
        age: 30,
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(false);
    });

    it("should return false when required fields are empty strings", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "", // Required field is empty
        email: "john@example.com",
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(false);
    });

    it("should return false when required fields are null", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        email: null, // Required field is null
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(false);
    });

    it("should ignore system fields", () => {
      const rowData: EntityData = {
        id: "new_123",
        name: "John Doe",
        email: "john@example.com",
        // System fields can be missing
        creationDate: undefined,
        createdBy: undefined,
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(true);
    });

    it("should handle empty row data", () => {
      const rowData: EntityData = {
        id: "new_123",
        // All other fields missing
      };

      const result = hasRequiredFieldsForNewRow(mockColumns, rowData);

      expect(result).toBe(false);
    });
  });

  describe("validationErrorsToRecord", () => {
    it("should convert validation errors array to record format", () => {
      const errors = [
        { field: "name", message: "Name is required", type: "required" as const },
        { field: "email", message: "Email is required", type: "required" as const },
      ];

      const result = validationErrorsToRecord(errors);

      expect(result).toEqual({
        name: "Name is required",
        email: "Email is required",
      });
    });

    it("should handle empty errors array", () => {
      const errors: any[] = [];

      const result = validationErrorsToRecord(errors);

      expect(result).toEqual({});
    });

    it("should handle duplicate field errors (last one wins)", () => {
      const errors = [
        { field: "name", message: "First error", type: "required" as const },
        { field: "name", message: "Second error", type: "format" as const },
      ];

      const result = validationErrorsToRecord(errors);

      expect(result).toEqual({
        name: "Second error",
      });
    });
  });

  describe("Integration Tests", () => {
    it("should validate complete new row creation workflow", () => {
      // Step 1: Create empty row data
      const newRowId = "new_123";
      const emptyRowData: EntityData = {
        id: newRowId,
        name: null,
        email: null,
        age: null,
        active: false,
      };

      // Step 2: Check if required fields are filled (should fail)
      expect(hasRequiredFieldsForNewRow(mockColumns, emptyRowData)).toBe(false);

      // Step 3: Fill required fields
      const filledRowData: EntityData = {
        ...emptyRowData,
        name: "John Doe",
        email: "john@example.com",
      };

      // Step 4: Check if required fields are filled (should pass)
      expect(hasRequiredFieldsForNewRow(mockColumns, filledRowData)).toBe(true);

      // Step 5: Validate for save (should pass)
      const validationResult = validateNewRowForSave(mockColumns, filledRowData);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toEqual([]);
    });

    it("should handle validation errors in new row workflow", () => {
      const newRowData: EntityData = {
        id: "new_123",
        name: "", // Invalid: empty required field
        email: "john@example.com",
        age: -5, // Invalid: negative age (if we had such validation)
      };

      // Validate for save
      const validationResult = validateNewRowForSave(mockColumns, newRowData);
      expect(validationResult.isValid).toBe(false);

      // Convert to record format for state management
      const errorRecord = validationErrorsToRecord(validationResult.errors);
      expect(errorRecord.name).toBeDefined();
      expect(typeof errorRecord.name).toBe("string");
    });
  });
});
