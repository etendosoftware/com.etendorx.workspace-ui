/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { type CSSProperties, useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

export const menuSyle = { paddingY: 0 };
export const COLUMN_SPACING = "0.75rem";
export const FIRST_MARGIN_TOP = "0.75rem";
export const BORDER_SELECT_1 = "1px solid ";
export const BORDER_SELECT_2 = "2px solid ";

export const useStyle = () => {
  const theme = useTheme();
  return useMemo(
    () => ({
      styles: {
        titleModalContainer: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          background: theme.palette.baselineColor.neutral[0],
          padding: "0.75rem",
        },
        titleModalImageContainer: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        },
        titleModalImageRadius: {
          width: "2rem",
          height: "2rem",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          background: theme.palette.baselineColor.neutral[10],
          borderRadius: "2rem",
          marginRight: "0.25rem",
        },
        titleModalImage: {
          width: "1rem",
          height: "1rem",
        },
        titleModal: {
          fontSize: "1rem",
          fontWeight: "600",
          lineHeight: "1.21rem",
          textAlign: "left",
        },
        imgContainer: {
          borderRadius: "0.75rem",
          width: "7rem",
          height: "4.5rem",
          cursor: "pointer",
          overflow: "hidden",
          transition: "border-color 0.25s ease",
        },
        img: { width: "100%", height: "100%" },
        title: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1.063rem",
          textAlign: "left",
          marginBottom: "0.75rem",
        },
        label: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1.063rem",
          textAlign: "left",
        },
        labelIcon: {
          width: "1rem",
          height: "1rem",
          marginRight: "0.25rem",
        },
        labelIconContainer: {
          display: "flex",
          flexDirection: "row",
          height: "1.25rem",
          marginTop: "0.25rem",
        },
        gridContainer: {
          padding: "0.75rem 1rem",
        },
        gridSectionContainer: {
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          background: theme.palette.baselineColor.neutral[0],
          padding: "0.75rem 1rem 0.75rem 1rem",
          borderRadius: "0.75rem",
        },
        paperStyleMenu: {
          background: theme.palette.baselineColor.neutral[10],
          borderRadius: "0.75rem",
        },
        listContainer: {
          padding: "0.75rem",
        },
        iconButtonStyles: {
          width: "2.5rem",
          height: "2.5rem",
          color: theme.palette.baselineColor.neutral[80],
        },
      } as { [key: string]: CSSProperties },
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
        linkStyles: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1rem",
          color: theme.palette.dynamicColor.main,
          textDecoration: "none",
          paddingRight: "0.5rem",
          cursor: "pointer",
          "&:hover": {
            textDecoration: "underline",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
