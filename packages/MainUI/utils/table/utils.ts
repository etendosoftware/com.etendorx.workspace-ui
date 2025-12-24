import type { SxProps, Theme } from "@mui/material";
import type { MRT_ColumnDef, MRT_Row, MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { isEmptyObject } from "../commons";
import { formatClassicDate, isDateLike } from "@workspaceui/componentlibrary/src/utils/dateFormatter";

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
