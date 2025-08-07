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

import { type SxProps, type Theme, useTheme } from "@mui/material/styles";
import { useMemo } from "react";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
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
        iconStyles: {
          width: "1.5rem",
          height: "1.5rem",
          color: theme.palette.baselineColor.neutral[80],
        },
        badgeStyles: {
          "& .MuiBadge-badge": {
            top: "25%",
            right: "30%",
            fontSize: "0.75rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
