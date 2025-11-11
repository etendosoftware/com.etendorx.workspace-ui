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
import { FieldType } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilter } from "../../components/Table/ColumnFilter";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useTranslation } from "../useTranslation";
import { transformColumnWithCustomJs } from "@/utils/customJsColumnTransformer";

interface UseColumnsOptions {
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
}

// Columnas booleanas conocidas
const BOOLEAN_COLUMNS = ["isOfficialHoliday", "isActive", "isPaid", "stocked", "isGeneric"];

// Audit fields that need special date formatting
const AUDIT_DATE_COLUMNS = ["creationDate", "updated", "createdBy", "updatedBy"];

export const useColumns = (tab: Tab, options?: UseColumnsOptions) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();
  const { onColumnFilter, onLoadFilterOptions, onLoadMoreFilterOptions, columnFilterStates } = options || {};
  const { t } = useTranslation();

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    let originalColumns = parseColumns(fieldsAsArray);

    // Mark boolean columns and audit fields automatically
    originalColumns = originalColumns.map((col) => {
      if (BOOLEAN_COLUMNS.includes(col.columnName)) {
        return { ...col, type: "boolean" };
      }
      // Mark audit columns for special handling
      if (AUDIT_DATE_COLUMNS.includes(col.columnName)) {
        return {
          ...col,
          type: col.columnName.includes("Date") || col.columnName === "updated" ? "datetime" : col.type,
        };
      }
      return col;
    });

    return originalColumns.map((column: Column) => {
      const isReference = isEntityReference(getFieldReference(column.column?.reference));
      const isBooleanColumn = column.type === "boolean" || column.column?._identifier === "YesNo";
      const isDateColumn =
        column.type === "datetime" ||
        AUDIT_DATE_COLUMNS.includes(column.columnName) ||
        getFieldReference(column.column?.reference) === FieldType.DATE;
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

      // Reference columns with navigation
      if (isReference) {
        const windowId = column.referencedWindowId;
        const windowIdentifier = column._identifier;
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
                onClick={(e) => handleClickRedirect(e, windowId, windowIdentifier, String(selectedRecordId ?? ""))}
                onKeyDown={(e) => handleKeyDownRedirect(e, windowId, windowIdentifier, String(selectedRecordId ?? ""))}>
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

      // Enable simple text filtering for date columns
      if (isDateColumn && !supportsDropdownFilter) {
        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
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
    onLoadFilterOptions,
    t,
    handleClickRedirect,
    handleKeyDownRedirect,
    onLoadMoreFilterOptions,
  ]);

  return columns;
};
