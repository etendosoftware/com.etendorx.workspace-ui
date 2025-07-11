import { type CSSProperties, useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

export const tabIndicatorProps = { style: { display: "none" } };
export const menuStyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        containerBox: {
          width: "100%",
          height: "3rem",
          display: "flex",
          background: theme.palette.baselineColor.transparentNeutral[5],
          borderRadius: "6.25rem",
          alignItems: "center",
          justifyContent: "space-between",
        },
        tabsContainer: {
          flexGrow: 1,
          maxHeight: "3rem",
          paddingLeft: "0.25rem",
          paddingRight: "0.25rem",
          overflowX: "auto",
        },
        iconButtonMore: {
          marginLeft: "0.25rem",
          padding: "0.5rem",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        tabs: {
          minHeight: "3rem",
          maxHeight: "3rem",
          "& .MuiTabs-scrollButtons": {
            "&.Mui-disabled": {
              opacity: 0.3,
            },
          },
          "& .MuiTabs-scroller": {
            display: "flex",
          },
          "& .MuiTabs-flexContainer": {
            gap: "0.25rem",
            height: "100%",
            maxHeight: "2.5rem",
            alignSelf: "center",
          },
          "& .MuiTab-root": {
            maxHeight: "2.5rem",
            minHeight: "2.5rem",
          },
        },
        tab: {
          maxHeight: "2.5rem",
          textTransform: "none",
          borderRadius: "12.5rem",
          transition: "background-color 0.3s, color 0.4s",
          color: theme.palette.baselineColor.neutral[90],
          padding: "0.25rem 1rem",
          whiteSpace: "nowrap",
          "& .MuiTab-iconWrapper": {
            marginRight: "0.5rem",
          },
          "&.Mui-selected": {
            background: theme.palette.baselineColor.neutral[0],
            color: theme.palette.baselineColor.neutral[90],
          },
          "&:hover:not(.Mui-selected)": {
            color: theme.palette.baselineColor.neutral[0],
            background: theme.palette.dynamicColor.main,
          },
        },
        menu: {
          borderRadius: "0.75rem",
          "& .MuiPaper-root": {
            borderRadius: "0.75rem",
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        menuItem: {
          display: "flex",
          width: "15rem",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "0.5rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          "&.Mui-selected": {
            background: theme.palette.baselineColor.neutral[10],
          },
          "&:hover": {
            background: "",
            color: theme.palette.baselineColor.neutral[80],
          },
        },
        selectedMenuItem: {
          backgroundColor: theme.palette.dynamicColor.contrastText,
        },
        iconBox: {
          display: "flex",
          alignItems: "center",
          maxWidth: "10rem",
          overflow: "hidden",
          "& span": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginLeft: "0.5rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
