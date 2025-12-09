import type React from "react";
import { useCallback } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { MultiSelect } from "../Form/FormView/selectors/components/MultiSelect";
import { useTranslation } from "@/hooks/useTranslation";

export interface ColumnFilterProps {
  column: Column;
  filterState?: ColumnFilterState;
  onFilterChange: (selectedOptions: FilterOption[]) => void;
  onLoadOptions?: (searchQuery?: string) => void;
  onLoadMoreOptions?: (searchQuery?: string) => void;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  column,
  filterState,
  onFilterChange,
  onLoadOptions,
  onLoadMoreOptions,
}) => {
  const { t } = useTranslation();

  const isBooleanColumn =
    column.type === "boolean" ||
    column.column?._identifier === "YesNo" ||
    column.column?.reference === "20";

  const supportsDropdown = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);

  if (!supportsDropdown) return null;

  const booleanOptions: FilterOption[] = [
    { id: "true", label: t("common.trueText"), value: "true" },
    { id: "false", label: t("common.falseText"), value: "false" },
  ];

  const availableOptions = isBooleanColumn
    ? booleanOptions
    : (filterState?.availableOptions || [])
        .filter((option) => !option.isTextSearch)
        .map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value ?? option.id,
        }));

  // Treat boolean columns the same as LIST columns: use filterState?.selectedOptions directly
  const selectedValues = (filterState?.selectedOptions || [])
    .filter((option) => !option.isTextSearch)
    .map((option) => option.id);

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedOptions = (availableOptions || []).filter((option) => selectedIds.includes(option.id));
    onFilterChange(selectedOptions);
  };

  const handleSearchChange = useCallback((searchQuery: string) => {
    if (onLoadOptions && !isBooleanColumn) onLoadOptions(searchQuery);

    if (searchQuery) {
      // Check if the search query matches an existing option label (e.g. "==Action" -> "Action")
      // If it matches, use the option's ID/Value instead of the text query.
      // This is crucial for List/TableDir columns where the Label (displayed) differs from the Value (stored).
      const cleanQuery = searchQuery.trim();
      const valueToCheck = cleanQuery.startsWith("==") ? cleanQuery.substring(2) : cleanQuery;
      
      const matchingOption = availableOptions.find(
        (opt) => opt.label.toLowerCase() === valueToCheck.toLowerCase()
      );

      if (matchingOption) {
        onFilterChange([matchingOption]);
      } else {
        onFilterChange([
          {
            id: searchQuery,
            value: searchQuery,
            label: searchQuery,
            isTextSearch: true,
          },
        ]);
      }
    } else {
      // If search is cleared, revert to empty selection
      onFilterChange([]);
    }
  }, [onLoadOptions, isBooleanColumn, onFilterChange, availableOptions]);

  const handleLoadMore = () => {
    if (onLoadMoreOptions && ColumnFilterUtils.isTableDirColumn(column) && !isBooleanColumn) {
      onLoadMoreOptions(filterState?.searchQuery);
    }
  };

  return (
    <MultiSelect
      options={availableOptions}
      selectedValues={selectedValues}
      onSelectionChange={handleSelectionChange}
      onSearch={handleSearchChange}
      onFocus={!isBooleanColumn ? onLoadOptions : undefined}
      onLoadMore={!isBooleanColumn ? handleLoadMore : undefined}
      loading={filterState?.loading || false}
      hasMore={filterState?.hasMore || false}
      placeholder={`Filter ${column.name || column.columnName}...`}
      maxHeight={200}
      data-testid="MultiSelect__a8fea9"
      enableTextFilterLogic={true}
    />
  );
};
