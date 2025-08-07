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

import { useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

export const menuStyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();
  return useMemo(
    () => ({
      sx: {
        container: {
          display: "flex",
          minWidth: "4.75rem",
          maxWidth: "100%",
          overflow: "hidden",
          height: "2rem",
        },
        breadcrumbs: {
          flexGrow: 1,
          overflow: "hidden",
          height: "2rem",
          "& .MuiBreadcrumbs-ol": {
            height: "2rem",
            "& .MuiBreadcrumbs-li": {
              height: "2rem",
            },
          },
        },
        breadcrumbTypography: {
          fontSize: "1.375rem",
          fontWeight: "600",
          color: theme.palette.baselineColor.neutral[100],
          "&:hover": {
            textDecoration: "underline",
            color: theme.palette.baselineColor.neutral[100],
          },
        },
        breadcrumbItem: {
          height: "2rem",
          padding: "0",
          maxWidth: "100%",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        },
        lastItemTypography: {
          height: "2rem",
          display: "flex",
          alignItems: "center",
          padding: "0.25rem 0",
          fontSize: "1.375rem",
          fontWeight: "600",
          color: theme.palette.baselineColor.neutral[100],
        },
        textButton: {
          textDecoration: "none",
          color: "inherit",
          padding: 0,
          minWidth: "auto",
          "&:hover": {
            backgroundColor: "transparent",
            border: "none",
          },
        },
        iconContainer: {
          display: "flex",
          alignItems: "center",
        },
        iconButton: {
          padding: 0,
          minWidth: "auto",
          "&:hover": {
            backgroundColor: "transparent",
            border: "none",
          },
        },
        actionButton: {
          marginLeft: "0.5rem",
          padding: "0.25rem",
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
          justifyContent: "space-between",
          alignItems: "center",
          margin: "0.5rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          "&:hover": {
            color: theme.palette.dynamicColor.main,
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        iconBox: {
          display: "flex",
          alignItems: "center",
          "& > *:first-of-type": {
            marginRight: "0.5rem",
          },
          "& span": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        },
        toggleContainer: {
          marginLeft: "1rem",
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
