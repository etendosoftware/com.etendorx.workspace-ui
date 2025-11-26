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
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilter } from "../../components/Table/ColumnFilter";
import { DateSelector } from "../../components/Table/DateSelector";
import { TextFilter } from "../../components/Table/TextFilter";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useTranslation } from "../useTranslation";
import { transformColumnWithCustomJs } from "@/utils/customJsColumnTransformer";
import { formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";

interface UseColumnsOptions {
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onDateTextFilterChange?: (columnId: string, filterValue: string) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
  tableColumnFilters?: Array<{ id: string; value: unknown }>;
}

// Columnas booleanas conocidas
const BOOLEAN_COLUMNS = ["isOfficialHoliday", "isActive", "isPaid", "stocked", "isGeneric"];

// Audit fields that need special date formatting (with time)
const AUDIT_DATE_COLUMNS_WITH_TIME = ["creationDate", "updated"];

/**
 * Gets the current filter value for a column from tableColumnFilters
 * Searches by both column.id and column.columnName for consistency
 */
const getCurrentFilterValue = (
  column: Column,
  tableColumnFilters?: Array<{ id: string; value: unknown }>
): string | undefined => {
  const currentFilter = tableColumnFilters?.find((f) => f.id === column.id || f.id === column.columnName);
  return currentFilter ? String(currentFilter.value) : undefined;
};

/**
 * Helper to check if column should use date formatting
 */
const shouldFormatDateColumn = (column: Column): boolean => {
  return (
    column.column?.reference === FIELD_REFERENCE_CODES.DATE ||
    column.column?.reference === FIELD_REFERENCE_CODES.DATETIME
  );
};

export const useColumns = (tab: Tab, options?: UseColumnsOptions) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();
  const {
    onColumnFilter,
    onDateTextFilterChange,
    onLoadFilterOptions,
    onLoadMoreFilterOptions,
    columnFilterStates,
    tableColumnFilters,
  } = options || {};
  const { t } = useTranslation();

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    let originalColumns = parseColumns(fieldsAsArray);

    // Mark boolean columns automatically
    originalColumns = originalColumns.map((col) => {
      if (BOOLEAN_COLUMNS.includes(col.columnName)) {
        return { ...col, type: "boolean" };
      }
      return col;
    });

    return originalColumns.map((column: Column) => {
      const fieldReference = getFieldReference(column.column?.reference);
      const isReference = isEntityReference(fieldReference);
      const isBooleanColumn = column.type === "boolean" || column.column?._identifier === "YesNo";
      const isDateColumn = shouldFormatDateColumn(column);
      const supportsDropdownFilter = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);
      const isCustomJsColumn = Boolean(column.customJs && column.customJs.trim().length > 0);

      // --- Initialize filterState for booleans if it doesn't exist ---
      let filterState = columnFilterStates?.find((f) => f.id === column.id);
      if (isBooleanColumn && !filterState) {
        filterState = {
          id: column.id,
          selectedOptions: [],
          availableOptions: [
            { id: "true", label: t("common.trueText"), value: "true" },
            { id: "false", label: t("common.falseText"), value: "false" },
          ],
          loading: false,
          hasMore: false,
          searchQuery: "",
          isMultiSelect: false,
        };
      }

      let columnConfig = { ...column };

      // Date columns with Etendo Classic formatting
      if (isDateColumn) {
        // Include time for audit date columns (creationDate, updated) or datetime type columns
        const includeTime =
          AUDIT_DATE_COLUMNS_WITH_TIME.includes(column.columnName) ||
          column.column?.reference === FIELD_REFERENCE_CODES.DATETIME;
        columnConfig = {
          ...columnConfig,
          Cell: ({ cell }: { cell: MRT_Cell<EntityData, unknown> }) => {
            const value = cell?.getValue();
            // Only format if the value is a string with valid date format
            // This prevents formatting non-date values that are incorrectly marked as date type
            if (typeof value === "string" && value) {
              const formattedDate = formatClassicDate(value, includeTime);
              // If formatClassicDate returned a non-empty value, use it; otherwise use original
              return <span>{formattedDate || value}</span>;
            }
            // For non-string or empty values, show as-is or empty
            return <span>{value ? String(value) : ""}</span>;
          },
        };
      }

      // Reference columns with navigation
      if (isReference) {
        const windowId = column.referencedWindowId || "";
        const columnTitle = column.name;
        const referencedTabId = column.referencedTabId || "";
        columnConfig = {
          ...columnConfig,
          Cell: ({ row, cell }: { row: { original: EntityData }; cell: MRT_Cell<EntityData, unknown> }) => {
            const recordData = row?.original as EntityData;
            const selectedRecordId = recordData?.[column.columnName as keyof EntityData];
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
                onClick={(e) => {
                  handleClickRedirect({
                    e,
                    windowId,
                    windowTitle: columnTitle,
                    referencedTabId,
                    selectedRecordId: String(selectedRecordId ?? ""),
                  });
                }}
                onKeyDown={(e) =>
                  handleKeyDownRedirect({
                    e,
                    windowId,
                    windowTitle: columnTitle,
                    referencedTabId,
                    selectedRecordId: String(selectedRecordId ?? ""),
                  })
                }>
                {displayValue}
              </button>
            );
          },
        };
      }

      // Advanced filters
      if (supportsDropdownFilter && onColumnFilter && onLoadFilterOptions) {
        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          Filter: () => (
            <ColumnFilter
              column={column}
              filterState={filterState}
              onFilterChange={(selectedOptions: FilterOption[]) => onColumnFilter(column.id, selectedOptions)}
              onLoadOptions={(searchQuery?: string) => onLoadFilterOptions(column.id, searchQuery)}
              onLoadMoreOptions={
                onLoadMoreFilterOptions
                  ? (searchQuery?: string) => onLoadMoreFilterOptions(column.id, searchQuery)
                  : undefined
              }
              data-testid="ColumnFilter__46c09c"
            />
          ),
        };
      }

      // Enable DateSelector for date columns
      if (isDateColumn && !supportsDropdownFilter) {
        const currentFilterValue = getCurrentFilterValue(column, tableColumnFilters);

        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          Filter: () => (
            <DateSelector
              column={column}
              filterValue={currentFilterValue}
              onFilterChange={(filterValue: string) => {
                onDateTextFilterChange?.(column.columnName, filterValue);
              }}
              data-testid="DateSelector__46c09c"
            />
          ),
          columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
          filterFn: "contains",
        };
      }

      // Enable default text filtering for columns without specialized filters
      if (!supportsDropdownFilter && !isDateColumn && onDateTextFilterChange) {
        const currentFilterValue = getCurrentFilterValue(column, tableColumnFilters);

        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          Filter: () => (
            <TextFilter
              column={column}
              filterValue={currentFilterValue}
              onFilterChange={(filterValue: string) => {
                onDateTextFilterChange(column.columnName, filterValue);
              }}
              data-testid="TextFilter__46c09c"
            />
          ),
          columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
          filterFn: "contains",
        };
      }

      if (isCustomJsColumn) {
        columnConfig = transformColumnWithCustomJs(columnConfig);
      }

      return columnConfig;
    });
  }, [
    tab.fields,
    columnFilterStates,
    onColumnFilter,
    onDateTextFilterChange,
    onLoadFilterOptions,
    t,
    handleClickRedirect,
    handleKeyDownRedirect,
    onLoadMoreFilterOptions,
    tableColumnFilters,
  ]);

  return columns;
};
