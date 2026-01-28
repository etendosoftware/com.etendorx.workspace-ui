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

import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type {
  MRT_ColumnFiltersState,
  MRT_ExpandedState,
  MRT_VisibilityState,
  MRT_SortingState,
} from "material-react-table";
import type { DatasourceOptions, EntityData, Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useSearch } from "../../contexts/searchContext";
import { useLanguage } from "../../contexts/language";
import { useTabContext } from "../../contexts/tab";
import { useWindowContext } from "../../contexts/window";
import { useToolbarContext } from "../../contexts/ToolbarContext";
import { useTableStatePersistenceTab } from "../useTableStatePersistenceTab";
import { useTreeModeMetadata } from "../useTreeModeMetadata";
import { useDatasource } from "../useDatasource";
import { useColumns } from "./useColumns";
import { useColumnFilters } from "@workspaceui/api-client/src/hooks/useColumnFilters";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { loadSelectFilterOptions, loadTableDirFilterOptions } from "@/utils/columnFilterHelpers";
import type { ExpandedState, Updater } from "@tanstack/react-table";
import { isEmptyObject } from "@/utils/commons";
import { mapSummariesToBackend, getSummaryCriteria } from "@/utils/table/utils";

interface UseTableDataParams {
  isTreeMode: boolean;
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
}

export interface SummaryResult {
  value: number | string;
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
  handleMRTColumnOrderChange: (updaterOrValue: string[] | ((prev: string[]) => string[])) => void;
  handleColumnFilterChange: (columnId: string, selectedOptions: FilterOption[]) => Promise<void>;
  handleDateTextFilterChange: (columnId: string, filterValue: string) => void;
  handleLoadFilterOptions: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  handleLoadMoreFilterOptions: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  handleMRTExpandChange: ({ newExpanded }: { newExpanded: Updater<ExpandedState> }) => void;

  // Actions
  toggleImplicitFilters: () => void;
  fetchMore: () => void;
  refetch: () => Promise<void>;
  removeRecordLocally: ((id: string) => void) | null;
  updateRecordLocally: (recordId: string, updatedRecord: EntityData) => void;
  addRecordLocally: (newRecord: EntityData) => void;
  hasMoreRecords: boolean;
  applyQuickFilter: (
    columnId: string,
    filterId: string,
    filterValue: string | number,
    filterLabel: string
  ) => Promise<void>;
  isImplicitFilterApplied: boolean;
  tableColumnFilters: MRT_ColumnFiltersState;
  tableColumnVisibility: MRT_VisibilityState;
  fetchSummary: (summaries: Record<string, string>) => Promise<Record<string, number | string> | null>;
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
  const hasBeenInGridMode = useRef<boolean>(false);

  // Contexts and hooks
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { tab, parentTab, parentRecord, parentRecords } = useTabContext();
  const { activeWindow, getTabFormState, getTabInitializedWithDirectLink, setTabInitializedWithDirectLink } =
    useWindowContext();
  const { setIsImplicitFilterApplied: setToolbarFilterApplied } = useToolbarContext();

  const {
    tableColumnFilters,
    tableColumnVisibility,
    isImplicitFilterApplied,
    setTableColumnFilters,
    setTableColumnVisibility,
    setTableColumnSorting,
    setTableColumnOrder,
    setIsImplicitFilterApplied,
    tableColumnSorting,
    advancedCriteria,
  } = useTableStatePersistenceTab({
    windowIdentifier: activeWindow?.windowIdentifier || "",
    tabId: tab.id,
    tabLevel: tab.tabLevel,
  });
  const { treeMetadata, loading: treeMetadataLoading } = useTreeModeMetadata(tab);

  // Computed values
  const parentId = String(parentRecord?.id ?? "");
  const shouldUseTreeMode = isTreeMode && treeMetadata.supportsTreeMode && !treeMetadataLoading;
  const treeEntity = shouldUseTreeMode ? treeMetadata.treeEntity || "90034CAE96E847D78FBEF6D38CB1930D" : tab.entityName;

  const tabFormState = activeWindow?.windowIdentifier
    ? getTabFormState(activeWindow.windowIdentifier, tab.id)
    : undefined;
  const hasSelectedRecord = !!tabFormState?.recordId && tabFormState.recordId !== NEW_RECORD_ID;

  // Parse columns
  const rawColumns = useMemo(() => {
    const { parseColumns } = require("@/utils/tableColumns");
    return parseColumns(Object.values(tab.fields));
  }, [tab.fields]);

  const initialIsFilterApplied = useMemo(() => {
    return tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0;
  }, [tab.hqlfilterclause, tab.sQLWhereClause]);

  // Column filters
  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    setColumnFilters,
    setFilterOptions,
    loadFilterOptions,
    loadMoreFilterOptions,
  } = useColumnFilters({
    columns: rawColumns,
  });

  const { fetchFilterOptions } = useColumnFilterData();

  // Column filter handlers
  const handleColumnFilterChange = useCallback(
    async (columnId: string, selectedOptions: FilterOption[]) => {
      setColumnFilter(columnId, selectedOptions);

      // Store complete FilterOption[] to preserve id, label, and value
      // This allows proper reconstruction of filter state when switching windows
      const mrtFilter =
        selectedOptions.length > 0
          ? {
              id: columnId,
              value: selectedOptions,
            }
          : null;

      setTableColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });

      onColumnFilter?.(columnId, selectedOptions);
    },
    [setColumnFilter, onColumnFilter, setTableColumnFilters]
  );

  const handleDateTextFilterChange = useCallback(
    (columnId: string, filterValue: string) => {
      // Find the column to get its columnName for consistent filter key
      const column = rawColumns.find((col: Column) => col.columnName === columnId || col.id === columnId);

      // Always use columnName as the filter ID for consistency
      const filterKey = column?.columnName || columnId;

      // For date filters, pass the value as a string (not as FilterOption array)
      // This preserves range filter detection (e.g., "2025-09-29 - 2025-09-30")
      const mrtFilter = filterValue?.trim()
        ? {
            id: filterKey,
            value: filterValue,
          }
        : null;

      setTableColumnFilters((prev) => {
        // Remove any previous filter for this column using any ID variant
        const filtered = prev.filter((f) => {
          if (column) {
            // Remove by columnName (new standard), id (old display name), or provided columnId
            return f.id !== column.columnName && f.id !== column.id && f.id !== columnId;
          }
          return f.id !== columnId;
        });
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });
    },
    [rawColumns, setTableColumnFilters]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = rawColumns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      // Set loading state before fetching data
      await loadFilterOptions(columnId, searchQuery);

      // Handle TableDir columns (backend search)
      if (ColumnFilterUtils.isTableDirColumn(column)) {
        return loadTableDirFilterOptions({
          column,
          columnId,
          searchQuery,
          tabId: tab.id,
          entityName: treeEntity,
          fetchFilterOptions,
          setFilterOptions,
          isImplicitFilterApplied,
        });
      }

      // Handle Select/List columns (static or reference)
      if (ColumnFilterUtils.supportsDropdownFilter(column)) {
        return loadSelectFilterOptions(column, columnId, searchQuery, setFilterOptions);
      }

      return [];
    },
    [rawColumns, fetchFilterOptions, setFilterOptions, loadFilterOptions, tab.id, treeEntity, isImplicitFilterApplied]
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
        isImplicitFilterApplied,
      });
    },
    [
      rawColumns,
      fetchFilterOptions,
      setFilterOptions,
      loadMoreFilterOptions,
      tab.id,
      treeEntity,
      advancedColumnFilters,
      isImplicitFilterApplied,
    ]
  );

  // Get columns with filter handlers
  const baseColumns = useColumns(tab, {
    onColumnFilter: onColumnFilter || handleColumnFilterChange,
    onDateTextFilterChange: handleDateTextFilterChange,
    onLoadFilterOptions: onLoadFilterOptions || handleLoadFilterOptions,
    onLoadMoreFilterOptions: onLoadMoreFilterOptions || handleLoadMoreFilterOptions,
    columnFilterStates: advancedColumnFilters,
    tableColumnFilters,
  });

  // Build query
  // Helper to determine default sort
  const getDefaultSort = useCallback(() => {
    if (!tab) return null;

    // 1. Tab Level: Order By Clause
    const orderByClause = tab.hqlorderbyclause || tab.sQLOrderByClause;
    if (orderByClause) {
      const parts = orderByClause.trim().split(/\s+/);
      const fieldName = parts[0];
      const desc = parts.length > 1 && parts[1].toUpperCase() === "DESC";

      // Try to find the field to get its UI ID (name)
      const field = Object.values(tab.fields).find(
        (f) => f.hqlName === fieldName || f.columnName === fieldName || f.name === fieldName
      );

      return {
        id: field?.name ?? fieldName,
        desc,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = Object.values(tab.fields) as any[];

    // 2. Field Level: Record Sort No
    const sortNoFields = fields.filter((f) => f.recordSortNo != null);
    if (sortNoFields.length > 0) {
      sortNoFields.sort((a, b) => a.recordSortNo - b.recordSortNo);
      return {
        id: sortNoFields[0].name,
        desc: false,
      };
    }

    // 3. Field Level: Identifier
    const identifierFields = fields.filter((field) => {
      const col = field.column;
      if (!col) return false;
      // Check both boolean true and string "true" values
      return (
        col?.isIdentifier === true ||
        col?.isIdentifier === "true" ||
        col?.identifier === true ||
        col?.identifier === "true"
      );
    });

    if (identifierFields.length > 0) {
      const sortedIdentifierFields = identifierFields.toSorted(
        (a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0)
      );
      const identifierField = sortedIdentifierFields[0];
      return {
        id: identifierField.name,
        desc: false,
      };
    }

    return null;
  }, [tab]);

  // Helper to find parent field name
  const getParentFieldName = useCallback(() => {
    if (!Array.isArray(tab?.parentColumns) || tab.parentColumns.length === 0) {
      return "id";
    }

    if (!parentTab) {
      return tab.parentColumns[0] || "id";
    }

    const matchingField = tab.parentColumns.find((colName) => {
      const field = tab.fields[colName];
      return field?.referencedEntity === parentTab.entityName;
    });

    return matchingField || tab.parentColumns[0] || "id";
  }, [tab.parentColumns, tab.fields, parentTab]);

  // Helper to apply sort options to query
  const applySortToOptions = useCallback(
    (options: DatasourceOptions, sort: ReturnType<typeof getDefaultSort>) => {
      if (!sort) return;

      const field = Object.values(tab.fields).find((f) => f.name === sort.id);
      const sortField = field?.hqlName || sort.id;

      options.sortBy = sort.desc ? `-${sortField}` : sortField;
      options.isSorting = true;
    },
    [tab.fields]
  );

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = getParentFieldName();
    const value = parentId;
    const operator = "equals";

    const options: DatasourceOptions = {
      windowId: tab.window,
      tabId: tab.id,
      isImplicitFilterApplied: isImplicitFilterApplied ?? initialIsFilterApplied,
      pageSize: 100,
    };

    if (language) {
      options.language = language;
    }

    if (value && value !== "" && value !== undefined) {
      options.criteria = [{ fieldName, value, operator }];
    }

    // Apply advanced criteria
    if (advancedCriteria) {
      if (options.criteria) {
        // @ts-ignore - advancedCriteria is compatible with Criteria
        options.criteria.push(advancedCriteria);
      } else {
        // @ts-ignore - advancedCriteria is compatible with Criteria
        options.criteria = [advancedCriteria];
      }
    } else {
      console.log("useTableData: No advancedCriteria found");
    }

    // Apply sorting
    if (tableColumnSorting?.length > 0) {
      applySortToOptions(options, tableColumnSorting[0]);
    } else {
      applySortToOptions(options, getDefaultSort());
    }

    return options;
  }, [
    tab.window,
    tab.id,
    initialIsFilterApplied,
    isImplicitFilterApplied,
    parentId,
    language,
    tableColumnSorting,
    advancedCriteria,
    getDefaultSort,
    getParentFieldName,
    applySortToOptions,
  ]);

  // Tree options
  const treeOptions = useMemo(
    () =>
      shouldUseTreeMode
        ? {
            isTreeMode: true,
            windowId: tab.window,
            tabId: tab.id,
            referencedTableId: treeMetadata.referencedTableId,
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
  const {
    fetchMore,
    records,
    removeRecordLocally,
    updateRecordLocally,
    addRecordLocally,
    error,
    refetch,
    loading,
    hasMoreRecords,
  } = useDatasource({
    entity: treeEntity,
    params: query,
    columns: stableDatasourceColumns,
    searchQuery,
    skip,
    treeOptions,
    activeColumnFilters: tableColumnFilters,
    isImplicitFilterApplied: isImplicitFilterApplied ?? initialIsFilterApplied,
    setIsImplicitFilterApplied,
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
          referencedTableId: treeMetadata.referencedTableId,
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

        const response = (await datasource.get(treeEntity, processedParams)) as {
          ok: boolean;
          data: { response?: { data?: EntityData[] } };
        };

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
    (records: EntityData[], expandedState: MRT_ExpandedState, childrenMap: Map<string, EntityData[]>): EntityData[] => {
      const result: EntityData[] = [];
      const recordIds = new Set(records.map((r) => String(r.id)));
      const localChildren = new Map<string, EntityData[]>();
      const roots: EntityData[] = [];

      // Partition records into roots and children based on whether their parent is in the list
      records.forEach((record) => {
        const pId = record.parentId ? String(record.parentId) : null;
        if (pId && recordIds.has(pId)) {
          if (!localChildren.has(pId)) {
            localChildren.set(pId, []);
          }
          localChildren.get(pId)?.push(record);
        } else {
          roots.push(record);
        }
      });

      const sortRecords = (list: EntityData[]) => {
        return list.sort((a, b) => {
          // Compare seqno first
          if (typeof a.seqno === "number" && typeof b.seqno === "number") {
            if (a.seqno !== b.seqno) return a.seqno - b.seqno;
          }

          // Fallback to identifier/name string comparison
          const nameA = String(a._identifier || a.name || "").toLowerCase();
          const nameB = String(b._identifier || b.name || "").toLowerCase();

          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      };

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

        if (isExpanded) {
          const fetchedChildren = childrenMap.get(nodeId) || [];
          const localChildNodes = localChildren.get(nodeId) || [];

          // Merge and deduplicate
          const combinedChildrenMap = new Map<string, EntityData>();
          [...fetchedChildren, ...localChildNodes].forEach((child) => {
            combinedChildrenMap.set(String(child.id), child);
          });

          const sortedChildren = sortRecords(Array.from(combinedChildrenMap.values()));

          for (const childRecord of sortedChildren) {
            processNode(childRecord, level + 1, nodeId);
          }
        }
      };

      const sortedRoots = sortRecords(roots);

      for (const rootRecord of sortedRoots) {
        processNode(rootRecord, 0);
      }
      return result;
    },
    []
  );

  // Column filters change handler
  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      setTableColumnFilters(updaterOrValue);
    },
    [setTableColumnFilters]
  );

  // NOTE: this can implies some extra config
  const handleMRTColumnVisibilityChange = useCallback(
    (updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)) => {
      setTableColumnVisibility(updaterOrValue);
    },
    [setTableColumnVisibility]
  );

  const handleMRTSortingChange = useCallback(
    (updaterOrValue: MRT_SortingState | ((prev: MRT_SortingState) => MRT_SortingState)) => {
      setTableColumnSorting(updaterOrValue);
    },
    [setTableColumnSorting]
  );

  const handleMRTColumnOrderChange = useCallback(
    (updaterOrValue: string[] | ((prev: string[]) => string[])) => {
      setTableColumnOrder(updaterOrValue);
    },
    [setTableColumnOrder]
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

        const prevKeys = Object.entries(prevExpandedObj)
          .filter(([, value]) => value)
          .map(([key]) => key);
        const newKeys = Object.entries(newExpandedState)
          .filter(([, value]) => value)
          .map(([key]) => key);

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

  const handleToggleImplicitFilters = useCallback(() => {
    if (!isImplicitFilterApplied) {
      handleMRTColumnFiltersChange([]);
      return;
    }
    setIsImplicitFilterApplied(false);
  }, [isImplicitFilterApplied, setIsImplicitFilterApplied, handleMRTColumnFiltersChange]);

  const hasInitializedDirectLink = useRef(false);

  /** Track when tab is in grid mode */
  useEffect(() => {
    const isGridMode = !tabFormState || tabFormState.mode !== "form";
    if (isGridMode && !hasBeenInGridMode.current) {
      hasBeenInGridMode.current = true;
    }
  }, [tabFormState]);

  /** Initialize implicit filter state */
  /** Initialize implicit filter state */
  useEffect(() => {
    if (!hasInitializedDirectLink.current) {
      const windowIdentifier = activeWindow?.windowIdentifier;

      const initializeDirectLink = () => {
        if (isImplicitFilterApplied !== false) {
          setIsImplicitFilterApplied(false);
        }

        if (!hasBeenInGridMode.current && tabFormState?.recordId && windowIdentifier) {
          const currentIdFilter = tableColumnFilters.find((f) => f.id === "id");
          if (currentIdFilter?.value !== tabFormState.recordId) {
            setTableColumnFilters([{ id: "id", value: tabFormState.recordId }]);
          }
          setTabInitializedWithDirectLink(windowIdentifier, tab.id, true);
        }
        hasInitializedDirectLink.current = true;
      };

      const initializeDefault = () => {
        setIsImplicitFilterApplied(initialIsFilterApplied);
        hasInitializedDirectLink.current = true;
      };

      if (hasSelectedRecord && tabFormState?.mode === "form") {
        initializeDirectLink();
      } else if (isImplicitFilterApplied === undefined) {
        initializeDefault();
      }
    }
  }, [
    initialIsFilterApplied,
    isImplicitFilterApplied,
    setIsImplicitFilterApplied,
    hasSelectedRecord,
    tabFormState,
    setTableColumnFilters,
    tableColumnFilters,
    activeWindow,
    tab.id,
    setTabInitializedWithDirectLink,
  ]);

  /** Clear ID filter when returning to grid mode from manual navigation */
  useEffect(() => {
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowIdentifier) return;

    // If we are NOT in form mode (meaning we are in grid/table mode)
    const isGridMode = !tabFormState || tabFormState.mode !== "form";

    if (isGridMode) {
      const hasIdFilter = tableColumnFilters.some((f) => f.id === "id");
      const wasInitializedWithDirectLink = getTabInitializedWithDirectLink(windowIdentifier, tab.id);

      // Only clear the ID filter if we did NOT initialize with a direct link
      // This preserves the filter for direct link scenarios while clearing it for manual navigation
      if (hasIdFilter && !wasInitializedWithDirectLink) {
        setTableColumnFilters((prev) => prev.filter((f) => f.id !== "id"));

        // Restore implicit filters if they were initially applied and are currently disabled
        if (initialIsFilterApplied && isImplicitFilterApplied === false) {
          setIsImplicitFilterApplied(true);
        }
      }
    }
  }, [
    tabFormState,
    tableColumnFilters,
    setTableColumnFilters,
    initialIsFilterApplied,
    isImplicitFilterApplied,
    setIsImplicitFilterApplied,
    activeWindow,
    tab.id,
    getTabInitializedWithDirectLink,
  ]);

  /** Detect manual filter removal and clear direct link flag */
  useEffect(() => {
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowIdentifier) return;

    const hasIdFilter = tableColumnFilters.some((f) => f.id === "id");
    const wasInitializedWithDirectLink = getTabInitializedWithDirectLink(windowIdentifier, tab.id);

    // If the ID filter was removed manually and we had marked this as a direct link,
    // clear the direct link flag so future navigation behaves like manual navigation
    if (!hasIdFilter && wasInitializedWithDirectLink) {
      setTabInitializedWithDirectLink(windowIdentifier, tab.id, false);
    }
  }, [tableColumnFilters, activeWindow, tab.id, getTabInitializedWithDirectLink, setTabInitializedWithDirectLink]);

  // Clear filters when parent selection changes
  // This ensures that if we were filtering by a specific ID (e.g. from direct link),
  // changing the parent record will reset the view to show all child records for the new parent
  const prevParentIdRef = useRef<string | undefined>(parentRecord?.id ? String(parentRecord.id) : undefined);

  useEffect(() => {
    // Only clear filters if the parent ID has actually CHANGED from a previous valid ID
    // This prevents clearing filters on initial load when the parent ID is first set
    if (parentRecord?.id && prevParentIdRef.current && parentRecord.id !== prevParentIdRef.current) {
      const hasIdFilter = tableColumnFilters.some((f) => f.id === "id");
      if (hasIdFilter) {
        setTableColumnFilters([]);
        setIsImplicitFilterApplied(true);
      }
    }
    // Update ref for next render
    prevParentIdRef.current = parentRecord?.id ? String(parentRecord.id) : undefined;
  }, [parentRecord?.id, setTableColumnFilters, setIsImplicitFilterApplied, tableColumnFilters]);

  /** Sync implicit filter state with toolbar context */
  useEffect(() => {
    const hasIdFilter = tableColumnFilters.some((f) => f.id === "id");
    const isFiltered = (isImplicitFilterApplied ?? false) || hasIdFilter;
    setToolbarFilterApplied(isFiltered);
  }, [isImplicitFilterApplied, tableColumnFilters, setToolbarFilterApplied]);

  /** Clear advanced column filters when table filters are cleared */
  useEffect(() => {
    // If tableColumnFilters is empty (cleared externally), clear advanced column filters as well
    if (tableColumnFilters.length === 0) {
      const hasActiveAdvancedFilters = advancedColumnFilters.some((filter) => filter.selectedOptions.length > 0);

      if (hasActiveAdvancedFilters) {
        // Clear all selected options in advanced filters to sync with MRT state
        setColumnFilters((prev) =>
          prev.map((filter) => ({
            ...filter,
            selectedOptions: [],
          }))
        );
      }
    }
  }, [tableColumnFilters, advancedColumnFilters, setColumnFilters]);

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

  // Initialize column visibility based on tab configuration
  useEffect(() => {
    if (!isEmptyObject(tableColumnVisibility)) return;

    const initialVisibility: MRT_VisibilityState = {};
    if (tab.fields) {
      for (const field of Object.values(tab.fields)) {
        if (field.showInGridView !== undefined && field.name) {
          initialVisibility[field.name] = field.showInGridView;
        }
      }
    }

    setTableColumnVisibility(initialVisibility);
  }, [tab.fields, tableColumnVisibility, setTableColumnVisibility]);

  // Initialize default sorting
  useEffect(() => {
    // Only initialize if there's no current sorting
    if (tableColumnSorting.length === 0 && tab.fields) {
      const defaultSort = getDefaultSort();

      if (defaultSort) {
        setTableColumnSorting([
          {
            id: defaultSort.id,
            desc: defaultSort.desc,
          },
        ]);
      }
    }
  }, [tab.fields, tableColumnSorting.length, setTableColumnSorting, getDefaultSort]);

  // Apply quick filter from context menu
  const applyQuickFilter = useCallback(
    async (columnId: string, filterId: string, filterValue: string | number, filterLabel: string) => {
      const column = baseColumns.find((col) => col.columnName === columnId || col.id === columnId);
      if (!column) {
        return;
      }

      const filterOption: FilterOption = {
        id: filterId,
        label: filterLabel,
        value: String(filterValue),
      };

      const existingFilter = advancedColumnFilters.find((f) => f.id === columnId);
      const optionExists = existingFilter?.availableOptions.some((opt) => opt.id === filterOption.id);
      const isBooleanOrYesNo = column.type === "boolean" || column.column?._identifier === "YesNo";

      // For boolean/YesNo columns, create the filter entry if it doesn't exist
      if (isBooleanOrYesNo && !existingFilter) {
        const booleanOptions: FilterOption[] = [
          { id: "true", label: "Yes", value: "true" },
          { id: "false", label: "No", value: "false" },
        ];

        const newFilter: ColumnFilterState = {
          id: columnId,
          selectedOptions: [filterOption],
          isMultiSelect: true,
          availableOptions: booleanOptions,
          loading: false,
        };

        setColumnFilters((prev) => [...prev, newFilter]);

        const mrtFilter = {
          id: columnId,
          value: [filterOption.value],
        };
        setTableColumnFilters((prev) => {
          const filtered = prev.filter((f) => f.id !== columnId);
          return [...filtered, mrtFilter];
        });

        onColumnFilter?.(columnId, [filterOption]);
        return;
      }

      // For TableDir columns, ensure the option is available in the dropdown
      if (ColumnFilterUtils.isTableDirColumn(column) && !optionExists) {
        const existingOptions = existingFilter?.availableOptions || [];
        setFilterOptions(columnId, [...existingOptions, filterOption], false, false);
      }

      // For text/date columns (primitives), use handleDateTextFilterChange to store as string
      // This ensures TextFilter receives the value correctly
      const isTextOrDateColumn =
        !isBooleanOrYesNo && !ColumnFilterUtils.isTableDirColumn(column) && !ColumnFilterUtils.isSelectColumn(column);
      if (isTextOrDateColumn) {
        handleDateTextFilterChange(column.columnName || columnId, String(filterValue));
      } else {
        // For dropdown filters (boolean, TableDir, Select), use handleColumnFilterChange
        await handleColumnFilterChange(columnId, [filterOption]);
      }
    },
    [
      baseColumns,
      handleColumnFilterChange,
      handleDateTextFilterChange,
      setFilterOptions,
      advancedColumnFilters,
      setColumnFilters,
      setTableColumnFilters,
      onColumnFilter,
    ]
  );

  // Fetch summary data
  const fetchSummary = useCallback(
    async (summaries: Record<string, string>): Promise<Record<string, number | string> | null> => {
      if (Object.keys(summaries).length === 0) return null;

      const { summaryRequest, columnMapping } = mapSummariesToBackend(summaries, baseColumns);
      if (Object.keys(summaryRequest).length === 0) return null;

      const combinedCriteria = getSummaryCriteria(query, tableColumnFilters, baseColumns);
      const { sortBy: _sortBy, pageSize: _pageSize, ...cleanQuery } = query;

      const summaryQuery = {
        ...cleanQuery,
        criteria: combinedCriteria,
        _summary: JSON.stringify(summaryRequest),
        _noCount: true,
        _startRow: 0,
        _endRow: 1,
        _operationType: "fetch",
        _textMatchStyle: "substring",
        _noActiveFilter: false,
        _className: "OBViewDataSource",
        Constants_FIELDSEPARATOR: "$",
        Constants_IDENTIFIER: "_identifier",
        operator: "and",
        _constructor: "AdvancedCriteria",
      };

      try {
        const { datasource } = await import("@workspaceui/api-client/src/api/datasource");
        const response = (await datasource.get(treeEntity, summaryQuery)) as {
          ok: boolean;
          data: { response?: { data?: Record<string, unknown>[] } };
        };

        const firstResult = response.ok ? (response.data?.response?.data?.[0] as Record<string, unknown>) : null;
        if (!firstResult) return null;

        const results: Record<string, number | string> = {};
        for (const [backendName, originalId] of Object.entries(columnMapping)) {
          if (firstResult[backendName] !== undefined) {
            results[originalId] = firstResult[backendName] as number | string;
          }
        }
        return results;
      } catch (error) {
        console.error("Exception fetching summary:", error);
        return null;
      }
    },
    [query, treeEntity, baseColumns, tableColumnFilters]
  );

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
    handleDateTextFilterChange,
    handleLoadFilterOptions,
    handleLoadMoreFilterOptions,
    handleMRTColumnOrderChange,
    handleMRTExpandChange,

    // Actions
    toggleImplicitFilters: handleToggleImplicitFilters,
    fetchMore,
    refetch,
    removeRecordLocally,
    updateRecordLocally,
    addRecordLocally,
    applyQuickFilter,
    isImplicitFilterApplied: isImplicitFilterApplied ?? initialIsFilterApplied,
    tableColumnFilters,
    tableColumnVisibility,
    fetchSummary,
    hasMoreRecords,
  };
};
