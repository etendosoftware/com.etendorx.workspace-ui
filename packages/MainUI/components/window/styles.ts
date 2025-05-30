import { useMemo } from "react";
import { type Theme, useTheme, type SxProps } from "@mui/material";

type StylesType = {
  sx: {
    container: SxProps<Theme>;
    button: (isActive?: boolean) => SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: {
          padding: "0.5rem",
        },
        button: (isActive?: boolean) => ({
          color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
          backgroundColor: isActive ? theme.palette.background.default : theme.palette.action.disabled,
          borderRadius: "0.5rem",
          border: `1px solid ${theme.palette.divider}`,
          padding: theme.spacing(1),
          transition: theme.transitions.create(["color", "background-color"], {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": {
            borderRadius: "0.5rem",
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.baselineColor.neutral[20],
          },
        }),
      },
    }),
    [theme],
  );
};
