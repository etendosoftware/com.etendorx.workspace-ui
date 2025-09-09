/*
 *************************************************************************
 * useColumns.ts
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
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilter } from "../../components/Table/ColumnFilter";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";

interface UseColumnsOptions {
  onColumnFilter?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
}

// Columnas booleanas conocidas
const BOOLEAN_COLUMNS = ["isOfficialHoliday", "isActive", "isPaid", "stocked", "isGeneric"];

export const useColumns = (tab: Tab, options?: UseColumnsOptions) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();
  const { onColumnFilter, onLoadFilterOptions, onLoadMoreFilterOptions, columnFilterStates } = options || {};

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    let originalColumns = parseColumns(fieldsAsArray);

    // Marcar columnas booleanas automáticamente
    originalColumns = originalColumns.map((col) => {
      if (BOOLEAN_COLUMNS.includes(col.columnName)) {
        return { ...col, type: "boolean" };
      }
      return col;
    });

    return originalColumns.map((column: Column) => {
      const isReference = isEntityReference(getFieldReference(column.column?.reference));
      const isBooleanColumn = column.type === "boolean" || column.column?._identifier === "YesNo";
      const supportsDropdownFilter = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);

      // --- Inicializar filterState para booleanos si no existe ---
      let filterState = columnFilterStates?.find((f) => f.id === column.id);
      if (isBooleanColumn && !filterState) {
        filterState = {
          id: column.id,
          selectedOptions: [],
          availableOptions: [
            { id: "true", label: "Sí", value: true },
            { id: "false", label: "No", value: false },
          ],
          loading: false,
          hasMore: false,
          searchQuery: "",
        };
      }

      let columnConfig = { ...column };

      // Columnas de referencia con navegación
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

      // Filtros avanzados
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
            />
          ),
        };
      }

      return columnConfig;
    });
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
