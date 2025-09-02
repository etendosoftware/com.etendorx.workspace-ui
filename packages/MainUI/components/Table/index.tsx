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
  type MRT_ColumnFiltersState,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
  type MRT_VisibilityState,
  type MRT_ExpandedState,
} from "material-react-table";
import { useStyle } from "./styles";
import type { DatasourceOptions, EntityData, Column } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import ColumnVisibilityMenu from "../Toolbar/Menus/ColumnVisibilityMenu";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useLanguage } from "@/contexts/language";
import { useTreeModeMetadata } from "@/hooks/useTreeModeMetadata";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useDatasource } from "@/hooks/useDatasource";
import { useSelected } from "@/hooks/useSelected";
import { useColumns } from "@/hooks/table/useColumns";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { logger } from "@/utils/logger";
import PlusFolderFilledIcon from "../../../ComponentLibrary/src/assets/icons/folder-plus-filled.svg";
import MinusFolderIcon from "../../../ComponentLibrary/src/assets/icons/folder-minus.svg";
import CircleFilledIcon from "../../../ComponentLibrary/src/assets/icons/circle-filled.svg";
import ChevronUp from "../../../ComponentLibrary/src/assets/icons/chevron-up.svg";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check.svg";
import { useColumnFilters } from "@workspaceui/api-client/src/hooks/useColumnFilters";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";

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
  const [expanded, setExpanded] = useState<MRT_ExpandedState>({});
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set());
  const [childrenData, setChildrenData] = useState<Map<string, EntityData[]>>(new Map());
  const [flattenedRecords, setFlattenedRecords] = useState<EntityData[]>([]);

  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({});
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const { graph } = useSelected();

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
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const { registerActions } = useToolbarContext();
  const { tab, parentTab, parentRecord, parentRecords } = useTabContext();
  const { activeWindow, getSelectedRecord } = useMultiWindowURL();
  const { treeMetadata, loading: treeMetadataLoading } = useTreeModeMetadata(tab);
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? "");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasScrolledToSelection = useRef<boolean>(false);

  const shouldUseTreeMode = isTreeMode && treeMetadata.supportsTreeMode && !treeMetadataLoading;
  const treeEntity = shouldUseTreeMode ? treeMetadata.treeEntity || "90034CAE96E847D78FBEF6D38CB1930D" : tab.entityName;

  const rawColumns = useMemo(() => {
    const { parseColumns } = require("@/utils/tableColumns");
    return parseColumns(Object.values(tab.fields));
  }, [tab.fields]);

  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    setFilterOptions,
    loadMoreFilterOptions,
  } = useColumnFilters({
    columns: rawColumns,
  });

  const { fetchFilterOptions } = useColumnFilterData();

  const [appliedTableFilters, setAppliedTableFilters] = useState<MRT_ColumnFiltersState>([]);

  const handleColumnFilterChange = useCallback(
    async (columnId: string, selectedOptions: FilterOption[]) => {
      setColumnFilter(columnId, selectedOptions);

      const mrtFilter =
        selectedOptions.length > 0
          ? {
              id: columnId,
              value: selectedOptions.map((opt) => opt.value),
            }
          : null;

      setAppliedTableFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });

      // Also update MRT column filters state for UI consistency
      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });
    },
    [setColumnFilter]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = rawColumns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (ColumnFilterUtils.isSelectColumn(column)) {
        const allOptions = ColumnFilterUtils.getSelectOptions(column);

        // Filter locally if 's a search query
        const filteredOptions = searchQuery
          ? allOptions.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
          : allOptions;

        setFilterOptions(columnId, filteredOptions, false, false);
        return filteredOptions;
      }

      if (ColumnFilterUtils.isTableDirColumn(column)) {
        try {
          let options: FilterOption[] = [];

          if (ColumnFilterUtils.needsDistinctValues(column)) {
            const currentDatasource = treeEntity;
            const tabIdStr = tab.id;
            const distinctField = column.columnName;

            options = await fetchFilterOptions(
              currentDatasource,
              undefined,
              searchQuery,
              20,
              distinctField,
              tabIdStr,
              0
            );
          } else {
            const selectorDefinitionId = column.selectorDefinitionId;
            const datasourceId = column.datasourceId || column.referencedEntity;

            if (datasourceId) {
              options = await fetchFilterOptions(
                datasourceId,
                selectorDefinitionId,
                searchQuery,
                20,
                undefined,
                undefined,
                0
              );
            }
          }

          const hasMore = options.length === 20;
          setFilterOptions(columnId, options, hasMore, false);
          return options;
        } catch (error) {
          console.error("Error loading filter options:", error);
          setFilterOptions(columnId, [], false, false);
          return [];
        }
      }

      return [];
    },
    [rawColumns, fetchFilterOptions, setFilterOptions, tab.id, treeEntity]
  );

  const handleLoadMoreFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = rawColumns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (!ColumnFilterUtils.isTableDirColumn(column)) {
        return [];
      }

      // Get current filter state to determine pagination
      const filterState = advancedColumnFilters.find((f) => f.id === columnId);
      const currentPage = filterState?.currentPage || 0;
      const currentSearchQuery = searchQuery || filterState?.searchQuery;

      loadMoreFilterOptions(columnId, currentSearchQuery);

      try {
        let options: FilterOption[] = [];

        // Calculate offset for pagination (20 items per page)
        const pageSize = 20;
        const offset = currentPage * pageSize;

        if (ColumnFilterUtils.needsDistinctValues(column)) {
          const currentDatasource = treeEntity;
          const tabIdStr = tab.id;
          const distinctField = column.columnName;

          options = await fetchFilterOptions(
            currentDatasource,
            undefined,
            currentSearchQuery,
            pageSize,
            distinctField,
            tabIdStr,
            offset
          );
        } else {
          const selectorDefinitionId = column.selectorDefinitionId;
          const datasourceId = column.datasourceId || column.referencedEntity;

          if (datasourceId) {
            options = await fetchFilterOptions(
              datasourceId,
              selectorDefinitionId,
              currentSearchQuery,
              pageSize,
              undefined,
              undefined,
              offset
            );
          }
        }

        const hasMore = options.length === pageSize;
        setFilterOptions(columnId, options, hasMore, true);
        return options;
      } catch (error) {
        console.error("Error loading more filter options:", error);
        setFilterOptions(columnId, [], false, true);
        return [];
      }
    },
    [rawColumns, fetchFilterOptions, setFilterOptions, loadMoreFilterOptions, tab.id, treeEntity, advancedColumnFilters]
  );

  const baseColumns = useColumns(tab, {
    onColumnFilter: handleColumnFilterChange,
    onLoadFilterOptions: handleLoadFilterOptions,
    onLoadMoreFilterOptions: handleLoadMoreFilterOptions,
    columnFilterStates: advancedColumnFilters,
  });
  const [prevShouldUseTreeMode, setPrevShouldUseTreeMode] = useState(shouldUseTreeMode);

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
    }: {
      renderedCellValue: React.ReactNode;
      row: MRT_Row<EntityData>;
      table: MRT_TableInstance<EntityData>;
    }) => {
      const hasChildren = row.original.showDropIcon === true;
      const canExpand = shouldUseTreeMode && hasChildren;
      const isExpanded = row.getIsExpanded();
      const isSelected = row.getIsSelected();

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
                {canExpand ? (
                  isExpanded ? (
                    <ChevronUp height={12} width={12} fill={"#3F4A7E"} />
                  ) : (
                    <ChevronDown height={12} width={12} fill={"#3F4A7E"} />
                  )
                ) : null}
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
              {isSelected && <CheckIcon className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none fill-white" />}
            </div>

            {HierarchyIcon && <HierarchyIcon className="min-w-5 min-h-5" fill={"#004ACA"} />}

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

    modifiedColumns[0] = firstColumn;
    return modifiedColumns;
  }, [baseColumns, shouldUseTreeMode]);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || "id";
    const value = parentId;
    const operator = "equals";

    const options: DatasourceOptions = {
      windowId: tab.window,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
    };

    if (language) {
      options.language = language;
    }

    if (value && value !== "" && value !== undefined) {
      options.criteria = [
        {
          fieldName,
          value,
          operator,
        },
      ];
    }

    return options;
  }, [
    tab.parentColumns,
    tab.window,
    tab.id,
    tab.hqlfilterclause?.length,
    tab.sQLWhereClause?.length,
    parentId,
    language,
  ]);

  const loadChildNodes = useCallback(
    async (parentId: string) => {
      if (!shouldUseTreeMode || loadedNodes.has(parentId)) {
        return;
      }

      try {
        const childTreeOptions = {
          isTreeMode: true,
          windowId: tab.window,
          tabId: tab.id,
          referencedTableId: treeMetadata.referencedTableId || "155",
          parentId: parentId,
        };

        const childQuery = {
          ...query,
        };

        const { datasource } = await import("@workspaceui/api-client/src/api/datasource");

        const safePageSize = 1000;
        const startRow = 0;
        const endRow = safePageSize - 1;

        const processedParams = {
          ...childQuery,
          startRow,
          endRow,
          pageSize: safePageSize,
          parentId: parentId,
          tabId: childTreeOptions.tabId,
          windowId: childTreeOptions.windowId,
          referencedTableId: childTreeOptions.referencedTableId,
        };

        const response = await datasource.get(treeEntity, processedParams);

        if (response.ok && response.data?.response?.data) {
          const childNodes = response.data.response.data;

          setChildrenData((prev) => new Map(prev.set(parentId, childNodes)));
          setLoadedNodes((prev) => new Set(prev.add(parentId)));
        } else {
          console.error("❌ Error loading child nodes:", response);
        }
      } catch (error) {
        console.error("❌ Exception loading child nodes:", error);
      }
    },
    [shouldUseTreeMode, loadedNodes, treeEntity, tab, treeMetadata, query]
  );

  const buildFlattenedRecords = useCallback(
    (
      parentRecords: EntityData[],
      expandedState: MRT_ExpandedState,
      childrenMap: Map<string, EntityData[]>
    ): EntityData[] => {
      const result: EntityData[] = [];

      const processNode = (record: EntityData, level = 0, parentTreeId?: string) => {
        const nodeWithLevel = {
          ...record,
          __level: level,
          __isParent: level === 0 ? true : record.showDropIcon === true,
          __originalParentId: record.parentId,
          __treeParentId: parentTreeId || null,
        } as EntityData;
        result.push(nodeWithLevel);

        const nodeId = String(record.id);
        const isExpanded = typeof expandedState === "object" && expandedState[nodeId];

        if (isExpanded && childrenMap.has(nodeId)) {
          const children = childrenMap.get(nodeId) || [];
          for (const childRecord of children) {
            processNode(childRecord, level + 1, nodeId);
          }
        }
      };

      for (const parentRecord of parentRecords) {
        processNode(parentRecord, 0);
      }
      return result;
    },
    []
  );

  const treeOptions = useMemo(
    () =>
      shouldUseTreeMode
        ? {
            isTreeMode: true,
            windowId: tab.window,
            tabId: tab.id,
            referencedTableId: treeMetadata.referencedTableId || "155",
            parentId: -1,
          }
        : undefined,
    [shouldUseTreeMode, tab.id, tab.window, treeMetadata.referencedTableId]
  );

  const skip = useMemo(() => {
    return parentTab ? Boolean(!parentRecord || (parentRecords && parentRecords.length !== 1)) : false;
  }, [parentTab, parentRecord, parentRecords]);

  const stableDatasourceColumns = useMemo(() => {
    return rawColumns;
  }, [rawColumns]);

  const { toggleImplicitFilters, fetchMore, records, removeRecordLocally, error, refetch, loading, hasMoreRecords } =
    useDatasource({
      entity: treeEntity,
      params: query,
      columns: stableDatasourceColumns,
      searchQuery,
      skip,
      treeOptions,
      activeColumnFilters: appliedTableFilters,
    });

  // Initialize row selection from URL parameters with proper validation and logging
  const urlBasedRowSelection = useMemo(() => {
    // Use proper URL state management instead of search params
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window) {
      return {};
    }

    // Get the selected record from URL for this specific tab
    const urlSelectedId = getSelectedRecord(windowId, tab.id);
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

  // Track URL selection changes to detect direct navigation
  const previousURLSelection = useRef<string | null>(null);

  useEffect(() => {
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window) {
      return;
    }

    const currentURLSelection = getSelectedRecord(windowId, tab.id);

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

  useEffect(() => {
    if (prevShouldUseTreeMode !== shouldUseTreeMode) {
      if (!shouldUseTreeMode) {
        setExpanded({});
        setLoadedNodes(new Set());
        setChildrenData(new Map());
        setFlattenedRecords([]);
      }
      refetch();

      setPrevShouldUseTreeMode(shouldUseTreeMode);
    }
  }, [shouldUseTreeMode, prevShouldUseTreeMode, refetch]);

  const displayRecords = shouldUseTreeMode ? flattenedRecords : records;

  useEffect(() => {
    if (shouldUseTreeMode) {
      const flattened = buildFlattenedRecords(records, expanded, childrenData);
      setFlattenedRecords(flattened);
    } else {
      setFlattenedRecords(records);
    }
  }, [records, expanded, childrenData, shouldUseTreeMode, buildFlattenedRecords]);

  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      let newColumnFilters: MRT_ColumnFiltersState;

      if (typeof updaterOrValue === "function") {
        newColumnFilters = updaterOrValue(columnFilters);
      } else {
        newColumnFilters = updaterOrValue;
      }

      setColumnFilters(newColumnFilters);
    },
    [columnFilters]
  );

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
              table.setRowSelection({});
              row.toggleSelected(true);
            } else {
              row.toggleSelected();
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
          const parentSelection = parent ? graph.getSelected(parent) : undefined;

          // Set graph selection for consistency but avoid triggering URL updates
          graph.setSelected(tab, row.original);

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
    ({ table }: { table: MRT_TableInstance<EntityData> }) => <EmptyState table={table} />,
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
  const expandedRef = useRef<MRT_ExpandedState>({});

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: { sx: sx.tablePaper },

    muiTableHeadCellProps: {
      sx: {
        ...sx.tableHeadCell,
      },
    },

    muiTableBodyCellProps: ({ row, column }) => ({
      sx: {
        ...sx.tableBodyCell,
        ...(shouldUseTreeMode &&
          column.id === columns[0]?.id && {
            paddingLeft: `${12 + ((row.original.__level as number) || 0) * 16}px`,
            position: "relative",
          }),
      },
    }),

    displayColumnDefOptions: shouldUseTreeMode
      ? {
          "mrt-row-expand": {
            size: 60,
            muiTableHeadCellProps: {
              sx: {
                display: "none",
              },
            },
            muiTableBodyCellProps: {
              sx: {
                display: "none",
              },
            },
          },
          "mrt-row-select": {
            size: 0,
            muiTableHeadCellProps: {
              sx: {
                display: "none",
              },
            },
            muiTableBodyCellProps: {
              sx: {
                display: "none",
              },
            },
          },
        }
      : {
          "mrt-row-expand": {
            size: 0,
            muiTableHeadCellProps: {
              sx: {
                display: "none",
              },
            },
            muiTableBodyCellProps: {
              sx: {
                display: "none",
              },
            },
          },
        },

    muiTableBodyProps: { sx: sx.tableBody },
    layoutMode: "semantic",
    enableGlobalFilter: false,
    columns,
    data: displayRecords,
    enableRowSelection: true,
    enableMultiRowSelection: true,
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
      if (shouldUseTreeMode) {
        return true;
      }
      const isParentNode = row.original.__isParent !== false;
      const canExpand = row.original.showDropIcon === true && isParentNode;
      return canExpand;
    },
    initialState: {
      density: "compact",
      rowSelection: urlBasedRowSelection,
    },
    renderDetailPanel: undefined,
    onExpandedChange: (newExpanded) => {
      const prevExpanded = expandedRef.current;
      const newExpandedState = typeof newExpanded === "function" ? newExpanded(expanded) : newExpanded;

      setExpanded(newExpandedState);
      expandedRef.current = newExpandedState;

      if (typeof newExpandedState === "object" && newExpandedState !== null && !Array.isArray(newExpandedState)) {
        const prevExpandedObj =
          typeof prevExpanded === "object" && prevExpanded !== null && !Array.isArray(prevExpanded) ? prevExpanded : {};

        const prevKeys = Object.keys(prevExpandedObj).filter((k) => prevExpandedObj[k as keyof typeof prevExpandedObj]);
        const newKeys = Object.keys(newExpandedState).filter(
          (k) => newExpandedState[k as keyof typeof newExpandedState]
        );

        const expandedRowIds = newKeys.filter((k) => !prevKeys.includes(k));
        const collapsedRowIds = prevKeys.filter((k) => !newKeys.includes(k));

        for (const id of expandedRowIds) {
          const rowData = displayRecords.find((record) => String(record.id) === id);

          if (shouldUseTreeMode && rowData && rowData.__isParent !== false) {
            loadChildNodes(String(rowData.id));
          }
        }

        for (const id of collapsedRowIds) {
          setChildrenData((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
          setLoadedNodes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
    },
    state: {
      columnFilters,
      columnVisibility,
      expanded: shouldUseTreeMode ? expanded : {},
      showColumnFilters: true,
      showProgressBars: loading,
    },
    onColumnFiltersChange: handleMRTColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId,
    enableColumnFilters: true,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    renderEmptyRowsFallback,
  });

  useTableSelection(tab, records, table.getState().rowSelection, handleTableSelectionChange);

  // Handle auto-scroll to selected record with virtualization support
  useLayoutEffect(() => {
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window || !displayRecords) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowId, tab.id);
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
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window || !records) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowId, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Check if URL selection is still valid with current data
    const recordExists = records.some((record) => String(record.id) === urlSelectedId);
    const currentSelection = table.getState().rowSelection;
    const isCurrentlySelected = currentSelection[urlSelectedId];

    if (recordExists && !isCurrentlySelected) {
      // Record exists but is not selected - restore URL selection
      table.setRowSelection({ [urlSelectedId]: true });
    } else if (!recordExists && isCurrentlySelected) {
      // Record no longer exists but is still selected - clear selection
      table.setRowSelection({});
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, table]);

  // Handle browser navigation and direct link access
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window || !records) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowId, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Handle case where user navigates directly to a URL with selection
    const recordExists = records.some((record) => String(record.id) === urlSelectedId);
    if (recordExists) {
      const currentSelection = table.getState().rowSelection;
      const isCurrentlySelected = currentSelection[urlSelectedId];

      if (!isCurrentlySelected) {
        logger.info(`[URLNavigation] Applying URL selection for direct navigation: ${urlSelectedId}`);
        table.setRowSelection({ [urlSelectedId]: true });
      }
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, table]);

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

    return () => {
      unregisterDatasource(tabId);
    };
  }, [tabId, removeRecordLocally, registerDatasource, unregisterDatasource, registerRefetchFunction, refetch]);

  useEffect(() => {
    registerActions({
      refresh: refetch,
      filter: toggleImplicitFilters,
      save: async () => {},
      columnFilters: toggleColumnsDropdown,
    });
  }, [refetch, registerActions, toggleImplicitFilters, toggleColumnsDropdown]);

  if (error) {
    return (
      <ErrorDisplay title={t("errors.tableError.title")} description={error?.message} showRetry onRetry={refetch} />
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

  return (
    <>
      {shouldUseTreeMode && (
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
      <div
        className={`h-full overflow-hidden rounded-3xl transition-opacity ${
          loading ? "opacity-60 cursor-progress cursor-to-children" : "opacity-100"
        }`}>
        <MaterialReactTable table={table} />

        <ColumnVisibilityMenu anchorEl={columnMenuAnchor} onClose={handleCloseColumnMenu} table={table} />
      </div>
    </>
  );
};

export default DynamicTable;
