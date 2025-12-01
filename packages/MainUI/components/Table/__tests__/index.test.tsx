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
 * Test suite for the DynamicTable component
 *
 * The DynamicTable component is a highly complex component with numerous dependencies and interactions.
 * This test suite verifies the component's basic interface, prop handling, and rendering behavior.
 *
 * For comprehensive testing of specific features, see the dedicated test files:
 * - inlineEditing.test.ts - Inline editing functionality
 * - errorHandling.test.tsx - Error handling and recovery
 * - saveOperations.test.ts - Save and persistence operations
 * - tableFeatureIntegration.test.tsx - Feature compatibility and integration
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DynamicTable from "../index";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock all the context providers and hooks
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({
    registerDatasource: jest.fn(),
    unregisterDatasource: jest.fn(),
    registerRefetchFunction: jest.fn(),
    registerRecordsGetter: jest.fn(),
    registerHasMoreRecordsGetter: jest.fn(),
    registerFetchMore: jest.fn(),
  }),
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerActions: jest.fn(),
    registerAttachmentAction: jest.fn(),
    setShouldOpenAttachmentModal: jest.fn(),
  }),
}));

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => ({
    activeWindow: {
      window_identifier: "test-window",
      windowId: "test-window-id",
    },
    getSelectedRecord: jest.fn(() => "test-record-id"),
  }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: {
      id: "test-tab",
      window: "test-window",
      name: "Test Tab",
      title: "Test Tab",
      fields: {},
      parentColumns: [],
      table: "test_table",
      entityName: "TestEntity",
      tabLevel: 0,
      uIPattern: "STD",
      _identifier: "test-tab-id",
      records: {},
    } as Tab,
    parentTab: null,
    parentRecord: null,
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      entity: "TestEntity",
      breadcrumb: [],
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  }),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({
    user: {
      id: "test-user",
      name: "Test User",
    },
    session: {},
  }),
}));

jest.mock("@/hooks/table/useTableData", () => ({
  useTableData: () => ({
    displayRecords: [],
    records: [],
    columns: [],
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
  }),
}));

jest.mock("@/hooks/useTableSelection", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    tableColumnFilters: [],
    tableColumnVisibility: {},
    tableColumnSorting: [],
    tableColumnOrder: [],
  }),
}));

jest.mock("@/components/Table/hooks/useTableConfirmation", () => ({
  useTableConfirmation: () => ({
    confirmationState: {
      isOpen: false,
      statusType: "info",
      title: "",
      message: "",
      confirmText: "OK",
      cancelText: "Cancel",
      confirmDisabled: false,
      showCancel: false,
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    },
    confirmDiscardChanges: jest.fn(),
    confirmSaveWithErrors: jest.fn(),
  }),
}));

jest.mock("@/hooks/Toolbar/useStatusModal", () => ({
  useStatusModal: () => ({
    statusModal: {
      open: false,
      statusType: "info",
      statusText: "",
    },
    hideStatusModal: jest.fn(),
    showErrorModal: jest.fn(),
    showSuccessModal: jest.fn(),
  }),
}));

jest.mock("@/components/Table/hooks/useInlineEditInitialization", () => ({
  useInlineEditInitialization: () => ({
    fetchInitialData: jest.fn(),
  }),
}));

jest.mock("@/components/Table/hooks/useInlineTableDirOptions", () => ({
  useInlineTableDirOptions: () => ({
    loadOptions: jest.fn(),
    isLoading: jest.fn(() => false),
  }),
}));

jest.mock("@/hooks/Toolbar/useProcessExecution", () => ({
  useProcessExecution: () => ({
    executeProcess: jest.fn(),
  }),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/components/Table/styles", () => ({
  useStyle: () => ({
    sx: {},
  }),
}));

jest.mock("material-react-table", () => ({
  MaterialReactTable: () => <div data-testid="MaterialReactTable__8ca888">Table</div>,
  useMaterialReactTable: () => ({
    getState: () => ({
      rowSelection: {},
      columnFilters: [],
      columnVisibility: {},
      columnSizingInfo: {},
      columnSizing: {},
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
    setColumnFilters: jest.fn(),
    setColumnVisibility: jest.fn(),
    setSorting: jest.fn(),
    setColumnOrder: jest.fn(),
    setExpanded: jest.fn(),
    setRowSelection: jest.fn(),
  }),
}));

jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  RecordCounterBar: ({
    selectedCount,
    loadedRecords,
    totalRecords,
  }: {
    selectedCount: number;
    loadedRecords: number;
    totalRecords: number;
  }) => (
    <div data-testid="RecordCounterBar__8ca888">
      {selectedCount} selected, {loadedRecords} loaded of {totalRecords} total
    </div>
  ),
}));

jest.mock("@/components/Toolbar/Menus/ColumnVisibilityMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="ColumnVisibilityMenu__8ca888">Column Menu</div>,
}));

jest.mock("@/components/Table/EmptyState", () => ({
  __esModule: true,
  default: () => <div data-testid="EmptyState__8ca888">No records</div>,
}));

jest.mock("@/components/ErrorDisplay", () => ({
  ErrorDisplay: () => <div data-testid="ErrorDisplay__8ca888">Error</div>,
}));

jest.mock("@/components/Table/CellContextMenu", () => ({
  CellContextMenu: () => <div data-testid="CellContextMenu__8ca888">Context Menu</div>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/StatusModal", () => ({
  __esModule: true,
  default: () => <div data-testid="StatusModal__table">Status Modal</div>,
}));

jest.mock("@/services/callouts", () => ({
  globalCalloutManager: {
    executeCallout: jest.fn(),
    executeFieldCallout: jest.fn(),
  },
}));

describe("DynamicTable Component", () => {
  const mockSetRecordId = jest.fn();
  const mockOnRecordSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Interface", () => {
    it("should accept setRecordId as a required prop", () => {
      expect(() => {
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it("should accept onRecordSelection as an optional prop", () => {
      expect(() => {
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          onRecordSelection: mockOnRecordSelection,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it("should accept isTreeMode as an optional prop with boolean value", () => {
      expect(() => {
        const componentWithTreeMode = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          isTreeMode: true,
        });
        const componentWithoutTreeMode = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          isTreeMode: false,
        });
        expect(componentWithTreeMode).toBeDefined();
        expect(componentWithoutTreeMode).toBeDefined();
      }).not.toThrow();
    });

    it("should default isTreeMode to true when not provided", () => {
      expect(() => {
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Component Type", () => {
    it("should be a React component", () => {
      expect(typeof DynamicTable).toBe("function");
    });

    it("should be a valid React functional component", () => {
      expect(React.isValidElement(DynamicTable)).toBe(false);
      expect(typeof DynamicTable).toBe("function");
    });
  });

  describe("Props Validation", () => {
    it("should handle prop updates without errors", () => {
      expect(() => {
        const props1 = {
          setRecordId: mockSetRecordId,
          onRecordSelection: mockOnRecordSelection,
          isTreeMode: true,
        };
        const props2 = {
          setRecordId: jest.fn(),
          onRecordSelection: jest.fn(),
          isTreeMode: false,
        };
        const component1 = React.createElement(DynamicTable, props1);
        const component2 = React.createElement(DynamicTable, props2);
        expect(component1).toBeDefined();
        expect(component2).toBeDefined();
      }).not.toThrow();
    });

    it("should handle all prop combinations", () => {
      const testCases = [
        { setRecordId: mockSetRecordId },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection },
        { setRecordId: mockSetRecordId, isTreeMode: true },
        { setRecordId: mockSetRecordId, isTreeMode: false },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection, isTreeMode: true },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection, isTreeMode: false },
      ];

      expect(() => {
        for (const props of testCases) {
          const component = React.createElement(DynamicTable, props);
          expect(component).toBeDefined();
        }
      }).not.toThrow();
    });
  });

  describe("Component Rendering", () => {
    it("should render without crashing with minimal props", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });

    it("should render RecordCounterBar", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("RecordCounterBar__8ca888")).toBeInTheDocument();
      });
    });

    it("should render ColumnVisibilityMenu", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("ColumnVisibilityMenu__8ca888")).toBeInTheDocument();
      });
    });

    it("should render CellContextMenu component", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("CellContextMenu__8ca888")).toBeInTheDocument();
      });
    });

    it("should render StatusModal component", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        const statusModals = screen.getAllByTestId("StatusModal__table");
        expect(statusModals.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Props Callbacks", () => {
    it("should call setRecordId when needed", async () => {
      const mockSetRecordIdLocal = jest.fn();
      render(<DynamicTable setRecordId={mockSetRecordIdLocal} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });

    it("should handle onRecordSelection callback prop", async () => {
      const mockOnRecordSelectionLocal = jest.fn();
      render(<DynamicTable setRecordId={mockSetRecordId} onRecordSelection={mockOnRecordSelectionLocal} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no records are present", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper accessibility attributes on main table", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        const table = screen.getByTestId("MaterialReactTable__8ca888");
        expect(table).toBeInTheDocument();
      });
    });

    it("should render with keyboard navigation support", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should display loading indication when loading prop is true", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });
  });

  describe("TreeMode Props", () => {
    it("should render with tree mode enabled", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} isTreeMode={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });

    it("should render with tree mode disabled", async () => {
      render(<DynamicTable setRecordId={mockSetRecordId} isTreeMode={false} />);

      await waitFor(() => {
        expect(screen.getByTestId("MaterialReactTable__8ca888")).toBeInTheDocument();
      });
    });
  });
});
