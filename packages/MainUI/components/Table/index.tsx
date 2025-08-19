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
import type { DatasourceOptions, EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { treeMetadata, loading: treeMetadataLoading } = useTreeModeMetadata(tab);
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? "");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const shouldUseTreeMode = isTreeMode && treeMetadata.supportsTreeMode && !treeMetadataLoading;
  const treeEntity = shouldUseTreeMode ? treeMetadata.treeEntity || "90034CAE96E847D78FBEF6D38CB1930D" : tab.entityName;

  const rawColumns = useMemo(() => {
    const { parseColumns } = require("@/utils/tableColumns");
    return parseColumns(Object.values(tab.fields));
  }, [tab.fields]);

  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    loadFilterOptions,
    setFilterOptions,
  } = useColumnFilters({ columns: rawColumns });

  const { fetchFilterOptions } = useColumnFilterData();

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

      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });
    },
    [setColumnFilter]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = rawColumns.find((col: any) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (ColumnFilterUtils.isSelectColumn(column)) {
        const options = ColumnFilterUtils.getSelectOptions(column);
        setFilterOptions(columnId, options);
        return options;
      }

      if (ColumnFilterUtils.isTableDirColumn(column)) {
        loadFilterOptions(columnId, searchQuery);
        
        // For TABLE_DIR columns, use distinct values from current table instead of full entity list
        if (ColumnFilterUtils.needsDistinctValues(column)) {
          const currentDatasource = treeEntity; // Use current table's datasource
          const tabIdStr = tab.id; // Current tab ID
          const distinctField = column.columnName; // Field to get distinct values for
          
          const options = await fetchFilterOptions(
            currentDatasource, 
            undefined, // No selector definition for distinct queries
            searchQuery, 
            20, // limit
            distinctField, // distinct field
            tabIdStr // tab ID
          );
          setFilterOptions(columnId, options);
          return options;
        }
        
        // Fallback to original behavior for non-distinct columns
        const selectorDefinitionId = (column as any).selectorDefinitionId;
        const datasourceId = (column as any).datasourceId || (column as any).referencedEntity;

        if (datasourceId) {
          const options = await fetchFilterOptions(datasourceId, selectorDefinitionId, searchQuery);
          setFilterOptions(columnId, options);
          return options;
        }
      }

      return [];
    },
    [rawColumns, loadFilterOptions, fetchFilterOptions, setFilterOptions, tab.id, treeEntity]
  );

  const baseColumns = useColumns(tab, {
    onColumnFilter: handleColumnFilterChange,
    onLoadFilterOptions: handleLoadFilterOptions,
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

  const { toggleImplicitFilters, fetchMore, records, removeRecordLocally, error, refetch, loading, hasMoreRecords } =
    useDatasource({
      entity: treeEntity,
      params: query,
      columns,
      searchQuery,
      skip: parentTab ? Boolean(!parentRecord || (parentRecords && parentRecords.length !== 1)) : false,
      treeOptions,
      activeColumnFilters: columnFilters,
    });

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
      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection]
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

          const existingTimeout = clickTimeoutsRef.current.get(rowId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            clickTimeoutsRef.current.delete(rowId);
          }

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

          const timeout = clickTimeoutsRef.current.get(rowId);
          if (timeout) {
            clearTimeout(timeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          const parent = graph.getParent(tab);
          const parentSelection = parent ? graph.getSelected(parent) : undefined;

          if (!isSelected) {
            row.toggleSelected();
          }

          graph.setSelected(tab, row.original);

          if (parent && parentSelection) {
            setTimeout(() => graph.setSelected(parent, parentSelection), 10);
          }
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
    initialState: { density: "compact" },
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
