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

import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field, EntityData, Column } from "@workspaceui/api-client/src/api/types";
import type { ValidationError, RowValidationResult } from "../types/inlineEditing";
import { getFieldReference } from "@/utils";

/**
 * Converts a Column to a Field-like object for validation using existing utilities
 * @param column Column metadata
 * @returns Field-like object
 */
function columnToFieldForValidation(column: Column): Field {
  // Use the existing getFieldReference utility to determine field type
  const fieldType = getFieldReference(column.column?.reference) || FieldType.TEXT;

  // Map display type if reference doesn't provide enough info
  let finalFieldType = fieldType;
  if (fieldType === FieldType.TEXT && column.displayType) {
    switch (column.displayType.toLowerCase()) {
      case "integer":
      case "number":
        finalFieldType = FieldType.NUMBER;
        break;
      case "date":
        finalFieldType = FieldType.DATE;
        break;
      case "datetime":
        finalFieldType = FieldType.DATETIME;
        break;
      case "boolean":
      case "yesno":
        finalFieldType = FieldType.BOOLEAN;
        break;
      case "list":
        finalFieldType = FieldType.LIST;
        break;
      case "search":
        finalFieldType = FieldType.SEARCH;
        break;
      case "tabledir":
        finalFieldType = FieldType.TABLEDIR;
        break;
      case "quantity":
        finalFieldType = FieldType.QUANTITY;
        break;
    }
  }

  return {
    name: column.name,
    description: column.header,
    type: finalFieldType,
    isMandatory: column.isMandatory || false,
    refList: (column as any).refList || [],
    isReadOnly: (column as any).isReadOnly || false,
    isUpdatable: (column as any).isUpdatable !== false, // Default to true if not specified
    // Add other properties as needed for validation
  } as Field;
}

/**
 * Validates a single field value based on field metadata
 * @param field Field metadata (can be Field or Column)
 * @param value Current field value
 * @returns Validation error message or undefined if valid
 */
export function validateFieldValue(field: Field | Column, value: unknown): string | undefined {
  // Convert Column to Field if needed
  const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;
  // Check required fields
  if (fieldData.isMandatory && (value === null || value === undefined || value === "")) {
    return `${fieldData.description || fieldData.name} is required`;
  }

  // Skip validation for empty optional fields
  if (!fieldData.isMandatory && (value === null || value === undefined || value === "")) {
    return undefined;
  }

  // Type-specific validation
  switch (fieldData.type) {
    case FieldType.NUMBER:
    case FieldType.QUANTITY:
      return validateNumericField(fieldData, value);

    case FieldType.DATE:
    case FieldType.DATETIME:
      return validateDateField(fieldData, value);

    case FieldType.BOOLEAN:
      return validateBooleanField(fieldData, value);

    case FieldType.LIST:
    case FieldType.SELECT:
      return validateListField(fieldData, value);

    case FieldType.TEXT:
      return validateTextField(fieldData, value);

    default:
      return undefined;
  }
}

/**
 * Validates numeric field values
 */
function validateNumericField(field: Field, value: unknown): string | undefined {
  // Accept number, string, null, or undefined for optional fields
  if (value === null || value === undefined) {
    return undefined; // Let the mandatory check handle this
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return `${field.description || field.name} must be a number`;
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return `${field.description || field.name} must be a valid number`;
  }

  // Quantity fields cannot be negative
  if (field.type === FieldType.QUANTITY && numValue < 0) {
    return `${field.description || field.name} cannot be negative`;
  }

  return undefined;
}

/**
 * Validates date field values
 */
function validateDateField(field: Field, value: unknown): string | undefined {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return undefined; // Let the mandatory check handle this
  }

  // Accept both string and Date objects
  if (typeof value !== "string" && !(value instanceof Date) && typeof value !== "number") {
    return `${field.description || field.name} must be a valid date`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${field.description || field.name} must be a valid date`;
  }

  return undefined;
}

/**
 * Validates boolean field values
 */
function validateBooleanField(field: Field, value: unknown): string | undefined {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return undefined; // Let the mandatory check handle this
  }

  // Boolean fields accept various formats including actual booleans
  const validBooleanValues = [true, false, "Y", "N", "true", "false", "1", "0", 1, 0];

  if (!validBooleanValues.includes(value as any)) {
    return `${field.description || field.name} must be a valid boolean value`;
  }

  return undefined;
}

/**
 * Validates list/select field values
 */
function validateListField(field: Field, value: unknown): string | undefined {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined || value === "") {
    return undefined; // Let the mandatory check handle this
  }

  if (!field.refList || field.refList.length === 0) {
    return undefined; // No validation if no options available
  }

  const validValues = field.refList.map((option) => option.value);
  if (!validValues.includes(value as string)) {
    return `${field.description || field.name} must be one of the available options`;
  }

  return undefined;
}

/**
 * Validates text field values
 */
function validateTextField(field: Field, value: unknown): string | undefined {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return undefined; // Let the mandatory check handle this
  }

  if (typeof value !== "string") {
    return `${field.description || field.name} must be text`;
  }

  return undefined;
}

/**
 * Validates an entire row of data
 * @param fields Array of field metadata (can be Field or Column)
 * @param rowData Current row data
 * @returns Validation result with errors
 */
export function validateRowData(fields: (Field | Column)[], rowData: EntityData): RowValidationResult {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    // Try to get value using the most specific key available
    // Priority: hqlName > columnName > name
    // This ensures we match how data is actually stored in rowData
    let fieldKey: string;
    if ("hqlName" in field && field.hqlName) {
      fieldKey = field.hqlName;
    } else if ("columnName" in field && field.columnName) {
      fieldKey = field.columnName;
    } else {
      fieldKey = field.name;
    }
    const value = rowData[fieldKey] ?? rowData[field.name];
    const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;
    const errorMessage = validateFieldValue(fieldData, value);

    if (errorMessage) {
      errors.push({
        field: field.name,
        message: errorMessage,
        type: "format",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts validation errors array to record format for state management
 * @param errors Array of validation errors
 * @returns Record mapping field names to error messages
 */
export function validationErrorsToRecord(errors: ValidationError[]): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {};

  for (const error of errors) {
    record[error.field] = error.message;
  }

  return record;
}

/**
 * Validates a new row before saving
 * @param fields Array of field metadata (can be Field or Column)
 * @param rowData Current row data
 * @returns Validation result with specific focus on new row requirements
 */
export function validateNewRowForSave(fields: (Field | Column)[], rowData: EntityData): RowValidationResult {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    if (
      field.name === "id" ||
      field.name === "actions" ||
      field.name === "creationDate" ||
      field.name === "createdBy" ||
      field.name === "updated" ||
      field.name === "updatedBy"
    ) {
      continue;
    }
    const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;
    if (fieldData.isReadOnly || !fieldData.isUpdatable) {
      continue;
    }
    // Try to get value using the most specific key available
    // Priority: hqlName > columnName > name
    // This ensures we match how data is actually stored in rowData
    let fieldKey: string;
    if ("hqlName" in field && field.hqlName) {
      fieldKey = field.hqlName;
    } else if ("columnName" in field && field.columnName) {
      fieldKey = field.columnName;
    } else {
      fieldKey = field.name;
    }
    const value = rowData[fieldKey] ?? rowData[field.name];
    const errorMessage = validateFieldValue(fieldData, value);

    if (errorMessage) {
      errors.push({
        field: field.name,
        message: errorMessage,
        type: "required",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an existing row before saving (less strict than new rows)
 * @param fields Array of field metadata (can be Field or Column)
 * @param rowData Current row data
 * @param originalData Original row data for comparison
 * @returns Validation result
 */
export function validateExistingRowForSave(
  fields: (Field | Column)[],
  rowData: EntityData,
  originalData: EntityData
): RowValidationResult {
  const errors: ValidationError[] = [];

  // For existing rows, only validate fields that have been modified

  for (const field of fields) {
    if (
      field.name === "id" ||
      field.name === "actions" ||
      field.name === "creationDate" ||
      field.name === "createdBy" ||
      field.name === "updated" ||
      field.name === "updatedBy"
    ) {
      continue;
    }

    // Convert Column to Field if needed
    const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;

    // Skip validation for readonly fields
    if (fieldData.isReadOnly || !fieldData.isUpdatable) {
      continue;
    }

    const currentValue = rowData[field.name];
    const originalValue = originalData[field.name];

    // Only validate if the field has been modified
    if (currentValue !== originalValue) {
      const errorMessage = validateFieldValue(fieldData, currentValue);

      if (errorMessage) {
        errors.push({
          field: field.name,
          message: errorMessage,
          type: "format",
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a new row has all required fields filled
 * @param fields Array of field metadata
 * @param rowData Current row data
 * @returns True if all required fields are filled
 */
export function hasRequiredFieldsForNewRow(fields: (Field | Column)[], rowData: EntityData): boolean {
  return fields.every((field) => {
    // Skip system fields
    if (
      field.name === "id" ||
      field.name === "actions" ||
      field.name === "creationDate" ||
      field.name === "createdBy" ||
      field.name === "updated" ||
      field.name === "updatedBy"
    ) {
      return true;
    }

    // Convert Column to Field if needed
    const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;

    if (!fieldData.isMandatory) {
      return true; // Optional fields are always valid
    }

    // Try to get value using the most specific key available
    // Priority: hqlName > columnName > name
    // This ensures we match how data is actually stored in rowData
    let fieldKey: string;
    if ("hqlName" in field && field.hqlName) {
      fieldKey = field.hqlName;
    } else if ("columnName" in field && field.columnName) {
      fieldKey = field.columnName;
    } else {
      fieldKey = field.name;
    }
    const value = rowData[fieldKey] ?? rowData[field.name];
    return value !== null && value !== undefined && value !== "";
  });
}

/**
 * Real-time validation function that provides immediate feedback
 * @param field Field metadata (can be Field or Column)
 * @param value Current field value
 * @param options Validation options
 * @returns Validation result with immediate feedback
 */
export function validateFieldRealTime(
  field: Field | Column,
  value: unknown,
  options: {
    allowEmpty?: boolean;
    showTypingErrors?: boolean;
  } = {}
): { isValid: boolean; error?: string; warning?: string } {
  const { allowEmpty = true, showTypingErrors = false } = options;

  // Convert Column to Field if needed
  const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;

  // Check if value is empty
  const isEmpty = value === null || value === undefined || value === "";

  // For empty values, check if they're allowed
  if (isEmpty) {
    // If this is a mandatory field and we're not allowing empty (strict validation for save)
    if (fieldData.isMandatory && !allowEmpty) {
      return {
        isValid: false,
        error: `${fieldData.description || fieldData.name} is required`,
      };
    }
    // For optional fields or when allowEmpty is true, empty values are valid
    return { isValid: true };
  }

  // Type-specific real-time validation
  switch (fieldData.type) {
    case FieldType.NUMBER:
    case FieldType.QUANTITY:
      return validateNumericFieldRealTime(fieldData, value, showTypingErrors);

    case FieldType.DATE:
    case FieldType.DATETIME:
      return validateDateFieldRealTime(fieldData, value, showTypingErrors);

    case FieldType.BOOLEAN:
      return validateBooleanFieldRealTime(fieldData, value);

    case FieldType.LIST:
    case FieldType.SELECT:
      return validateListFieldRealTime(fieldData, value);

    case FieldType.TEXT:
      return validateTextFieldRealTime(fieldData, value, showTypingErrors);

    default:
      return { isValid: true };
  }
}

/**
 * Real-time validation for numeric fields
 */
function validateNumericFieldRealTime(
  field: Field,
  value: unknown,
  showTypingErrors: boolean
): { isValid: boolean; error?: string; warning?: string } {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return {
      isValid: false,
      error: `${field.description || field.name} must be a number`,
    };
  }

  const stringValue = String(value);

  // Allow partial input while typing (e.g., "-", ".", "1.")
  if (!showTypingErrors && /^-?\.?$|^-?\d*\.?$/.test(stringValue)) {
    return { isValid: true };
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return {
      isValid: false,
      error: `${field.description || field.name} must be a valid number`,
    };
  }

  // Quantity fields cannot be negative
  if (field.type === FieldType.QUANTITY && numValue < 0) {
    return {
      isValid: false,
      error: `${field.description || field.name} cannot be negative`,
    };
  }

  return { isValid: true };
}

/**
 * Real-time validation for date fields
 */
function validateDateFieldRealTime(
  field: Field,
  value: unknown,
  showTypingErrors: boolean
): { isValid: boolean; error?: string; warning?: string } {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return { isValid: true }; // Let the mandatory check handle this
  }

  // Accept Date objects, strings, or numbers
  if (typeof value !== "string" && !(value instanceof Date) && typeof value !== "number") {
    return {
      isValid: false,
      error: `${field.description || field.name} must be a valid date`,
    };
  }

  // Allow partial date input while typing (only for string inputs)
  if (typeof value === "string" && !showTypingErrors && /^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(value)) {
    return { isValid: true };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      error: `${field.description || field.name} must be a valid date`,
    };
  }

  return { isValid: true };
}

/**
 * Real-time validation for boolean fields
 */
function validateBooleanFieldRealTime(
  field: Field,
  value: unknown
): { isValid: boolean; error?: string; warning?: string } {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return { isValid: true }; // Let the mandatory check handle this
  }

  const validBooleanValues = [true, false, "Y", "N", "true", "false", "1", "0", 1, 0];

  if (!validBooleanValues.includes(value as any)) {
    return {
      isValid: false,
      error: `${field.description || field.name} must be a valid boolean value`,
    };
  }

  return { isValid: true };
}

/**
 * Real-time validation for list/select fields
 */
function validateListFieldRealTime(
  field: Field,
  value: unknown
): { isValid: boolean; error?: string; warning?: string } {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined || value === "") {
    return { isValid: true }; // Let the mandatory check handle this
  }

  if (!field.refList || field.refList.length === 0) {
    return { isValid: true }; // No validation if no options available
  }

  const validValues = field.refList.map((option) => option.value);
  if (!validValues.includes(value as string)) {
    return {
      isValid: false,
      error: `${field.description || field.name} must be one of the available options`,
    };
  }

  return { isValid: true };
}

/**
 * Real-time validation for text fields
 */
function validateTextFieldRealTime(
  field: Field,
  value: unknown,
  showTypingErrors: boolean
): { isValid: boolean; error?: string; warning?: string } {
  // Accept null/undefined for optional fields
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    // Only show type error if showTypingErrors is enabled
    if (showTypingErrors) {
      return {
        isValid: false,
        error: `${field.description || field.name} must be text`,
      };
    }
    return { isValid: true };
  }

  return { isValid: true };
}

/**
 * Validates a row and prevents save if validation fails
 * @param fields Array of field metadata
 * @param rowData Current row data
 * @returns Validation result that determines if save should be allowed
 */
export function validateRowForSave(fields: (Field | Column)[], rowData: EntityData): RowValidationResult {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    // Skip system fields
    if (
      field.name === "id" ||
      field.name === "actions" ||
      field.name === "creationDate" ||
      field.name === "createdBy" ||
      field.name === "updated" ||
      field.name === "updatedBy"
    ) {
      continue;
    }

    // Convert Column to Field if needed
    const fieldData: Field = ("type" in field ? field : columnToFieldForValidation(field)) as Field;

    // Skip validation for readonly fields
    if (fieldData.isReadOnly || !fieldData.isUpdatable) {
      continue;
    }

    // Try to get value using the most specific key available
    // Priority: hqlName > columnName > name
    // This ensures we match how data is actually stored in rowData
    let fieldKey: string;
    if ("hqlName" in field && field.hqlName) {
      fieldKey = field.hqlName;
    } else if ("columnName" in field && field.columnName) {
      fieldKey = field.columnName;
    } else {
      fieldKey = field.name;
    }
    const value = rowData[fieldKey] ?? rowData[field.name];

    // Use strict validation for save operations
    // Only mandatory fields must be non-empty
    const validationResult = validateFieldRealTime(fieldData, value, {
      allowEmpty: !fieldData.isMandatory,
      showTypingErrors: true,
    });

    if (!validationResult.isValid && validationResult.error) {
      errors.push({
        field: field.name,
        message: validationResult.error,
        type: "format",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Debounced validation function factory
 * @param validationFn Function to call for validation
 * @param delay Debounce delay in milliseconds
 * @returns Debounced validation function
 */
export function createDebouncedValidation<T extends unknown[]>(
  validationFn: (...args: T) => void,
  delay = 300
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      validationFn(...args);
      timeoutId = null;
    }, delay);
  };
}
