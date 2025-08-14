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
      styles: {
        defaultContainer: {
          borderRadius: "6.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          background: theme.palette.baselineColor.neutral[0],
          "&:hover": {
            backgroundColor: theme.palette.dynamicColor.main,
          },
        },
        buttonContainer: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        iconText: {
          marginLeft: "0.5rem",
          whiteSpace: "nowrap",
          fontSize: "0.825rem",
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
