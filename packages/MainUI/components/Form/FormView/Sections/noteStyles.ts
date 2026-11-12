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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useMemo } from "react";
import { useTheme, type SxProps, type Theme } from "@mui/material";

/** Lines of a note shown before it is cut and the "Show more" toggle appears. */
export const NOTE_COLLAPSED_LINES = 6;

const CARD_RADIUS = "0.75rem";
const ACCENT_WIDTH = "4px";

/**
 * Styles of the Notes section. Every color comes from the theme palette, which the dark theme
 * inverts, so the section stays readable in both themes.
 */
export const useNoteStyles = (): Record<string, SxProps<Theme>> => {
  const theme = useTheme();

  return useMemo(() => {
    const { baselineColor, dynamicColor, specificColor, common } = theme.palette;
    const card = {
      backgroundColor: baselineColor.neutral[0],
      border: `1px solid ${baselineColor.transparentNeutral[10]}`,
      borderRadius: CARD_RADIUS,
    };
    const item = { ...card, padding: "0.75rem 1rem" };
    const body = {
      marginTop: "0.25rem",
      color: baselineColor.neutral[90],
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    };

    return {
      container: { display: "flex", flexDirection: "column", gap: "0.75rem" },
      composer: { ...card, padding: "0.75rem" },
      composerInput: {
        "& .MuiInputBase-root": { padding: 0, color: baselineColor.neutral[90] },
        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        "& textarea::placeholder": { color: baselineColor.transparentNeutral[60], opacity: 1 },
      },
      composerFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "0.75rem",
        marginTop: "0.5rem",
        paddingTop: "0.5rem",
        borderTop: `1px solid ${baselineColor.transparentNeutral[10]}`,
      },
      composerHint: { color: baselineColor.transparentNeutral[70], marginRight: "auto" },
      composerCounter: { color: baselineColor.transparentNeutral[70], fontVariantNumeric: "tabular-nums" },
      composerCounterLimit: { color: specificColor.error.main, fontVariantNumeric: "tabular-nums" },
      submitButton: {
        borderRadius: "1.5rem",
        textTransform: "none",
        boxShadow: "none",
        "&.Mui-disabled": {
          backgroundColor: baselineColor.transparentNeutral[10],
          color: baselineColor.transparentNeutral[50],
        },
      },
      list: { display: "flex", flexDirection: "column", gap: "0.5rem", margin: 0, padding: 0, listStyle: "none" },
      item: { ...item, borderLeft: `${ACCENT_WIDTH} solid ${baselineColor.transparentNeutral[10]}` },
      ownItem: { ...item, borderLeft: `${ACCENT_WIDTH} solid ${dynamicColor.main}` },
      itemHeader: { display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "2rem" },
      avatar: {
        width: "1.75rem",
        height: "1.75rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: dynamicColor.light,
        color: dynamicColor.main,
      },
      author: { fontWeight: 600, color: baselineColor.neutral[90], overflowWrap: "anywhere" },
      youBadge: {
        padding: "0 0.5rem",
        borderRadius: "1rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: dynamicColor.light,
        color: dynamicColor.main,
      },
      date: { color: baselineColor.transparentNeutral[70], whiteSpace: "nowrap" },
      deleteSlot: { marginLeft: "auto" },
      body,
      bodyCollapsed: {
        ...body,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: NOTE_COLLAPSED_LINES,
        overflow: "hidden",
      },
      toggleButton: {
        padding: 0,
        minWidth: 0,
        marginTop: "0.25rem",
        textTransform: "none",
        color: dynamicColor.main,
        fontWeight: 600,
      },
      confirm: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginTop: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.5rem",
        backgroundColor: specificColor.error.contrastText,
      },
      confirmText: { color: baselineColor.neutral[90], fontWeight: 600, marginRight: "auto" },
      cancelButton: { textTransform: "none", color: baselineColor.neutral[90] },
      deleteButton: {
        textTransform: "none",
        boxShadow: "none",
        backgroundColor: specificColor.error.main,
        color: common.white,
        "&:hover": { backgroundColor: specificColor.error.main, boxShadow: "none" },
      },
      empty: { color: baselineColor.transparentNeutral[70], padding: "0.5rem 0.25rem" },
      skeleton: { borderRadius: CARD_RADIUS },
    };
  }, [theme]);
};
