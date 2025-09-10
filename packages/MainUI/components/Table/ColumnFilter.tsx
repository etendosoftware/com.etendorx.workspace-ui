import type React from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { MultiSelect } from "../Form/FormView/selectors/components/MultiSelect";
import { useState } from "react";
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
  const [localSelectedOptions, setLocalSelectedOptions] = useState<FilterOption[]>(filterState?.selectedOptions || []);

  const isBooleanColumn = column.type === "boolean" || column.column?._identifier === "YesNo";

  const supportsDropdown = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);

  if (!supportsDropdown) return null;

  const booleanOptions: FilterOption[] = [
    { id: "true", label: t("common.trueText"), value: "true" },
    { id: "false", label: t("common.falseText"), value: "false" },
  ];

  const availableOptions = isBooleanColumn
    ? booleanOptions
    : (filterState?.availableOptions || []).map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value ?? option.id,
      }));

  const selectedValues = isBooleanColumn
    ? localSelectedOptions.map((opt) => opt.id)
    : (filterState?.selectedOptions || []).map((option) => option.id);

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedOptions = (availableOptions || []).filter((option) => selectedIds.includes(option.id));

    if (isBooleanColumn) {
      setLocalSelectedOptions(selectedOptions);
    }

    onFilterChange(selectedOptions);
  };

  const handleSearchChange = (searchQuery: string) => {
    if (onLoadOptions && !isBooleanColumn) onLoadOptions(searchQuery);
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
      onSearch={!isBooleanColumn ? handleSearchChange : undefined}
      onFocus={!isBooleanColumn ? onLoadOptions : undefined}
      onLoadMore={!isBooleanColumn ? handleLoadMore : undefined}
      loading={filterState?.loading || false}
      hasMore={filterState?.hasMore || false}
      placeholder={`Filter ${column.name || column.columnName}...`}
      maxHeight={200}
    />
  );
};
