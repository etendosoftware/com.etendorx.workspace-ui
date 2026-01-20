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

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Column } from "../api/types";
import { ColumnFilterUtils, type ColumnFilterState, type FilterOption } from "../utils/column-filter-utils";

export interface UseColumnFiltersProps {
  columns: Column[];
  onFiltersChange?: (filters: ColumnFilterState[]) => void;
}

export interface UseColumnFiltersReturn {
  columnFilters: ColumnFilterState[];
  setColumnFilter: (columnId: string, selectedOptions: FilterOption[]) => void;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFilterState[]>>;
  clearColumnFilter: (columnId: string) => void;
  clearAllFilters: () => void;
  loadFilterOptions: (columnId: string, searchQuery?: string) => Promise<void>;
  setFilterOptions: (columnId: string, options: FilterOption[], hasMore?: boolean, append?: boolean) => void;
  loadMoreFilterOptions: (columnId: string, searchQuery?: string) => void;
  getFilterableColumns: () => Column[];
  hasActiveFilters: boolean;
}

export function useColumnFilters({ columns, onFiltersChange }: UseColumnFiltersProps): UseColumnFiltersReturn {
  const [columnFilters, setColumnFilters] = useState<ColumnFilterState[]>([]);

  // Get columns that support dropdown filtering
  const filterableColumns = useMemo(() => columns.filter(ColumnFilterUtils.supportsDropdownFilter), [columns]);

  // Initialize filter states for filterable columns
  useEffect(() => {
    const initialFilters: ColumnFilterState[] = filterableColumns.map((column) => {
      const existingFilter = columnFilters.find((filter) => filter.id === column.id);

      if (existingFilter) {
        return existingFilter;
      }

      // Initialize with select options if available
      const availableOptions = ColumnFilterUtils.isSelectColumn(column)
        ? ColumnFilterUtils.getSelectOptions(column)
        : [];

      return {
        id: column.id || column.columnName,
        selectedOptions: [],
        isMultiSelect: true, // Allow multi-select by default
        availableOptions,
        loading: false,
      };
    });

    setColumnFilters(initialFilters);
  }, [filterableColumns]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(columnFilters);
  }, [columnFilters, onFiltersChange]);

  const setColumnFilter = useCallback((columnId: string, selectedOptions: FilterOption[]) => {
    setColumnFilters((prev) =>
      prev.map((filter) => (filter.id === columnId ? { ...filter, selectedOptions } : filter))
    );
  }, []);

  const clearColumnFilter = useCallback((columnId: string) => {
    setColumnFilters((prev) =>
      prev.map((filter) => (filter.id === columnId ? { ...filter, selectedOptions: [] } : filter))
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters((prev) => prev.map((filter) => ({ ...filter, selectedOptions: [] })));
  }, []);

  const loadFilterOptions = useCallback(async (columnId: string, searchQuery?: string) => {
    // Just set loading state and search query - actual data loading is handled by the parent component
    setColumnFilters((prev) =>
      prev.map((filter) => (filter.id === columnId ? { ...filter, loading: true, searchQuery } : filter))
    );
  }, []);

  const setFilterOptions = useCallback(
    (columnId: string, options: FilterOption[], hasMore?: boolean, append?: boolean) => {
      setColumnFilters((prev) =>
        prev.map((filter) => {
          if (filter.id !== columnId) return filter;

          return {
            ...filter,
            availableOptions: append ? [...filter.availableOptions, ...options] : options,
            loading: false,
            hasMore: hasMore || false,
            currentPage: append ? (filter.currentPage || 0) + 1 : 1,
          };
        })
      );
    },
    []
  );

  const loadMoreFilterOptions = useCallback((columnId: string, searchQuery?: string) => {
    setColumnFilters((prev) =>
      prev.map((filter) => (filter.id === columnId ? { ...filter, loading: true, searchQuery } : filter))
    );
  }, []);

  const getFilterableColumns = useCallback(() => filterableColumns, [filterableColumns]);

  const hasActiveFilters = useMemo(
    () => columnFilters.some((filter) => filter.selectedOptions.length > 0),
    [columnFilters]
  );

  return {
    columnFilters,
    setColumnFilter,
    setColumnFilters,
    clearColumnFilter,
    clearAllFilters,
    loadFilterOptions,
    setFilterOptions,
    loadMoreFilterOptions,
    getFilterableColumns,
    hasActiveFilters,
  };
}
