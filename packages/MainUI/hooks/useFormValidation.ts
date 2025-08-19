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

import { useMemo, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { Tab, Field } from "@workspaceui/api-client/src/api/types";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

/**
 * Interface for validation result of a single field
 */
interface FieldValidationResult {
  fieldName: string;
  fieldLabel: string;
  isValid: boolean;
  message?: string;
}

/**
 * Interface for overall form validation result
 */
interface FormValidationResult {
  isValid: boolean;
  missingFields: FieldValidationResult[];
}

/**
 * Interface for validation summary with user-friendly error message
 */
interface ValidationSummary {
  isValid: boolean;
  errorMessage: string;
  missingFieldsCount: number;
}

/**
 * Custom hook for form validation logic
 * Provides client-side validation for required fields before form submission
 *
 * @param tab - Tab metadata containing field definitions
 * @returns Validation functions and utilities
 */
export const useFormValidation = (tab: Tab) => {
  const { getValues } = useFormContext();
  const { session } = useUserContext();

  /**
   * Filter and memoize required fields that need validation
   * Only includes fields that are mandatory, displayed, and not readonly
   */
  const requiredFields = useMemo(() => {
    if (!tab?.fields) return [];

    return Object.values(tab.fields).filter((field: Field) => {
      return field.isMandatory && field.displayed && !field.isReadOnly;
    });
  }, [tab?.fields]);

  /**
   * Check if a field should be displayed based on display logic
   * Respects dynamic field visibility to prevent validation of hidden mandatory fields
   *
   * @param field - Field to check
   * @returns true if field should be displayed
   */
  const isFieldDisplayed = useCallback(
    (field: Field): boolean => {
      if (!field.displayLogicExpression) {
        return field.displayed;
      }

      try {
        const currentValues = getValues();
        if (!currentValues || Object.keys(currentValues).length === 0) {
          return field.displayed; // Default to displayed while form loads
        }

        const compiledExpression = compileExpression(field.displayLogicExpression);
        return compiledExpression(session, currentValues);
      } catch (error) {
        console.warn(`Error evaluating display logic for field ${field.hqlName}:`, error);
        return field.displayed; // Default to displayed on error
      }
    },
    [getValues, session]
  );

  /**
   * Validate a single field value based on its type and requirements
   * Different field types have different "empty" definitions
   *
   * @param field - Field definition
   * @param value - Current field value
   * @param formValues - All form values for reference field validation
   * @returns Field validation result
   */
  const validateField = useCallback(
    (field: Field, value: unknown, formValues: Record<string, unknown>): FieldValidationResult => {
      const fieldLabel = field.name || field.hqlName;

      // Reference fields (Table Directory) need both value and identifier
      if (
        field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_18 ||
        field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_19
      ) {
        const identifierValue = formValues[`${field.hqlName}$_identifier`];
        const isValid = !!(value && identifierValue);

        return {
          fieldName: field.hqlName,
          fieldLabel,
          isValid,
          message: isValid ? undefined : `${fieldLabel} is required`,
        };
      }

      // String fields - check for non-empty strings (handle whitespace-only inputs)
      if (
        field.column?.reference === FIELD_REFERENCE_CODES.STRING ||
        field.column?.reference === FIELD_REFERENCE_CODES.TEXT_LONG
      ) {
        const isValid = !!(value && typeof value === "string" && value.trim() !== "");

        return {
          fieldName: field.hqlName,
          fieldLabel,
          isValid,
          message: isValid ? undefined : `${fieldLabel} is required`,
        };
      }

      // Numeric fields (allow zero values - business logic requirement)
      if (
        field.column?.reference === FIELD_REFERENCE_CODES.INTEGER ||
        field.column?.reference === FIELD_REFERENCE_CODES.NUMERIC ||
        field.column?.reference === FIELD_REFERENCE_CODES.QUANTITY_22
      ) {
        const isValid = value !== null && value !== undefined && value !== "";

        return {
          fieldName: field.hqlName,
          fieldLabel,
          isValid,
          message: isValid ? undefined : `${fieldLabel} is required`,
        };
      }

      // Boolean fields (both states are valid)
      if (field.column?.reference === FIELD_REFERENCE_CODES.BOOLEAN) {
        const isValid = value !== null && value !== undefined;

        return {
          fieldName: field.hqlName,
          fieldLabel,
          isValid,
          message: isValid ? undefined : `${fieldLabel} is required`,
        };
      }

      // Default validation for other field types
      const isValid = value !== null && value !== undefined && value !== "";

      return {
        fieldName: field.hqlName,
        fieldLabel,
        isValid,
        message: isValid ? undefined : `${fieldLabel} is required`,
      };
    },
    []
  );

  /**
   * Validate all required fields in the form
   * Returns comprehensive validation result with details for each invalid field
   *
   * @returns Form validation result
   */
  const validateRequiredFields = useCallback((): FormValidationResult => {
    const formValues = getValues();
    const missingFields: FieldValidationResult[] = [];

    for (const field of requiredFields) {
      // Skip validation for fields that are not currently displayed
      if (!isFieldDisplayed(field)) {
        continue;
      }

      const value = formValues[field.hqlName];
      const validationResult = validateField(field, value, formValues);

      if (!validationResult.isValid) {
        missingFields.push(validationResult);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }, [requiredFields, getValues, isFieldDisplayed, validateField]);

  /**
   * Get a user-friendly validation summary with formatted error message
   * Provides actionable feedback for users
   *
   * @returns Validation summary with error message
   */
  const getValidationSummary = useCallback((): ValidationSummary => {
    const validationResult = validateRequiredFields();

    if (validationResult.isValid) {
      return {
        isValid: true,
        errorMessage: "",
        missingFieldsCount: 0,
      };
    }

    const fieldLabels = validationResult.missingFields.map((field) => field.fieldLabel).join(", ");

    return {
      isValid: false,
      errorMessage: `The following required fields are missing: ${fieldLabels}`,
      missingFieldsCount: validationResult.missingFields.length,
    };
  }, [validateRequiredFields]);

  /**
   * Check if the form has any validation errors
   * Quick check without detailed error information
   *
   * @returns true if form has validation errors
   */
  const hasValidationErrors = useCallback((): boolean => {
    const result = validateRequiredFields();
    return !result.isValid;
  }, [validateRequiredFields]);

  return {
    // Validation functions
    validateRequiredFields,
    validateField,
    getValidationSummary,
    hasValidationErrors,

    // Field utilities
    isFieldDisplayed,
    requiredFields,

    // Debugging utilities
    getFormValues: getValues,
  };
};
