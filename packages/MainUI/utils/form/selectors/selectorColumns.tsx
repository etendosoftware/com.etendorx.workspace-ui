import type { MRT_ColumnDef, MRT_ColumnFiltersState, MRT_Cell } from "material-react-table";
import type { EntityData, SelectorColumn, Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { TranslateFunction } from "@/hooks/types";
import { TextFilter } from "../../../components/Table/TextFilter";
import { DateSelector } from "../../../components/Table/DateSelector";
import { ColumnFilter } from "../../../components/Table/ColumnFilter";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check.svg";
import { DEFAULT_PAGE_SIZE, SELECTOR_SAFE_PARAMS, DEFAULT_SORT_BY } from "@/utils/table/constants";
import type { SelectorCriteria, DefaultFilterResponse } from "./defaultFilters";

const DATE_REFERENCE_IDS = new Set(["15", "16", "478169542A1747BD942DD70C8B45089C"]);
const BOOLEAN_REFERENCE_ID = "20";
const TABLEDIR_REFERENCE_IDS = new Set(["18", "19"]);

type FilterType = "boolean" | "date" | "text" | "dropdown";

export function getFilterType(referenceId?: string): FilterType {
  if (!referenceId) return "text";
  if (referenceId === BOOLEAN_REFERENCE_ID) return "boolean";
  if (DATE_REFERENCE_IDS.has(referenceId)) return "date";
  if (TABLEDIR_REFERENCE_IDS.has(referenceId)) return "dropdown";
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
  } else if (filterType === "dropdown") {
    base.type = "tabledir";
    base.referencedEntity = "true";
  }

  return base as Column;
}

interface BuildSelectorColumnDefsOptions {
  onTextFilterChange: (columnId: string, value: string) => void;
  onBooleanFilterChange: (columnId: string, selectedOptions: FilterOption[]) => void;
  onDropdownFilterChange?: (columnId: string, selectedOptions: FilterOption[]) => void;
  onLoadFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  onLoadMoreFilterOptions?: (columnId: string, searchQuery?: string) => Promise<FilterOption[]>;
  columnFilterStates?: ColumnFilterState[];
  columnFilters: MRT_ColumnFiltersState;
  t: TranslateFunction;
  idFilterDisplayValues?: Map<string, string>;
  idFilterPreloadedOptions?: Map<string, FilterOption[]>;
}

export function buildSelectorColumnDefs(
  gridColumns: SelectorColumn[],
  options: BuildSelectorColumnDefsOptions
): MRT_ColumnDef<EntityData>[] {
  const {
    onTextFilterChange,
    onBooleanFilterChange,
    onDropdownFilterChange,
    onLoadFilterOptions,
    onLoadMoreFilterOptions,
    columnFilterStates,
    columnFilters,
    t,
    idFilterDisplayValues,
    idFilterPreloadedOptions,
  } = options;

  return gridColumns.map((col) => {
    const filterType = getFilterType(col.referenceId);
    const minimalCol = buildMinimalColumn(col, filterType);

    const columnDef: MRT_ColumnDef<EntityData> = {
      accessorKey: col.accessorKey,
      header: col.header,
      enableSorting: col.enableSorting ?? true,
      enableColumnFilter: col.enableFiltering ?? true,
      Cell: ({ cell, row }: { cell: MRT_Cell<EntityData, unknown>; row: { original: EntityData } }) => {
        const identifierKey = `${col.accessorKey}$_identifier`;
        const label = (row.original[identifierKey] ?? cell.getValue()) as string | undefined;
        return <>{label ?? ""}</>;
      },
    };

    if (!(col.enableFiltering ?? true)) return columnDef;

    if (filterType === "boolean") {
      const booleanOptions: FilterOption[] = [
        { id: "true", label: t("common.trueText"), value: "true" },
        { id: "false", label: t("common.falseText"), value: "false" },
      ];

      columnDef.Cell = ({ cell }: { cell: MRT_Cell<EntityData, unknown> }) => {
        const val = cell.getValue();
        const isTrue = val === true || val === "true" || val === "Y" || val === "1" || val === "Yes";

        return (
          <div className="flex items-center justify-center w-full">
            <div className="relative flex items-end">
              <input
                type="checkbox"
                checked={isTrue}
                readOnly
                className="min-w-4 min-h-4 cursor-default rounded border-[1.67px] border-[rgba(0,3,13,0.4)] appearance-none bg-white checked:bg-[#004ACA] checked:border-[#004ACA]"
              />
              {isTrue && (
                <CheckIcon
                  className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none fill-white"
                  data-testid="CheckIcon__selector"
                />
              )}
            </div>
          </div>
        );
      };

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
            data-testid="ColumnFilter__ea08b7"
          />
        );
      };
    } else if (filterType === "dropdown") {
      columnDef.Filter = () => {
        const currentFilter = columnFilters.find((f) => f.id === col.accessorKey);
        const filterState = columnFilterStates?.find((f) => f.id === col.accessorKey);
        let selectedOptions: FilterOption[];
        if (currentFilter) {
          selectedOptions = Array.isArray(currentFilter.value) ? (currentFilter.value as FilterOption[]) : [];
        } else {
          selectedOptions = idFilterPreloadedOptions?.get(col.accessorKey) ?? [];
        }

        const effectiveFilterState: ColumnFilterState = {
          id: col.accessorKey,
          selectedOptions,
          availableOptions: filterState?.availableOptions || [],
          isMultiSelect: true,
          loading: filterState?.loading || false,
          hasMore: filterState?.hasMore || false,
          searchQuery: filterState?.searchQuery || "",
        };

        return (
          <ColumnFilter
            column={minimalCol}
            filterState={effectiveFilterState}
            onFilterChange={(selected: FilterOption[]) => onDropdownFilterChange?.(col.accessorKey, selected)}
            onLoadOptions={(q?: string) => onLoadFilterOptions?.(col.accessorKey, q)}
            onLoadMoreOptions={(q?: string) => onLoadMoreFilterOptions?.(col.accessorKey, q)}
            data-testid="ColumnFilter__ea08b7"
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
            data-testid="DateSelector__ea08b7"
          />
        );
      };
      columnDef.columnFilterModeOptions = ["contains", "startsWith", "endsWith"];
      columnDef.filterFn = "contains";
    } else {
      columnDef.Filter = () => {
        const currentFilter = columnFilters.find((f) => f.id === col.accessorKey);
        // Show idFilter _identifier only if the user hasn't interacted with this filter yet
        const idDisplayValue = !currentFilter ? idFilterDisplayValues?.get(col.accessorKey) : undefined;
        const filterValue =
          idDisplayValue ?? (typeof currentFilter?.value === "string" ? currentFilter.value : undefined);

        return (
          <TextFilter
            column={minimalCol}
            filterValue={filterValue}
            onFilterChange={(value: string) => onTextFilterChange(col.accessorKey, value)}
            data-testid="TextFilter__ea08b7"
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

export function buildDatasourceColumns(gridColumns: SelectorColumn[]): Column[] {
  return gridColumns.map((col) => {
    const filterType = getFilterType(col.referenceId);
    return {
      id: col.accessorKey,
      name: col.header,
      header: col.header,
      columnName: col.accessorKey,
      _identifier: col.accessorKey,
      accessorFn: (v: Record<string, unknown>) => v[col.accessorKey],
      referencedTabId: null,
      reference: col.referenceId,
      type: filterType === "dropdown" ? "tabledir" : undefined,
      referencedEntity: filterType === "dropdown" ? "true" : undefined,
    } as Column;
  });
}

export function getHiddenDefaultCriteria(
  criteria: SelectorCriteria[],
  gridColumns: SelectorColumn[],
  rawResponse: DefaultFilterResponse | null,
  activeColumnFilterIds?: Set<string>
): SelectorCriteria[] {
  const visibleAccessorKeys = new Set(gridColumns.map((col) => col.accessorKey));
  const idFilterFields = new Set((rawResponse?.idFilters ?? []).map((f) => f.fieldName));
  return criteria.filter((c) => {
    // If the user edited this column's filter, drop the hidden default so the user's takes over
    if (idFilterFields.has(c.fieldName) && activeColumnFilterIds?.has(c.fieldName)) return false;
    // Keep criteria that have no visible column OR are idFilters (not yet edited)
    return !visibleAccessorKeys.has(c.fieldName) || idFilterFields.has(c.fieldName);
  });
}

export interface BuildSelectorDatasourceParamsInput {
  field: {
    selector?: Record<string, unknown>;
    hqlName?: string;
    columnName?: string;
    column?: { dBColumnName?: string };
  };
  etendoContext: Record<string, unknown>;
  language: string | null;
  sorting: { id: string; desc: boolean }[];
  currentTab: {
    id: string;
    window: string;
    fields: Record<string, { inputName?: string; hqlName?: string; id: string }>;
  } | null;
  formValues: Record<string, unknown>;
  columnFilters: { id: string; value: unknown }[];
  defaultCriteria: SelectorCriteria[] | null;
  defaultFilterResponse: DefaultFilterResponse | null;
  gridColumns: SelectorColumn[];
}

function buildDatasourceBaseParams(
  field: BuildSelectorDatasourceParamsInput["field"],
  etendoContext: Record<string, unknown>,
  language: string | null
): Record<string, unknown> {
  const selector = field.selector;
  return {
    ...etendoContext,
    isSorting: true,
    language,
    _sortBy: (selector?._sortBy as string) || DEFAULT_SORT_BY,
    pageSize: DEFAULT_PAGE_SIZE,
    IsSelectorItem: "true",
    _requestType: "Window",
    targetProperty: field.hqlName || field.columnName,
    columnName: field.column?.dBColumnName || field.columnName,
  };
}

function applyTabFieldValues(
  params: Record<string, unknown>,
  currentTab: BuildSelectorDatasourceParamsInput["currentTab"],
  formValues: Record<string, unknown>
): void {
  if (!currentTab) return;

  for (const tabField of Object.values(currentTab.fields)) {
    if (tabField.inputName) {
      const val = formValues[tabField.hqlName ?? ""] ?? formValues[tabField.inputName] ?? formValues[tabField.id];
      if (val !== undefined && val !== null) {
        params[tabField.inputName] = String(val);
      }
    }
  }

  params.windowId = currentTab.window;
  params.tabId = currentTab.id;
  params.inpwindowId = currentTab.window;
  params.inpTabId = currentTab.id;
  params.adTabId = currentTab.id;
}

function applySelectorParams(params: Record<string, unknown>, selector: Record<string, unknown>): void {
  for (const param of SELECTOR_SAFE_PARAMS) {
    if (selector[param] !== undefined && selector[param] !== null) {
      params[param] = selector[param];
    }
  }
}

export function buildSelectorDatasourceParams(input: BuildSelectorDatasourceParamsInput): Record<string, unknown> {
  const {
    field,
    etendoContext,
    language,
    sorting,
    currentTab,
    formValues,
    columnFilters,
    defaultCriteria,
    defaultFilterResponse,
    gridColumns,
  } = input;

  const params = buildDatasourceBaseParams(field, etendoContext, language);

  applyTabFieldValues(params, currentTab, formValues);

  if (field.selector) {
    applySelectorParams(params, field.selector);
  }

  if (sorting.length > 0) {
    params.sortBy = `${sorting[0].id}${sorting[0].desc ? " desc" : ""}`;
  }

  if (params.inpadOrgId && !params._org) params._org = params.inpadOrgId;

  const activeFilterIds = new Set(columnFilters.map((f) => f.id));
  const hiddenCriteria = getHiddenDefaultCriteria(
    defaultCriteria ?? [],
    gridColumns,
    defaultFilterResponse,
    activeFilterIds
  );
  if (hiddenCriteria.length > 0) {
    params.criteria = hiddenCriteria;
  }

  return params;
}
