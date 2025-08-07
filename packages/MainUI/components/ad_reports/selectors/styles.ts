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
import { type CSSProperties, useMemo } from "react";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        checkboxContainer: {
          position: "relative",
          height: "3rem",
          display: "flex",
          alignItems: "center",
        },
        checkboxBorder: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          backgroundColor: theme.palette.baselineColor.transparentNeutral[10],
          transition: "height 0.2s ease-in-out",
        },
        checkboxBorderHover: {
          backgroundColor: theme.palette.baselineColor.neutral[90],
          height: "2px",
        },
        checkboxLabel: {
          display: "inline-block",
          position: "relative",
          paddingLeft: "2rem",
          cursor: "pointer",
          userSelect: "none",
        },
        hiddenCheckbox: {
          position: "absolute",
          opacity: 0,
          cursor: "pointer",
          height: 0,
          width: 0,
        },
        styledCheckbox: {
          position: "absolute",
          top: "2px",
          left: 0,
          height: "1.25rem",
          width: "1.25rem",
          backgroundColor: theme.palette.dynamicColor.contrastText,
          transition: "background-color 0.25s ease",
          borderRadius: "0.375rem",
        },
        styledCheckboxChecked: {
          backgroundColor: theme.palette.dynamicColor.main,
        },
        styledCheckboxAfter: {
          content: '""',
          position: "absolute",
          left: "0.5rem",
          top: "0.25rem",
          width: "0.375rem",
          height: "0.625rem",
          border: `solid ${theme.palette.dynamicColor.contrastText}`,
          borderWidth: "0 2px 2px 0",
          borderRadius: "1px",
          transform: "rotate(45deg)",
          opacity: 0,
          transition: "opacity 0.25s ease",
        },
        styledCheckboxCheckedAfter: {
          opacity: 1,
        },
        labelText: {
          color: theme.palette.baselineColor.neutral[90],
          lineHeight: 1.4,
        },
        disabled: {
          opacity: 0.5,
          cursor: "not-allowed",
        },
      } as { [key: string]: CSSProperties },
    }),
    [theme]
  );
};
