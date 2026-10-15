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

/** Captures the parent/child split heights and the tab levels shown in a window. */
export const captureWindowLayout = ({
  activeLevels,
  splitHeights,
}: Pick<NavigationState, "activeLevels" | "splitHeights">): WindowLayout => ({
  splitHeights: { ...splitHeights },
  activeLevels: [...activeLevels],
});

/** Split heights to apply for a layout, keyed by tab level. A view without layout restores the default heights. */
export const getLayoutSplitHeights = (layout?: WindowLayout): Record<number, number> => {
  const heights: Record<number, number> = {};
  for (const [level, height] of Object.entries(layout?.splitHeights ?? {})) {
    heights[Number(level)] = height;
  }
  return heights;
};

const isSameLevels = (current: number[], target: number[]) =>
  current.length === target.length && current.every((level, index) => level === target[index]);

/** Without saved levels (older views), a maximized child level goes back to the parent/child split. */
const resolveDefaultActiveLevels = (activeLevels: number[]): number[] | null => {
  const [level] = activeLevels;
  if (activeLevels.length === 1 && level > 0) {
    return [level - 1, level];
  }
  return null;
};

/**
 * Active tab levels to apply for a layout, or null when the current levels already match it or it
 * cannot be applied.
 *
 * The saved levels are only restored when their shallowest level is already open: a deeper level
 * needs a record selected in its parent level, and showing it without one would collapse the window.
 */
export const resolveActiveLevels = (activeLevels: number[], layout?: WindowLayout): number[] | null => {
  const savedLevels = layout?.activeLevels;
  if (!savedLevels?.length) {
    return resolveDefaultActiveLevels(activeLevels);
  }
  const deepestOpenLevel = Math.max(...activeLevels);
  if (Math.min(...savedLevels) > deepestOpenLevel || isSameLevels(activeLevels, savedLevels)) {
    return null;
  }
  return [...savedLevels];
};
