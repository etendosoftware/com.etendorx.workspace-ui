import type { MRT_ColumnDef, MRT_ColumnFiltersState } from "material-react-table";
import type { EntityData, SelectorColumn, Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { TranslateFunction } from "@/hooks/types";
import { TextFilter } from "../../../components/Table/TextFilter";
import { DateSelector } from "../../../components/Table/DateSelector";
import { ColumnFilter } from "../../../components/Table/ColumnFilter";
import type { SelectorCriteria, DefaultFilterResponse } from "./defaultFilters";

const DATE_REFERENCE_IDS = new Set(["15", "16", "478169542A1747BD942DD70C8B45089C"]);
const BOOLEAN_REFERENCE_ID = "20";

type FilterType = "boolean" | "date" | "text";

function getFilterType(referenceId?: string): FilterType {
  if (!referenceId) return "text";
  if (referenceId === BOOLEAN_REFERENCE_ID) return "boolean";
  if (DATE_REFERENCE_IDS.has(referenceId)) return "date";
  return "text";
}

function buildMinimalColumn(col: SelectorColumn, filterType: FilterType): Column {
  const base: Record<string, unknown> = {
    id: col.id,
    name: col.header,
    columnName: col.accessorKey,
    reference: col.referenceId,
  };

  if (filterType === "boolean") {
    base.type = "boolean";
    base.column = { reference: col.referenceId, _identifier: "YesNo" };
  }

  return base as Column;
}

interface BuildSelectorColumnDefsOptions {
  onTextFilterChange: (columnId: string, value: string) => void;
  onBooleanFilterChange: (columnId: string, selectedOptions: FilterOption[]) => void;
  columnFilters: MRT_ColumnFiltersState;
  t: TranslateFunction;
  idFilterDisplayValues?: Map<string, string>;
}

export function buildSelectorColumnDefs(
  gridColumns: SelectorColumn[],
  options: BuildSelectorColumnDefsOptions
): MRT_ColumnDef<EntityData>[] {
  const { onTextFilterChange, onBooleanFilterChange, columnFilters, t, idFilterDisplayValues } = options;

  return gridColumns.map((col) => {
    const filterType = getFilterType(col.referenceId);
    const minimalCol = buildMinimalColumn(col, filterType);

    const columnDef: MRT_ColumnDef<EntityData> = {
      accessorKey: col.accessorKey,
      header: col.header,
      enableSorting: col.enableSorting ?? true,
      enableColumnFilter: col.enableFiltering ?? true,
    };

    if (!(col.enableFiltering ?? true)) return columnDef;

    if (filterType === "boolean") {
      const booleanOptions: FilterOption[] = [
        { id: "true", label: t("common.trueText"), value: "true" },
        { id: "false", label: t("common.falseText"), value: "false" },
      ];

      columnDef.Filter = () => {
        const currentFilter = columnFilters.find((f) => f.id === col.accessorKey);
        const selectedOptions = Array.isArray(currentFilter?.value) ? (currentFilter.value as FilterOption[]) : [];

        const filterState: ColumnFilterState = {
          id: col.accessorKey,
          selectedOptions,
          availableOptions: booleanOptions,
          isMultiSelect: false,
          loading: false,
          hasMore: false,
          searchQuery: "",
        };

        return (
          <ColumnFilter
            column={minimalCol}
            filterState={filterState}
            onFilterChange={(selected: FilterOption[]) => onBooleanFilterChange(col.accessorKey, selected)}
          />
        );
      };
    } else if (filterType === "date") {
      columnDef.Filter = () => {
        const currentFilter = columnFilters.find((f) => f.id === col.accessorKey);
        const filterValue = typeof currentFilter?.value === "string" ? currentFilter.value : undefined;

        return (
          <DateSelector
            column={minimalCol}
            filterValue={filterValue}
            onFilterChange={(value: string) => onTextFilterChange(col.accessorKey, value)}
          />
        );
      };
      columnDef.columnFilterModeOptions = ["contains", "startsWith", "endsWith"];
      columnDef.filterFn = "contains";
    } else {
      columnDef.Filter = () => {
        const idDisplayValue = idFilterDisplayValues?.get(col.accessorKey);
        const currentFilter = columnFilters.find((f) => f.id === col.accessorKey);
        const filterValue = idDisplayValue ?? (typeof currentFilter?.value === "string" ? currentFilter.value : undefined);

        return (
          <TextFilter
            column={minimalCol}
            filterValue={filterValue}
            onFilterChange={(value: string) => onTextFilterChange(col.accessorKey, value)}
          />
        );
      };
      columnDef.columnFilterModeOptions = ["contains", "startsWith", "endsWith"];
      columnDef.filterFn = "contains";
    }

    return columnDef;
  });
}

export function preloadFiltersFromCriteria(
  criteria: SelectorCriteria[],
  gridColumns: SelectorColumn[],
  rawResponse: DefaultFilterResponse | null,
  t: TranslateFunction
): MRT_ColumnFiltersState {
  const filters: MRT_ColumnFiltersState = [];
  const columnsByAccessorKey = new Map(gridColumns.map((col) => [col.accessorKey, col]));

  const idFilterFields = new Set((rawResponse?.idFilters ?? []).map((f) => f.fieldName));

  for (const criterion of criteria) {
    // Skip idFilters: they are always sent as hidden criteria with their original ID value
    if (idFilterFields.has(criterion.fieldName)) continue;

    const col = columnsByAccessorKey.get(criterion.fieldName);
    if (!col) continue;

    const filterType = getFilterType(col.referenceId);

    if (filterType === "boolean") {
      const boolVal = String(criterion.value);
      const label = criterion.value === true || boolVal === "true" ? t("common.trueText") : t("common.falseText");
      filters.push({
        id: col.accessorKey,
        value: [{ id: boolVal, label, value: boolVal }],
      });
    } else {
      filters.push({
        id: col.accessorKey,
        value: String(criterion.value),
      });
    }
  }

  return filters;
}

export function getHiddenDefaultCriteria(
  criteria: SelectorCriteria[],
  gridColumns: SelectorColumn[],
  rawResponse: DefaultFilterResponse | null
): SelectorCriteria[] {
  const visibleAccessorKeys = new Set(gridColumns.map((col) => col.accessorKey));
  const idFilterFields = new Set((rawResponse?.idFilters ?? []).map((f) => f.fieldName));
  // Keep criteria that either have no visible column OR are idFilters (always sent with original ID)
  return criteria.filter((c) => !visibleAccessorKeys.has(c.fieldName) || idFilterFields.has(c.fieldName));
}
