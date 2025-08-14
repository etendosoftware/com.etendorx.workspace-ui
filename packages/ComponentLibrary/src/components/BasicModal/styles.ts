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

import { type CSSProperties, useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

export const IconSize = 20;

export const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () => ({
      styles: {
        boxStyles: {
          position: "absolute",
          width: "18.75rem",
          background: theme.palette.baselineColor.neutral[0],
          border: `2px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          borderRadius: "1.125rem",
          boxShadow: `0px 0.25rem 0.625rem 0px ${theme.palette.baselineColor.neutral[90]}`,
        },
        modalStyles: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        buttonContainerStyles: {
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0.5rem",
          flex: "1 0 0",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        actionButtons: {
          position: "absolute",
          right: 8,
          top: 8,
          display: "flex",
          gap: "0.5rem",
        },
        fullScreenStyles: {
          position: "fixed",
          width: "100vw",
          height: "100vh",
        },
        actionButton: {
          background: "none",
          "&:hover": {
            background: theme.palette.baselineColor.transparentNeutral[5],
          },
        },
        headerContainer: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
        titleContainer: {
          display: "flex",
          alignItems: "center",
          marginBottom: "1rem",
        },
        closeRecordButton: {
          width: "2.5rem",
          height: "2.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: theme.palette.dynamicColor.contrastText,
          borderRadius: "2rem",
          marginRight: "0.5rem",
          "&:hover": {
            borderRadius: "2rem",
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        modalContainer: {
          display: "flex",
          flexDirection: "column",
          padding: "2.5rem",
        },
        registerText: { fontSize: "1.275rem", fontWeight: "600" },
        descriptionText: {
          marginBottom: "1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: theme.palette.baselineColor.transparentNeutral[60],
        },
        saveButton: {
          fontWeight: "600",
          fontSize: "0.875rem",
          color: theme.palette.baselineColor.neutral[0],
          padding: "0.5rem 1rem",
          background: theme.palette.baselineColor.neutral[100],
          flex: "1 0 0",
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
          height: "2.5rem",
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
          "&:disabled": {
            border: "none",
            color: theme.palette.baselineColor.neutral[0],
            background: theme.palette.baselineColor.transparentNeutral[10],
          },
        },
        cancelButton: {
          fontWeight: "600",
          fontSize: "0.875rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          height: "2.5rem",
          borderRadius: "6.25rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
          flex: "1 0 0",
          color: theme.palette.baselineColor.transparentNeutral[70],
          background: theme.palette.baselineColor.neutral[0],
          "&:hover": {
            borderRadius: "6.25rem",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
