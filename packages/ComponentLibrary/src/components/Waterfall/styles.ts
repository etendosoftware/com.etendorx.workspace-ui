import { type SxProps, type Theme, useTheme } from "@mui/material";
import { type CSSProperties, useMemo } from "react";

export const menuSyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        SectionContainer: {
          padding: "0.5rem",
        },
        StartIconStyles: {
          marginLeft: "0.5rem",
          maxHeight: "1rem",
          maxWidth: "1rem",
        },
        EndIconStyles: {
          position: "absolute",
          right: "0",
          marginRight: "0.5rem",
        },
        SpanStyles: {
          paddingRight: "0.5rem",
        },
        paperStyleMenu: {
          borderRadius: "0.75rem",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        menuItemStyles: {
          margin: "0 0.5rem",
          padding: "0.5rem",
          "&:hover": {
            borderRadius: "0.5rem",
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        customizeButton: {
          fontWeight: "500",
          fontSize: "1rem",
          width: "100%",
          height: "2.25rem",
          borderRadius: "0.5rem",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          position: "relative",
          "&:hover": {
            border: "none",
            color: theme.palette.baselineColor.neutral[80],
          },
        },
        headerBox: {
          "&:hover": {
            background: theme.palette.dynamicColor.contrastText,
            borderRadius: "0.5rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
