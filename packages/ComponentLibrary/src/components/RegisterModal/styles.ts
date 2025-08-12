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
        itemList: {
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        },
        registerButton: {
          fontWeight: "600",
          fontSize: "0.875rem",
          padding: "0.5rem 1rem",
          width: "8.5rem",
          height: "2.5rem",
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
          flex: "1 0 0",
          color: theme.palette.baselineColor.transparentNeutral[70],
          background: theme.palette.baselineColor.transparentNeutral[0],
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.dark,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
