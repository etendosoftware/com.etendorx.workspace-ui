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
 * Window layout of a saved view (classic view definition `window`: TopMax / BottomMax / Mid state
 * and height of the parent and child tab sets). Pure helpers: the toolbar wires them to the store.
 */

import type { NavigationState } from "@/utils/window/constants";
import type { WindowLayout } from "./types";

/** Captures the parent/child split heights and the maximized tab level of a window. */
export const captureWindowLayout = ({
  activeLevels,
  splitHeights,
}: Pick<NavigationState, "activeLevels" | "splitHeights">): WindowLayout => {
  const layout: WindowLayout = { splitHeights: { ...splitHeights } };
  if (activeLevels.length === 1) {
    layout.maximizedLevel = activeLevels[0];
  }
  return layout;
};

/** Split heights to apply for a layout, keyed by tab level. A view without layout restores the default heights. */
export const getLayoutSplitHeights = (layout?: WindowLayout): Record<number, number> => {
  const heights: Record<number, number> = {};
  for (const [level, height] of Object.entries(layout?.splitHeights ?? {})) {
    heights[Number(level)] = height;
  }
  return heights;
};

/**
 * Active tab levels that apply the maximized state of a layout, or null when the current levels
 * already match it or it cannot be applied.
 *
 * A maximized level deeper than the deepest open level is skipped: that level has no parent
 * record selected, so it cannot be shown. A layout without maximized level (or a view without
 * layout) restores a maximized child level to the parent/child split.
 */
export const resolveActiveLevels = (activeLevels: number[], layout?: WindowLayout): number[] | null => {
  const deepestLevel = activeLevels[activeLevels.length - 1];
  const isSingleLevel = activeLevels.length === 1;
  const maximizedLevel = layout?.maximizedLevel;

  if (maximizedLevel === undefined) {
    if (isSingleLevel && deepestLevel > 0) {
      return [deepestLevel - 1, deepestLevel];
    }
    return null;
  }
  if (maximizedLevel > deepestLevel || (isSingleLevel && deepestLevel === maximizedLevel)) {
    return null;
  }
  return [maximizedLevel];
};
