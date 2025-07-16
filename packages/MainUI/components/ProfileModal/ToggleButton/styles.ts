import type { CSSProperties } from "react";
import { useTheme } from "@mui/material";

type StylesType = {
  [key: string]: CSSProperties;
};

export const useStyle = () => {
  const theme = useTheme();

  const styles: StylesType = {
    toggleContainerStyles: {
      display: "flex",
      padding: "0.25rem",
      justifyContent: "space-between",
      alignItems: "center",
      alignSelf: "stretch",
      borderRadius: "12.5rem",
      gap: "0.25rem",
      background: theme.palette.baselineColor.transparentNeutral[10],
    },
    toggleButtonStyles: {
      height: "2.5rem",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      justifyContent: "center",
      alignItems: "center",
      flex: "1 0 0",
      border: "0px solid",
      borderRadius: "12.5rem",
    },
  };

  return { styles };
};
