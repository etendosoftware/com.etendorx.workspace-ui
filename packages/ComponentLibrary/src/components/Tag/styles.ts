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

import React, { type CSSProperties, type ReactElement, useMemo } from "react";
import { type Theme, useTheme, type SxProps } from "@mui/material";

type StylesType = {
  getColor: (customColor?: string) => string;
  getTextColor: (customColor?: string) => string;
  getColoredIcon: (icon: ReactElement, customColor?: string) => ReactElement;
  getChipStyles: (customColor?: string) => CSSProperties;
  sx: {
    chipLabel: (icon?: ReactElement) => SxProps<Theme>;
  };
};

// Helper function to determine if a color is light or dark
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace("#", "");
  const r = Number.parseInt(hex.substr(0, 2), 16);
  const g = Number.parseInt(hex.substr(2, 2), 16);
  const b = Number.parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();
  const self = useMemo(
    () => ({
      getColor: (customColor?: string): string => {
        if (customColor) {
          return customColor;
        }

        return theme.palette.specificColor.draft.contrastText;
      },
      getTextColor: (customColor?: string): string => {
        if (customColor) {
          return isLightColor(customColor) ? "#000000" : "#FFFFFF";
        }
        return theme.palette.baselineColor.neutral[100];
      },
      getChipStyles: (customColor?: string): CSSProperties => ({
        backgroundColor: self.getColor(customColor),
        color: self.getTextColor(customColor),
        height: "1.5rem",
        fontWeight: 500,
        cursor: "default",
        padding: "0 0.5rem",
        fontFamily: "Inter, sans-serif",
        border: "none",
      }),
      sx: {
        chipLabel: (icon?: ReactElement): SxProps<Theme> => ({
          "& .MuiChip-label": {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            padding: "0",
            margin: "0",
            paddingLeft: icon ? "0.25rem" : "0",
          },
        }),
      },
    }),
    [theme]
  );

  const getColoredIcon = (icon: ReactElement, customColor?: string): ReactElement => {
    return React.cloneElement(icon, {
      style: {
        ...icon.props.style,
        color: self.getTextColor(customColor),
        width: "1rem",
        height: "1rem",
        margin: "0",
        padding: "0",
      },
    });
  };

  return {
    ...self,
    getColoredIcon,
  };
};
