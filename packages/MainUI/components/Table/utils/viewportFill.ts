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

/** Scroll measures of the grid container, as read from the DOM element. */
export interface GridScrollMetrics {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

/** Distance to the bottom, in pixels, at which the grid asks for its next page while scrolling. */
const BOTTOM_REACHED_THRESHOLD_PX = 10;

/**
 * True when a visible grid has been scrolled to its bottom, so the next page must be requested.
 *
 * @param metrics - Scroll measures of the grid container
 */
export function isGridBottomReached({ scrollHeight, scrollTop, clientHeight }: GridScrollMetrics): boolean {
  return (
    clientHeight > 0 &&
    scrollHeight > clientHeight &&
    scrollHeight - scrollTop - clientHeight < BOTTOM_REACHED_THRESHOLD_PX
  );
}

/**
 * True when the rows of a visible grid do not fill its height: there is no scroll bar, so scrolling can never
 * ask for the next page and the grid has to request it by itself.
 *
 * @param metrics - Height measures of the grid container
 */
export function isGridViewportUnfilled({
  scrollHeight,
  clientHeight,
}: Pick<GridScrollMetrics, "scrollHeight" | "clientHeight">): boolean {
  return clientHeight > 0 && scrollHeight <= clientHeight;
}
