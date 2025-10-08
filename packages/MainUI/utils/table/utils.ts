import type { SxProps, Theme } from "@mui/material";
import type { MRT_ColumnDef, MRT_Row, MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

/**
 * Determines if a value represents a valid CSS color.
 * Supports multiple formats: hexadecimal, RGB/RGBA, HSL/HSLA, and standard color names.
 *
 * @param value Value to evaluate. Usually a string is expected.
 * @returns {boolean} Returns true if the value is a valid color, false otherwise.
 *
 * Supported formats:
 *   - Hexadecimal: #fff, #ffffff
 *   - RGB/RGBA: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
 *   - HSL/HSLA: hsl(120, 100%, 50%), hsla(120, 100%, 50%, 0.3)
 *   - Color names: red, blue, transparent, inherit, etc.
 *
 * @example
 * isColorString("#1F845A"); // true
 * isColorString("rgba(0,0,0,0.5)"); // true
 * isColorString("banana"); // false
 */
export const isColorString = (value: unknown): boolean => {
  if (typeof value !== "string") return false;

  // Hex color pattern (#fff or #ffffff)
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (hexPattern.test(value)) return true;

  // RGB/RGBA pattern
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
  if (rgbPattern.test(value)) return true;

  // HSL/HSLA pattern
  const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
  if (hslPattern.test(value)) return true;

  // Named colors (basic check - could be expanded)
  const namedColors = [
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    "gray",
    "grey",
    "transparent",
    "inherit",
    "initial",
  ];
  if (namedColors.includes(value.toLowerCase())) return true;

  return false;
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
  const firstColumnId = columns[0]?.id;
  const isFirstColumn = column.id === firstColumnId;
  const paddingLeft = `${12 + ((row.original.__level as number) || 0) * 16}px`;

  const baseStyle = sx.tableBodyCell || {};

  if (shouldUseTreeMode && isFirstColumn) {
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
