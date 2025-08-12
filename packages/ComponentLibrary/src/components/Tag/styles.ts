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
import type { TagType } from "./types";

type StylesType = {
  getColor: (type: TagType) => string;
  getTextColor: (type: TagType) => string;
  getColoredIcon: (icon: ReactElement, type: TagType) => ReactElement;
  getChipStyles: (type: TagType) => CSSProperties;
  sx: {
    chipLabel: (icon?: ReactElement) => SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();
  const self = useMemo(
    () => ({
      getColor: (type: TagType): string => {
        switch (type) {
          case "primary":
            return theme.palette.dynamicColor.main;
          case "success":
            return theme.palette.specificColor.success.main;
          case "warning":
            return theme.palette.specificColor.warning.main;
          case "error":
            return theme.palette.specificColor.error.main;
          case "draft":
            return theme.palette.specificColor.draft.contrastText;
          default:
            return theme.palette.dynamicColor.main;
        }
      },
      getTextColor: (type: TagType): string => {
        switch (type) {
          case "primary":
          case "success":
          case "error":
            return theme.palette.dynamicColor.contrastText;
          case "warning":
          case "draft":
            return theme.palette.baselineColor.neutral[100];
          default:
            return theme.palette.dynamicColor.contrastText;
        }
      },
      getChipStyles: (type: TagType): CSSProperties => ({
        backgroundColor: self.getColor(type),
        color: self.getTextColor(type),
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

  const getColoredIcon = (icon: ReactElement, type: TagType): ReactElement => {
    return React.cloneElement(icon, {
      style: {
        ...icon.props.style,
        color: self.getTextColor(type),
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
