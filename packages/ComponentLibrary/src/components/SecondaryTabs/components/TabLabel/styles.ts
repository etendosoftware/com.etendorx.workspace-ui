import { type SxProps, type Theme, useTheme } from "@mui/material";
import { type CSSProperties, useMemo } from "react";

type StylesType = {
  styles: {
    tabLabelContainerStyles: SxProps<Theme>;
    badgeTextStyles: CSSProperties;
    badgeStyles: SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        tabLabelContainerStyles: {
          display: "flex",
          alignItems: "center",
          height: "100%",
          "& .MuiBadge-badge": {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
            color: theme.palette.baselineColor.neutral[100],
            fontSize: "0.875rem",
            fontWeight: 500,
            height: "1.5rem",
            borderRadius: "12.5rem",
            paddingX: "0.5rem",
          },
        },
        badgeTextStyles: {
          marginLeft: "0.5rem",
          marginRight: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "inherit",
        } as CSSProperties,
        badgeStyles: {
          marginLeft: "0.875rem",
          "& .MuiBadge-badge": {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
            color: theme.palette.baselineColor.neutral[100],
            fontSize: "0.875rem",
            fontWeight: 500,
            height: "1.5rem",
            borderRadius: "12.5rem",
            maxWidth: "1.5rem",
            paddingX: "0.5rem",
          },
        },
      },
    }),
    [theme]
  );
};
