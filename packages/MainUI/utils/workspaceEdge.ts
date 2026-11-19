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

/**
 * Side padding of a window: 8px. Its toolbar, grid and child panel start 4px further (toolbar padding, grid
 * selection border), so their visible edge is 12px from the menu. It was 16px (20px visible), which wasted width.
 */
export const WINDOW_CONTENT_PADDING_CLASS = "px-2";

/** Padding of the home page: its cards have no inner inset, so 12px puts them on the same edge as a window. */
export const HOME_CONTENT_PADDING_CLASS = "p-3";

/**
 * Left padding of the rows above a window (top bar with the back arrow, and the bar with the home button and the
 * window tabs): 12px, the visible edge of the window content, so the arrow and the home button line up with it.
 */
export const WORKSPACE_EDGE_PADDING_CLASS = "pl-3";
