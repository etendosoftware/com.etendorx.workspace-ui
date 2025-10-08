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

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type {
  MRT_ColumnFiltersState,
  MRT_ExpandedState,
  MRT_VisibilityState,
  MRT_SortingState,
} from "material-react-table";
import type { DatasourceOptions, EntityData, Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useSearch } from "../../contexts/searchContext";
import { useLanguage } from "../../contexts/language";
import { useTabContext } from "../../contexts/tab";
import { useTreeModeMetadata } from "../useTreeModeMetadata";
import { useDatasource } from "../useDatasource";
import { useColumns } from "./useColumns";
import { useColumnFilters } from "@workspaceui/api-client/src/hooks/useColumnFilters";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { loadSelectFilterOptions, loadTableDirFilterOptions } from "@/utils/columnFilterHelpers";
import type { ExpandedState, Updater } from "@tanstack/react-table";

interface UseTableDataParams {
  isTreeMode: boolean;
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
}

interface UseTableDataReturn {
  // Data
  displayRecords: EntityData[];
  records: EntityData[];
  columns: Column[];

  // State
  expanded: MRT_ExpandedState;
  loading: boolean;
  error: Error | null;

  // Tree mode
  shouldUseTreeMode: boolean;

  // Handlers
  handleMRTColumnFiltersChange: (
    updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)
  ) => void;
  handleMRTColumnVisibilityChange: (
    updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)
  ) => void;
  handleMRTSortingChange: (updaterOrValue: MRT_SortingState | ((prev: MRT_SortingState) => MRT_SortingState)) => void;
  handleColumnFilterChange: (columnId: string, selectedOptions: FilterOption[]) => Promise<void>;
  handleLoadFilterOptions: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  handleLoadMoreFilterOptions: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  handleMRTExpandChange: ({ newExpanded }: { newExpanded: Updater<ExpandedState> }) => void;

  // Actions
  toggleImplicitFilters: () => void;
  fetchMore: () => void;
  refetch: () => Promise<void>;
  removeRecordLocally: ((id: string) => void) | null;
  hasMoreRecords: boolean;
}

export const useTableData = ({
  isTreeMode,
  onColumnFilter,
  onLoadFilterOptions,
  onLoadMoreFilterOptions,
}: UseTableDataParams): UseTableDataReturn => {
  // State
  const [expanded, setExpanded] = useState<MRT_ExpandedState>({});
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set());
  const [childrenData, setChildrenData] = useState<Map<string, EntityData[]>>(new Map());
  const [flattenedRecords, setFlattenedRecords] = useState<EntityData[]>([]);
  const [prevShouldUseTreeMode, setPrevShouldUseTreeMode] = useState<boolean | null>(null);

  const expandedRef = useRef<MRT_ExpandedState>({});

  // Contexts and hooks
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const {
    tab,
    parentTab,
    parentRecord,
    parentRecords,
    tableColumnFilters,
    setTableColumnFilters,
    tableColumnVisibility,
    setTableColumnVisibility,
    tableSorting,
    setTableSorting,
  } = useTabContext();
  const { treeMetadata, loading: treeMetadataLoading } = useTreeModeMetadata(tab);

  // Computed values
  const parentId = String(parentRecord?.id ?? "");
  const shouldUseTreeMode = isTreeMode && treeMetadata.supportsTreeMode && !treeMetadataLoading;
  const treeEntity = shouldUseTreeMode ? treeMetadata.treeEntity || "90034CAE96E847D78FBEF6D38CB1930D" : tab.entityName;

  // Parse columns
  const rawColumns = useMemo(() => {
    const { parseColumns } = require("@/utils/tableColumns");
    return parseColumns(Object.values(tab.fields));
  }, [tab.fields]);

  // Column filters
  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    setFilterOptions,
    loadMoreFilterOptions,
  } = useColumnFilters({
    columns: rawColumns,
  });

  const { fetchFilterOptions } = useColumnFilterData();

  // Column filter handlers
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

      setTableColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });

      onColumnFilter?.(columnId, selectedOptions);
    },
    [setColumnFilter, onColumnFilter]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = rawColumns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (ColumnFilterUtils.isSelectColumn(column)) {
        return loadSelectFilterOptions(column, columnId, searchQuery, setFilterOptions);
      }

      if (ColumnFilterUtils.isTableDirColumn(column)) {
        return loadTableDirFilterOptions({
          column,
          columnId,
          searchQuery,
          tabId: tab.id,
          entityName: treeEntity,
          fetchFilterOptions,
          setFilterOptions,
        });
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

      const filterState = advancedColumnFilters.find((f) => f.id === columnId);
      const currentPage = filterState?.currentPage || 0;
      const currentSearchQuery = searchQuery || filterState?.searchQuery;

      loadMoreFilterOptions(columnId, currentSearchQuery);

      const pageSize = 20;
      const offset = currentPage * pageSize;

      return loadTableDirFilterOptions({
        column,
        columnId,
        searchQuery: currentSearchQuery,
        tabId: tab.id,
        entityName: treeEntity,
        fetchFilterOptions,
        setFilterOptions,
        offset,
        pageSize,
      });
    },
    [rawColumns, fetchFilterOptions, setFilterOptions, loadMoreFilterOptions, tab.id, treeEntity, advancedColumnFilters]
  );

  // Get columns with filter handlers
  const baseColumns = useColumns(tab, {
    onColumnFilter: onColumnFilter || handleColumnFilterChange,
    onLoadFilterOptions: onLoadFilterOptions || handleLoadFilterOptions,
    onLoadMoreFilterOptions: onLoadMoreFilterOptions || handleLoadMoreFilterOptions,
    columnFilterStates: advancedColumnFilters,
  });

  // Build query
  const query: DatasourceOptions = useMemo(() => {
    const fieldName =
      Array.isArray(tab?.parentColumns) && tab.parentColumns.length > 0
        ? (tab.parentColumns[tab.tabLevel] ?? tab.parentColumns[tab.parentColumns.length - 1] ?? "id")
        : "id";

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

  // Tree options
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

  // Skip condition
  const skip = useMemo(() => {
    return parentTab ? Boolean(!parentRecord || (parentRecords && parentRecords.length !== 1)) : false;
  }, [parentTab, parentRecord, parentRecords]);

  // Stable columns for datasource
  const stableDatasourceColumns = useMemo(() => {
    return rawColumns;
  }, [rawColumns]);

  // Use datasource hook
  const { toggleImplicitFilters, fetchMore, records, removeRecordLocally, error, refetch, loading, hasMoreRecords } =
    useDatasource({
      entity: treeEntity,
      params: query,
      columns: stableDatasourceColumns,
      searchQuery,
      skip,
      treeOptions,
      activeColumnFilters: tableColumnFilters,
    });

  // Display records (tree mode uses flattened, normal mode uses original records)
  const displayRecords = shouldUseTreeMode ? flattenedRecords : records;

  // Load child nodes for tree mode
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

  // Build flattened records for tree mode
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

  // Column filters change handler
  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      let newColumnFilters: MRT_ColumnFiltersState;

      if (typeof updaterOrValue === "function") {
        newColumnFilters = updaterOrValue(tableColumnFilters);
      } else {
        newColumnFilters = updaterOrValue;
      }

      setTableColumnFilters(newColumnFilters);
    },
    [tableColumnFilters, setTableColumnFilters]
  );

  const handleMRTColumnVisibilityChange = useCallback(
    (updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)) => {
      const newVisibility =
        typeof updaterOrValue === "function" ? updaterOrValue(tableColumnVisibility) : updaterOrValue;

      setTableColumnVisibility((prev) => ({ ...prev, ...newVisibility }));
    },
    [tableColumnVisibility, setTableColumnVisibility]
  );

  const handleMRTSortingChange = useCallback(
    (updaterOrValue: MRT_SortingState | ((prev: MRT_SortingState) => MRT_SortingState)) => {
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(tableSorting) : updaterOrValue;

      setTableSorting(newSorting);
    },
    [tableSorting, setTableSorting]
  );

  const handleMRTExpandChange = useCallback(
    ({ newExpanded }: { newExpanded: Updater<ExpandedState> }) => {
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
    [expanded, displayRecords, shouldUseTreeMode, loadChildNodes]
  );

  // Handle tree mode changes
  useEffect(() => {
    // Skip the first render to avoid unnecessary refetch on mount
    if (prevShouldUseTreeMode !== null && prevShouldUseTreeMode !== shouldUseTreeMode) {
      if (!shouldUseTreeMode) {
        setExpanded({});
        setLoadedNodes(new Set());
        setChildrenData(new Map());
        setFlattenedRecords([]);
      }
      refetch();
    }
    setPrevShouldUseTreeMode(shouldUseTreeMode);
  }, [shouldUseTreeMode, prevShouldUseTreeMode, refetch]);

  // Update flattened records when tree data changes
  useEffect(() => {
    if (shouldUseTreeMode) {
      const flattened = buildFlattenedRecords(records, expanded, childrenData);
      setFlattenedRecords(flattened);
    } else {
      setFlattenedRecords(records);
    }
  }, [records, expanded, childrenData, shouldUseTreeMode, buildFlattenedRecords]);

  return {
    // Data
    displayRecords,
    records,
    columns: baseColumns,

    // State
    expanded,
    loading,
    error: error || null,

    // Tree mode
    shouldUseTreeMode,

    // Handlers
    handleMRTColumnFiltersChange,
    handleMRTColumnVisibilityChange,
    handleMRTSortingChange,
    handleColumnFilterChange,
    handleLoadFilterOptions,
    handleLoadMoreFilterOptions,
    handleMRTExpandChange,

    // Actions
    toggleImplicitFilters,
    fetchMore,
    refetch,
    removeRecordLocally,
    hasMoreRecords,
  };
};
