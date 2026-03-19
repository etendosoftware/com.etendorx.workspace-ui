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

import React, { useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import Tag from "@workspaceui/componentlibrary/src/components/Tag";
import { isColorString, getContrastTextColor } from "@/utils/color/utils";
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
import { dateTimeSortingFn, dateSortingFn } from "@/utils/table/sortingFunctions";
import { getTextFilterValue, getAvailableOptions, reconstructFilterState } from "@/utils/table/filters/utils";

interface UseColumnsOptions {
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onDateTextFilterChange?: (columnId: string, filterValue: string) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
  tableColumnFilters?: Array<{ id: string; value: unknown }>;
  /** Called after a clientclass-based navigation (e.g. SalesOrderTabLink) so the parent can close itself. */
  onNavigate?: () => void;
}

// Columnas booleanas conocidas
const BOOLEAN_COLUMNS = ["isOfficialHoliday", "isActive", "isPaid", "stocked", "isGeneric"];

// Audit fields that need special date formatting (with time)
const AUDIT_DATE_COLUMNS_WITH_TIME = ["creationDate", "updated"];

/**
 * Helper to check if column should use date formatting
 * Checks multiple indicators to ensure date columns are properly detected
 */
const shouldFormatDateColumn = (column: Column): boolean => {
  // Check column.column.reference (primary check)
  if (
    column.column?.reference === FIELD_REFERENCE_CODES.DATE.id ||
    column.column?.reference === FIELD_REFERENCE_CODES.DATETIME.id ||
    column.column?.reference === FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id
  ) {
    return true;
  }

  // Check column.type (FieldType)
  if (column.type === "date" || column.type === "datetime") {
    return true;
  }

  // Check reference identifier
  if (
    column.column?.reference$_identifier === "Date" ||
    column.column?.reference$_identifier === "DateTime" ||
    column.column?.reference$_identifier === "Absolute DateTime"
  ) {
    return true;
  }

  // Check display type
  if (column.displayType === "date" || column.displayType === "datetime") {
    return true;
  }

  return false;
};

/**
 * Extracts the color context (rawColor, finalDisplayValue) for a specific column and record.
 * Helper function to reduce cognitive complexity of the useColumns hook.
 */
const extractColorContext = (recordData: EntityData | undefined, column: Column, cellValue: any) => {
  if (!recordData || typeof recordData !== "object") {
    return { rawColor: undefined, finalDisplayValue: "" };
  }

  let chosenColorKey: string | undefined;

  // 1. Explicit checking based on predefined reference/metadata (highest priority)
  if (column.colorFieldName) {
    const explicitKey = `${column.hqlName || column.columnName}$${column.colorFieldName}`;
    const val = recordData[explicitKey];
    if (typeof val === "string" && isColorString(val.trim())) {
      chosenColorKey = explicitKey;
    }
  }

  // 2. Fallback: Magical scanning for color-related suffixes in the payload (legacy support / resilience)
  if (!chosenColorKey) {
    const allColorKeys = Object.keys(recordData).filter((key) => {
      const lowerK = key.toLowerCase();
      if (lowerK.includes("color")) {
        const val = recordData[key];
        return typeof val === "string" && isColorString(val.trim());
      }
      return false;
    });

    if (allColorKeys.length > 0) {
      const potentialPrefixes = [column.columnName, column.name, column.hqlName]
        .filter(Boolean)
        .map((p) => String(p).toLowerCase());

      chosenColorKey = allColorKeys.find((ck) => {
        const prefix = ck.toLowerCase().split("$")[0];
        return potentialPrefixes.includes(prefix);
      });
    }
  }

  if (!chosenColorKey) {
    return { rawColor: undefined, finalDisplayValue: "" };
  }

  const rawColor = String(recordData[chosenColorKey]).trim();
  const prefixMatch = chosenColorKey.match(/^(.*?)\$(smf)?color/i);
  const truePrefix = prefixMatch ? prefixMatch[1] : column.columnName;
  const identifierKey = `${truePrefix}$_identifier`;

  let finalDisplayValue = "";
  if (recordData[identifierKey] != null && String(recordData[identifierKey]).trim() !== "") {
    finalDisplayValue = String(recordData[identifierKey]).trim();
  } else if (cellValue != null && String(cellValue).trim() !== "") {
    finalDisplayValue = String(cellValue);
  } else {
    finalDisplayValue = String(recordData[truePrefix] || "");
  }

  return { rawColor, finalDisplayValue };
};

export const useColumns = (tab: Tab, options?: UseColumnsOptions) => {
  const { handleClickRedirect, handleKeyDownRedirect, handleClientclassNavigation } = useRedirect();
  const {
    onColumnFilter,
    onDateTextFilterChange,
    onLoadFilterOptions,
    onLoadMoreFilterOptions,
    columnFilterStates,
    tableColumnFilters,
    onNavigate,
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
          column.column?.reference === FIELD_REFERENCE_CODES.DATETIME.id;
        const isAuditField = AUDIT_DATE_COLUMNS_WITH_TIME.includes(column.columnName);
        columnConfig = {
          ...columnConfig,
          Cell: ({ cell, row }: { cell: MRT_Cell<EntityData, unknown>; row: { original: EntityData } }) => {
            // Try to get value from cell first, then fallback to row data
            let value = cell?.getValue();

            // If cell.getValue() returns undefined, try getting from row.original directly
            if (value === undefined || value === null) {
              const rowData = row.original;
              // Try both hqlName and name to find the value
              value = rowData[column.columnName] ?? rowData[column.name];
            }

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
          // Use custom sorting function for datetime fields to sort by actual date value
          // rather than the formatted string representation
          sortingFn: isAuditField ? dateTimeSortingFn : dateSortingFn,
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

            const cellValue = cell?.getValue();
            let displayNode: React.ReactNode;

            const displayString =
              cellValue != null && !React.isValidElement(cellValue)
                ? String(cellValue)
                : String(
                    recordData?.[identifierKey as keyof EntityData] ||
                      recordData?.[column.columnName as keyof EntityData] ||
                      ""
                  );

            const isAlreadyReactElement = React.isValidElement(cellValue);
            if (isAlreadyReactElement) {
              displayNode = cellValue;
            } else {
              displayNode = displayString;
            }

            const usePlainLinkStyle = !isAlreadyReactElement;

            return (
              <button
                type="button"
                tabIndex={0}
                aria-label="Navigate to referenced window"
                className={`bg-transparent border-none p-0 text-left pointer-events-auto ${
                  usePlainLinkStyle ? "text-(--color-dynamic-main) hover:underline" : ""
                }`}
                onClick={(e) => {
                  const selectedId = String(selectedRecordId ?? "");
                  console.debug("[useColumns] Reference cell clicked:", {
                    columnName: column.columnName,
                    fieldId: column.fieldId,
                    referencedWindowId: windowId,
                    referencedTabId,
                    selectedRecordId: selectedId,
                    referencedEntity: column.referencedEntity,
                    currentWindowId: tab.window,
                  });
                  handleClickRedirect({
                    e,
                    windowId,
                    windowTitle: columnTitle,
                    referencedTabId,
                    selectedRecordId: selectedId,
                    referencedLinkContext:
                      column.fieldId && column.referencedEntity
                        ? {
                            entityName: column.referencedEntity as string,
                            fieldId: column.fieldId as string,
                            currentWindowId: tab.window,
                            columnName: (column.dbColumnName || column.columnName) as string,
                          }
                        : undefined,
                  });
                }}
                onKeyDown={(e) => {
                  const selectedId = String(selectedRecordId ?? "");
                  handleKeyDownRedirect({
                    e,
                    windowId,
                    windowTitle: columnTitle,
                    referencedTabId,
                    selectedRecordId: selectedId,
                    referencedLinkContext:
                      column.fieldId && column.referencedEntity
                        ? {
                            entityName: column.referencedEntity as string,
                            fieldId: column.fieldId as string,
                            currentWindowId: tab.window,
                            columnName: (column.dbColumnName || column.columnName) as string,
                          }
                        : undefined,
                  });
                }}>
                {displayNode}
              </button>
            );
          },
        };
      } else if (column.clientclass) {
        // clientclass-based link columns (e.g. "SalesOrderTabLink" from Classic SmartClient)
        const clientclass = column.clientclass as string;
        columnConfig = {
          ...columnConfig,
          Cell: ({ row, cell }: { row: { original: EntityData }; cell: MRT_Cell<EntityData, unknown> }) => {
            const recordId = String((row.original as Record<string, unknown>).id ?? "");
            const displayValue = String(cell?.getValue?.() ?? "");
            return (
              <button
                type="button"
                tabIndex={0}
                aria-label="Navigate to referenced record"
                className="bg-transparent border-none p-0 text-left pointer-events-auto text-(--color-dynamic-main) hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClientclassNavigation({ clientclass, recordId });
                  onNavigate?.();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (e.key === "Enter" || e.key === " ") {
                    handleClientclassNavigation({ clientclass, recordId });
                    onNavigate?.();
                  }
                }}>
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
          Filter: () => {
            // const effectiveFilterState =
            // Get current persisted filter
            const currentFilter = tableColumnFilters?.find((f) => f.id === column.id || f.id === column.columnName);

            // Boolean options for boolean columns
            const booleanOptions: FilterOption[] = [
              { id: "true", label: t("common.trueText"), value: "true" },
              { id: "false", label: t("common.falseText"), value: "false" },
            ];

            // Get available options based on column type
            const availableOptions = getAvailableOptions(column, isBooleanColumn, filterState, booleanOptions);

            // Reconstruct complete filter state from persisted data
            const effectiveFilterState = reconstructFilterState(column, currentFilter, availableOptions, filterState);

            return (
              <ColumnFilter
                column={column}
                filterState={effectiveFilterState}
                onFilterChange={(selectedOptions: FilterOption[]) => onColumnFilter(column.id, selectedOptions)}
                onLoadOptions={(searchQuery?: string) => onLoadFilterOptions(column.id, searchQuery)}
                onLoadMoreOptions={
                  onLoadMoreFilterOptions
                    ? (searchQuery?: string) => onLoadMoreFilterOptions(column.id, searchQuery)
                    : undefined
                }
                data-testid="ColumnFilter__46c09c"
              />
            );
          },
        };
      }

      // Enable DateSelector for date columns
      if (isDateColumn && !supportsDropdownFilter) {
        const currentFilterValue = getTextFilterValue(column, tableColumnFilters);

        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          Filter: () => (
            <DateSelector
              column={column}
              filterValue={currentFilterValue}
              onFilterChange={(filterValue: string) => {
                onDateTextFilterChange?.(column.id, filterValue);
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
        const currentFilterValue = getTextFilterValue(column, tableColumnFilters);

        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          Filter: () => (
            <TextFilter
              column={column}
              filterValue={currentFilterValue}
              onFilterChange={(filterValue: string) => {
                onDateTextFilterChange(column.id, filterValue);
              }}
              data-testid="TextFilter__46c09c"
            />
          ),
          columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
          filterFn: "contains",
        };
      }

      // --------------------------------------------------------------------------
      // GLOBAL COLOR RENDERING
      // --------------------------------------------------------------------------
      // This applies to any column. If the backend sent a property that looks like
      // "columnName$color", "columnName$smfColor", or "columnName$anythingColor",
      // and its value is a valid CSS color, we render a Tag instead of raw text.
      {
        const wrappedCell = columnConfig.Cell;
        columnConfig = {
          ...columnConfig,
          Cell: (cellProps: any) => {
            const { row, cell, renderedCellValue } = cellProps;
            const recordData = row?.original as EntityData;

            const { rawColor, finalDisplayValue: deducedValue } = extractColorContext(
              recordData,
              column,
              cell?.getValue?.()
            );

            if (rawColor) {
              const normalizedColor = rawColor.toLowerCase();
              const displayValue = deducedValue || String(cell?.getValue?.() ?? "");

              return (
                <Tag
                  label={displayValue}
                  tagColor={normalizedColor}
                  textColor={getContrastTextColor(normalizedColor)}
                  data-testid={`Tag__${column.columnName}`}
                />
              );
            }

            // Fallback to the regular column component (e.g. Reference Button, Date strings, etc.)
            if (typeof wrappedCell === "function") {
              return wrappedCell(cellProps);
            }
            return <>{renderedCellValue ?? cell?.getValue()}</>;
          },
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
    handleClientclassNavigation,
    onNavigate,
    onLoadMoreFilterOptions,
    tableColumnFilters,
    tab.window,
  ]);

  return columns;
};
