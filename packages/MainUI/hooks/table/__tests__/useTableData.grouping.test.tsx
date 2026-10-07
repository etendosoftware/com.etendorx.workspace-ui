import { renderHook } from "@testing-library/react";
import type { DatasourceOptions } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_PAGE_SIZE } from "@/utils/table/constants";
import { GROUPING_ENABLED_PREFERENCE, getGroupingMaxRecords } from "@/utils/table/grouping";
import { clearPreferences, savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { useTableData } from "../useTableData";

const GROUP_COLUMN = "Business Partner";
const GROUP_FIELD = "businessPartner";
const SORT_COLUMN = "Document No.";
const SORT_FIELD = "documentNo";

const mockTableState = {
  grouping: [] as string[],
  sorting: [] as Array<{ id: string; desc: boolean }>,
};
let mockSupportsTree = false;
const mockUseDatasource = jest.fn();
// Stable references: the hook's effects compare them by identity
const mockFilters: unknown[] = [];
const mockVisibility = { [GROUP_COLUMN]: true };
const mockPersistenceSetters = {
  setTableColumnFilters: jest.fn(),
  setTableColumnVisibility: jest.fn(),
  setTableColumnSorting: jest.fn(),
  setTableColumnOrder: jest.fn(),
  setIsImplicitFilterApplied: jest.fn(),
};
const mockDatasourceResult = { records: [], loading: false, error: null, hasMoreRecords: false, fetchMore: jest.fn() };
const mockToolbar = { setIsImplicitFilterApplied: jest.fn() };
const mockSelected = { graph: { getSelected: () => null } };
const mockColumnFilters = { columnFilters: [], setColumnFilter: jest.fn(), setColumnFilters: jest.fn() };
const mockColumns: unknown[] = [];

const mockTab = {
  id: "tab-1",
  window: "143",
  entityName: "Order",
  tabLevel: 0,
  parentColumns: [],
  fields: {
    [GROUP_FIELD]: { name: GROUP_COLUMN, hqlName: GROUP_FIELD, column: {} },
    [SORT_FIELD]: { name: SORT_COLUMN, hqlName: SORT_FIELD, column: {} },
  },
};

jest.mock("../../../contexts/searchContext", () => ({ useSearch: () => ({ searchQuery: "" }) }));
jest.mock("../../../contexts/language", () => ({ useLanguage: () => ({ language: "en_US" }) }));
jest.mock("../../../contexts/tab", () => ({
  useTabContext: () => ({ tab: mockTab, parentTab: null, parentRecord: null, parentRecords: [] }),
}));
jest.mock("../../../contexts/CurrentWindowContext", () => ({ useCurrentWindowIdentifier: () => "143_1" }));
jest.mock("../../../contexts/ToolbarContext", () => ({
  useToolbarContext: () => mockToolbar,
}));
jest.mock("../../useSelected", () => ({ useSelected: () => mockSelected }));
jest.mock("../../useTreeModeMetadata", () => ({
  useTreeModeMetadata: () => ({ treeMetadata: { supportsTreeMode: mockSupportsTree }, loading: false }),
}));
jest.mock("../../useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    tableColumnFilters: mockFilters,
    tableColumnVisibility: mockVisibility,
    tableColumnSorting: mockTableState.sorting,
    tableColumnGrouping: mockTableState.grouping,
    isImplicitFilterApplied: false,
    advancedCriteria: undefined,
    ...mockPersistenceSetters,
  }),
}));
jest.mock("../../useDatasource", () => ({
  useDatasource: (args: unknown) => {
    mockUseDatasource(args);
    return mockDatasourceResult;
  },
}));
jest.mock("../useColumns", () => ({ useColumns: () => mockColumns }));
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilters", () => ({
  useColumnFilters: () => mockColumnFilters,
}));
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilterData", () => ({
  useColumnFilterData: () => ({ fetchFilterOptions: jest.fn() }),
}));
jest.mock("@/utils/contextUtils", () => ({ buildEtendoContext: () => ({}), buildParentSessionContext: () => ({}) }));

/** Renders the hook and returns the query it sent to the datasource. */
const renderQuery = (isTreeMode = false): DatasourceOptions => {
  renderHook(() => useTableData({ isTreeMode }));
  const lastCall = mockUseDatasource.mock.calls.at(-1)?.[0] as { params: DatasourceOptions };
  return lastCall.params;
};

describe("useTableData grouping query", () => {
  beforeEach(() => {
    mockUseDatasource.mockClear();
    mockTableState.grouping = [];
    mockTableState.sorting = [];
    mockSupportsTree = false;
    installLocalStorageMock();
    savePreferences({ [GROUPING_ENABLED_PREFERENCE]: "Y" });
  });

  afterEach(() => clearPreferences());

  it("keeps the regular page size and sort when the grid is not grouped", () => {
    mockTableState.sorting = [{ id: SORT_COLUMN, desc: true }];

    const query = renderQuery();

    expect(query.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(query.sortBy).toBe(`-${SORT_FIELD}`);
  });

  it("loads up to the grouping limit + 1 sorted by the grouped column", () => {
    mockTableState.grouping = [GROUP_COLUMN];
    mockTableState.sorting = [{ id: GROUP_COLUMN, desc: false }];

    const query = renderQuery();

    expect(query.pageSize).toBe(getGroupingMaxRecords(mockTab.window) + 1);
    expect(query.sortBy).toBe(GROUP_FIELD);
    expect(query.isSorting).toBe(true);
  });

  it("sorts inside the groups by the current sort", () => {
    mockTableState.grouping = [GROUP_COLUMN];
    mockTableState.sorting = [{ id: SORT_COLUMN, desc: true }];

    expect(renderQuery().sortBy).toBe(`${GROUP_FIELD},-${SORT_FIELD}`);
  });

  it("sorts by the grouped column alone when there is no sort at all", () => {
    mockTableState.grouping = [GROUP_COLUMN];

    expect(renderQuery().sortBy).toBe(GROUP_FIELD);
  });

  it("sorts by the column id when it does not match a field", () => {
    mockTableState.grouping = [GROUP_COLUMN];
    mockTableState.sorting = [{ id: "unknownColumn", desc: false }];

    expect(renderQuery().sortBy).toBe(`${GROUP_FIELD},unknownColumn`);
  });

  it("ignores the grouping when the window does not enable it or in tree mode", () => {
    mockTableState.grouping = [GROUP_COLUMN];
    clearPreferences();
    expect(renderQuery().pageSize).toBe(DEFAULT_PAGE_SIZE);

    savePreferences({ [GROUPING_ENABLED_PREFERENCE]: "Y" });
    mockSupportsTree = true;
    expect(renderQuery(true).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});
