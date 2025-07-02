import { type SxProps, type Theme, useTheme } from "@mui/material/styles";
import { useMemo } from "react";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        hoverStyles: {
          background: "white",
          "&:hover": {
            backgroundColor: theme.palette.dynamicColor.main,
            "& .MuiSvgIcon-root": {
              color: theme.palette.baselineColor.neutral[0],
            },
          },
        },
        iconStyles: {
          width: "1.5rem",
          height: "1.5rem",
          color: theme.palette.baselineColor.neutral[80],
        },
        badgeStyles: {
          "& .MuiBadge-badge": {
            top: "25%",
            right: "30%",
            fontSize: "0.75rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
