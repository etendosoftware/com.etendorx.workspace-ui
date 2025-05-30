import { useTheme } from "@mui/material";
import { useMemo } from "react";

export const DEFAULT_MODAL_WIDTH = "25.625rem";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: () => ({
          padding: 0,
          height: "auto",
          "&:focus-visible": { outline: "none" },
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          boxShadow: `0 0.25rem 0.625rem 0 ${theme.palette.baselineColor.transparentNeutral[10]}`,
          borderRadius: "0.75rem",
          backgroundColor: theme.palette.baselineColor.neutral[0],
        }),
        content: (variant: unknown) => ({
          overflow: "auto",
          maxHeight: "calc(100vh - 3.125rem)",
          borderRadius: "0.75rem",
          backgroundColor:
            variant === "default" ? theme.palette.baselineColor.neutral[10] : theme.palette.baselineColor.neutral[0],
        }),
        sectionContent: {
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        },
        sectionBox: (isLast: boolean) => ({
          borderBottom: isLast ? "none" : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          backgroundColor: theme.palette.baselineColor.neutral[0],
        }),
        sectionInnerBox: (isLast: boolean) => ({
          padding: "0.75rem",
          paddingBottom: isLast ? "0.5rem" : "0.5rem",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }),
        itemBox: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          cursor: "pointer",
          transition: "background-color 500ms, color 500ms",
          "&:hover": {
            backgroundColor: theme.palette.dynamicColor.contrastText,
            color: theme.palette.dynamicColor.main,
          },
        },
        newLabel: () => ({
          backgroundColor: theme.palette.baselineColor.etendoPrimary.main,
          color: theme.palette.baselineColor.neutral[0],
          borderRadius: "12.5rem",
          padding: "0 0.5rem",
          fontSize: "10.25rem",
          fontWeight: 500,
        }),
      },
    }),
    [theme],
  );
};
