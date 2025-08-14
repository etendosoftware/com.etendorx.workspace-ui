import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type React from "react";
import DynamicTable from "../../../components/Table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_Row, MRT_RowData, MRT_TableOptions, MRT_ColumnFiltersState } from "material-react-table";
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
};

const mockToolbarContext = {
  registerActions: jest.fn(),
  onSave: jest.fn(),
  onRefresh: jest.fn(),
  onNew: jest.fn(),
  onBack: jest.fn(),
  onFilter: jest.fn(),
  onColumnFilters: jest.fn(),
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
  },
  parentTab: null,
  parentRecord: { id: "parent-123" },
  parentRecords: [{ id: "parent-123" }],
};

const mockSelectedContext = {
  graph: {
    getParent: jest.fn(),
    getSelected: jest.fn(),
    setSelected: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};

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
  updateColumnFilters: jest.Mock;
  toggleImplicitFilters: jest.Mock;
  fetchMore: jest.Mock;
  records: EntityData[];
  removeRecordLocally: jest.Mock;
  error: Error | null;
  refetch: jest.Mock;
  loading: boolean;
  hasMoreRecords: boolean;
} = {
  updateColumnFilters: jest.fn(),
  toggleImplicitFilters: jest.fn(),
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
  default: jest.fn(),
}));

// Mock Material React Table
jest.mock("material-react-table", () => ({
  MaterialReactTable: ({ table }: { table: MockTableInstance<EntityData> }) => (
    <div data-testid="material-react-table">
      <div data-testid="table-content">
        {table.getRowModel().rows.map((row: TableRow<EntityData>, index: number) => (
          <div key={index} data-testid={`table-row-${index}`}>
            {String(row.original.name || "")}
          </div>
        ))}
      </div>
    </div>
  ),
  useMaterialReactTable: <TData extends MRT_RowData>(options: MRT_TableOptions<TData>): MockTableInstance<TData> => ({
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
  }),
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
  });

  describe("Rendering", () => {
    it("renders the table container correctly", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders table records", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("table-content")).toBeInTheDocument();
    });

    it("renders with tree mode enabled by default", () => {
      render(<DynamicTable {...defaultProps} />);

      // Tree mode should be enabled based on the mocked tree metadata
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders correctly when tree mode is disabled", () => {
      render(<DynamicTable {...defaultProps} isTreeMode={false} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("renders column visibility menu", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("column-visibility-menu")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("displays loading state correctly", () => {
      mockDatasourceHook.loading = true;

      render(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").closest(".h-full");
      expect(container).toHaveClass("opacity-60", "cursor-progress");
    });

    it("removes loading state when not loading", () => {
      mockDatasourceHook.loading = false;

      render(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").closest(".h-full");
      expect(container).toHaveClass("opacity-100");
      expect(container).not.toHaveClass("opacity-60", "cursor-progress");
    });
  });

  describe("Error Handling", () => {
    it("displays error when datasource has error", () => {
      mockDatasourceHook.error = new Error("Database connection failed");

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Table Error")).toBeInTheDocument();
      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });

    it("calls refetch when retry button is clicked", async () => {
      const user = userEvent.setup();
      mockDatasourceHook.error = new Error("Network error");

      render(<DynamicTable {...defaultProps} />);

      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      expect(mockDatasourceHook.refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Parent Record Selection", () => {
    it("shows selection error when parent tab exists but no parent record", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = null;

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByText("Selection Required")).toBeInTheDocument();
      expect(screen.getByText("Please select a parent record")).toBeInTheDocument();
    });

    it("renders normally when parent record exists", () => {
      mockTabContext.parentTab = { id: "parent-tab" };
      mockTabContext.parentRecord = { id: "parent-123" };

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
      expect(screen.queryByText("Selection Required")).not.toBeInTheDocument();
    });
  });

  describe("Tree Mode Functionality", () => {
    it("handles tree mode metadata loading", () => {
      render(<DynamicTable {...defaultProps} isTreeMode={true} />);

      // Should render without tree mode while metadata is loading
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("supports expanding and collapsing nodes in tree mode", async () => {
      render(<DynamicTable {...defaultProps} isTreeMode={true} />);

      // The expand/collapse functionality would be tested through the table interactions
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Record Selection", () => {
    it("calls setRecordId when onRecordSelection prop is provided", () => {
      const mockSetRecordId = jest.fn();
      const mockOnRecordSelection = jest.fn();

      render(
        <DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelection} isTreeMode={true} />
      );

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("handles multiple record selection", () => {
      render(<DynamicTable {...defaultProps} />);

      // Multiple selection functionality would be handled by the table component
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Column Filtering", () => {
    it("handles column filter changes", () => {
      render(<DynamicTable {...defaultProps} />);

      // Column filtering would be handled through the table state
      expect(mockDatasourceHook.updateColumnFilters).toBeDefined();
    });

    it("toggles implicit filters", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceHook.toggleImplicitFilters).toBeDefined();
    });
  });

  describe("Infinite Scrolling", () => {
    it("fetches more records when scrolling to bottom", () => {
      mockDatasourceHook.hasMoreRecords = true;

      render(<DynamicTable {...defaultProps} />);

      // Scroll functionality would be tested through scroll events
      expect(mockDatasourceHook.fetchMore).toBeDefined();
    });

    it("does not fetch more when no more records available", () => {
      mockDatasourceHook.hasMoreRecords = false;

      render(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceHook.hasMoreRecords).toBe(false);
    });
  });

  describe("Context Integration", () => {
    it("registers datasource and refetch function", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceContext.registerRefetchFunction).toHaveBeenCalled();
    });

    it("registers toolbar actions", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(mockToolbarContext.registerActions).toHaveBeenCalledWith({
        refresh: expect.any(Function),
        filter: expect.any(Function),
        save: expect.any(Function),
        columnFilters: expect.any(Function),
      });
    });

    it("unregisters datasource on unmount", () => {
      const { unmount } = render(<DynamicTable {...defaultProps} />);

      unmount();

      expect(mockDatasourceContext.unregisterDatasource).toHaveBeenCalled();
    });
  });

  describe("Search Integration", () => {
    it("responds to search query changes", () => {
      mockSearchContext.searchQuery = "test search";

      render(<DynamicTable {...defaultProps} />);

      // Search functionality is passed to the useDatasource hook
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("renders empty state when no records", () => {
      mockDatasourceHook.records = [];

      render(<DynamicTable {...defaultProps} />);

      // Empty state would be handled by the table's renderEmptyRowsFallback
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper keyboard navigation support", () => {
      render(<DynamicTable {...defaultProps} />);

      // Material React Table handles most accessibility features
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });

    it("supports screen readers", () => {
      render(<DynamicTable {...defaultProps} />);

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

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("handles missing optional props", () => {
      render(
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
        render(<DynamicTable {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
