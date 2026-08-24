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

import { useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

/**
 * `BasicModal` formats its `width` prop as `${width}px`, so these are plain pixel values.
 * The default box is 300px wide, which is too narrow for a list of windows.
 */
export const UNSAVED_CHANGES_MODAL_WIDTH = 600;
export const UNSAVED_CHANGES_PROMPT_WIDTH = 480;

/**
 * Look shared by every unsaved-changes modal: the record prompt, the window-close prompt
 * and the per-window menu. Keeping it in one place is what makes them consistent with each
 * other and with the primary/secondary pairing the rest of the app uses.
 */
export const useUnsavedChangesStyles = () => {
  const theme = useTheme();

  return useMemo(() => {
    const { baselineColor, dynamicColor, specificColor } = theme.palette;

    const button = {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.875rem",
      borderRadius: "6.25rem",
      whiteSpace: "nowrap",
      height: "2.5rem",
      padding: "0 1.25rem",
    };

    const rowButton = {
      ...button,
      height: "2rem",
      fontSize: "0.8125rem",
      padding: "0 0.875rem",
    };

    const primary = {
      color: baselineColor.neutral[0],
      background: dynamicColor.main,
      "&:hover": {
        background: dynamicColor.dark,
        borderRadius: "6.25rem",
      },
      "&:disabled": {
        background: baselineColor.neutral[20],
        color: baselineColor.neutral[0],
      },
    };

    const secondary = {
      color: baselineColor.transparentNeutral[70],
      background: baselineColor.neutral[0],
      border: `1px solid ${baselineColor.neutral[20]}`,
      "&:hover": {
        background: dynamicColor.light,
        borderColor: dynamicColor.main,
        color: dynamicColor.dark,
        borderRadius: "6.25rem",
      },
      "&:disabled": {
        color: baselineColor.neutral[30],
        borderColor: baselineColor.neutral[20],
      },
    };

    const discard = {
      color: dynamicColor.main,
      background: baselineColor.neutral[0],
      border: `1px solid ${dynamicColor.main}`,
      "&:hover": {
        background: dynamicColor.light,
        borderColor: dynamicColor.dark,
        color: dynamicColor.dark,
        borderRadius: "6.25rem",
      },
      "&:disabled": {
        color: baselineColor.neutral[30],
        borderColor: baselineColor.neutral[20],
      },
    };

    return {
      sx: {
        primaryButton: { ...button, ...primary },
        secondaryButton: { ...button, ...secondary },
        discardButton: { ...button, ...discard },
        rowPrimaryButton: { ...rowButton, ...primary },
        rowSecondaryButton: { ...rowButton, ...secondary },
        rowDiscardButton: { ...rowButton, ...discard },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          paddingBottom: "1.5rem",
        },
        description: {
          fontSize: "0.875rem",
          fontWeight: 500,
          textAlign: "center",
          color: baselineColor.transparentNeutral[60],
        },
        rows: {
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "17rem",
          overflowY: "auto",
        },
        row: {
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "0.75rem",
          borderRadius: "0.75rem",
          border: `1px solid ${baselineColor.neutral[20]}`,
          background: baselineColor.neutral[10],
        },
        rowHeader: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        },
        rowLabels: {
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        },
        rowTitle: {
          fontSize: "0.875rem",
          fontWeight: 600,
          color: baselineColor.neutral[100],
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        rowHint: {
          fontSize: "0.75rem",
          fontWeight: 500,
          color: baselineColor.transparentNeutral[60],
        },
        rowActions: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexShrink: 0,
        },
        rowError: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.5rem",
          background: specificColor.error.contrastText,
        },
        rowErrorText: {
          fontSize: "0.75rem",
          fontWeight: 500,
          color: specificColor.error.main,
        },
      } as { [key: string]: SxProps<Theme> },
    };
  }, [theme]);
};
