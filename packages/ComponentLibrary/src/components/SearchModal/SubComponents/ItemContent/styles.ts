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

import { useTheme } from "@mui/material";

export const useStyle = () => {
  const theme = useTheme();

  return {
    styles: {
      itemBox: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "background-color 500ms, color 500ms",
        "&:hover": {
          backgroundColor: theme.palette.dynamicColor.contrastText,
          color: theme.palette.dynamicColor.main,
        },
      },
      itemIcon: {
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: 500,
      },
      itemText: {
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: 500,
        opacity: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      newLabel: {
        backgroundColor: theme.palette.baselineColor.etendoPrimary.main,
        color: theme.palette.baselineColor.neutral[0],
        borderRadius: "6.25rem",
        padding: "0 1rem",
        fontSize: "0.875rem",
        fontWeight: 500,
      },
    },
  };
};
