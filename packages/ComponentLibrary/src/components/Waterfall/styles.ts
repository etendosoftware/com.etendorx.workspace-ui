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

export const menuSyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        SectionContainer: {
          padding: "0.5rem",
        },
        StartIconStyles: {
          marginLeft: "0.5rem",
          maxHeight: "1rem",
          maxWidth: "1rem",
        },
        EndIconStyles: {
          position: "absolute",
          right: "0",
          marginRight: "0.5rem",
        },
        SpanStyles: {
          paddingRight: "0.5rem",
        },
        paperStyleMenu: {
          borderRadius: "0.75rem",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        menuItemStyles: {
          margin: "0 0.5rem",
          padding: "0.5rem",
          "&:hover": {
            borderRadius: "0.5rem",
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        customizeButton: {
          fontWeight: "500",
          fontSize: "1rem",
          width: "100%",
          height: "2.25rem",
          borderRadius: "0.5rem",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          position: "relative",
          "&:hover": {
            border: "none",
            color: theme.palette.baselineColor.neutral[80],
          },
        },
        headerBox: {
          "&:hover": {
            background: theme.palette.dynamicColor.contrastText,
            borderRadius: "0.5rem",
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
