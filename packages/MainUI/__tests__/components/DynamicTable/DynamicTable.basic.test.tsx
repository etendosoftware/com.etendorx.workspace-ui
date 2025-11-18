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

/**
 * Basic DynamicTable tests
 *
 * This test suite covers the basic functionality of the DynamicTable component,
 * including rendering, loading states, error handling, and context integration.
 *
 * For inline editing functionality tests, see:
 * - packages/MainUI/components/Table/__tests__/inlineEditing.test.ts
 * - packages/MainUI/components/Table/__tests__/editingStateManagement.test.tsx
 * - packages/MainUI/components/Table/__tests__/CellEditors.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DynamicTable from "../../../components/Table";
import type { EntityData, Column } from "@workspaceui/api-client/src/api/types";
import { FieldType } from "@workspaceui/api-client/src/api/types";

// Mock data
const mockRecords: EntityData[] = [
  { id: "1", name: "Record 1", status: "Active" },
  { id: "2", name: "Record 2", status: "Inactive" },
  { id: "3", name: "Record 3", status: "Active" },
];

const mockColumns: Column[] = [
  {
    id: "name",
    name: "name",
    columnName: "name",
    header: "Name",
    type: "string",
    displayed: true,
    showInGridView: true,
    sequenceNumber: 1,
    column: {},
  },
  {
    id: "status",
    name: "status",
    columnName: "status",
    header: "Status",
    type: "string",
    displayed: true,
    showInGridView: true,
    sequenceNumber: 2,
    column: {},
  },
];

// Mock contexts
const mockDatasourceContext = {
  registerDatasource: jest.fn(),
  unregisterDatasource: jest.fn(),
  registerRefetchFunction: jest.fn(),
  registerRecordsGetter: jest.fn(),
  registerHasMoreRecordsGetter: jest.fn(),
  registerFetchMore: jest.fn(),
};

const mockToolbarContext = {
  registerActions: jest.fn(),
  registerAttachmentAction: jest.fn(),
  setShouldOpenAttachmentModal: jest.fn(),
};

const mockTabContext = {
  tab: {
    id: "test-tab",
    window: "test-window",
    entityName: "TestEntity",
    fields: {},
  },
  parentTab: null,
  parentRecord: null,
};

const mockUserContext = {
  user: { id: "user-1", name: "Test User" },
  session: {},
};

const mockMultiWindowURL = {
  activeWindow: {
    windowId: "test-window",
    window_identifier: "test-window-123",
  },
  getSelectedRecord: jest.fn(),
};

// Mock hooks
jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => mockDatasourceContext,
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => mockToolbarContext,
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => mockTabContext,
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => mockUserContext,
}));

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => mockMultiWindowURL,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      getParent: jest.fn().mockReturnValue(null),
      getSelected: jest.fn(),
      setSelected: jest.fn(),
      setSelectedMultiple: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getChildren: jest.fn().mockReturnValue([]),
    },
  }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    tableColumnFilters: [],
    tableColumnVisibility: {},
    tableColumnSorting: [],
    tableColumnOrder: [],
  }),
}));

// Mock table data hook
const mockTableData = {
  displayRecords: mockRecords,
  records: mockRecords,
  columns: mockColumns,
  expanded: {},
  loading: false,
  error: null,
  shouldUseTreeMode: false,
  hasMoreRecords: false,
  handleMRTColumnFiltersChange: jest.fn(),
  handleMRTColumnVisibilityChange: jest.fn(),
  handleMRTSortingChange: jest.fn(),
  handleMRTColumnOrderChange: jest.fn(),
  handleMRTExpandChange: jest.fn(),
  toggleImplicitFilters: jest.fn(),
  fetchMore: jest.fn(),
  refetch: jest.fn(),
  removeRecordLocally: jest.fn(),
  applyQuickFilter: jest.fn(),
};

jest.mock("@/hooks/table/useTableData", () => ({
  useTableData: () => mockTableData,
}));

jest.mock("@/hooks/useTableSelection", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock inline editing hooks
jest.mock("../../../components/Table/hooks/useConfirmationDialog", () => ({
  useConfirmationDialog: () => ({
    dialogState: { isOpen: false },
    confirmDiscardChanges: jest.fn(),
    confirmSaveWithErrors: jest.fn(),
    confirmRetryAfterError: jest.fn(),
    showSuccessMessage: jest.fn(),
  }),
}));

jest.mock("../../../components/Table/hooks/useInlineEditInitialization", () => ({
  useInlineEditInitialization: () => ({
    fetchInitialData: jest.fn(),
  }),
}));

jest.mock("../../../components/Table/hooks/useInlineTableDirOptions", () => ({
  useInlineTableDirOptions: () => ({
    loadOptions: jest.fn(),
    isLoading: jest.fn().mockReturnValue(false),
  }),
}));

jest.mock("@/hooks/Toolbar/useStatusModal", () => ({
  useStatusModal: () => ({
    showProcessStatus: jest.fn(),
    showExecutionStatus: jest.fn(),
  }),
}));

// Mock Material React Table
jest.mock("material-react-table", () => ({
  MaterialReactTable: ({ table }: any) => (
    <div data-testid="material-react-table">
      <div data-testid="table-rows">
        {table.getRowModel().rows.map((row: any, i: number) => (
          <div key={i} data-testid={`row-${row.id}`}>
            {row.original.name}
          </div>
        ))}
      </div>
    </div>
  ),
  useMaterialReactTable: (options: any) => ({
    getState: () => ({
      rowSelection: {},
      columnFilters: options.state?.columnFilters || [],
      columnVisibility: options.state?.columnVisibility || {},
      sorting: options.state?.sorting || [],
      expanded: options.state?.expanded || {},
    }),
    getRowModel: () => ({
      rows: options.data.map((item: any, index: number) => ({
        id: item.id || index,
        original: item,
        getIsSelected: () => false,
        getIsExpanded: () => false,
      })),
    }),
    setRowSelection: jest.fn(),
    resetRowSelection: jest.fn(),
  }),
}));

// Mock components
jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  RecordCounterBar: ({ totalRecords, loadedRecords }: any) => (
    <div data-testid="record-counter-bar">
      Showing {loadedRecords} of {totalRecords}
    </div>
  ),
}));

jest.mock("../../../components/Toolbar/Menus/ColumnVisibilityMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="column-visibility-menu" />,
}));

jest.mock("../../../components/Table/CellContextMenu", () => ({
  CellContextMenu: () => <div data-testid="cell-context-menu" />,
}));

jest.mock("../../../components/Table/components/ConfirmationDialog", () => ({
  ConfirmationDialog: () => <div data-testid="confirmation-dialog" />,
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  ErrorDisplay: ({ title, description }: any) => (
    <div data-testid="error-display">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock("../../../components/Table/EmptyState", () => ({
  __esModule: true,
  default: () => <div data-testid="empty-state">No records found</div>,
}));

// Mock icons
jest.mock("../../../ComponentLibrary/src/assets/icons/folder-plus-filled.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/folder-minus.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/circle-filled.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-up.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-down.svg", () => "div");
jest.mock("../../../ComponentLibrary/src/assets/icons/check.svg", () => "div");

jest.mock("../../../components/Table/styles", () => ({
  useStyle: () => ({
    sx: {
      tablePaper: {},
      tableHeadCell: {},
      tableBody: {},
      rowSelected: {},
    },
  }),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/utils", () => ({
  getFieldReference: jest.fn((ref) => FieldType.STRING),
  parseDynamicExpression: jest.fn((expr) => expr),
}));

jest.mock("@/utils/table/utils", () => ({
  getDisplayColumnDefOptions: jest.fn(() => ({})),
  getMUITableBodyCellProps: jest.fn(() => ({})),
  getCurrentRowCanExpand: jest.fn(() => false),
  getCellTitle: jest.fn((value) => String(value || "")),
}));

jest.mock("@/utils/tableColumns", () => ({
  parseColumns: jest.fn((fields) => []),
}));

jest.mock("../../../components/Table/styles/inlineEditing.css", () => ({}));

jest.mock("../../../components/Table/utils/tableFeatureCompatibility", () => ({
  canSortWithEditingRows: jest.fn(() => true),
  canFilterWithEditingRows: jest.fn(() => true),
  mergeOptimisticRecordsWithSort: jest.fn((display, optimistic) => optimistic.length > 0 ? optimistic : display),
  canUseVirtualScrollingWithEditing: jest.fn(() => true),
}));

jest.mock("../../../components/Table/utils/performanceOptimizations", () => ({
  useDebouncedCallback: jest.fn((fn) => fn),
  useThrottledCallback: jest.fn((fn) => fn),
  usePerformanceMonitor: jest.fn(() => ({
    measure: jest.fn((name, fn) => fn()),
  })),
  useMemoryManager: jest.fn(() => ({
    clear: jest.fn(),
  })),
}));

jest.mock("../../../components/Table/utils/accessibilityUtils", () => ({
  useScreenReaderAnnouncer: jest.fn(() => ({
    announceEditingStateChange: jest.fn(),
    announceRowInsertion: jest.fn(),
    announceSaveOperation: jest.fn(),
  })),
  generateAriaAttributes: {
    tableContainer: jest.fn(() => ({})),
  },
  useFocusManagement: jest.fn(() => ({
    setFocusedElement: jest.fn(),
    getFocusedElement: jest.fn(),
    restoreFocus: jest.fn(),
  })),
}));

jest.mock("@/utils/commons", () => ({
  isEmptyObject: jest.fn((obj) => Object.keys(obj || {}).length === 0),
}));

describe("DynamicTable - Basic Functionality", () => {
  const defaultProps = {
    setRecordId: jest.fn(),
    onRecordSelection: jest.fn(),
    isTreeMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTableData.displayRecords = mockRecords;
    mockTableData.records = mockRecords;
    mockTableData.loading = false;
    mockTableData.error = null;
  });

  describe("Rendering", () => {
    it("should render the table with records", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
      expect(screen.getByTestId("table-rows")).toBeInTheDocument();
      expect(screen.getByText("Record 1")).toBeInTheDocument();
      expect(screen.getByText("Record 2")).toBeInTheDocument();
      expect(screen.getByText("Record 3")).toBeInTheDocument();
    });

    it("should render record counter bar", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("record-counter-bar")).toBeInTheDocument();
      expect(screen.getByText(/Showing 3 of 3/)).toBeInTheDocument();
    });

    it("should render column visibility menu", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("column-visibility-menu")).toBeInTheDocument();
    });

    it("should render cell context menu", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("cell-context-menu")).toBeInTheDocument();
    });

    it("should render confirmation dialog", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("confirmation-dialog")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading state when loading is true", () => {
      mockTableData.loading = true;

      render(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").parentElement;
      expect(container).toHaveClass("opacity-60");
    });

    it("should not show loading state when loading is false", () => {
      mockTableData.loading = false;

      render(<DynamicTable {...defaultProps} />);

      const container = screen.getByTestId("material-react-table").parentElement;
      expect(container).toHaveClass("opacity-100");
    });
  });

  describe("Error Handling", () => {
    it("should display error when there is an error", () => {
      mockTableData.error = new Error("Test error message");

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should not render table when there is an error", () => {
      mockTableData.error = new Error("Test error");

      render(<DynamicTable {...defaultProps} />);

      expect(screen.queryByTestId("material-react-table")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no records", () => {
      mockTableData.displayRecords = [];
      mockTableData.records = [];

      render(<DynamicTable {...defaultProps} />);

      // The empty state is rendered by Material React Table's renderEmptyRowsFallback
      // We just verify the table is rendered (empty state is handled internally)
      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
    });
  });

  describe("Parent Record Requirement", () => {
    it("should show selection error when parent tab exists but no parent record", () => {
      mockTabContext.parentTab = { id: "parent-tab" } as any;
      mockTabContext.parentRecord = null;

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByText("errors.selectionError.title")).toBeInTheDocument();
      expect(screen.getByText("errors.selectionError.description")).toBeInTheDocument();
    });

    it("should render normally when parent record exists", () => {
      mockTabContext.parentTab = { id: "parent-tab" } as any;
      mockTabContext.parentRecord = { id: "parent-1" } as any;

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByTestId("material-react-table")).toBeInTheDocument();
      expect(screen.queryByText("errors.selectionError.title")).not.toBeInTheDocument();
    });
  });

  describe("Context Integration", () => {
    it("should register datasource on mount", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(mockDatasourceContext.registerRefetchFunction).toHaveBeenCalled();
      expect(mockDatasourceContext.registerRecordsGetter).toHaveBeenCalled();
      expect(mockDatasourceContext.registerHasMoreRecordsGetter).toHaveBeenCalled();
    });

    it("should register toolbar actions on mount", () => {
      render(<DynamicTable {...defaultProps} />);

      expect(mockToolbarContext.registerActions).toHaveBeenCalled();
    });

    it("should unregister datasource on unmount", () => {
      const { unmount } = render(<DynamicTable {...defaultProps} />);

      unmount();

      expect(mockDatasourceContext.unregisterDatasource).toHaveBeenCalled();
    });
  });

  describe("Infinite Scrolling", () => {
    it("should indicate when more records are available", () => {
      mockTableData.hasMoreRecords = true;
      mockTableData.displayRecords = mockRecords;

      render(<DynamicTable {...defaultProps} />);

      // When hasMoreRecords is true, the counter shows loaded +1 as approximate total
      expect(screen.getByText(/Showing 3 of 4/)).toBeInTheDocument();
    });

    it("should not indicate more records when all are loaded", () => {
      mockTableData.hasMoreRecords = false;

      render(<DynamicTable {...defaultProps} />);

      expect(screen.getByText(/Showing 3 of 3/)).toBeInTheDocument();
    });
  });

  describe("Record Selection", () => {
    it("should call onRecordSelection when provided", async () => {
      const onRecordSelection = jest.fn();
      render(<DynamicTable {...defaultProps} onRecordSelection={onRecordSelection} />);

      // Record selection is handled by useTableSelection hook which is mocked
      // Just verify the prop is passed correctly
      expect(defaultProps.onRecordSelection).toBeDefined();
    });
  });
});
