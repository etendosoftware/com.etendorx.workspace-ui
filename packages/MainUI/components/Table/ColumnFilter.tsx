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

import type React from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { MultiSelect } from "../Form/FormView/selectors/components/MultiSelect";

export interface ColumnFilterProps {
  column: Column;
  filterState?: ColumnFilterState;
  onFilterChange: (selectedOptions: FilterOption[]) => void;
  onLoadOptions?: (searchQuery?: string) => void;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ column, filterState, onFilterChange, onLoadOptions }) => {
  if (!ColumnFilterUtils.supportsDropdownFilter(column)) {
    return null;
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedOptions = (filterState?.availableOptions || []).filter((option) => selectedIds.includes(option.id));
    onFilterChange(selectedOptions);
  };

  const handleSearchChange = (searchQuery: string) => {
    if (onLoadOptions) {
      onLoadOptions(searchQuery);
    }
  };

  const selectedValues = (filterState?.selectedOptions || []).map((option) => option.id);
  const availableOptions = (filterState?.availableOptions || []).map((option) => ({
    id: option.id,
    label: option.label,
  }));

  return (
    <MultiSelect
      options={availableOptions}
      selectedValues={selectedValues}
      onSelectionChange={handleSelectionChange}
      onSearch={ColumnFilterUtils.isTableDirColumn(column) ? handleSearchChange : undefined}
      onFocus={onLoadOptions}
      loading={filterState?.loading || false}
      placeholder={`Filter ${column.name || column.columnName}...`}
      maxHeight={200}
    />
  );
};
