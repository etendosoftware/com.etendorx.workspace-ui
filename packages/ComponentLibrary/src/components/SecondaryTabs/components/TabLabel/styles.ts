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

type StylesType = {
  styles: {
    tabLabelContainerStyles: SxProps<Theme>;
    badgeTextStyles: CSSProperties;
    badgeStyles: SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        tabLabelContainerStyles: {
          display: "flex",
          alignItems: "center",
          height: "100%",
          "& .MuiBadge-badge": {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
            color: theme.palette.baselineColor.neutral[100],
            fontSize: "0.875rem",
            fontWeight: 500,
            height: "1.5rem",
            borderRadius: "12.5rem",
            paddingX: "0.5rem",
          },
        },
        badgeTextStyles: {
          marginLeft: "0.5rem",
          marginRight: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "inherit",
        } as CSSProperties,
        badgeStyles: {
          marginLeft: "0.875rem",
          "& .MuiBadge-badge": {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
            color: theme.palette.baselineColor.neutral[100],
            fontSize: "0.875rem",
            fontWeight: 500,
            height: "1.5rem",
            borderRadius: "12.5rem",
            maxWidth: "1.5rem",
            paddingX: "0.5rem",
          },
        },
      },
    }),
    [theme]
  );
};
