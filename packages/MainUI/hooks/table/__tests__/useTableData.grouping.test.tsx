import { act, renderHook, waitFor } from "@testing-library/react";
import type { DatasourceOptions } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_PAGE_SIZE } from "@/utils/table/constants";
import { GROUPING_ENABLED_PREFERENCE, getGroupingMaxRecords } from "@/utils/table/grouping";
import { ORDER_BY_PARAM } from "@/utils/table/defaultOrderBy";
import { clearPreferences, savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { useTableData } from "../useTableData";
import { DEFAULT_TREE_FETCH_LIMIT, TOO_MANY_NODES_MESSAGE } from "@/utils/table/treeMode";
import { toast } from "sonner";
import { markInitialViewResolved, useInitialViewStore } from "@/stores/initialViewStore";
import { useWindowStore } from "@/stores/windowStore";
import { getSettledTabDefaultView } from "@/utils/savedViews/defaultViews";
import { getSettledTabColumnConfiguration } from "@/utils/savedViews/gridConfiguration";

const GROUP_COLUMN = "Business Partner";
const GROUP_FIELD = "businessPartner";
const SORT_COLUMN = "Document No.";
const SORT_FIELD = "documentNo";
const ORDER_BY_CLAUSE = "-documentNo, abs(grandTotalAmount) desc, e.businessPartner";
const QUERY_TAB_CLAUSE = "trx.movementDate, trx.transactionProcessDate";

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
const mockGetRequestParams = jest.fn();
const mockDatasourceResult = {
  records: [] as Record<string, unknown>[],
  isTreeLimitExceeded: false,
  loading: false,
  error: null,
  hasMoreRecords: false,
  fetchMore: jest.fn(),
  getRequestParams: mockGetRequestParams,
};
const mockToolbar = { setIsImplicitFilterApplied: jest.fn() };
const PROPERTY_COLUMN = "Payment Date";
const PROPERTY_PATH = "finPayment.paymentDate";
const PROPERTY_FIELD = "finPayment$paymentDate";
const mockSelected = { graph: { getSelected: () => null } };
const mockColumnFilters = { columnFilters: [], setColumnFilter: jest.fn(), setColumnFilters: jest.fn() };
const mockColumns: unknown[] = [];
const mockDatasourceGet = jest.fn();

const mockTab: { hqlorderbyclause?: string; defaultSortField?: string; [key: string]: unknown } = {
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
jest.mock("../../../contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", getLabel: (code: string) => code }),
}));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/utils/savedViews/defaultViews", () => ({
  ...jest.requireActual("@/utils/savedViews/defaultViews"),
  getSettledTabDefaultView: jest.fn(),
}));
jest.mock("@/utils/savedViews/gridConfiguration", () => ({
  ...jest.requireActual("@/utils/savedViews/gridConfiguration"),
  getSettledTabColumnConfiguration: jest.fn(),
}));
const mockTabContext: { parentTab: Record<string, unknown> | null; parentRecord: Record<string, unknown> | null } = {
  parentTab: null,
  parentRecord: null,
};
jest.mock("../../../contexts/tab", () => ({
  useTabContext: () => ({ tab: mockTab, parentRecords: [], ...mockTabContext }),
}));
jest.mock("../../../contexts/CurrentWindowContext", () => ({ useCurrentWindowIdentifier: () => "143_1" }));
jest.mock("../../../contexts/ToolbarContext", () => ({
  useToolbarCommands: () => mockToolbar,
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
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { get: (...args: unknown[]) => mockDatasourceGet(...args) },
}));
const mockRecordContext = jest.fn((): Record<string, unknown> => ({}));
/** Context of the record selected in the tab, as the requests that do not go through the datasource send it. */
const OWN_RECORD_CONTEXT = { "@Order.id@": "own-1" };
afterEach(() => mockRecordContext.mockImplementation(() => ({})));
jest.mock("@/utils/contextUtils", () => ({
  buildAncestorContext: () => ({}),
  buildParentSessionContext: () => ({}),
  buildRecordContext: () => mockRecordContext(),
}));

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

  it("sorts by every sorted column, in order", () => {
    mockTableState.sorting = [
      { id: SORT_COLUMN, desc: true },
      { id: GROUP_COLUMN, desc: false },
    ];

    expect(renderQuery().sortBy).toBe(`-${SORT_FIELD},${GROUP_FIELD}`);
  });

  it("sorts inside the groups by every other sorted column", () => {
    mockTableState.grouping = [GROUP_COLUMN];
    mockTableState.sorting = [
      { id: SORT_COLUMN, desc: true },
      { id: GROUP_COLUMN, desc: true },
    ];

    expect(renderQuery().sortBy).toBe(`-${GROUP_FIELD},-${SORT_FIELD}`);
  });

  it("requests the property fields and sorts by their related-record path, as Classic", () => {
    const fields = mockTab.fields as Record<string, unknown>;
    fields[PROPERTY_FIELD] = {
      name: PROPERTY_COLUMN,
      hqlName: PROPERTY_FIELD,
      column: { propertyPath: PROPERTY_PATH },
    };
    mockTableState.sorting = [{ id: PROPERTY_COLUMN, desc: false }];

    try {
      const query = renderQuery() as DatasourceOptions & { _extraProperties?: string };

      expect(query._extraProperties).toBe(PROPERTY_PATH);
      expect(query.sortBy).toBe(PROPERTY_FIELD);
    } finally {
      delete fields[PROPERTY_FIELD];
    }
  });

  it("exposes the params of the grid's current query", () => {
    const { result } = renderHook(() => useTableData({ isTreeMode: false }));

    expect(result.current.getRequestParams).toBe(mockGetRequestParams);
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
    // A tree asks for TreeDatasourceFetchLimit nodes, as classic, never the size of a grouped page
    expect(renderQuery(true).pageSize).toBe(DEFAULT_TREE_FETCH_LIMIT);
  });
});

describe("useTableData default order-by clause", () => {
  beforeEach(() => {
    mockUseDatasource.mockClear();
    mockPersistenceSetters.setTableColumnSorting.mockClear();
    mockTableState.grouping = [];
    mockTableState.sorting = [];
    mockSupportsTree = false;
  });

  afterEach(() => {
    mockTab.hqlorderbyclause = undefined;
    mockTab.defaultSortField = undefined;
    mockColumns.length = 0;
  });

  it("sends no _orderBy when the tab has no order-by clause", () => {
    const query = renderQuery();

    expect(query[ORDER_BY_PARAM]).toBeUndefined();
    expect(mockPersistenceSetters.setTableColumnSorting).not.toHaveBeenCalled();
  });

  it("sends the whole clause as _orderBy and no sortBy while the default sort is active", () => {
    mockTab.hqlorderbyclause = ORDER_BY_CLAUSE;

    const query = renderQuery();

    expect(query[ORDER_BY_PARAM]).toBe(ORDER_BY_CLAUSE);
    expect(query.sortBy).toBeUndefined();
    expect(query.isSorting).toBeUndefined();
  });

  it("shows the sort indicator on every column of the clause that maps to a field", () => {
    mockTab.hqlorderbyclause = ORDER_BY_CLAUSE;

    renderQuery();

    expect(mockPersistenceSetters.setTableColumnSorting).toHaveBeenCalledWith([
      { id: SORT_COLUMN, desc: true },
      { id: GROUP_COLUMN, desc: false },
    ]);
  });

  it("keeps relying on _orderBy once the indicator holds the default sorts", () => {
    mockTab.hqlorderbyclause = ORDER_BY_CLAUSE;
    mockTableState.sorting = [
      { id: SORT_COLUMN, desc: true },
      { id: GROUP_COLUMN, desc: false },
    ];

    expect(renderQuery().sortBy).toBeUndefined();
  });

  it("lets a manual sort override the default order", () => {
    mockTab.hqlorderbyclause = ORDER_BY_CLAUSE;
    mockTableState.sorting = [{ id: GROUP_COLUMN, desc: true }];

    const query = renderQuery();

    expect(query.sortBy).toBe(`-${GROUP_FIELD}`);
    expect(query.isSorting).toBe(true);
    expect(query[ORDER_BY_PARAM]).toBe(ORDER_BY_CLAUSE);
  });

  it("loads a query-based tab whose clause maps to no field with the clause alone", () => {
    mockTab.hqlorderbyclause = QUERY_TAB_CLAUSE;

    const query = renderQuery();

    expect(query[ORDER_BY_PARAM]).toBe(QUERY_TAB_CLAUSE);
    expect(query.sortBy).toBeUndefined();
    expect(mockPersistenceSetters.setTableColumnSorting).not.toHaveBeenCalled();
  });

  it("sorts by the classic default sort field and shows its indicator", () => {
    mockTab.defaultSortField = SORT_FIELD;

    const query = renderQuery();

    expect(query.sortBy).toBe(SORT_FIELD);
    expect(query[ORDER_BY_PARAM]).toBeUndefined();
    expect(mockPersistenceSetters.setTableColumnSorting).toHaveBeenCalledWith([{ id: SORT_COLUMN, desc: false }]);
  });

  it("sorts by a default sort property without a grid field, without an indicator", () => {
    mockTab.defaultSortField = "sequenceNumber";

    expect(renderQuery().sortBy).toBe("sequenceNumber");
    expect(mockPersistenceSetters.setTableColumnSorting).not.toHaveBeenCalled();
  });

  it("does not send the order-by clause with the summary request", async () => {
    mockTab.hqlorderbyclause = ORDER_BY_CLAUSE;
    mockColumns.push({ id: SORT_COLUMN, columnName: SORT_FIELD });
    mockDatasourceGet.mockResolvedValue({ ok: true, data: { response: { data: [{ [SORT_FIELD]: 2 }] } } });
    mockRecordContext.mockReturnValue(OWN_RECORD_CONTEXT);
    const { result } = renderHook(() => useTableData({ isTreeMode: false }));

    await act(async () => {
      await result.current.fetchSummary({ [SORT_COLUMN]: "count" });
    });

    const summaryQuery = mockDatasourceGet.mock.calls.at(-1)?.[1] as DatasourceOptions;
    expect(summaryQuery._summary).toBeDefined();
    expect(summaryQuery[ORDER_BY_PARAM]).toBeUndefined();
    expect(summaryQuery.sortBy).toBeUndefined();
    expect(summaryQuery).toMatchObject(OWN_RECORD_CONTEXT);
  });
});

describe("useTableData tree fetch limit", () => {
  const TOO_MANY_NODES = { ok: true, data: { response: { status: -1, error: { type: "tooManyNodes" }, data: [] } } };
  const NODE_ID = "node-1";

  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    mockSupportsTree = true;
    mockDatasourceResult.records = [];
    mockDatasourceResult.isTreeLimitExceeded = false;
  });

  afterAll(() => {
    mockSupportsTree = false;
    mockDatasourceResult.isTreeLimitExceeded = false;
    mockDatasourceResult.records = [];
  });

  it("shows OBUIAPP_TooManyNodes when the tree answer is over the limit", () => {
    mockDatasourceResult.isTreeLimitExceeded = true;

    renderHook(() => useTableData({ isTreeMode: true }));

    expect(toast.error).toHaveBeenCalledWith(TOO_MANY_NODES_MESSAGE);
  });

  it("asks for the children up to the limit and shows the message when they are over it", async () => {
    mockDatasourceResult.records = [{ id: NODE_ID, __isParent: true }];
    mockDatasourceGet.mockResolvedValue(TOO_MANY_NODES);
    mockRecordContext.mockReturnValue(OWN_RECORD_CONTEXT);
    const { result } = renderHook(() => useTableData({ isTreeMode: true }));

    await waitFor(() => expect(result.current.displayRecords).toHaveLength(1));
    act(() => result.current.handleMRTExpandChange({ newExpanded: { [NODE_ID]: true } }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(TOO_MANY_NODES_MESSAGE));
    expect(mockDatasourceGet).toHaveBeenCalledWith(
      mockTab.entityName,
      expect.objectContaining({ startRow: 0, endRow: DEFAULT_TREE_FETCH_LIMIT, ...OWN_RECORD_CONTEXT })
    );
  });
});

describe("useTableData first load", () => {
  const lastDatasourceSkip = () => (mockUseDatasource.mock.calls.at(-1)?.[0] as { skip: boolean }).skip;

  beforeEach(() => {
    mockUseDatasource.mockClear();
    useInitialViewStore.setState({ resolved: {} });
    // The settings of the window have not answered yet
    (getSettledTabDefaultView as jest.Mock).mockReturnValue(undefined);
    (getSettledTabColumnConfiguration as jest.Mock).mockReturnValue(undefined);
  });

  it("waits for the initial view of the tab before loading, showing the grid as loading", () => {
    const { result } = renderHook(() => useTableData({ isTreeMode: false }));

    expect(lastDatasourceSkip()).toBe(true);
    expect(result.current.loading).toBe(true);
  });

  it("loads once the initial view of the tab is resolved", () => {
    const { result } = renderHook(() => useTableData({ isTreeMode: false }));

    act(() => markInitialViewResolved("143_1", mockTab.id));

    expect(lastDatasourceSkip()).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("loads on the first render when the window settings answered nothing for the tab", () => {
    (getSettledTabDefaultView as jest.Mock).mockReturnValue(null);
    (getSettledTabColumnConfiguration as jest.Mock).mockReturnValue(null);

    renderHook(() => useTableData({ isTreeMode: false }));

    expect((mockUseDatasource.mock.calls[0]?.[0] as { skip: boolean }).skip).toBe(false);
  });
});

describe("useTableData request context", () => {
  const WINDOW = "143_1";
  const PARENT_TAB = { id: "parent-tab", entityName: "Order", fields: {} };
  const PARENT_ID = "parent-1";
  const OWN_ID_KEY = "@Order.id@";

  type DatasourceArgs = {
    params: DatasourceOptions;
    skip: boolean;
    withRequestContext: (params: DatasourceOptions) => DatasourceOptions;
  };
  const lastDatasourceArgs = () => mockUseDatasource.mock.calls.at(-1)?.[0] as DatasourceArgs;

  /** The parent tab as a recovered window leaves it: only the id of its record is known. */
  const givenRecoveredParent = (tabState: Record<string, unknown>) => {
    mockTabContext.parentTab = PARENT_TAB;
    useWindowStore.setState({
      windows: {
        [WINDOW]: { tabs: { [PARENT_TAB.id]: { selectedRecord: PARENT_ID, ...tabState } } },
      },
    } as never);
  };

  beforeEach(() => {
    mockUseDatasource.mockClear();
    mockRecordContext.mockReturnValue(OWN_RECORD_CONTEXT);
    useInitialViewStore.setState({ resolved: { [`${WINDOW}_${mockTab.id}`]: true } });
  });

  afterEach(() => {
    mockTabContext.parentTab = null;
    mockTabContext.parentRecord = null;
    useWindowStore.setState({ windows: {} } as never);
  });

  it("sends the record selected in the tab with every request without reloading for it", () => {
    renderHook(() => useTableData({ isTreeMode: false }));
    const { params, withRequestContext } = lastDatasourceArgs();

    expect(params[OWN_ID_KEY]).toBeUndefined();
    expect(withRequestContext(params)[OWN_ID_KEY]).toBe("own-1");
  });

  it("keeps the parent context over the record of the tab when both name the same key", () => {
    // A tab whose parent has the same entity: the parent id wins, as when the context was part of the query
    givenRecoveredParent({});
    mockTabContext.parentRecord = { id: PARENT_ID };

    renderHook(() => useTableData({ isTreeMode: false }));
    const { params, withRequestContext } = lastDatasourceArgs();

    expect(withRequestContext(params)[OWN_ID_KEY]).toBe(PARENT_ID);
  });

  it("waits for the parent record of a recovered window, showing the grid as loading", () => {
    givenRecoveredParent({ initializedWithDirectLink: true });

    const { result, rerender } = renderHook(() => useTableData({ isTreeMode: false }));

    expect(lastDatasourceArgs().skip).toBe(true);
    expect(result.current.loading).toBe(true);

    mockTabContext.parentRecord = { id: PARENT_ID };
    rerender();
    expect(lastDatasourceArgs().skip).toBe(false);
  });

  it("loads with the parent id when its record is not on its way, as before", () => {
    givenRecoveredParent({});

    renderHook(() => useTableData({ isTreeMode: false }));

    expect(lastDatasourceArgs().skip).toBe(false);
  });
});
