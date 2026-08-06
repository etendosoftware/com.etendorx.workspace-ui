import type { SxProps, Theme } from "@mui/material";
import type { MRT_ColumnDef, MRT_Row, MRT_Column, MRT_ColumnFiltersState } from "material-react-table";
import type { EntityData, Column, DatasourceOptions, Tab } from "@workspaceui/api-client/src/api/types";
import { WindowType } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { isEmptyObject } from "../commons";
import { formatClassicDate, isDateLike } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";

/**
 * Single source of truth for a tab's default implicit-filter state, mirroring Classic's
 * OBViewGridComponent.isHasFilterClause(): ON when the tab has an HQL filter clause, or when it
 * is a root tab of a transactional ("T") window (which auto-applies a recent/unprocessed filter).
 * Shared by the grid datasource, the toolbar button and saved-view capture so they never diverge
 * (ETP-4381). The SQL/HQL *where* clause is intentionally not a trigger — Classic always applies
 * it server-side regardless of the funnel, so it must not drive this default.
 */
export const getDefaultImplicitFilter = (tab: Tab): boolean => {
  const hasFilterClause = (tab.hqlfilterclause?.length ?? 0) > 0;
  const isTransactionalRootTab =
    tab.tabLevel === 0 && Metadata.getCachedWindow(tab.window)?.windowType === WindowType.T;
  return hasFilterClause || isTransactionalRootTab;
};

export type ImplicitFilterToggleAction = { type: "clearColumnFilters" } | { type: "setImplicit"; value: boolean };

/**
 * Decides what the funnel toolbar button does when clicked (ETP-4381):
 *  - if an "id" filter is pinning a single record (direct-link view), clear column filters to
 *    return to the full, implicit-filtered list;
 *  - otherwise, symmetric toggle of the implicit filter using the effective value
 *    (state ?? metadata default), so it can be turned back ON, not only OFF.
 */
export const resolveImplicitFilterToggle = ({
  hasIdFilter,
  isImplicitFilterApplied,
  initialIsFilterApplied,
}: {
  hasIdFilter: boolean;
  isImplicitFilterApplied: boolean | undefined;
  initialIsFilterApplied: boolean;
}): ImplicitFilterToggleAction => {
  if (hasIdFilter) {
    return { type: "clearColumnFilters" };
  }
  return { type: "setImplicit", value: !(isImplicitFilterApplied ?? initialIsFilterApplied) };
};

export const getDisplayColumnDefOptions = ({ shouldUseTreeMode }: { shouldUseTreeMode: boolean }) => {
  if (shouldUseTreeMode) {
    return {
      "mrt-row-expand": {
        size: 60,
        muiTableHeadCellProps: {
          sx: {
            display: "none",
          },
        },
        muiTableBodyCellProps: {
          sx: {
            display: "none",
          },
        },
      },
      "mrt-row-select": {
        size: 60,
        // Checkboxes visible in tree mode
      },
    };
  }
  return {
    "mrt-row-expand": {
      size: 0,
      muiTableHeadCellProps: {
        sx: {
          display: "none",
        },
      },
      muiTableBodyCellProps: {
        sx: {
          display: "none",
        },
      },
    },
    "mrt-row-select": {
      size: 60,
      // Checkboxes visible in normal mode
    },
  };
};

export const getMUITableBodyCellProps = ({
  shouldUseTreeMode,
  sx,
  columns,
  column,
  row,
}: {
  shouldUseTreeMode: boolean;
  sx: Record<string, SxProps<Theme>>;
  columns: MRT_ColumnDef<EntityData>[];
  column: MRT_Column<EntityData>;
  row: MRT_Row<EntityData>;
}): SxProps<Theme> => {
  // In tree mode, apply indentation to the SECOND column (first data column, after Actions)
  // This is index 1 because Actions is at index 0
  const treeIndentColumnId = columns[1]?.id;
  const isTreeIndentColumn = column.id === treeIndentColumnId;
  const paddingLeft = `${12 + ((row.original.__level as number) || 0) * 16}px`;

  const baseStyle = sx.tableBodyCell || {};

  if (shouldUseTreeMode && isTreeIndentColumn) {
    return {
      ...baseStyle,
      paddingLeft: paddingLeft,
      position: "relative",
    } as SxProps<Theme>;
  }

  return baseStyle;
};

export const getCurrentRowCanExpand = ({
  shouldUseTreeMode,
  row,
}: {
  shouldUseTreeMode: boolean;
  row: MRT_Row<EntityData>;
}): boolean => {
  if (shouldUseTreeMode) {
    return true;
  }
  const isParentNode = row.original.__isParent !== false;
  const canExpand = row.original.showDropIcon === true && isParentNode;
  return canExpand;
};

export const getNewActiveLevels = (currentLevels: number[], level: number, expand?: boolean) => {
  if (expand) return [level];

  if (expand === false) {
    if (level === 0) return [0];
    return [level - 1, level];
  }

  const maxLevel = currentLevels[currentLevels.length - 1];

  if (level === 0) return [0];
  if (maxLevel === level) return currentLevels;
  if (maxLevel > level) return [level - 1, level];

  return [maxLevel, level];
};

export const getNewActiveTabsByLevel = (currentMap: Map<number, string>, level: number, tabId: string) => {
  const newMap = new Map(currentMap);
  newMap.set(level, tabId);
  return newMap;
};

export const getCellTitle = (cellValue: unknown): string => {
  if (typeof cellValue === "string") {
    // Check if the string looks like a date and format it accordingly
    if (isDateLike(cellValue)) {
      const formattedDate = formatClassicDate(cellValue, false);
      return formattedDate || cellValue;
    }
    return cellValue;
  }
  if (typeof cellValue === "number") {
    return cellValue.toString();
  }
  if (typeof cellValue === "object" && cellValue !== null && "props" in cellValue) {
    const cellValueWithProps = cellValue as { props?: Record<string, unknown> };
    if (cellValueWithProps.props && !isEmptyObject(cellValueWithProps.props)) {
      return (cellValueWithProps.props as { label?: string }).label ?? "";
    }
  }
  return "";
};

export const mapSummariesToBackend = (summaries: Record<string, string>, baseColumns: Column[]) => {
  const summaryRequest: Record<string, string> = {};
  const columnMapping: Record<string, string> = {};

  for (const [colId, type] of Object.entries(summaries)) {
    const column = baseColumns.find((col) => col.columnName === colId || col.id === colId);
    if (column) {
      const backendName = column.columnName || column.id;
      summaryRequest[backendName] = type;
      columnMapping[backendName] = colId;
    }
  }

  return { summaryRequest, columnMapping };
};

export const getSummaryCriteria = (
  query: DatasourceOptions,
  tableColumnFilters: MRT_ColumnFiltersState,
  baseColumns: Column[]
) => {
  const columnFilterCriteria = LegacyColumnFilterUtils.createColumnFilterCriteria(tableColumnFilters, baseColumns);

  let existingCriteria: Record<string, unknown>[] = [];
  if (Array.isArray(query.criteria)) {
    existingCriteria = query.criteria as unknown as Record<string, unknown>[];
  } else if (query.criteria) {
    existingCriteria = [query.criteria] as unknown as Record<string, unknown>[];
  }

  return [...existingCriteria, ...columnFilterCriteria];
};
