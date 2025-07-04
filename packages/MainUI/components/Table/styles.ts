import { type SxProps, type Theme, useTheme } from "@mui/material";
import { useMemo } from "react";

type StylesType = {
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        tablePaper: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
          maxHeight: "100%",
        },
        tableHeadCell: {
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          borderRight: `1px solid ${theme.palette.divider}`,
          background: theme.palette.baselineColor.transparentNeutral[5],
          fontWeight: "bold",
          color: theme.palette.text.primary,
          "&:last-child": {
            borderRight: "none",
          },
          "& .MuiBox-root": {
            whiteSpace: "nowrap",
          },
        },
        tableBodyCell: {
          borderRight: `1px solid ${theme.palette.divider}`,
          "&:first-of-type": {
            textAlign: "center",
          },
        },
        tableBody: {
          "& tr": {
            backgroundColor: theme.palette.background.paper,
          },
          cursor: "pointer",
        },
        // multiselect
        multiSelectContainer: {
          display: "flex",
        },
        rowSelected: {
          cursor: "pointer",
          backgroundColor: `${theme.palette.baselineColor.neutral[20]} !important`,
          "&:hover": {
            backgroundColor: `${theme.palette.baselineColor.neutral[10]} !important`,
          },
        },
        contentContainer: {
          flex: 1,
        },
        titleContainer: {
          margin: "0.5rem",
        },
        selectedContainer: {
          borderRadius: "0.25rem 0 0 0.25rem",
          minHeight: "8rem",
          maxHeight: "8rem",
          overflow: "auto",
          background: theme.palette.baselineColor.neutral[20],
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        selectedItem: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          borderBottom: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
        },
        selectedItemHover: {
          backgroundColor: theme.palette.baselineColor.neutral[5],
        },
        emptyState: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: theme.palette.baselineColor.neutral[100],
        },
        searchBarBase: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: "2rem",
          maxHeight: "8rem",
          borderRadius: "0 0.25rem 0.25rem 0",
          padding: "0.5rem 0.75rem",
          marginTop: "1.5rem",
          color: theme.palette.baselineColor.neutral[0],
          background: theme.palette.baselineColor.neutral[50],
        },
        clearButton: {
          background: theme.palette.baselineColor.neutral[10],
        },
        clearButtonHover: {
          background: theme.palette.baselineColor.neutral[50],
        },
        dialogContent: {
          padding: "1rem",
        },
      },
    }),
    [theme]
  );
};
