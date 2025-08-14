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
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterDropdown } from "./ColumnFilterDropdown";

export interface ColumnFilterProps {
  column: Column;
  filterState?: ColumnFilterState;
  onFilterChange: (selectedOptions: FilterOption[]) => void;
  onLoadOptions?: (searchQuery?: string) => Promise<FilterOption[]>;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ column, filterState, onFilterChange, onLoadOptions }) => {
  if (!ColumnFilterUtils.supportsDropdownFilter(column)) {
    return null;
  }

  const hasActiveFilter = filterState && filterState.selectedOptions.length > 0;

  const handleSearchChange = async (searchQuery: string) => {
    if (onLoadOptions) {
      await onLoadOptions(searchQuery);
    }
  };

  const displayValue = hasActiveFilter ? filterState!.selectedOptions.map((opt) => opt.label).join(", ") : "";

  return (
    <ColumnFilterDropdown
      column={column}
      selectedOptions={filterState?.selectedOptions || []}
      availableOptions={filterState?.availableOptions || []}
      loading={filterState?.loading || false}
      onSelectionChange={onFilterChange}
      onSearchChange={ColumnFilterUtils.isTableDirColumn(column) ? handleSearchChange : undefined}
      placeholder={displayValue || `Filter ${column.name || column.columnName}...`}
    />
  );
};
