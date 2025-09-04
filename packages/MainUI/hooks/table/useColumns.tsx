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

import { useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { transformColumnsWithCustomJs } from "@/utils/customJsColumnTransformer";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilter } from "../../components/Table/ColumnFilter";

import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";

interface UseColumnsOptions {
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
}

export const useColumns = (tab: Tab, options?: UseColumnsOptions) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();
  const { onColumnFilter, onLoadFilterOptions, onLoadMoreFilterOptions, columnFilterStates } = options || {};

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    const originalColumns = parseColumns(fieldsAsArray);

    const referencedColumns = originalColumns.map((column: Column) => {
      const isReference = isEntityReference(getFieldReference(column.column?.reference));
      const supportsDropdownFilter = ColumnFilterUtils.supportsDropdownFilter(column);

      let columnConfig = { ...column };

      // Configure reference columns with navigation
      if (isReference) {
        const windowId = column.referencedWindowId;
        const windowIdentifier = column._identifier;
        columnConfig = {
          ...columnConfig,
          Cell: ({ row, cell }: { row: { original: EntityData }; cell: MRT_Cell<EntityData, unknown> }) => {
            const recordData = row?.original as EntityData;
            const selectedRecordId = recordData?.[column.columnName as keyof EntityData];

            // Get the display value (identifier) using the same logic as accessorFn
            const identifierKey = `${column.columnName}$_identifier`;
            const displayValue =
              cell?.getValue() != null
                ? String(cell.getValue())
                : String(
                    recordData?.[identifierKey as keyof EntityData] ||
                      recordData?.[column.columnName as keyof EntityData] ||
                      ""
                  );

            return (
              <button
                type="button"
                tabIndex={0}
                aria-label="Navigate to referenced window"
                className="bg-transparent border-none p-0 text-(--color-dynamic-main) hover:underline text-left"
                onClick={(e) => handleClickRedirect(e, windowId, windowIdentifier, String(selectedRecordId ?? ""))}
                onKeyDown={(e) => handleKeyDownRedirect(e, windowId, windowIdentifier, String(selectedRecordId ?? ""))}>
                {displayValue}
              </button>
            );
          },
        };
      }

      // Configure advanced filters for select/tabledir columns
      if (supportsDropdownFilter && onColumnFilter && onLoadFilterOptions) {
        const filterState = columnFilterStates?.find((f) => f.id === column.id);

        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true, // Keep column filter enabled
          Filter: () => (
            <ColumnFilter
              column={column}
              filterState={filterState}
              onFilterChange={(selectedOptions: FilterOption[]) => onColumnFilter(column.id, selectedOptions)}
              onLoadOptions={(searchQuery?: string) => {
                return onLoadFilterOptions(column.id, searchQuery);
              }}
              onLoadMoreOptions={
                onLoadMoreFilterOptions
                  ? (searchQuery?: string) => {
                      return onLoadMoreFilterOptions(column.id, searchQuery);
                    }
                  : undefined
              }
            />
          ),
        };
      }

      return columnConfig;
    });

    // Apply custom JavaScript code
    const customJsColumns = transformColumnsWithCustomJs(referencedColumns, fieldsAsArray);

    return customJsColumns;
  }, [
    tab.fields,
    handleClickRedirect,
    handleKeyDownRedirect,
    onColumnFilter,
    onLoadFilterOptions,
    onLoadMoreFilterOptions,
    columnFilterStates,
  ]);

  return columns;
};
