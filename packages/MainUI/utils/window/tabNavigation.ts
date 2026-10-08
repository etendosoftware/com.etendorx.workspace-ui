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

import type { Tab } from "@workspaceui/api-client/src/api/types";

/** Direction of a previous / next keyboard move along the window tab bar. */
export const TAB_BAR_STEP = { PREVIOUS: -1, NEXT: 1 } as const;
export type TabBarStep = (typeof TAB_BAR_STEP)[keyof typeof TAB_BAR_STEP];

/** Position of the Workspace (Home) in the window tab bar: before every open window, as classic. */
export const WORKSPACE_POSITION = 0;

/**
 * Where a previous / next move lands in the window tab bar, whose positions are the Workspace (0)
 * followed by the open windows (1..n). Nothing happens at the extremes: there is no wrap around.
 *
 * @param activeWindowIndex - Index of the active window among the open ones, -1 on the Workspace
 * @param windowCount - Number of open windows
 * @returns The target position, or `null` when the move would leave the bar
 */
export function getAdjacentTabBarPosition(
  activeWindowIndex: number,
  step: TabBarStep,
  windowCount: number
): number | null {
  const target = activeWindowIndex + 1 + step;
  if (target < WORKSPACE_POSITION || target > windowCount) return null;
  return target;
}

/** The tab one level above the focused one: its declared parent, else the active tab of that level. */
export function findParentTab(tabs: Tab[], focusedTab: Tab, activeTabsByLevel: Map<number, string>): Tab | null {
  const parentId = focusedTab.parentTabId ?? activeTabsByLevel.get(focusedTab.tabLevel - 1);
  return tabs.find((tab) => tab.id === parentId) ?? null;
}

/**
 * The rendered tab one level below the focused one: the active tab of that level when it is a child
 * of the focused tab, otherwise its first rendered child. Children hidden by display logic or not
 * mounted are skipped, so the focus never lands on a tab that is not on screen.
 */
export function findChildTab(
  tabs: Tab[],
  focusedTab: Tab,
  activeTabsByLevel: Map<number, string>,
  isRendered: (tabId: string) => boolean
): Tab | null {
  const childLevel = focusedTab.tabLevel + 1;
  const isChild = (tab: Tab) => !tab.parentTabId || tab.parentTabId === focusedTab.id;
  const children = tabs.filter((tab) => tab.tabLevel === childLevel && isChild(tab) && isRendered(tab.id));
  const activeChild = children.find((tab) => tab.id === activeTabsByLevel.get(childLevel));
  return activeChild ?? children[0] ?? null;
}
