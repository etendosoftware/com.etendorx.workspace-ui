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
import { alpha, useTheme, type SxProps, type Theme } from "@mui/material";

/** Lines of a note shown before it is cut and the "Show more" toggle appears. */
export const NOTE_COLLAPSED_LINES = 6;

const CARD_RADIUS = "0.75rem";
/** Opacity of the primary color tint of own notes: visible on the light and dark surfaces. */
const OWN_NOTE_TINT = 0.1;
/** Opacity of the "You" badge background, a step stronger than the tint of the note it sits on. */
const YOU_BADGE_TINT = 0.18;

/**
 * Classes of the delete button of a note: the red of the theme, with a faint red background on hover,
 * like the destructive actions of the Attachments section. CSS variables follow the dark theme.
 */
export const DELETE_ICON_BUTTON_CLASS =
  "text-(--color-error-main) bg-transparent hover:bg-(--color-error-contrast-text) hover:text-(--color-error-main) " +
  // The theme red is below 3:1 on the dark surfaces: a lighter red keeps the icon visible
  "dark:text-red-400 dark:hover:text-red-400";

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
      border: `1px solid ${baselineColor.transparentNeutral[30]}`,
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
      // The input is a control: its border is stronger than the one of the notes, and focus shows the primary color
      composer: {
        ...card,
        padding: "0.75rem",
        borderColor: baselineColor.transparentNeutral[50],
        "&:focus-within": { borderColor: dynamicColor.main },
      },
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
      listHeader: { display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "-0.5rem" },
      dateToggleButton: {
        padding: "0.125rem 0.5rem",
        minWidth: 0,
        textTransform: "none",
        fontWeight: 500,
        color: baselineColor.transparentNeutral[70],
        "& svg": { fill: "currentColor" },
        "&:hover": { color: dynamicColor.main },
      },
      item,
      // Own notes get a faint tint of the primary color (the highlight tone of the application)
      ownItem: { ...item, backgroundColor: alpha(dynamicColor.main, OWN_NOTE_TINT) },
      itemHeader: { display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "2rem" },
      author: { fontWeight: 600, color: baselineColor.neutral[90], overflowWrap: "anywhere" },
      youBadge: {
        padding: "0 0.5rem",
        borderRadius: "1rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: alpha(dynamicColor.main, YOU_BADGE_TINT),
        color: baselineColor.neutral[90],
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
