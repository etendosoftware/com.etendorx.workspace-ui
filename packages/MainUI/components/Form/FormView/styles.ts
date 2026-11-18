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
import { theme } from "@workspaceui/componentlibrary/src/theme";

export const defaultFill = theme.palette.dynamicColor.main;

type StylesType = {
  styles: Record<string, CSSProperties>;
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        dottedSpacing: {
          flex: 1,
          backgroundImage: `radial-gradient(circle, ${theme.palette.text.secondary} 1px, transparent 1px)`,
          backgroundSize: "8px 4px",
          backgroundPosition: "bottom",
          backgroundRepeat: "repeat-x",
          height: "4px",
          marginLeft: theme.spacing(1.5),
          marginRight: theme.spacing(2),
        },

        labelText: {
          fontSize: "0.875rem",
          whiteSpace: "nowrap",
          color: theme.palette.baselineColor.neutral[80],
        },
        requiredAsterisk: {
          width: "0.75rem",
          height: "1rem",
          color: theme.palette.specificColor.error.main,
          marginLeft: theme.spacing(1),
        },
        fieldContainer: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        },
      },
      sx: {
        labelWrapper: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        },
        linkStyles: {
          fontSize: "0.875rem",
          fontWeight: "600",
          lineHeight: "1rem",
          color: theme.palette.dynamicColor.main,
          textDecoration: "none",
          paddingRight: "0.5rem",
          cursor: "pointer",
          "&:hover": {
            textDecoration: "underline",
          },
        },
        accordion: {
          width: "100%",
          marginTop: "0.5rem",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "0.75rem",
          "&:before": {
            display: "none",
          },
          "&:first-of-type": {
            borderRadius: "0.75rem",
          },
          "&:last-of-type": {
            borderRadius: "0.75rem",
          },
          "&.MuiAccordion-root": {
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: `${theme.spacing(1)} 0 0`,
            },
          },
          "& .MuiAccordionSummary-root": {
            minHeight: "auto",
            "&.Mui-expanded": {
              minHeight: "auto",
            },
          },
          "& .MuiAccordionSummary-content": {
            margin: `${theme.spacing(1)} 0`,
            "&.Mui-expanded": {
              margin: `${theme.spacing(1)} 0`,
            },
          },
          "& .MuiAccordionDetails-root": {
            padding: theme.spacing(2),
          },
        },
        iconLabel: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        },
        chevronButton: {
          background: "none",
          "&:hover": {
            background: theme.palette.baselineColor.transparentNeutral[5],
          },
        },
        accordionSummary: {
          borderRadius: "0.75rem",
          "&.Mui-expanded": {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
          "&:hover .main-icon-button": {
            backgroundColor: theme.palette.dynamicColor.main,
          },
        },
        labelBox: {
          flexBasis: "40%",
          alignContent: "center",
          alignItems: "center",
        },
        inputBox: {
          flexGrow: 1,
        },
        checkboxContainer: {
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: theme.palette.baselineColor.neutral[100],
            opacity: 0.42,
          },
          "&:hover::after": {
            height: "2px",
            opacity: 0.87,
          },
          "&:focus-within::after": {
            height: "2px",
            backgroundColor: theme.palette.baselineColor.neutral[100],
            opacity: 1,
          },
        },
        gridItem: {
          display: "flex",
          alignItems: "stretch",
        },
      },
    }),
    [theme]
  );
};
