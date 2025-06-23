import { type CSSProperties, useMemo } from "react";
import { useTheme } from "@mui/material";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        NavStyles: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "0 0.25rem",
        },
        LeftItems: {
          width: "22.75rem",
          padding: "0 0.25rem",
          borderRadius: "6.25rem",
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          marginBottom: "0.25rem",
        },
        RightItems: {
          height: "3rem",
          padding: "0.25rem",
          display: "flex",
          borderRadius: "6.25rem",
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
        },
        childBox: {
          display: "flex",
          gap: "0.25rem",
        },
      } as { [key: string]: CSSProperties },
    }),
    [theme]
  );
};
