/**
 * Test helpers for selectorColumns.tsx
 * Provides mocks, fixtures, and utilities for testing selector column building
 */

import type { SelectorColumn, Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { MRT_ColumnFiltersState } from "material-react-table";

/**
 * Creates a mock SelectorColumn for testing
 */
export function createMockSelectorColumn(overrides?: Partial<SelectorColumn>): SelectorColumn {
  return {
    id: "col-1",
    header: "Test Column",
    accessorKey: "testField",
    enableSorting: true,
    enableFiltering: true,
    referenceId: "10", // Text reference
    sortNo: 1,
    ...overrides,
  };
}

/**
 * Creates a mock filter option for testing
 */
export function createMockFilterOption(overrides?: Partial<FilterOption>): FilterOption {
  return {
    id: "opt-1",
    label: "Option 1",
    value: "option1",
    ...overrides,
  };
}

/**
 * Creates mock column filter state for testing
 */
export function createMockColumnFilterState(overrides?: Partial<ColumnFilterState>): ColumnFilterState {
  return {
    id: "testField",
    selectedOptions: [],
    availableOptions: [],
    isMultiSelect: false,
    loading: false,
    hasMore: false,
    searchQuery: "",
    ...overrides,
  };
}

/**
 * Creates mock translation function
 */
export function createMockTranslator() {
  return jest.fn((key: string, defaultValue?: string) => defaultValue || key);
}

/**
 * Reference IDs for testing different column types
 */
export const TEST_REFERENCE_IDS = {
  TEXT: "10",
  BOOLEAN: "20",
  DATE: "15",
  TABLEDIR: "18",
  TABLEDIR_ALT: "19",
  CUSTOM_DATE: "478169542A1747BD942DD70C8B45089C",
};

/**
 * Creates a complete set of test selector columns for comprehensive testing
 */
export function createMockGridColumns(): SelectorColumn[] {
  return [
    createMockSelectorColumn({
      id: "name",
      header: "Name",
      accessorKey: "name",
      referenceId: TEST_REFERENCE_IDS.TEXT,
      sortNo: 1,
    }),
    createMockSelectorColumn({
      id: "active",
      header: "Active",
      accessorKey: "active",
      referenceId: TEST_REFERENCE_IDS.BOOLEAN,
      sortNo: 2,
    }),
    createMockSelectorColumn({
      id: "created",
      header: "Created Date",
      accessorKey: "createdDate",
      referenceId: TEST_REFERENCE_IDS.DATE,
      sortNo: 3,
    }),
    createMockSelectorColumn({
      id: "warehouse",
      header: "Warehouse",
      accessorKey: "warehouse",
      referenceId: TEST_REFERENCE_IDS.TABLEDIR,
      sortNo: 4,
    }),
  ];
}

/**
 * Creates mock column filters for testing
 */
export function createMockColumnFilters(): MRT_ColumnFiltersState {
  return [
    { id: "name", value: "test" },
    { id: "active", value: [createMockFilterOption({ id: "true", value: "true" })] },
  ];
}

/**
 * Creates a mock Column for internal use
 */
export function createMockColumn(overrides?: Partial<Column>): Column {
  return {
    id: "col-1",
    name: "Test",
    header: "Test Column",
    columnName: "testField",
    reference: "10",
    type: "text",
    ...overrides,
  } as Column;
}
