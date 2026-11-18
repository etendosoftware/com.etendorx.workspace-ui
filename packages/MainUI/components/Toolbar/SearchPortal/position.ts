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

/** Gap between the toolbar row and the search box, in pixels. */
export const SEARCH_BOX_GAP = 4;

export interface SearchBoxPosition {
  top: number;
  right: number;
}

/**
 * Places the search box right under the toolbar row and aligned with its right edge, so it stays inside the
 * content area instead of covering the tab bar or passing the right margin.
 *
 * @param anchorRect bounding box of the toolbar row
 * @param viewportWidth width of the viewport
 * @returns the fixed `top` and `right` coordinates of the box
 */
export const computeSearchBoxPosition = (
  anchorRect: Pick<DOMRect, "bottom" | "right">,
  viewportWidth: number
): SearchBoxPosition => ({
  top: anchorRect.bottom + SEARCH_BOX_GAP,
  right: Math.max(0, viewportWidth - anchorRect.right),
});
