import { css, useTheme } from "@mui/material";
import { useMemo } from "react";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      container: css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }),
      icon: css({
        cursor: "pointer",
        margin: theme.spacing(1),
      }),
    }),
    [theme],
  );
};

export default useStyle;
