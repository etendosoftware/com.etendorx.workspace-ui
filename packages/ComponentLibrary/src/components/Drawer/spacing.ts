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

import type React from "react";

// Spacing of the expanded sidebar, the same on both sides for every part: header, search box,
// "Recently Viewed" and its chips, and the menu entries (hover and selected background).

/** Gap between the sidebar edges and every box inside it (12px). */
export const SIDEBAR_GUTTER_CLASS = "mx-3";
/** Same gap as padding, for containers that own the edge (header, search row). */
export const SIDEBAR_GUTTER_PADDING_CLASS = "px-3";
/** Inner padding of a menu entry, the same on both sides (8px): icon on the left, chevron on the right. */
export const MENU_ROW_PADDING_REM = 0.5;
/** Extra left padding per menu level (8px); entries only indent on the left, never shrink on the right. */
export const MENU_LEVEL_INDENT_REM = 0.5;

/**
 * Left padding of a menu entry at a given depth.
 *
 * @param depth 0 for a top-level entry, +1 per nesting level
 * @returns the inline style with the padding
 */
export const getMenuRowIndentStyle = (depth: number): React.CSSProperties => ({
  paddingLeft: `${MENU_ROW_PADDING_REM + depth * MENU_LEVEL_INDENT_REM}rem`,
});
