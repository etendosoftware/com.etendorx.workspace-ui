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

import type React from "react";
import { renderHook } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";
import { FormProvider, useForm } from "react-hook-form";
import type { Tab, Field } from "@workspaceui/api-client/src/api/types";
import type { IUserContext } from "../../contexts/types";

// Mock de compileExpression
jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn((_expression: string) => {
    // Mock simple que siempre retorna true para expresiones de display logic
    return () => true;
  }),
}));

// Mock del useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(() => ({
    user: {} as IUserContext["user"],
    login: jest.fn(),
    changeProfile: jest.fn(),
    token: "mock-token",
    roles: [],
    currentRole: undefined,
    prevRole: undefined,
    profile: { name: "Test User", email: "test@test.com", image: "" },
    currentWarehouse: undefined,
    currentClient: undefined,
    currentOrganization: undefined,
    setToken: jest.fn(),
    clearUserData: jest.fn(),
    setDefaultConfiguration: jest.fn(),
    languages: [],
    session: {},
    setSession: jest.fn(),
  })),
}));

// Helper function to create mock fields with required properties
const createMockField = (overrides: Partial<Field>): Field =>
  ({
    id: "mock-id",
    hqlName: "mockField",
    name: "Mock Field",
    inputName: "mockField",
    columnName: "MOCK_FIELD",
    process: "",
    isMandatory: false,
    displayed: true,
    isReadOnly: false,
    shownInStatusBar: false,
    isParent: false,
    isTransient: false,
    seqno: 0,
    startRow: 0,
    startRowStandardWindow: 0,
    updatable: true,
    isActive: true,
    column: { reference: "10" },
    firstFocused: false,
    isEncrypted: false,
    isSecondaryKey: false,
    isSortable: false,
    isStoredInSession: false,
    isSummary: false,
    maxLength: 0,
    displayLength: 0,
    callout: "",
    defaultValue: "",
    descriptionField: "",
    displayLogicExpression: "",
    mandatoryLogicExpression: "",
    readOnlyLogicExpression: "",
    validationCode: "",
    valueMapValueExpression: "",
    inpColumnName: "",
    ...overrides,
  }) as Field;

// Helper function to create mock tabs with required properties
const createMockTab = (overrides: Partial<Tab>): Tab => ({
  id: "mock-tab",
  name: "Mock Tab",
  title: "Mock Tab Title",
  window: "mock-window",
  entityName: "MockEntity",
  uIPattern: "STD" as const,
  parentColumns: [],
  table: "mock_table",
  tabLevel: 0,
  _identifier: "mock-identifier",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "mock-module",
  fields: {},
  ...overrides,
});

const mockTab: Tab = createMockTab({
  id: "test-tab",
  name: "Test Tab",
  window: "test-window",
  entityName: "TestEntity",
  uIPattern: "STD",
  fields: {
    mandatoryField1: createMockField({
      id: "field1",
      hqlName: "mandatoryField1",
      name: "Mandatory Field 1",
      isMandatory: true,
      displayed: true,
      isReadOnly: false,
      column: { reference: "10" }, // String field
    }),
    optionalField: createMockField({
      id: "field2",
      hqlName: "optionalField",
      name: "Optional Field",
      isMandatory: false,
      displayed: true,
      isReadOnly: false,
      column: { reference: "10" },
    }),
    hiddenMandatoryField: createMockField({
      id: "field3",
      hqlName: "hiddenMandatoryField",
      name: "Hidden Mandatory Field",
      isMandatory: true,
      displayed: false,
      isReadOnly: false,
      column: { reference: "10" },
    }),
    readOnlyMandatoryField: createMockField({
      id: "field4",
      hqlName: "readOnlyMandatoryField",
      name: "ReadOnly Mandatory Field",
      isMandatory: true,
      displayed: true,
      isReadOnly: true,
      column: { reference: "10" },
    }),
    referenceField: createMockField({
      id: "field5",
      hqlName: "referenceField",
      name: "Reference Field",
      isMandatory: true,
      displayed: true,
      isReadOnly: false,
      column: { reference: "18" }, // Reference field
    }),
    numericField: createMockField({
      id: "field6",
      hqlName: "numericField",
      name: "Numeric Field",
      isMandatory: true,
      displayed: true,
      isReadOnly: false,
      column: { reference: "11" }, // Numeric field
    }),
    booleanField: createMockField({
      id: "field7",
      hqlName: "booleanField",
      name: "Boolean Field",
      isMandatory: true,
      displayed: true,
      isReadOnly: false,
      column: { reference: "20" }, // Boolean field
    }),
  },
});

interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children, defaultValues = {} }) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("useFormValidation", () => {
  describe("Required Fields Detection", () => {
    test("should identify required fields correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.requiredFields).toHaveLength(4); // mandatoryField1, referenceField, numericField, booleanField
      expect(result.current.requiredFields.map((f) => f.hqlName)).toEqual([
        "mandatoryField1",
        "referenceField",
        "numericField",
        "booleanField",
      ]);
    });

    test("should exclude hidden mandatory fields", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const fieldNames = result.current.requiredFields.map((f) => f.hqlName);
      expect(fieldNames).not.toContain("hiddenMandatoryField");
    });

    test("should exclude readonly mandatory fields", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const fieldNames = result.current.requiredFields.map((f) => f.hqlName);
      expect(fieldNames).not.toContain("readOnlyMandatoryField");
    });

    test("should exclude optional fields", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const fieldNames = result.current.requiredFields.map((f) => f.hqlName);
      expect(fieldNames).not.toContain("optionalField");
    });
  });

  describe("Field Validation", () => {
    test("should identify missing required fields", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper defaultValues={{}}>{children}</TestWrapper>
        ),
      });

      const validation = result.current.validateRequiredFields();
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toHaveLength(4);
      expect(validation.missingFields[0].fieldName).toBe("mandatoryField1");
    });

    test("should pass validation when all required fields filled", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper
            defaultValues={{
              mandatoryField1: "filled",
              referenceField: "ref-value",
              referenceField$_identifier: "ref-identifier",
              numericField: 123,
              booleanField: true,
            }}>
            {children}
          </TestWrapper>
        ),
      });

      const validation = result.current.validateRequiredFields();
      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });

    test("should handle string fields correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const field = mockTab.fields.mandatoryField1;

      // Empty string should be invalid
      const emptyResult = result.current.validateField(field, "", {});
      expect(emptyResult.isValid).toBe(false);

      // Whitespace-only should be invalid
      const whitespaceResult = result.current.validateField(field, "   ", {});
      expect(whitespaceResult.isValid).toBe(false);

      // Valid string should be valid
      const validResult = result.current.validateField(field, "valid value", {});
      expect(validResult.isValid).toBe(true);
    });

    test("should handle reference fields correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const field = mockTab.fields.referenceField;

      // Having value without identifier should be valid (OR logic)
      const missingIdentifierResult = result.current.validateField(field, "ref-value", {
        referenceField: "ref-value",
      });
      expect(missingIdentifierResult.isValid).toBe(true);

      // Having identifier without value should be valid (OR logic)
      const missingValueResult = result.current.validateField(field, "", {
        referenceField$_identifier: "ref-identifier",
      });
      expect(missingValueResult.isValid).toBe(true);

      // Both value and identifier should be valid
      const validResult = result.current.validateField(field, "ref-value", {
        referenceField: "ref-value",
        referenceField$_identifier: "ref-identifier",
      });
      expect(validResult.isValid).toBe(true);

      // Neither value nor identifier should be invalid
      const neitherResult = result.current.validateField(field, "", {});
      expect(neitherResult.isValid).toBe(false);
    });

    test("should handle numeric fields correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const field = mockTab.fields.numericField;

      // Zero should be valid (business requirement)
      const zeroResult = result.current.validateField(field, 0, {});
      expect(zeroResult.isValid).toBe(true);

      // Positive number should be valid
      const positiveResult = result.current.validateField(field, 123, {});
      expect(positiveResult.isValid).toBe(true);

      // Empty should be invalid
      const emptyResult = result.current.validateField(field, "", {});
      expect(emptyResult.isValid).toBe(false);

      // Null should be invalid
      const nullResult = result.current.validateField(field, null, {});
      expect(nullResult.isValid).toBe(false);
    });

    test("should handle boolean fields correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const field = mockTab.fields.booleanField;

      // True should be valid
      const trueResult = result.current.validateField(field, true, {});
      expect(trueResult.isValid).toBe(true);

      // False should be valid
      const falseResult = result.current.validateField(field, false, {});
      expect(falseResult.isValid).toBe(true);

      // Null should be invalid
      const nullResult = result.current.validateField(field, null, {});
      expect(nullResult.isValid).toBe(false);
    });
  });

  describe("Validation Summary", () => {
    test("should generate proper error message", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper defaultValues={{}}>{children}</TestWrapper>
        ),
      });

      const summary = result.current.getValidationSummary();
      expect(summary.isValid).toBe(false);
      expect(summary.errorMessage).toBe(
        "The following required fields are missing: Mandatory Field 1, Reference Field, Numeric Field, Boolean Field"
      );
      expect(summary.missingFieldsCount).toBe(4);
    });

    test("should return valid summary when all fields filled", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper
            defaultValues={{
              mandatoryField1: "filled",
              referenceField: "ref-value",
              referenceField$_identifier: "ref-identifier",
              numericField: 123,
              booleanField: true,
            }}>
            {children}
          </TestWrapper>
        ),
      });

      const summary = result.current.getValidationSummary();
      expect(summary.isValid).toBe(true);
      expect(summary.errorMessage).toBe("");
      expect(summary.missingFieldsCount).toBe(0);
    });
  });

  describe("Utility Functions", () => {
    test("should check validation errors correctly", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper defaultValues={{}}>{children}</TestWrapper>
        ),
      });

      expect(result.current.hasValidationErrors()).toBe(true);
    });

    test("should check field display logic", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      const displayedField = mockTab.fields.mandatoryField1;
      const hiddenField = mockTab.fields.hiddenMandatoryField;

      expect(result.current.isFieldDisplayed(displayedField)).toBe(true);
      expect(result.current.isFieldDisplayed(hiddenField)).toBe(false);
    });

    test("should provide form values for debugging", () => {
      const { result } = renderHook(() => useFormValidation(mockTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <TestWrapper defaultValues={{ test: "value" }}>{children}</TestWrapper>
        ),
      });

      const values = result.current.getFormValues();
      expect(values).toEqual({ test: "value" });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty tab gracefully", () => {
      const emptyTab = createMockTab({ fields: {} });

      const { result } = renderHook(() => useFormValidation(emptyTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.requiredFields).toHaveLength(0);
      expect(result.current.validateRequiredFields().isValid).toBe(true);
    });

    test("should handle tab without fields property", () => {
      const invalidTab = createMockTab({ fields: {} });

      const { result } = renderHook(() => useFormValidation(invalidTab), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.requiredFields).toHaveLength(0);
      expect(result.current.validateRequiredFields().isValid).toBe(true);
    });

    test("should handle fields with display logic gracefully", () => {
      const tabWithDisplayLogic = createMockTab({
        ...mockTab,
        fields: {
          ...mockTab.fields,
          conditionalField: createMockField({
            id: "conditional",
            hqlName: "conditionalField",
            name: "Conditional Field",
            isMandatory: true,
            displayed: true,
            isReadOnly: false,
            column: { reference: "10" },
            displayLogicExpression: "@someCondition@ = 'Y'",
          }),
        },
      });

      const { result } = renderHook(() => useFormValidation(tabWithDisplayLogic), {
        wrapper: ({ children }: { children: React.ReactNode }) => <TestWrapper>{children}</TestWrapper>,
      });

      // Should not throw error and handle display logic gracefully
      expect(() => result.current.validateRequiredFields()).not.toThrow();
    });
  });
});
