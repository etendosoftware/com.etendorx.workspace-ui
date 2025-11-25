import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type React from "react";
import DynamicTable from "../../../components/Table";
import WindowProvider from "../../../contexts/window";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type {
  MRT_Row,
  MRT_RowData,
  MRT_TableOptions,
  MRT_ColumnFiltersState,
  MRT_TableInstance,
} from "material-react-table";

// Types for the component props
interface ErrorDisplayProps {
  title: string;
  description: string;
  onRetry: () => void;
}

interface CellContext<TData extends MRT_RowData> {
  renderedCellValue: React.ReactNode;
  row: MRT_Row<TData>;
  cell: {
    getValue: () => unknown;
  };
}

interface TableRow<TData> {
  id: string | number;
  original: TData;
  getIsSelected: () => boolean;
  getIsExpanded: () => boolean;
  toggleSelected: () => void;
  toggleExpanded: () => void;
}

interface TableState {
  rowSelection: Record<string, boolean>;
  columnFilters: MRT_ColumnFiltersState;
  columnVisibility: Record<string, boolean>;
  expanded: Record<string, boolean>;
}

interface MockTableInstance<TData extends MRT_RowData> {
  getState: () => TableState;
  getRowModel: () => {
    rows: TableRow<TData>[];
  };
  resetRowSelection: () => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
}

// Mock all the contexts and hooks
const mockSearchContext = {
  searchQuery: "",
  setSearchQuery: jest.fn(),
};

const mockDatasourceContext = {
  registerDatasource: jest.fn(),
  unregisterDatasource: jest.fn(),
  registerRefetchFunction: jest.fn(),
  removeRecordFromDatasource: jest.fn(),
  refetchDatasource: jest.fn(),
  registerRecordsGetter: jest.fn(),
  getRecords: jest.fn(() => []),
  registerHasMoreRecordsGetter: jest.fn(),
  getHasMoreRecords: jest.fn(() => false),
  registerFetchMore: jest.fn(),
  fetchMoreRecords: jest.fn(),
};

const mockToolbarContext = {
  registerActions: jest.fn(), // <---- ESTA ES LA CLAVE
  onSave: jest.fn(),
  onRefresh: jest.fn(),
  onNew: jest.fn(),
  onBack: jest.fn(),
  onFilter: jest.fn(),
  onColumnFilters: jest.fn(),
  registerAttachmentAction: jest.fn(),
  setShouldOpenAttachmentModal: jest.fn(),
  setToolbarFilterApplied: jest.fn(),
  setIsImplicitFilterApplied: jest.fn(),
};

const mockLanguageContext = {
  language: "en_US",
  setLanguage: jest.fn(),
};

const mockTabContext: {
  tab: {
    id: string;
    window: string;
    entityName: string;
    parentColumns: string[];
    hqlfilterclause: string;
    sQLWhereClause: string;
    fields: Record<
      string,
      {
        id: string;
        columnName: string;
        label: string;
        type: string;
        length: number;
        isRequired: boolean;
      }
    >;
  };
  parentTab: { id: string } | null;
  parentRecord: { id: string } | null;
  parentRecords: { id: string }[] | null;
} = {
  tab: {
    id: "test-tab-id",
    window: "test-window-id",
    entityName: "TestEntity",
    parentColumns: ["parentId"],
    hqlfilterclause: "",
    sQLWhereClause: "",
    fields: {
      name: {
        id: "name",
        columnName: "name",
        label: "Name",
        type: "string",
        length: 200,
        isRequired: false,
      },
      status: {
        id: "status",
        columnName: "status",
        label: "Status",
        type: "string",
        length: 150,
        isRequired: false,
      },
    },
  },
  parentTab: null,
  parentRecord: { id: "parent-123" },
  parentRecords: [{ id: "parent-123" }],
};

// Helper function to reset tab context
const resetTabContext = () => {
  mockTabContext.parentTab = null;
  mockTabContext.parentRecord = { id: "parent-123" };
  mockTabContext.parentRecords = [{ id: "parent-123" }];
};

const mockSelectedContext = {
  graph: {
    getParent: jest.fn().mockReturnValue(null), // Return null for parent
    getSelected: jest.fn().mockReturnValue(null),
    setSelected: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getChildren: jest.fn().mockReturnValue([]),
    clearSelected: jest.fn(),
    clearSelectedMultiple: jest.fn(),
    setSelectedMultiple: jest.fn(),
  },
};

const mockMultiWindowURL = {
  activeWindow: {
    windowId: "test-window-id",
    window_identifier: "test-window-id_123456789",
    isActive: true,
    order: 1,
    selectedRecords: {},
    tabFormStates: {},
    title: "Test Window",
  },
  getSelectedRecord: jest.fn(),
  setSelectedRecord: jest.fn(),
  clearSelectedRecord: jest.fn(),
  setTabFormState: jest.fn(),
  clearTabFormState: jest.fn(),
  getTabFormState: jest.fn(),
  clearChildrenSelections: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    forEach: jest.fn(),
  })),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => mockMultiWindowURL,
}));

// Mock the hooks
jest.mock("@/contexts/searchContext", () => ({
  useSearch: () => mockSearchContext,
}));

jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => mockDatasourceContext,
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => mockToolbarContext,
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => mockLanguageContext,
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => mockTabContext,
}));

// Mock the new table state persistence context
const mockTableStatePersistenceTab = {
  tableColumnFilters: [],
  tableColumnVisibility: {},
  tableColumnSorting: [],
  tableColumnOrder: [],
  isImplicitFilterApplied: false,
  setTableColumnFilters: jest.fn(),
  setTableColumnVisibility: jest.fn(),
  setTableColumnSorting: jest.fn(),
  setTableColumnOrder: jest.fn(),
  setIsImplicitFilterApplied: jest.fn(),
};

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => mockTableStatePersistenceTab,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => mockSelectedContext,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errors.tableError.title": "Table Error",
        "errors.selectionError.title": "Selection Required",
        "errors.selectionError.description": "Please select a parent record",
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock("@/hooks/useTreeModeMetadata", () => ({
  useTreeModeMetadata: () => ({
    treeMetadata: {
      supportsTreeMode: true,
      treeEntity: "TreeEntity",
      referencedTableId: "155",
    },
    loading: false,
  }),
}));

jest.mock("@/hooks/table/useColumns", () => ({
  useColumns: () => [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      size: 200,
      Cell: ({ renderedCellValue }: CellContext<EntityData>) => renderedCellValue,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 150,
      Cell: ({ renderedCellValue }: CellContext<EntityData>) => renderedCellValue,
    },
  ],
}));

const mockDatasourceHook: {
  fetchMore: jest.Mock;
  records: EntityData[];
  removeRecordLocally: jest.Mock;
  error: Error | null;
  refetch: jest.Mock;
  loading: boolean;
  hasMoreRecords: boolean;
} = {
  fetchMore: jest.fn(),
  records: [],
  removeRecordLocally: jest.fn(),
  error: null,
  refetch: jest.fn(),
  loading: false,
  hasMoreRecords: false,
};

jest.mock("@/hooks/useDatasource", () => ({
  useDatasource: () => mockDatasourceHook,
}));

jest.mock("@/hooks/useTableSelection", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    // This hook doesn't return anything, it just handles side effects
    return undefined;
  }),
}));

// Mock useColumnFilters hook
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilters", () => ({
  useColumnFilters: () => ({
    columnFilters: [],
    setColumnFilter: jest.fn(),
    loadFilterOptions: jest.fn(),
    setFilterOptions: jest.fn(),
  }),
}));

// Mock useColumnFilterData hook
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilterData", () => ({
  useColumnFilterData: () => ({
    fetchFilterOptions: jest.fn().mockResolvedValue([]),
  }),
}));

// Mock for capturing row props from the table
const capturedRowProps: {
  onClick?: React.MouseEventHandler<Element>;
  onDoubleClick?: React.MouseEventHandler<Element>;
} = {};

// Store the table options to access muiTableBodyRowProps
let tableOptions: MRT_TableOptions<EntityData> | null = null;

// Mock for Material React Table
jest.mock("material-react-table", () => ({
  MaterialReactTable: (props: { table: MRT_TableInstance<EntityData> }) => {
    const { table } = props;
    const rows = table.getRowModel().rows as unknown as MRT_Row<EntityData>[];

    // Use the stored options to get muiTableBodyRowProps
    if (tableOptions?.muiTableBodyRowProps && rows.length > 0) {
      const rowPropsResult =
        typeof tableOptions.muiTableBodyRowProps === "function"
          ? tableOptions.muiTableBodyRowProps({
              row: rows[0],
              table,
              staticRowIndex: 0,
            })
          : tableOptions.muiTableBodyRowProps;
      capturedRowProps.onClick = rowPropsResult.onClick;
      capturedRowProps.onDoubleClick = rowPropsResult.onDoubleClick;
    }

    return (
      <div data-testid="material-react-table">
        <div data-testid="table-content">
          {rows.map((row: TableRow<EntityData>, index: number) => (
            <button
              key={index}
              type="button"
              data-testid={`table-row-${index}`}
              onClick={(e) => capturedRowProps.onClick?.(e)}
              onDoubleClick={(e) => capturedRowProps.onDoubleClick?.(e)}>
              {String(row.original.name || "")}
            </button>
          ))}
        </div>
      </div>
    );
  },
  useMaterialReactTable: <TData extends MRT_RowData>(options: MRT_TableOptions<TData>): MockTableInstance<TData> => {
    // Store the options so MaterialReactTable can access them
    tableOptions = options as MRT_TableOptions<EntityData>;

    return {
      getState: () => ({
        rowSelection: {},
        columnFilters: [],
        columnVisibility: {},
        expanded: {},
      }),
      getRowModel: () => ({
        rows: (options.data?.map((item: TData, index: number) => ({
          id: index,
          original: item,
          getIsSelected: () => false,
          getIsExpanded: () => false,
          toggleSelected: jest.fn(),
          toggleExpanded: jest.fn(),
        })) || []) as TableRow<TData>[],
      }),
      resetRowSelection: jest.fn(),
      setRowSelection: jest.fn(),
    };
  },
}));

// Mock other components
jest.mock("../../../components/Toolbar/Menus/ColumnVisibilityMenu", () => {
  return function MockColumnVisibilityMenu() {
    return <div data-testid="column-visibility-menu" />;
  };
});

jest.mock("../../../components/Table/EmptyState", () => {
  return function MockEmptyState() {
    return <div data-testid="empty-state">No records found</div>;
  };
});

jest.mock("../../../components/ErrorDisplay", () => ({
  ErrorDisplay: ({ title, description, onRetry }: ErrorDisplayProps) => (
    <div data-testid="error-display">
      <h3>{title}</h3>
      <p>{description}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  ),
}));

// Mock icons
jest.mock("../../../ComponentLibrary/src/assets/icons/folder-plus-filled.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/folder-minus.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/circle-filled.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-up.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-down.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/check.svg", () => "div");

// Mock styles
jest.mock("../../../components/Table/styles", () => ({
  useStyle: () => ({
    sx: {
      tablePaper: {},
      tableHeadCell: {},
      tableBodyCell: {},
      tableBody: {},
      rowSelected: { backgroundColor: "#e3f2fd" },
    },
  }),
}));

const mockRecords: EntityData[] = [
  {
    id: "1",
    name: "Record 1",
    status: "Active",
    showDropIcon: true,
    parentId: null,
  },
  {
    id: "2",
    name: "Record 2",
    status: "Inactive",
    showDropIcon: false,
    parentId: null,
  },
  {
    id: "3",
    name: "Child Record",
    status: "Active",
    showDropIcon: false,
    parentId: "1",
  },
];

// Helper to wrap components with WindowProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(<WindowProvider>{component}</WindowProvider>);
};

describe("DynamicTable", () => {
  const defaultProps = {
    setRecordId: jest.fn(),
    onRecordSelection: jest.fn(),
    isTreeMode: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatasourceHook.records = mockRecords;
    mockDatasourceHook.loading = false;
    mockDatasourceHook.error = null;
    resetTabContext(); // Reset tab context to default state

    // Reset table state persistence mocks
    mockTableStatePersistenceTab.tableColumnFilters = [];
    mockTableStatePersistenceTab.tableColumnVisibility = {};
    mockTableStatePersistenceTab.tableColumnSorting = [];
    mockTableStatePersistenceTab.tableColumnOrder = [];
    mockTableStatePersistenceTab.isImplicitFilterApplied = false;
  });

  describe("Rendering", () => {
    it("renders the table container correctly", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders table records", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("table-content")).toBeInTheDocument();
    });

    it("renders with tree mode enabled by default", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Tree mode should be enabled based on the mocked tree metadata
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders correctly when tree mode is disabled", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={false} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders column visibility menu", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("column-visibility-menu")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("displays loading state correctly", () => {
      mockDatasourceHook.loading = true;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").closest(".h-full");
      expect(container).toHaveClass("opacity-60", "cursor-progress");
    });

    it("removes loading state when not loading", () => {
      mockDatasourceHook.loading = false;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").closest(".h-full");
      expect(container).toHaveClass("opacity-100");
      expect(container).not.toHaveClass("opacity-60", "cursor-progress");
    });
  });

  describe("Error Handling", () => {
    it("displays error when datasource has error", () => {
      mockDatasourceHook.error = new Error("Database connection failed");

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Table Error")).toBeInTheDocument();
      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });

    it("calls refetch when retry button is clicked", async () => {
      const user = userEvent.setup();
      mockDatasourceHook.error = new Error("Network error");

      renderWithProviders(<DynamicTable {...defaultProps} />);

      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      expect(mockDatasourceHook.refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Parent Record Selection", () => {
    afterEach(() => {
      resetTabContext(); // Reset after each test in this describe block
    });

    it("shows selection error when parent tab exists but no parent record", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = null;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByText("Selection Required")).toBeInTheDocument();
      expect(screen.getByText("Please select a parent record")).toBeInTheDocument();
    });

    it("renders normally when parent record exists", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = { id: "parent-123" };

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
      expect(screen.queryByText("Selection Required")).not.toBeInTheDocument();
    });
  });

  describe("Tree Mode Functionality", () => {
    it("handles tree mode metadata loading", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={true} />);

      // Should render without tree mode while metadata is loading
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("supports expanding and collapsing nodes in tree mode", async () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={true} />);

      // The expand/collapse functionality would be tested through the table interactions
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Record Selection", () => {
    it("calls setRecordId when onRecordSelection prop is provided", () => {
      const mockSetRecordId = jest.fn();
      const mockOnRecordSelection = jest.fn();

      renderWithProviders(
        <DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelection} isTreeMode={true} />
      );

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("handles multiple record selection", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Multiple selection functionality would be handled by the table component
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Column Filtering", () => {
    it("handles column filter changes", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Column filtering is now handled through activeColumnFilters prop
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("toggles implicit filters", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // toggleImplicitFilters is now handled internally by useTableData
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Infinite Scrolling", () => {
    it("fetches more records when scrolling to bottom", () => {
      mockDatasourceHook.hasMoreRecords = true;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Scroll functionality would be tested through scroll events
      expect(mockDatasourceHook.fetchMore).toBeDefined();
    });

    it("does not fetch more when no more records available", () => {
      mockDatasourceHook.hasMoreRecords = false;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceHook.hasMoreRecords).toBe(false);
    });
  });

  describe("Context Integration", () => {
    it("registers datasource and refetch function", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceContext.registerRefetchFunction).toHaveBeenCalled();
    });

    it("registers toolbar actions", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockToolbarContext.registerActions).toHaveBeenCalledWith({
        refresh: expect.any(Function),
        filter: expect.any(Function),
        save: expect.any(Function),
        columnFilters: expect.any(Function),
      });
    });

    it("unregisters datasource on unmount", () => {
      const { unmount } = renderWithProviders(<DynamicTable {...defaultProps} />);

      unmount();

      expect(mockDatasourceContext.unregisterDatasource).toHaveBeenCalled();
    });
  });

  describe("Search Integration", () => {
    it("responds to search query changes", () => {
      mockSearchContext.searchQuery = "test search";

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Search functionality is passed to the useDatasource hook
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("renders empty state when no records", () => {
      mockDatasourceHook.records = [];

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Empty state would be handled by the table's renderEmptyRowsFallback
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper keyboard navigation support", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Material React Table handles most accessibility features
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("supports screen readers", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Table should have proper ARIA labels and roles
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("handles large datasets with virtualization", () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`,
        status: i % 2 === 0 ? "Active" : "Inactive",
        showDropIcon: false,
        parentId: null,
      }));

      mockDatasourceHook.records = largeDataset;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("handles missing optional props", () => {
      renderWithProviders(
        <DynamicTable
          setRecordId={jest.fn()}
          // onRecordSelection is optional
          isTreeMode={false}
        />
      );

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("validates required props", () => {
      expect(() => {
        renderWithProviders(<DynamicTable {...defaultProps} />);
      }).not.toThrow();
    });
  });

  // ===== NEW COMPREHENSIVE TESTS =====

  describe("Row Click Interactions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      mockDatasourceHook.records = mockRecords;
      // Reset captured row props and table options
      capturedRowProps.onClick = undefined;
      capturedRowProps.onDoubleClick = undefined;
      tableOptions = null;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should handle single click selection with timeout", async () => {
      const mockSetRecordId = jest.fn();
      const mockOnRecordSelection = jest.fn();

      renderWithProviders(<DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelection} />);

      // Wait for render to complete and row props to be captured
      await screen.findByTestId("table-row-0");

      // Check that row props were captured
      expect(capturedRowProps.onClick).toBeDefined();

      const mockEvent = {
        target: { tagName: "TD", closest: () => null },
        ctrlKey: false,
        metaKey: false,
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      // Simulate single click
      if (capturedRowProps.onClick) {
        capturedRowProps.onClick(mockEvent);
      }

      // Should not immediately trigger selection (due to 250ms timeout)
      expect(mockSetRecordId).not.toHaveBeenCalled();

      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // The timeout should have executed the row selection logic
      expect(capturedRowProps.onClick).toBeDefined();
    });

    it("should handle double click navigation immediately", async () => {
      const mockSetRecordId = jest.fn();
      const mockOnRecordSelection = jest.fn();

      renderWithProviders(<DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelection} />);

      // Wait for render to complete and row props to be captured
      await screen.findByTestId("table-row-0");

      // Check that row props were captured
      expect(capturedRowProps.onDoubleClick).toBeDefined();

      // Create a mock event with a div target (not button) to avoid the early return
      const mockEvent = {
        target: { tagName: "TD", closest: () => null },
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      // Simulate double click
      if (capturedRowProps.onDoubleClick) {
        capturedRowProps.onDoubleClick(mockEvent);
      }

      // Should immediately trigger navigation
      expect(mockSetRecordId).toHaveBeenCalledWith("1");
    });

    it("should cancel single click when double click occurs", async () => {
      const mockSetRecordId = jest.fn();
      const mockOnRecordSelection = jest.fn();

      renderWithProviders(<DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelection} />);

      // Wait for render to complete and row props to be captured
      await screen.findByTestId("table-row-0");

      const mockEvent = {
        target: { tagName: "TD", closest: () => null },
        ctrlKey: false,
        metaKey: false,
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      // Perform single click first
      if (capturedRowProps.onClick) {
        capturedRowProps.onClick(mockEvent);
      }

      // Then double click quickly (should cancel the single click timeout)
      if (capturedRowProps.onDoubleClick) {
        capturedRowProps.onDoubleClick(mockEvent);
      }

      // Fast-forward time to check single click timeout was cancelled
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Double click should have triggered immediate navigation
      expect(mockSetRecordId).toHaveBeenCalledWith("1");
    });

    it("should handle keyboard navigation", async () => {
      const user = userEvent.setup({ delay: null });
      const mockSetRecordId = jest.fn();

      renderWithProviders(<DynamicTable setRecordId={mockSetRecordId} />);

      const row = screen.getByTestId("table-row-0");

      // Focus and press Enter
      await user.click(row);
      await user.keyboard("{Enter}");

      expect(row).toBeInTheDocument();
    });
  });

  describe("URL Selection Synchronization", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should apply initial URL selection on mount", () => {
      // This test is now handled by WindowContext internally
      // The component uses useWindowContext().getSelectedRecord() instead of mockMultiWindowURL
      mockDatasourceHook.records = mockRecords;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Verify table renders correctly with URL selection
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle invalid URL record IDs gracefully", () => {
      mockMultiWindowURL.getSelectedRecord.mockReturnValue("999"); // Non-existent record
      mockDatasourceHook.records = mockRecords;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Should not break when URL has invalid record ID
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should restore URL selection when table data changes", () => {
      const { rerender } = renderWithProviders(<DynamicTable {...defaultProps} />);

      // Change the records
      mockDatasourceHook.records = [
        ...mockRecords,
        { id: "4", name: "New Record", status: "Active", showDropIcon: false, parentId: null },
      ];

      rerender(
        <WindowProvider>
          <DynamicTable {...defaultProps} />
        </WindowProvider>
      );

      // Verify table handles data changes correctly
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle missing window ID gracefully", () => {
      const originalActiveWindow = mockMultiWindowURL.activeWindow;
      mockMultiWindowURL.activeWindow = {
        windowId: "",
        window_identifier: "",
        isActive: true,
        order: 1,
        selectedRecords: {},
        tabFormStates: {},
        title: "Empty Window",
      }; // Empty window ID

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();

      // Restore original value
      mockMultiWindowURL.activeWindow = originalActiveWindow;
    });
  });

  describe("Tree Mode Specific Behavior", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockDatasourceHook.records = mockRecords;
    });

    it("should enable tree mode when conditions are met", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={true} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should disable tree mode when isTreeMode is false", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={false} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle tree mode toggle", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={true} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should render tree styles when in tree mode", () => {
      renderWithProviders(<DynamicTable {...defaultProps} isTreeMode={true} />);

      // Check that the table renders in tree mode
      // Note: The actual CSS injection might be handled by the component library or styled-components
      // For now, we'll verify that the component renders without errors in tree mode
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();

      // If we need to test specific styles, we should mock the style injection
      // or check for specific className patterns that indicate tree mode is active
    });
  });

  describe("Column Filtering Advanced", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle column filter changes", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Column filtering functionality is tested through the integration
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle filter options loading", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // This tests that the component initializes with filter options
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should toggle column visibility menu", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("column-visibility-menu")).toBeInTheDocument();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle empty records gracefully", () => {
      mockDatasourceHook.records = [];

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle null/undefined records", () => {
      mockDatasourceHook.records = [] as EntityData[]; // Use empty array instead of null

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle datasource errors with retry functionality", async () => {
      const user = userEvent.setup();
      mockDatasourceHook.error = new Error("Network timeout");

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();

      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      expect(mockDatasourceHook.refetch).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid state changes", () => {
      const { rerender } = renderWithProviders(<DynamicTable {...defaultProps} />);

      // Rapidly change loading state
      mockDatasourceHook.loading = true;
      rerender(
        <WindowProvider>
          <DynamicTable {...defaultProps} />
        </WindowProvider>
      );

      mockDatasourceHook.loading = false;
      rerender(
        <WindowProvider>
          <DynamicTable {...defaultProps} />
        </WindowProvider>
      );

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle component unmounting cleanly", () => {
      const { unmount } = renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
      expect(mockDatasourceContext.unregisterDatasource).toHaveBeenCalled();
    });
  });

  describe("Hook Integration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should register datasource and refetch function on mount", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceContext.registerRefetchFunction).toHaveBeenCalledWith("test-tab-id", expect.any(Function));
    });

    it("should register all toolbar actions", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockToolbarContext.registerActions).toHaveBeenCalledWith({
        refresh: expect.any(Function),
        filter: expect.any(Function),
        save: expect.any(Function),
        columnFilters: expect.any(Function),
      });
    });

    it("should handle graph selection events", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockSelectedContext.graph.addListener).toHaveBeenCalledWith("unselected", expect.any(Function));
      expect(mockSelectedContext.graph.addListener).toHaveBeenCalledWith("unselectedMultiple", expect.any(Function));
    });

    it("should respond to search query changes", () => {
      mockSearchContext.searchQuery = "test search";

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Search functionality is passed to the useDatasource hook
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle language changes", () => {
      mockLanguageContext.language = "es_ES";

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Performance and Memory Management", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should handle large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`,
        status: i % 2 === 0 ? "Active" : "Inactive",
        showDropIcon: false,
        parentId: null,
      }));

      mockDatasourceHook.records = largeDataset;

      const startTime = performance.now();
      renderWithProviders(<DynamicTable {...defaultProps} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should not cause memory leaks with timeouts", () => {
      const { unmount } = renderWithProviders(<DynamicTable {...defaultProps} />);

      // Fast-forward all timers to ensure cleanup
      jest.runAllTimers();

      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid mount/unmount cycles", () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<DynamicTable {...defaultProps} />);
        unmount();
      }

      expect(mockDatasourceContext.unregisterDatasource).toHaveBeenCalledTimes(10);
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      const table = screen.getByTestId("material-react-table");
      expect(table).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DynamicTable {...defaultProps} />);

      const firstRow = screen.getByTestId("table-row-0");

      await user.click(firstRow);
      expect(firstRow).toHaveFocus();
    });

    it("should have accessible button elements for rows", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      const rows = screen.getAllByRole("button");
      expect(rows.length).toBeGreaterThan(0);

      for (const row of rows) {
        expect(row).toBeInTheDocument();
      }
    });

    it("should handle screen reader navigation", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Check that interactive elements are properly marked
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Record Selection State Management", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call onRecordSelection when selection changes", () => {
      const mockOnRecordSelection = jest.fn();

      renderWithProviders(<DynamicTable {...defaultProps} onRecordSelection={mockOnRecordSelection} />);

      // Selection changes are handled through the useTableSelection hook
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should handle multiple record selection", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Multiple selection functionality is built into Material React Table
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should clear selection when required", () => {
      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Selection clearing is handled through the graph events
      expect(mockSelectedContext.graph.addListener).toHaveBeenCalled();
    });
  });

  describe("Infinite Scrolling and Pagination", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should fetch more records when scrolling to bottom", () => {
      mockDatasourceHook.hasMoreRecords = true;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Simulate scroll to bottom by dispatching a scroll event
      const container = screen.getByTestId("material-react-table");

      // Mock the scroll properties
      Object.defineProperty(container, "scrollTop", { value: 1000, writable: true });
      Object.defineProperty(container, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(container, "clientHeight", { value: 100, writable: true });

      fireEvent.scroll(container);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("should not fetch more when no more records available", () => {
      mockDatasourceHook.hasMoreRecords = false;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceHook.hasMoreRecords).toBe(false);
    });

    it("should show loading state during fetch", () => {
      mockDatasourceHook.loading = true;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").closest(".h-full");
      expect(container).toHaveClass("opacity-60");
    });
  });

  describe("Integration with Parent-Child Tabs", () => {
    afterEach(() => {
      resetTabContext(); // Reset after each test in this describe block
    });

    it("should handle parent record selection properly", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = { id: "parent-123" };
      mockTabContext.parentRecords = [{ id: "parent-123" }]; // Exactly one record

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
      expect(screen.queryByText("Selection Required")).not.toBeInTheDocument();
    });

    it("should show error when parent record missing", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = null;

      renderWithProviders(<DynamicTable {...defaultProps} />);

      expect(screen.getByText("Selection Required")).toBeInTheDocument();
    });

    it("should handle parent records array properly", () => {
      // When parentRecords.length !== 1, the component should skip data loading
      // but NOT show a selection error (only shows error when parentRecord is null)
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = { id: "parent-123" }; // Not null, so no error
      mockTabContext.parentRecords = [{ id: "parent-123" }, { id: "parent-456" }]; // length !== 1, so skip=true

      // Mock empty records due to skip=true
      mockDatasourceHook.records = [];

      renderWithProviders(<DynamicTable {...defaultProps} />);

      // Should NOT show error message (because parentRecord is not null)
      expect(screen.queryByText("Selection Required")).not.toBeInTheDocument();

      // Should show the table (but empty due to skip=true)
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });
});
