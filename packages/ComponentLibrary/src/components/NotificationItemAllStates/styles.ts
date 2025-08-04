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

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        rightButton: {
          background: theme.palette.baselineColor.neutral[100],
          color: theme.palette.baselineColor.neutral[0],
          height: "2rem",
          borderRadius: "6.25rem",
          padding: "0.5rem 1rem",
          "&:hover": {
            border: "none",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.dynamicColor.contrastText,
          },
        },
        leftButton: {
          background: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.transparentNeutral[100],
          height: "2rem",
          borderRadius: "6.25rem",
          padding: "0.5rem 1rem",
          border: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
          "&:hover": {
            border: "none",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.dynamicColor.contrastText,
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
