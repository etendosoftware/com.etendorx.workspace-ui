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
import { useMemo } from "react";

export const DEFAULT_MODAL_WIDTH = "25.625rem";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: () => ({
          padding: 0,
          height: "auto",
          "&:focus-visible": { outline: "none" },
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          boxShadow: `0 0.25rem 0.625rem 0 ${theme.palette.baselineColor.transparentNeutral[10]}`,
          borderRadius: "0.75rem",
          backgroundColor: theme.palette.baselineColor.neutral[0],
        }),
        content: (variant: unknown) => ({
          overflow: "auto",
          maxHeight: "calc(100vh - 3.125rem)",
          borderRadius: "0.75rem",
          backgroundColor:
            variant === "default" ? theme.palette.baselineColor.neutral[10] : theme.palette.baselineColor.neutral[0],
        }),
        sectionContent: {
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        },
        sectionBox: (isLast: boolean) => ({
          borderBottom: isLast ? "none" : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          backgroundColor: theme.palette.baselineColor.neutral[0],
        }),
        sectionInnerBox: (isLast: boolean) => ({
          padding: "0.75rem",
          paddingBottom: isLast ? "0.5rem" : "0.5rem",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }),
        itemBox: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          cursor: "pointer",
          transition: "background-color 500ms, color 500ms",
          "&:hover": {
            backgroundColor: theme.palette.dynamicColor.contrastText,
            color: theme.palette.dynamicColor.main,
          },
        },
        newLabel: () => ({
          backgroundColor: theme.palette.baselineColor.etendoPrimary.main,
          color: theme.palette.baselineColor.neutral[0],
          borderRadius: "12.5rem",
          padding: "0 0.5rem",
          fontSize: "10.25rem",
          fontWeight: 500,
        }),
      },
    }),
    [theme]
  );
};
