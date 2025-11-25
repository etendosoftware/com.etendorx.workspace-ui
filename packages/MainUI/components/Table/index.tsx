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

import {
  MaterialReactTable,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
  type MRT_VisibilityState,
  type MRT_Cell,
} from "material-react-table";
import { useStyle } from "./styles";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ColumnVisibilityMenu from "../Toolbar/Menus/ColumnVisibilityMenu";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useSelected } from "@/hooks/useSelected";
import { useWindowContext } from "@/contexts/window";
import { logger } from "@/utils/logger";
import PlusFolderFilledIcon from "../../../ComponentLibrary/src/assets/icons/folder-plus-filled.svg";
import MinusFolderIcon from "../../../ComponentLibrary/src/assets/icons/folder-minus.svg";
import CircleFilledIcon from "../../../ComponentLibrary/src/assets/icons/circle-filled.svg";
import ChevronUp from "../../../ComponentLibrary/src/assets/icons/chevron-up.svg";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check.svg";
import { useTableData } from "@/hooks/table/useTableData";
import { isEmptyObject } from "@/utils/commons";
import {
  getDisplayColumnDefOptions,
  getMUITableBodyCellProps,
  getCurrentRowCanExpand,
  getCellTitle,
} from "@/utils/table/utils";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { CellContextMenu } from "./CellContextMenu";
import { RecordCounterBar } from "@workspaceui/componentlibrary/src/components";

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, "staticRowIndex">;

const getRowId = (row: EntityData) => String(row.id);
interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
  isTreeMode?: boolean;
}

const DynamicTable = ({ setRecordId, onRecordSelection, isTreeMode = true }: DynamicTableProps) => {
  const { sx } = useStyle();
  const { t } = useTranslation();
  const { graph } = useSelected();
  const {
    registerDatasource,
    unregisterDatasource,
    registerRefetchFunction,
    registerRecordsGetter,
    registerHasMoreRecordsGetter,
    registerFetchMore,
  } = useDatasourceContext();
  const { registerActions, registerAttachmentAction, setShouldOpenAttachmentModal } = useToolbarContext();
  const { activeWindow } = useWindowContext();
  const { getSelectedRecord } = useWindowContext();
  const { tab, parentTab, parentRecord } = useTabContext();

  const { tableColumnFilters, tableColumnVisibility, tableColumnSorting, tableColumnOrder } =
    useTableStatePersistenceTab({
      windowIdentifier: activeWindow?.windowIdentifier || "",
      tabId: tab.id,
      tabLevel: tab.tabLevel
    });
  const tabId = tab.id;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasScrolledToSelection = useRef<boolean>(false);
  const previousURLSelection = useRef<string | null>(null);
  const hasRestoredSelection = useRef(false);

  // Use the table data hook
  const {
    displayRecords,
    records,
    columns: baseColumns,
    expanded,
    loading,
    error,
    shouldUseTreeMode,
    hasMoreRecords,
    handleMRTColumnFiltersChange,
    handleMRTColumnVisibilityChange,
    handleMRTSortingChange,
    handleMRTColumnOrderChange,
    handleMRTExpandChange,
    toggleImplicitFilters,
    fetchMore,
    refetch,
    removeRecordLocally,
    applyQuickFilter,
  } = useTableData({
    isTreeMode,
  });

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const [hasInitialColumnVisibility, setHasInitialColumnVisibility] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    anchorEl: HTMLElement | null;
    cell: MRT_Cell<EntityData> | null;
    row: MRT_Row<EntityData> | null;
  }>({
    anchorEl: null,
    cell: null,
    row: null,
  });

  const toggleColumnsDropdown = useCallback(
    (buttonRef?: HTMLElement | null) => {
      if (columnMenuAnchor) {
        setColumnMenuAnchor(null);
      } else {
        setColumnMenuAnchor(buttonRef || null);
      }
    },
    [columnMenuAnchor]
  );

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenuAnchor(null);
  }, []);

  const handleCellContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>, cell: MRT_Cell<EntityData>, row: MRT_Row<EntityData>) => {
      event.preventDefault();
      setContextMenu({
        anchorEl: event.currentTarget,
        cell,
        row,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({
      anchorEl: null,
      cell: null,
      row: null,
    });
  }, []);

  const handleFilterByValue = useCallback(
    async (columnId: string, filterId: string, filterValue: string | number, filterLabel: string) => {
      await applyQuickFilter(columnId, filterId, filterValue, filterLabel);
    },
    [applyQuickFilter]
  );

  const renderFirstColumnCell = ({
    renderedCellValue,
    row,
    table,
    originalCell,
    shouldUseTreeMode,
  }: {
    renderedCellValue: React.ReactNode;
    row: MRT_Row<EntityData>;
    table: MRT_TableInstance<EntityData>;
    originalCell?: unknown;
    shouldUseTreeMode: boolean;
  }) => {
    const hasChildren = row.original.showDropIcon === true;
    const canExpand = shouldUseTreeMode && hasChildren;
    const isExpanded = row.getIsExpanded();
    const isSelected = row.getIsSelected();

    let expandIcon: React.ReactNode = null;
    if (canExpand) {
      expandIcon = isExpanded ? (
        <ChevronUp height={12} width={12} fill={"#3F4A7E"} data-testid="ChevronUp__8ca888" />
      ) : (
        <ChevronDown height={12} width={12} fill={"#3F4A7E"} data-testid="ChevronDown__8ca888" />
      );
    }

    let HierarchyIcon = null;
    if (shouldUseTreeMode) {
      if (hasChildren) {
        HierarchyIcon = isExpanded ? MinusFolderIcon : PlusFolderFilledIcon;
      } else {
        HierarchyIcon = CircleFilledIcon;
      }
    }

    if (shouldUseTreeMode) {
      return (
        <div className="flex items-center gap-2 w-full">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (canExpand) {
                  row.toggleExpanded();
                }
              }}
              className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center min-w-5 min-h-5 rounded-full shadow-[0px_2.5px_6.25px_0px_rgba(0,3,13,0.1)]">
              {expandIcon}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
          <div className="relative flex items-end">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                row.toggleSelected();
              }}
              className="min-w-4 min-h-4 cursor-pointer rounded border-[1.67px] border-[rgba(0,3,13,0.4)] appearance-none bg-white checked:bg-[#004ACA] checked:border-[#004ACA]"
            />
            {isSelected && (
              <CheckIcon
                className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none fill-white"
                data-testid="CheckIcon__8ca888"
              />
            )}
          </div>
          {HierarchyIcon && (
            <HierarchyIcon className="min-w-5 min-h-5" fill={"#004ACA"} data-testid="HierarchyIcon__8ca888" />
          )}
          <span className="flex-1">
            {originalCell && typeof originalCell === "function"
              ? originalCell({ renderedCellValue, row, table })
              : renderedCellValue}
          </span>
        </div>
      );
    }

    return (
      <span className="flex-1">
        {originalCell && typeof originalCell === "function"
          ? originalCell({ renderedCellValue, row, table })
          : renderedCellValue}
      </span>
    );
  };

  const columns = useMemo(() => {
    if (!baseColumns.length) {
      return baseColumns;
    }

    const modifiedColumns = baseColumns.map((col) => ({ ...col }));
    const firstColumn = { ...modifiedColumns[0] };
    const originalCell = firstColumn.Cell;

    if (shouldUseTreeMode) {
      firstColumn.size = 300;
      firstColumn.minSize = 250;
      firstColumn.maxSize = 500;
    }

    firstColumn.Cell = ({
      renderedCellValue,
      row,
      table,
    }: { renderedCellValue: React.ReactNode; row: MRT_Row<EntityData>; table: MRT_TableInstance<EntityData> }) =>
      renderFirstColumnCell({ renderedCellValue, row, table, originalCell, shouldUseTreeMode });

    modifiedColumns[0] = firstColumn;
    return modifiedColumns;
  }, [baseColumns, shouldUseTreeMode]);

  // Initialize row selection from URL parameters with proper validation and logging
  const urlBasedRowSelection = useMemo(() => {
    // Use proper URL state management instead of search params
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window) {
      return {};
    }

    // Get the selected record from URL for this specific tab
    const urlSelectedId = getSelectedRecord(activeWindow.windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return {};
    }

    // Validate that the record exists in current dataset
    const recordExists = records?.some((record) => String(record.id) === urlSelectedId);
    if (recordExists) {
      return { [urlSelectedId]: true };
    }

    return {};
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records]);

  /** Track URL selection changes to detect direct navigation */
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !windowIdentifier) {
      return;
    }

    const currentURLSelection = getSelectedRecord(windowIdentifier, tab.id);

    // Detect URL-driven navigation (direct links, browser back/forward)
    if (currentURLSelection !== previousURLSelection.current && currentURLSelection) {
      const recordExists = records?.some((record) => String(record.id) === currentURLSelection);

      if (recordExists) {
        logger.info(`[URLNavigation] Detected URL navigation to record: ${currentURLSelection}`);
      } else {
        logger.warn(`[URLNavigation] URL navigation to invalid record: ${currentURLSelection}`);
      }
      hasScrolledToSelection.current = false;
    }

    if (currentURLSelection) {
      previousURLSelection.current = currentURLSelection;
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records]);

  const handleTableSelectionChange = useCallback(
    (recordId: string) => {
      if (recordId) {
        logger.debug(`[TableSelection] Selection changed to record: ${recordId} in tab: ${tab.id}`);
      } else {
        logger.debug(`[TableSelection] Selection cleared in tab: ${tab.id}`);
      }

      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection, tab.id]
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();
      const rowId = String(record.id);

      return {
        onClick: (event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "BUTTON" || target.closest("button")) {
            return;
          }

          // Clear any existing timeout for this row
          const existingTimeout = clickTimeoutsRef.current.get(rowId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          // Set a new timeout for single click action
          const timeout = setTimeout(() => {
            if (event.ctrlKey || event.metaKey) {
              row.toggleSelected();
            } else {
              table.setRowSelection({});
              row.toggleSelected(true);
            }
            clickTimeoutsRef.current.delete(rowId);
          }, 250);

          clickTimeoutsRef.current.set(rowId, timeout);
        },

        onDoubleClick: (event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "BUTTON" || target.closest("button")) {
            return;
          }

          event.stopPropagation();

          // Cancel ALL pending timeouts to prevent single click execution
          for (const timeout of clickTimeoutsRef.current.values()) {
            clearTimeout(timeout);
            clickTimeoutsRef.current.delete(rowId);
          }
          clickTimeoutsRef.current.clear();

          const parent = graph.getParent(tab);

          // For child tabs, prevent opening form if parent has no selection in URL
          if (parent) {
            const windowIdentifier = activeWindow?.windowIdentifier;
            const parentSelectedInURL = windowIdentifier ? getSelectedRecord(windowIdentifier, parent.id) : undefined;
            if (!parentSelectedInURL) {
              return;
            }
          }

          // Set graph selection for consistency
          const parentSelection = parent ? graph.getSelected(parent) : undefined;
          graph.setSelected(tab, row.original);
          graph.setSelectedMultiple(tab, [row.original]);

          if (parent && parentSelection) {
            setTimeout(() => graph.setSelected(parent, parentSelection), 10);
          }

          // Navigate to form view - this will handle the URL update properly
          setRecordId(record.id);
        },

        sx: {
          ...(isSelected && {
            ...sx.rowSelected,
          }),
        },
        row,
        table,
      };
    },
    [graph, setRecordId, sx.rowSelected, tab]
  );

  const renderEmptyRowsFallback = useCallback(
    ({ table }: { table: MRT_TableInstance<EntityData> }) => (
      <EmptyState table={table} data-testid="EmptyState__8ca888" />
    ),
    []
  );

  const fetchMoreOnBottomReached = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = event.target as HTMLDivElement;

      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (scrollHeight - scrollTop - clientHeight < 10 && !loading && hasMoreRecords) {
          fetchMore();
        }
      }
    },
    [fetchMore, hasMoreRecords, loading]
  );

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: {
      sx: {
        ...sx.tableHeadCell,
      },
    },
    muiTableBodyCellProps: (props) => {
      const currentValue = props.cell.getValue();
      const currentTitle = getCellTitle(currentValue);
      return {
        sx: getMUITableBodyCellProps({
          shouldUseTreeMode,
          sx,
          columns,
          column: props.column,
          row: props.row,
        }),
        onContextMenu: (event: React.MouseEvent<HTMLTableCellElement>) => {
          handleCellContextMenu(event, props.cell, props.row);
        },
        title: currentTitle,
      };
    },
    displayColumnDefOptions: getDisplayColumnDefOptions({ shouldUseTreeMode }),
    muiTableBodyProps: { sx: sx.tableBody },
    layoutMode: "semantic",
    enableGlobalFilter: false,
    columns,
    data: displayRecords,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    // Disable "Select All" when there are more records to load
    muiSelectAllCheckboxProps: hasMoreRecords
      ? {
        disabled: true,
        // Wrap disabled checkbox in a span to enable tooltip
        sx: {
          "&.Mui-disabled": {
            pointerEvents: "auto", // Allow hover on disabled element
            cursor: "not-allowed",
          },
        },
        title: t("table.selectAll.disabledTooltip"),
      }
      : {
        disabled: false,
        title: t("table.selectAll.enabledTooltip"),
      },
    positionToolbarAlertBanner: "none",
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { flex: 1, height: "100%", maxHeight: "100%" },
      onScroll: fetchMoreOnBottomReached,
    },
    enablePagination: false,
    enableStickyHeader: true,
    enableColumnVirtualization: true,
    enableRowVirtualization: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableExpanding: shouldUseTreeMode,
    paginateExpandedRows: false,
    getRowCanExpand: (row) => {
      return getCurrentRowCanExpand({ row: row as MRT_Row<EntityData>, shouldUseTreeMode });
    },
    initialState: {
      density: "compact",
      rowSelection: urlBasedRowSelection,
    },
    renderDetailPanel: undefined,
    onExpandedChange: (newExpanded) => {
      handleMRTExpandChange({ newExpanded });
    },
    state: {
      columnFilters: tableColumnFilters,
      columnVisibility: tableColumnVisibility,
      sorting: tableColumnSorting,
      columnOrder: tableColumnOrder,
      expanded: shouldUseTreeMode ? expanded : {},
      showColumnFilters: true,
      showProgressBars: loading,
    },
    onColumnFiltersChange: handleMRTColumnFiltersChange,
    onColumnVisibilityChange: (
      updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)
    ) => {
      // Manage initial visibility to avoid overwriting saved state on first render
      if (!hasInitialColumnVisibility) {
        setHasInitialColumnVisibility(true);
        const isEmptyVisibility = isEmptyObject(tableColumnVisibility);
        // If the current visibility is not empty, it means we have loaded a saved state, so we don't apply the initial state
        if (!isEmptyVisibility) return;
      }

      handleMRTColumnVisibilityChange(updaterOrValue);
    },
    onSortingChange: handleMRTSortingChange,
    onColumnOrderChange: handleMRTColumnOrderChange,
    getRowId,
    enableColumnFilters: true,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    enableColumnOrdering: true,
    renderEmptyRowsFallback,
  });

  useTableSelection(tab, records, table.getState().rowSelection, handleTableSelectionChange);

  // Handle auto-scroll to selected record with virtualization support
  useLayoutEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !displayRecords || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Always mark as scrolled after first attempt, regardless of whether scroll was needed
    if (!hasScrolledToSelection.current && displayRecords.length > 0) {
      hasScrolledToSelection.current = true;

      // Find the index of the selected record in the display records
      const selectedIndex = displayRecords.findIndex((record) => String(record.id) === urlSelectedId);

      if (selectedIndex >= 0 && tableContainerRef.current) {
        try {
          if (tableContainerRef.current) {
            const containerElement = tableContainerRef.current;

            const estimatedRowHeight = 40; // Approximate row height
            const headerHeight = 75; // Approximate header height
            const scrollTop = selectedIndex * estimatedRowHeight - containerElement.clientHeight / 2 + headerHeight;

            // Scroll to the calculated position synchronously after DOM updates
            containerElement.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: "smooth",
            });

            logger.info(`[TableScroll] Auto-scrolled to record at index ${selectedIndex}: ${urlSelectedId}`);
          }
        } catch (error) {
          logger.error(`[TableScroll] Error scrolling to selected record: ${error}`);
        }
      } else {
        logger.debug(`[TableScroll] Record found but scroll not needed: ${urlSelectedId}`);
      }
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, displayRecords, table]);

  // Ensure URL selection is maintained when table data changes
  // Sync URL selection to table state
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Check if URL selection is still valid with current data
    const recordExists = records.some((record) => String(record.id) === urlSelectedId);
    const currentSelection = table.getState().rowSelection;
    const isCurrentlySelected = currentSelection[urlSelectedId];

    if (recordExists && !isCurrentlySelected) {
      // Record exists but is not selected - restore URL selection visually
      table.setRowSelection({ [urlSelectedId]: true });
    } else if (!recordExists && isCurrentlySelected) {
      // Record no longer exists but is still selected - clear selection
      table.setRowSelection({});
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, table, graph]);

  // Handle browser navigation and direct link access
  // NOTE: Disabled for tabs with children - their selection is handled atomically
  // by setSelectedRecordAndClearChildren in useTableSelection
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || !windowIdentifier) {
      return;
    }

    // Skip URLNavigation for tabs with children to prevent race conditions
    // Their selection is already handled atomically by useTableSelection
    const children = graph.getChildren(tab);
    if (children && children.length > 0) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    const currentSelection = table.getState().rowSelection;
    const recordExists = records.some((record) => String(record.id) === urlSelectedId);

    if (recordExists) {
      const isCurrentlySelected = currentSelection[urlSelectedId];

      if (!isCurrentlySelected) {
        // Add a small delay to avoid applying stale URL selections during transitions
        const timeoutId = setTimeout(() => {
          // Re-check if this is still the correct selection after the delay
          const latestUrlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
          if (latestUrlSelectedId === urlSelectedId) {
            logger.debug(`[URLNavigation] Applying URL selection for direct navigation: ${urlSelectedId}`);
            table.setRowSelection({ [urlSelectedId]: true });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, table, graph]);

  /** Restore selection from URL on mount */
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || hasRestoredSelection.current || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Check if record exists and restore visual selection if needed
    const recordExists = records.some((record) => String(record.id) === urlSelectedId);
    const currentSelection = table.getState().rowSelection;
    const isCurrentlySelected = currentSelection[urlSelectedId];

    if (recordExists && !isCurrentlySelected) {
      logger.debug(`[DynamicTable] Restoring selection on mount from URL: ${urlSelectedId}`);
      table.setRowSelection({ [urlSelectedId]: true });
      hasRestoredSelection.current = true;
    }
  }, [activeWindow, tab.window, records, table, getSelectedRecord, tab.id]);

  useEffect(() => {
    const handleGraphClear = (eventTab: typeof tab) => {
      if (eventTab.id === tabId) {
        const currentSelection = table.getState().rowSelection;
        const hasTableSelection = Object.keys(currentSelection).some((id) => currentSelection[id]);

        if (hasTableSelection) {
          table.resetRowSelection(true);
        }
      }
    };

    graph.addListener("unselected", handleGraphClear);
    graph.addListener("unselectedMultiple", handleGraphClear);

    return () => {
      graph.removeListener("unselected", handleGraphClear);
      graph.removeListener("unselectedMultiple", handleGraphClear);
    };
  }, [graph, table, tabId, tab.id]);

  useEffect(() => {
    if (removeRecordLocally) {
      registerDatasource(tabId, removeRecordLocally);
    }

    registerRefetchFunction(tabId, refetch);

    // Register records getter for navigation
    registerRecordsGetter(tabId, () => records);

    // Register hasMoreRecords getter
    registerHasMoreRecordsGetter(tabId, () => hasMoreRecords);

    // Register fetchMore function
    if (fetchMore) {
      registerFetchMore(tabId, fetchMore);
    }

    return () => {
      unregisterDatasource(tabId);
    };
  }, [
    tabId,
    removeRecordLocally,
    registerDatasource,
    unregisterDatasource,
    registerRefetchFunction,
    registerRecordsGetter,
    registerHasMoreRecordsGetter,
    registerFetchMore,
    refetch,
    records,
    hasMoreRecords,
    fetchMore,
  ]);

  useEffect(() => {
    registerActions({
      refresh: refetch,
      filter: toggleImplicitFilters,
      save: async () => { },
      columnFilters: toggleColumnsDropdown,
    });
  }, [refetch, registerActions, toggleImplicitFilters, toggleColumnsDropdown]);

  // Register attachment action to navigate to FormView
  useEffect(() => {
    if (registerAttachmentAction && activeWindow?.windowId && tab) {
      registerAttachmentAction(() => {
        const selectedRecordId = getSelectedRecord(activeWindow.windowId, tab.id);
        if (selectedRecordId) {
          // Set flag to open attachment modal
          setShouldOpenAttachmentModal(true);
          // Navigate to FormView
          setRecordId(selectedRecordId);
        } else {
          logger.warn("No record selected for attachment action");
        }
      });
    }
  }, [
    registerAttachmentAction,
    activeWindow?.windowId,
    tab,
    getSelectedRecord,
    setRecordId,
    setShouldOpenAttachmentModal,
  ]);

  if (error) {
    return (
      <ErrorDisplay
        title={t("errors.tableError.title")}
        description={error?.message}
        showRetry
        onRetry={refetch}
        data-testid="ErrorDisplay__8ca888"
      />
    );
  }

  if (parentTab && !parentRecord) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">{t("errors.selectionError.title")}</div>
          <div className="text-sm">{t("errors.selectionError.description")}</div>
        </div>
      </div>
    );
  }

  // Calculate counter values
  const selectedRecords = Object.keys(table.getState().rowSelection).filter((id) => table.getState().rowSelection[id]);
  const selectedCount = selectedRecords.length;
  const loadedRecords = displayRecords.length;
  const totalRecords = hasMoreRecords ? loadedRecords + 1 : loadedRecords; // Approximate total when more records available

  // Prepare labels for RecordCounterBar with translations
  const counterLabels = {
    showingRecords: t("table.counter.showingRecords"),
    showingPartialRecords: t("table.counter.showingPartialRecords"),
    selectedRecords: t("table.counter.selectedRecords"),
    recordsLoaded: t("table.counter.recordsLoaded"),
  };

  return (
    <div
      className={`h-full overflow-hidden rounded-3xl transition-opacity flex flex-col ${loading ? "opacity-60 cursor-progress cursor-to-children" : "opacity-100"
        }`}>
      <RecordCounterBar
        totalRecords={totalRecords}
        loadedRecords={loadedRecords}
        selectedCount={selectedCount}
        isLoading={loading}
        labels={counterLabels}
        data-testid="RecordCounterBar__8ca888"
      />
      <div className="flex-1 min-h-0">
        <MaterialReactTable table={table} data-testid="MaterialReactTable__8ca888" />
      </div>
      <ColumnVisibilityMenu
        anchorEl={columnMenuAnchor}
        onClose={handleCloseColumnMenu}
        table={table}
        data-testid="ColumnVisibilityMenu__8ca888"
      />
      <CellContextMenu
        anchorEl={contextMenu.anchorEl}
        onClose={handleCloseContextMenu}
        cell={contextMenu.cell}
        row={contextMenu.row}
        onFilterByValue={handleFilterByValue}
        columns={baseColumns}
        data-testid="CellContextMenu__8ca888"
      />
    </div>
  );
};

export default DynamicTable;
