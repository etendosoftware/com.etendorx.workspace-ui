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

/** Minimum distance kept between the menu and the viewport edges. */
export const MENU_VIEWPORT_MARGIN = 8;
/** Space left free when the menu height is limited to the room next to its anchor. */
const MENU_HEIGHT_GAP = MENU_VIEWPORT_MARGIN * 2;

export interface MenuVerticalInput {
  anchorTop: number;
  anchorBottom: number;
  menuHeight: number;
  viewportHeight: number;
  offsetY?: number;
}

export interface MenuVerticalPlacement {
  y: number;
  /** Height limit to apply, or `null` when the whole menu fits. */
  maxHeight: number | null;
}

/**
 * Limits the height to the available room, when the menu does not fit in it.
 *
 * @param menuHeight natural height of the menu
 * @param space room available next to the anchor
 * @returns the height limit, or `null` when the menu fits
 */
const limitHeight = (menuHeight: number, space: number): number | null => {
  const maxHeight = space - MENU_HEIGHT_GAP;
  if (menuHeight > maxHeight) return maxHeight;
  return null;
};

/**
 * Places the menu below its anchor, or above it when there is more room there.
 * A menu taller than the room is limited in height but stays attached to its
 * anchor, so it never jumps to the top of the screen over unrelated content.
 *
 * @param input anchor edges, natural menu height, viewport height and offset
 * @returns the top coordinate and the height limit to apply
 */
export const computeMenuVerticalPlacement = ({
  anchorTop,
  anchorBottom,
  menuHeight,
  viewportHeight,
  offsetY = 0,
}: MenuVerticalInput): MenuVerticalPlacement => {
  const spaceBelow = viewportHeight - anchorBottom;
  const spaceAbove = anchorTop;
  let y = anchorBottom + offsetY;
  let maxHeight: number | null = null;

  if (menuHeight > spaceBelow) {
    if (spaceAbove > spaceBelow && menuHeight <= spaceAbove) {
      y = anchorTop - menuHeight - offsetY;
    } else if (spaceBelow >= spaceAbove) {
      maxHeight = limitHeight(menuHeight, spaceBelow);
    } else {
      maxHeight = limitHeight(menuHeight, spaceAbove);
      y = anchorTop - (maxHeight ?? menuHeight) - offsetY;
    }
  }

  const effectiveHeight = Math.min(maxHeight ?? menuHeight, viewportHeight - MENU_HEIGHT_GAP);
  const lowestY = viewportHeight - effectiveHeight - MENU_VIEWPORT_MARGIN;

  return { y: Math.max(MENU_VIEWPORT_MARGIN, Math.min(y, lowestY)), maxHeight };
};
