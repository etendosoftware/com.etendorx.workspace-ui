import type React from "react";
import { useCallback, useMemo } from "react";
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

  // All hooks must be called unconditionally
  const handleSearchChange = useCallback(
    (searchQuery: string) => {
      const isBooleanColumn =
        column.type === "boolean" || column.column?._identifier === "YesNo" || column.column?.reference === "20";

      if (onLoadOptions && !isBooleanColumn) onLoadOptions(searchQuery);
    },
    [column, onLoadOptions]
  );

  // Compute values after hooks
  const isBooleanColumn =
    column.type === "boolean" || column.column?._identifier === "YesNo" || column.column?.reference === "20";

  const supportsDropdown = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);

  const booleanOptions: FilterOption[] = [
    { id: "true", label: t("common.trueText"), value: "true" },
    { id: "false", label: t("common.falseText"), value: "false" },
  ];

  const availableOptions = useMemo(() => {
    return isBooleanColumn
      ? booleanOptions
      : (filterState?.availableOptions || [])
          .filter((option) => !option.isTextSearch)
          .map((option) => ({
            id: option.id,
            label: option.label,
            value: option.value ?? option.id,
          }));
  }, [isBooleanColumn, filterState?.availableOptions, booleanOptions]);

  if (!supportsDropdown) return null;

  // Treat boolean columns the same as LIST columns: use filterState?.selectedOptions directly
  const selectedValues = (filterState?.selectedOptions || [])
    .filter((option) => !option.isTextSearch)
    .map((option) => option.id);

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedOptions = (availableOptions || []).filter((option) => selectedIds.includes(option.id));
    onFilterChange(selectedOptions);
  };

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
