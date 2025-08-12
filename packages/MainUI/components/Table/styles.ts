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

import { type SxProps, type Theme, useTheme } from "@mui/material";
import { useMemo } from "react";

type StylesType = {
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        tablePaper: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
          maxHeight: "100%",
        },
        tableHeadCell: {
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          borderRight: `1px solid ${theme.palette.divider}`,
          background: theme.palette.baselineColor.transparentNeutral[5],
          fontWeight: "bold",
          color: theme.palette.text.primary,
          "&:last-child": {
            borderRight: "none",
          },
          "& .MuiBox-root": {
            whiteSpace: "nowrap",
          },
        },
        tableBodyCell: {
          borderRight: `1px solid ${theme.palette.divider}`,
          "&:first-of-type": {
            textAlign: "center",
          },
        },
        tableBody: {
          "& tr": {
            backgroundColor: theme.palette.background.paper,
          },
          cursor: "pointer",
        },
        // multiselect
        multiSelectContainer: {
          display: "flex",
        },
        rowSelected: {
          cursor: "pointer",
          backgroundColor: `${theme.palette.baselineColor.neutral[20]} !important`,
          "&:hover": {
            backgroundColor: `${theme.palette.baselineColor.neutral[10]} !important`,
          },
        },
        contentContainer: {
          flex: 1,
        },
        titleContainer: {
          margin: "0.5rem",
        },
        selectedContainer: {
          borderRadius: "0.25rem 0 0 0.25rem",
          minHeight: "8rem",
          maxHeight: "8rem",
          overflow: "auto",
          background: theme.palette.baselineColor.neutral[20],
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        selectedItem: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          borderBottom: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
        },
        selectedItemHover: {
          backgroundColor: theme.palette.baselineColor.neutral[5],
        },
        emptyState: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: theme.palette.baselineColor.neutral[100],
        },
        searchBarBase: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: "2rem",
          maxHeight: "8rem",
          borderRadius: "0 0.25rem 0.25rem 0",
          padding: "0.5rem 0.75rem",
          marginTop: "1.5rem",
          color: theme.palette.baselineColor.neutral[0],
          background: theme.palette.baselineColor.neutral[50],
        },
        clearButton: {
          background: theme.palette.baselineColor.neutral[10],
        },
        clearButtonHover: {
          background: theme.palette.baselineColor.neutral[50],
        },
        dialogContent: {
          padding: "1rem",
        },
      },
    }),
    [theme]
  );
};
