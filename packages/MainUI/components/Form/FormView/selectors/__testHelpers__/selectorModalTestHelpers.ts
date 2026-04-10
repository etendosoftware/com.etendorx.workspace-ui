/**
 * Test helpers for SelectorModal and related hooks
 */

import type { Field, SelectorColumn, EntityData } from "@workspaceui/api-client/src/api/types";

/**
 * Creates a mock Field with selector configuration
 */
export function createMockField(overrides?: Partial<Field>): Field {
  return {
    id: "field-1",
    name: "Test Field",
    hqlName: "testField",
    columnName: "testField",
    column: { dBColumnName: "test_field" },
    referencedEntity: "TestEntity",
    referencedWindowId: "W123",
    selector: {
      datasourceName: "TestDatasource",
      gridColumns: [],
      _selectorDefinitionId: "sel-1",
      filterClass: "org.openbravo.userinterface.selector.SelectorDataSourceFilter",
    },
    ...overrides,
  } as Field;
}

/**
 * Creates a mock EntityData record
 */
export function createMockEntityData(overrides?: Partial<EntityData>): EntityData {
  return {
    id: "record-1",
    _identifier: "Record 1",
    name: "Test Record",
    ...overrides,
  };
}

/**
 * Creates a mock grid columns configuration
 */
export function createMockGridColumnsForSelector(): SelectorColumn[] {
  return [
    {
      id: "col-1",
      header: "Name",
      accessorKey: "name",
      enableSorting: true,
      enableFiltering: true,
      referenceId: "10",
      sortNo: 1,
    },
    {
      id: "col-2",
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      enableFiltering: true,
      referenceId: "20", // Boolean
      sortNo: 2,
    },
    {
      id: "col-3",
      header: "Warehouse",
      accessorKey: "warehouse",
      enableSorting: true,
      enableFiltering: true,
      referenceId: "18", // TABLEDIR
      sortNo: 3,
    },
  ];
}

/**
 * Mocks for React Hook Form
 */
export const createMockFormContext = () => ({
  getValues: jest.fn(() => ({
    field1: "value1",
    field2: "value2",
  })),
  watch: jest.fn(),
  control: {},
});

/**
 * Mocks for tab context
 */
export const createMockTabContext = () => ({
  tab: {
    id: "tab-1",
    window: "window-1",
    fields: {
      testField: {
        id: "field-1",
        inputName: "inpTestField",
        hqlName: "testField",
      },
    },
  },
});

/**
 * Mocks for user context
 */
export const createMockUserContext = () => ({
  session: {
    user: {
      id: "user-1",
      name: "Test User",
    },
    client: {
      id: "client-1",
    },
    org: {
      id: "org-1",
    },
  },
});

/**
 * Mocks for language context
 */
export const createMockLanguageContext = () => ({
  language: "en_US",
});

/**
 * Mocks for translation function
 */
export const createMockTranslationFunction = () =>
  jest.fn((key: string) => {
    const translations: Record<string, string> = {
      "common.trueText": "Yes",
      "common.falseText": "No",
      "errors.missingData.title": "No data available",
      "multiselect.noOptionsFound": "No options found",
      "multiselect.loadingOptions": "Loading options...",
    };
    return translations[key] || key;
  });
