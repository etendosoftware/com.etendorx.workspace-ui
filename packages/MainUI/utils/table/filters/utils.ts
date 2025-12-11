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

import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";

/**
 * Type guard to check if a value is a FilterOption array
 */
export const isFilterOptionArray = (value: unknown): value is FilterOption[] => {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    "id" in value[0] &&
    "label" in value[0] &&
    "value" in value[0]
  );
};

/**
 * Gets the current filter value for text/date columns from tableColumnFilters
 * Returns undefined for dropdown filters (FilterOption[]) as they are handled separately
 */
export const getTextFilterValue = (
  column: Column,
  tableColumnFilters?: Array<{ id: string; value: unknown }>
): string | undefined => {
  const currentFilter = tableColumnFilters?.find((f) => f.id === column.id || f.id === column.columnName);

  if (!currentFilter) return undefined;

  // If value is FilterOption[], return undefined as they are handled separately
  if (isFilterOptionArray(currentFilter.value)) {
    return undefined;
  }

  // For text/date filters, return as string
  return currentFilter ? String(currentFilter.value) : undefined;
};

/**
 * Gets available options for a dropdown filter based on column type
 */
export const getAvailableOptions = (
  column: Column,
  isBooleanColumn: boolean,
  filterState: ColumnFilterState | undefined,
  booleanOptions: FilterOption[]
): FilterOption[] => {
  if (isBooleanColumn) {
    return booleanOptions;
  }

  if (ColumnFilterUtils.isSelectColumn(column)) {
    return ColumnFilterUtils.getSelectOptions(column);
  }

  // For TABLEDIR columns, use dynamically loaded options from filterState
  return filterState?.availableOptions || [];
};

/**
 * Reconstructs selected options from persisted filter value
 * Supports both new format (FilterOption[]) and legacy format (string[])
 */
export const reconstructSelectedOptions = (
  currentFilter: { id: string; value: unknown } | undefined,
  availableOptions: FilterOption[]
): FilterOption[] => {
  if (!currentFilter?.value) {
    return [];
  }

  // Check if value is already FilterOption[] (new format)
  if (isFilterOptionArray(currentFilter.value)) {
    return currentFilter.value;
  }

  // Legacy format: parse the filter value (can be string, array of strings, or comma-separated)
  let values: string[] = [];
  if (Array.isArray(currentFilter.value)) {
    values = currentFilter.value.map((v) => String(v));
  } else if (typeof currentFilter.value === "string" && currentFilter.value.includes(",")) {
    values = currentFilter.value.split(",").map((v) => v.trim());
  } else {
    values = [String(currentFilter.value)];
  }

  // Match values with available options to create FilterOption objects
  return values
    .map((value) => {
      const matchingOption = availableOptions.find((opt) => opt.value === value || opt.id === value);
      if (matchingOption) {
        return matchingOption;
      }
      // If no matching option found, create a basic FilterOption
      // This handles cases where TABLEDIR options haven't loaded yet
      return {
        id: value,
        label: value,
        value: value,
      };
    })
    .filter(Boolean);
};

/**
 * Ensures selected options are included in available options
 * Important when options were loaded dynamically and may not be in the current availableOptions
 */
export const mergeAvailableAndSelectedOptions = (
  availableOptions: FilterOption[],
  selectedOptions: FilterOption[]
): FilterOption[] => {
  const mergedOptions = [...availableOptions];

  for (const selectedOption of selectedOptions) {
    const exists = mergedOptions.some((opt) => opt.id === selectedOption.id);
    if (!exists) {
      mergedOptions.push(selectedOption);
    }
  }

  return mergedOptions;
};

/**
 * Reconstructs complete filter state from persisted data
 */
export const reconstructFilterState = (
  column: Column,
  currentFilter: { id: string; value: unknown } | undefined,
  availableOptions: FilterOption[],
  filterState: ColumnFilterState | undefined
): ColumnFilterState => {
  // Reconstruct selected options
  const selectedOptions = reconstructSelectedOptions(currentFilter, availableOptions);

  // Merge available and selected options
  const allAvailableOptions = mergeAvailableAndSelectedOptions(availableOptions, selectedOptions);

  // Return complete filter state
  return {
    id: column.id,
    selectedOptions,
    availableOptions: allAvailableOptions,
    isMultiSelect: true,
    loading: filterState?.loading || false,
    hasMore: filterState?.hasMore || false,
    searchQuery: filterState?.searchQuery || "",
  };
};
