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
import { type CSSProperties, useMemo } from "react";

export const gridSizes = { xs: 12, sm: 1, md: 12 };
export const dotIntervals = 0;

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        buttonContainerStyles: {
          display: "flex",
          padding: "0rem 0.75rem 0.75rem 0.75rem",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0.5rem",
          flex: "1 0 0",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        mainContainer: {
          diplay: "flex",
          flexDirection: "column",
          heigh: "100%",
          width: "100%",
        },
        editButtonStyles: {
          fontWeight: "600",
          width: "100%",
          fontSize: "0.875rem",
          color: theme.palette.baselineColor.neutral[0],
          padding: "0.5rem 1rem",
          background: theme.palette.baselineColor.neutral[100],
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
          height: "2.5rem",
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
        saveButtonStyles: {
          fontWeight: "600",
          fontSize: "0.875rem",
          color: theme.palette.baselineColor.neutral[0],
          padding: "0.5rem 1rem",
          background: theme.palette.baselineColor.neutral[100],
          flex: "1 0 0",
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
          height: "2.5rem",
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
        cancelbuttonStyles: {
          fontWeight: "600",
          fontSize: "0.875rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          height: "2.5rem",
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
          flex: "1 0 0",
          color: theme.palette.baselineColor.transparentNeutral[70],
          background: theme.palette.baselineColor.neutral[0],
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
