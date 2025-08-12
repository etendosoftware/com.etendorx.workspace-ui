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

export const menuSyle = { padding: 0 };

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        menuContainer: {},
        titleModalContainer: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem",
          background: theme.palette.baselineColor.neutral[0],
          borderBottom: `1px solid ${theme.palette.dynamicColor.contrastText}`,
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
        titleModalButtonContainer: {
          width: "2rem",
          height: "2rem",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        },
        titleModalImage: {
          width: "1rem",
          height: "1rem",
        },
        rigthContainer: {
          alignItems: "center",
          display: "flex",
        },
        titleModal: {
          fontSize: "1rem",
          fontWeight: "600",
        },
        listContainer: {},
        emptyState: {
          width: "28.75rem",
          background: theme.palette.dynamicColor.contrastText,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
        emptyStateImage: {
          width: "12.5rem",
          height: "12.5rem",
          marginBottom: "1rem",
        },
        emptyTextContainer: {
          maxWidth: "24.75rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
        emptyHeader: {
          padding: "0.5rem",
          fontSize: "1.375rem",
          fontWeight: "600",
          color: theme.palette.baselineColor.neutral[80],
        },
        emptyText: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1.25rem",
          paddingBottom: "0.5rem",
          textAlign: "center",
          color: theme.palette.baselineColor.transparentNeutral[10],
        },
        actionButton: {
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          borderRadius: "6.25rem",
          padding: "0.5rem 1rem",
        },
        actionButtonText: {
          fontSize: "0.875rem",
          lineHeight: "1.25rem  ",
        },
        paperStyleMenu: {
          borderRadius: "0.75rem",
          background: theme.palette.dynamicColor.contrastText,
        },
      } as { [key: string]: CSSProperties },
      sx: {
        actionButton: {
          background: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.transparentNeutral[10],
          "&:hover": {
            border: "none",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[10],
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

        badgeStyles: {
          ".MuiBadge-badge": {
            fontSize: "0.75rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
