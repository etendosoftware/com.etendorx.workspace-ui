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

import { useCallback } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { MRT_ColumnFiltersState } from "material-react-table";
import {
  ColumnFilterUtils,
  type FilterOption,
  type ColumnFilterState,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useColumnFilters } from "@workspaceui/api-client/src/hooks/useColumnFilters";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";

interface UseGridColumnFiltersParams {
  columns: Column[];
  tabId?: string;
  entityName?: string;
  setAppliedTableFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
}

/**
 * Hook for managing column filters in grids (like WindowReferenceGrid)
 */
export const useGridColumnFilters = ({
  columns,
  tabId,
  entityName,
  setAppliedTableFilters,
  setColumnFilters,
}: UseGridColumnFiltersParams) => {
  const {
    columnFilters: advancedColumnFilters,
    setColumnFilter,
    setFilterOptions,
    loadMoreFilterOptions,
  } = useColumnFilters({
    columns,
  });

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

      setAppliedTableFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        const newFilters = mrtFilter ? [...filtered, mrtFilter] : filtered;
        return newFilters;
      });

      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== columnId);
        return mrtFilter ? [...filtered, mrtFilter] : filtered;
      });
    },
    [setColumnFilter, setAppliedTableFilters, setColumnFilters]
  );

  const handleLoadFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = columns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (ColumnFilterUtils.isSelectColumn(column)) {
        const allOptions = ColumnFilterUtils.getSelectOptions(column);
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
            const currentDatasource = entityName;
            const tabIdStr = tabId;
            const distinctField = column.columnName;

            options = await fetchFilterOptions(
              String(currentDatasource),
              undefined,
              searchQuery,
              20,
              distinctField,
              tabIdStr,
              0
            );
          } else {
            const selectorDefinitionId = column.selectorDefinitionId as string | undefined;
            const datasourceId = column.datasourceId || column.referencedEntity;

            if (datasourceId) {
              options = await fetchFilterOptions(
                String(datasourceId),
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
    [columns, fetchFilterOptions, setFilterOptions, tabId, entityName]
  );

  const handleLoadMoreFilterOptions = useCallback(
    async (columnId: string, searchQuery?: string): Promise<FilterOption[]> => {
      const column = columns.find((col: Column) => col.id === columnId || col.columnName === columnId);
      if (!column) {
        return [];
      }

      if (!ColumnFilterUtils.isTableDirColumn(column)) {
        return [];
      }

      const filterState = advancedColumnFilters.find((f: ColumnFilterState) => f.id === columnId);
      const currentPage = filterState?.currentPage || 0;
      const currentSearchQuery = searchQuery || filterState?.searchQuery;

      loadMoreFilterOptions(columnId, currentSearchQuery);

      try {
        let options: FilterOption[] = [];
        const pageSize = 20;
        const offset = currentPage * pageSize;

        if (ColumnFilterUtils.needsDistinctValues(column)) {
          const currentDatasource = entityName;
          const tabIdStr = tabId;
          const distinctField = column.columnName;

          options = await fetchFilterOptions(
            String(currentDatasource),
            undefined,
            currentSearchQuery,
            pageSize,
            distinctField,
            tabIdStr,
            offset
          );
        } else {
          const selectorDefinitionId = column.selectorDefinitionId as string | undefined;
          const datasourceId = column.datasourceId || column.referencedEntity;

          if (datasourceId) {
            options = await fetchFilterOptions(
              String(datasourceId),
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
    [columns, fetchFilterOptions, setFilterOptions, loadMoreFilterOptions, tabId, entityName, advancedColumnFilters]
  );

  return {
    advancedColumnFilters,
    setColumnFilter,
    setFilterOptions,
    loadMoreFilterOptions,
    handleColumnFilterChange,
    handleLoadFilterOptions,
    handleLoadMoreFilterOptions,
  };
};
