import { useCallback } from "react";
import type { MRT_ColumnFiltersState } from "material-react-table";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { useColumnFilters } from "@workspaceui/api-client/src/hooks/useColumnFilters";
import { loadTableDirFilterOptions } from "@/utils/columnFilterHelpers";

interface UseSelectorFilterHandlersParams {
  datasourceColumns: Column[];
  targetEntity: string | undefined;
  currentTabId: string | undefined;
  setColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  extraParams?: Record<string, unknown>;
}

export function useSelectorFilterHandlers({
  datasourceColumns,
  targetEntity,
  currentTabId,
  setColumnFilters,
  extraParams,
}: UseSelectorFilterHandlersParams) {
  const { fetchFilterOptions } = useColumnFilterData();
  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    setFilterOptions,
  } = useColumnFilters({ columns: datasourceColumns });

  const handleTextFilterChange = useCallback(
    (columnId: string, filterValue: string) => {
      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return [...filtered, { id: columnId, value: filterValue?.trim() || "" }];
      });
    },
    [setColumnFilters]
  );

  const handleBooleanFilterChange = useCallback(
    (columnId: string, selectedOptions: FilterOption[]) => {
      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return selectedOptions.length > 0 ? [...filtered, { id: columnId, value: selectedOptions }] : filtered;
      });
    },
    [setColumnFilters]
  );

  const handleDropdownFilterChange = useCallback(
    (columnId: string, selectedOptions: FilterOption[]) => {
      setColumnFilter(columnId, selectedOptions);
      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        // Always keep the entry (even empty) so the preloaded default is not restored
        return [...filtered, { id: columnId, value: selectedOptions }];
      });
    },
    [setColumnFilter, setColumnFilters]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string) => {
      const column = datasourceColumns.find((c) => c.columnName === columnId);
      if (!column) return [];
      return loadTableDirFilterOptions({
        column,
        columnId,
        searchQuery,
        tabId: currentTabId || "",
        entityName: targetEntity || "",
        fetchFilterOptions,
        setFilterOptions,
        isImplicitFilterApplied: false,
        extraParams,
      });
    },
    [datasourceColumns, currentTabId, targetEntity, fetchFilterOptions, setFilterOptions, extraParams]
  );

  const handleLoadMoreFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string) => {
      const column = datasourceColumns.find((c) => c.columnName === columnId);
      if (!column) return [];
      const filterState = advancedColumnFilters.find((f: ColumnFilterState) => f.id === columnId);
      const offset = (filterState?.currentPage || 1) * 20;
      return loadTableDirFilterOptions({
        column,
        columnId,
        searchQuery,
        tabId: currentTabId || "",
        entityName: targetEntity || "",
        fetchFilterOptions,
        setFilterOptions,
        offset,
        isImplicitFilterApplied: false,
        extraParams,
      });
    },
    [
      datasourceColumns,
      currentTabId,
      targetEntity,
      fetchFilterOptions,
      setFilterOptions,
      advancedColumnFilters,
      extraParams,
    ]
  );

  return {
    advancedColumnFilters,
    handleTextFilterChange,
    handleBooleanFilterChange,
    handleDropdownFilterChange,
    handleLoadFilterOptions,
    handleLoadMoreFilterOptions,
  };
}
