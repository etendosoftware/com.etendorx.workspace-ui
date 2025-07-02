import { useMemo } from "react";

const useStyles = () => {
  return useMemo(
    () => ({
      container: {
        py: 4,
      },
      headerContainer: {
        mb: 4,
      },
      pageTitle: {
        fontWeight: "bold",
      },
      pageSubtitle: {
        color: "text.secondary",
      },
      widgetContainer: {
        p: 3,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      },
      widgetHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      },
      widgetTitleContainer: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      },
      iconContainer: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      widgetTitle: {
        fontWeight: "medium",
      },
      actionButton: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
      },
      widgetContent: {
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }),
    []
  );
};

export default useStyles;
