/**
 * Tests for selectorColumns.tsx
 * Covers filter type detection, column building, and selector column utilities
 */

import {
  getFilterType,
  buildSelectorColumnDefs,
  preloadFiltersFromCriteria,
  buildDatasourceColumns,
  getHiddenDefaultCriteria,
} from "../selectorColumns";
import {
  createMockSelectorColumn,
  createMockFilterOption,
  createMockTranslator,
  TEST_REFERENCE_IDS,
  createMockGridColumns,
} from "../__testHelpers__/selectorColumnsTestHelpers";
import type { SelectorCriteria, DefaultFilterResponse } from "../defaultFilters";

describe("selectorColumns - getFilterType", () => {
  it("returns 'text' for undefined referenceId", () => {
    expect(getFilterType(undefined)).toBe("text");
  });

  it("returns 'boolean' for boolean reference ID", () => {
    expect(getFilterType(TEST_REFERENCE_IDS.BOOLEAN)).toBe("boolean");
  });

  it("returns 'date' for date reference IDs", () => {
    expect(getFilterType(TEST_REFERENCE_IDS.DATE)).toBe("date");
    expect(getFilterType(TEST_REFERENCE_IDS.CUSTOM_DATE)).toBe("date");
  });

  it("returns 'dropdown' for TABLEDIR reference IDs", () => {
    expect(getFilterType(TEST_REFERENCE_IDS.TABLEDIR)).toBe("dropdown");
    expect(getFilterType(TEST_REFERENCE_IDS.TABLEDIR_ALT)).toBe("dropdown");
  });

  it("returns 'text' for unknown reference ID", () => {
    expect(getFilterType("99999")).toBe("text");
  });

  it("returns 'text' for empty string referenceId", () => {
    expect(getFilterType("")).toBe("text");
  });
});

describe("selectorColumns - buildSelectorColumnDefs", () => {
  const mockTranslator = createMockTranslator();

  beforeEach(() => {
    mockTranslator.mockClear();
  });

  it("builds column definitions for grid columns with correct accessor keys", () => {
    const gridColumns = [
      createMockSelectorColumn({
        id: "col-1",
        header: "Test Header",
        accessorKey: "testField",
        enableSorting: true,
        enableFiltering: true,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs).toHaveLength(1);
    expect(columnDefs[0].accessorKey).toBe("testField");
    expect(columnDefs[0].header).toBe("Test Header");
  });

  it("enables sorting and filtering by default", () => {
    const gridColumns = [createMockSelectorColumn()];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].enableSorting).toBe(true);
    expect(columnDefs[0].enableColumnFilter).toBe(true);
  });

  it("respects enableSorting and enableFiltering from SelectorColumn", () => {
    const gridColumns = [
      createMockSelectorColumn({
        enableSorting: false,
        enableFiltering: false,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].enableSorting).toBe(false);
    expect(columnDefs[0].enableColumnFilter).toBe(false);
  });

  it("returns column without Filter when filtering is disabled", () => {
    const gridColumns = [
      createMockSelectorColumn({
        enableFiltering: false,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].Filter).toBeUndefined();
  });

  it("adds Cell renderer for dropdown columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        accessorKey: "warehouse",
        referenceId: TEST_REFERENCE_IDS.TABLEDIR,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].Cell).toBeDefined();
  });

  it("adds Filter component for text columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        referenceId: TEST_REFERENCE_IDS.TEXT,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].Filter).toBeDefined();
  });

  it("adds Filter component for boolean columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        referenceId: TEST_REFERENCE_IDS.BOOLEAN,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].Filter).toBeDefined();
  });

  it("adds Filter component for date columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        referenceId: TEST_REFERENCE_IDS.DATE,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs[0].Filter).toBeDefined();
  });

  it("processes multiple columns with different filter types", () => {
    const gridColumns = createMockGridColumns();

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
    });

    expect(columnDefs).toHaveLength(4);
    // Text column should have TextFilter
    expect(columnDefs[0].Filter).toBeDefined();
    // Boolean column should have ColumnFilter
    expect(columnDefs[1].Filter).toBeDefined();
    // Date column should have DateSelector
    expect(columnDefs[2].Filter).toBeDefined();
    // TABLEDIR column should have ColumnFilter and Cell renderer
    expect(columnDefs[3].Filter).toBeDefined();
    expect(columnDefs[3].Cell).toBeDefined();
  });

  it("passes preloaded options to dropdown filter when provided", () => {
    const preloadedOptions = new Map([["warehouse", [createMockFilterOption()]]]);
    const gridColumns = [
      createMockSelectorColumn({
        accessorKey: "warehouse",
        referenceId: TEST_REFERENCE_IDS.TABLEDIR,
      }),
    ];

    const columnDefs = buildSelectorColumnDefs(gridColumns, {
      onTextFilterChange: jest.fn(),
      onBooleanFilterChange: jest.fn(),
      columnFilters: [],
      t: mockTranslator,
      idFilterPreloadedOptions: preloadedOptions,
    });

    expect(columnDefs[0].Filter).toBeDefined();
  });
});

describe("selectorColumns - preloadFiltersFromCriteria", () => {
  const mockTranslator = createMockTranslator();
  const gridColumns = createMockGridColumns();

  it("preloads boolean filter from criteria", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "active",
        value: true,
      },
    ];

    const filters = preloadFiltersFromCriteria(criteria, gridColumns, null, mockTranslator);

    const activeFilter = filters.find((f) => f.id === "active");
    expect(activeFilter).toBeDefined();
    expect(activeFilter?.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "true",
        }),
      ])
    );
  });

  it("preloads text filter from criteria", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "name",
        value: "test name",
      },
    ];

    const filters = preloadFiltersFromCriteria(criteria, gridColumns, null, mockTranslator);

    const nameFilter = filters.find((f) => f.id === "name");
    expect(nameFilter).toBeDefined();
    expect(nameFilter?.value).toBe("test name");
  });

  it("skips idFilters from criteria", () => {
    const rawResponse: DefaultFilterResponse = {
      idFilters: [
        {
          fieldName: "idField",
          id: "123",
          _identifier: "ID Label",
        },
      ],
    };

    const criteria: SelectorCriteria[] = [
      {
        fieldName: "idField",
        value: "123",
      },
      {
        fieldName: "name",
        value: "test",
      },
    ];

    const filters = preloadFiltersFromCriteria(criteria, gridColumns, rawResponse, mockTranslator);

    // idField should not be in filters (it's skipped)
    const idFilter = filters.find((f) => f.id === "idField");
    expect(idFilter).toBeUndefined();

    // name filter should be present
    const nameFilter = filters.find((f) => f.id === "name");
    expect(nameFilter).toBeDefined();
  });

  it("handles missing columns in criteria gracefully", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "nonExistentField",
        value: "value",
      },
    ];

    const filters = preloadFiltersFromCriteria(criteria, gridColumns, null, mockTranslator);

    // Should skip the non-existent field
    expect(filters).toEqual([]);
  });

  it("handles empty criteria array", () => {
    const filters = preloadFiltersFromCriteria([], gridColumns, null, mockTranslator);

    expect(filters).toEqual([]);
  });
});

describe("selectorColumns - buildDatasourceColumns", () => {
  it("builds columns with correct structure", () => {
    const gridColumns = createMockGridColumns();

    const columns = buildDatasourceColumns(gridColumns);

    expect(columns).toHaveLength(4);
    expect(columns[0]).toMatchObject({
      id: "name",
      columnName: "name",
      reference: TEST_REFERENCE_IDS.TEXT,
    });
  });

  it("sets type to 'tabledir' for TABLEDIR columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        accessorKey: "warehouse",
        referenceId: TEST_REFERENCE_IDS.TABLEDIR,
      }),
    ];

    const columns = buildDatasourceColumns(gridColumns);

    expect(columns[0].type).toBe("tabledir");
    expect(columns[0].referencedEntity).toBe("true");
  });

  it("leaves type undefined for non-TABLEDIR columns", () => {
    const gridColumns = [
      createMockSelectorColumn({
        referenceId: TEST_REFERENCE_IDS.TEXT,
      }),
    ];

    const columns = buildDatasourceColumns(gridColumns);

    expect(columns[0].type).toBeUndefined();
  });

  it("provides accessorFn for data access", () => {
    const gridColumns = [
      createMockSelectorColumn({
        accessorKey: "testField",
      }),
    ];

    const columns = buildDatasourceColumns(gridColumns);

    expect(columns[0].accessorFn).toBeDefined();
    expect(typeof columns[0].accessorFn).toBe("function");
  });
});

describe("selectorColumns - getHiddenDefaultCriteria", () => {
  const gridColumns = createMockGridColumns();

  it("keeps criteria with no visible column", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "hiddenField",
        value: "value",
      },
    ];

    const hidden = getHiddenDefaultCriteria(criteria, gridColumns, null);

    expect(hidden).toContainEqual(criteria[0]);
  });

  it("drops idFilters when column filter is active", () => {
    const rawResponse: DefaultFilterResponse = {
      idFilters: [
        {
          fieldName: "warehouse",
          id: "wh-1",
          _identifier: "Warehouse 1",
        },
      ],
    };

    const criteria: SelectorCriteria[] = [
      {
        fieldName: "warehouse",
        value: "wh-1",
      },
    ];

    const activeFilterIds = new Set(["warehouse"]);
    const hidden = getHiddenDefaultCriteria(criteria, gridColumns, rawResponse, activeFilterIds);

    // warehouse is an idFilter and it's active, so should be dropped
    expect(hidden).not.toContainEqual(criteria[0]);
  });

  it("keeps idFilters when column filter is not active", () => {
    const rawResponse: DefaultFilterResponse = {
      idFilters: [
        {
          fieldName: "warehouse",
          id: "wh-1",
          _identifier: "Warehouse 1",
        },
      ],
    };

    const criteria: SelectorCriteria[] = [
      {
        fieldName: "warehouse",
        value: "wh-1",
      },
    ];

    const hidden = getHiddenDefaultCriteria(criteria, gridColumns, rawResponse);

    // warehouse is an idFilter and no active filters, so should be kept
    expect(hidden).toContainEqual(criteria[0]);
  });

  it("drops criteria for visible non-idFilter columns", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "name",
        value: "test",
      },
    ];

    const hidden = getHiddenDefaultCriteria(criteria, gridColumns, null);

    // name is a visible column and not an idFilter, so it's dropped (it's not a "hidden default")
    expect(hidden).not.toContainEqual(criteria[0]);
  });

  it("handles empty criteria array", () => {
    const hidden = getHiddenDefaultCriteria([], gridColumns, null);

    expect(hidden).toEqual([]);
  });

  it("handles undefined activeColumnFilterIds", () => {
    const criteria: SelectorCriteria[] = [
      {
        fieldName: "hiddenField",
        value: "value",
      },
    ];

    const hidden = getHiddenDefaultCriteria(criteria, gridColumns, null, undefined);

    expect(hidden).toContainEqual(criteria[0]);
  });
});
