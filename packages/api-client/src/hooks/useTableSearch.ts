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

import { useState, useCallback, useMemo } from "react";
import type { Column, CompositeCriteria } from "../api/types";
import { SearchUtils } from "../utils/search-utils";
import { ColumnFilterUtils } from "../utils/column-filter-utils";
import { useColumnFilters } from "./useColumnFilters";
import type { ColumnFilterState, FilterOption } from "../utils/column-filter-utils";

export interface UseTableSearchProps {
  columns: Column[];
  onSearchChange?: (criteria: CompositeCriteria[]) => void;
}

export interface UseTableSearchReturn {
  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Column filters
  columnFilters: ColumnFilterState[];
  setColumnFilter: (columnId: string, selectedOptions: FilterOption[]) => void;
  clearColumnFilter: (columnId: string) => void;
  clearAllFilters: () => void;
  loadFilterOptions: (columnId: string, searchQuery?: string) => Promise<void>;
  getFilterableColumns: () => Column[];
  
  // Combined state
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
  searchCriteria: CompositeCriteria[];
  
  // Actions
  clearAllSearchAndFilters: () => void;
}

export function useTableSearch({
  columns,
  onSearchChange,
}: UseTableSearchProps): UseTableSearchReturn {
  const [searchQuery, setSearchQueryState] = useState("");

  // Column filters hook
  const {
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    loadFilterOptions,
    getFilterableColumns,
    hasActiveFilters,
  } = useColumnFilters({
    columns,
    onFiltersChange: (filters) => {
      // Recalculate search criteria when column filters change
      const criteria = SearchUtils.combineSearchAndColumnFilters(columns, searchQuery, filters);
      onSearchChange?.(criteria);
    },
  });

  // Combined search criteria
  const searchCriteria = useMemo(() => {
    return SearchUtils.combineSearchAndColumnFilters(columns, searchQuery, columnFilters);
  }, [columns, searchQuery, columnFilters]);

  // Update search query
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    
    // Recalculate criteria with new search query
    const criteria = SearchUtils.combineSearchAndColumnFilters(columns, query, columnFilters);
    onSearchChange?.(criteria);
  }, [columns, columnFilters, onSearchChange]);

  // Clear all search and filters
  const clearAllSearchAndFilters = useCallback(() => {
    setSearchQueryState("");
    clearAllFilters();
    onSearchChange?.([]);
  }, [clearAllFilters, onSearchChange]);

  const hasActiveSearch = useMemo(() => {
    return searchQuery.trim().length > 0;
  }, [searchQuery]);

  return {
    // Global search
    searchQuery,
    setSearchQuery,
    
    // Column filters
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    loadFilterOptions,
    getFilterableColumns,
    
    // Combined state
    hasActiveFilters,
    hasActiveSearch,
    searchCriteria,
    
    // Actions
    clearAllSearchAndFilters,
  };
}