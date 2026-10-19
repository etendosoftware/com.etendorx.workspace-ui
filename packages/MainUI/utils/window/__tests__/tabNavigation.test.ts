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

import {
  TAB_BAR_STEP,
  WORKSPACE_POSITION,
  findChildTab,
  findParentTab,
  getAdjacentTabBarPosition,
} from "@/utils/window/tabNavigation";
import { HEADER_TAB, LINES_TAB, TAXES_TAB, WINDOW_TABS } from "@/utils/window/test-utils/tabNavigationFixtures";

const NO_ACTIVE_TABS = new Map<number, string>();
const isAlwaysRendered = () => true;

describe("getAdjacentTabBarPosition", () => {
  it("moves between open windows", () => {
    expect(getAdjacentTabBarPosition(0, TAB_BAR_STEP.NEXT, 3)).toBe(2);
    expect(getAdjacentTabBarPosition(2, TAB_BAR_STEP.PREVIOUS, 3)).toBe(2);
  });

  it("reaches the Workspace before the first window and leaves it for the first one", () => {
    expect(getAdjacentTabBarPosition(0, TAB_BAR_STEP.PREVIOUS, 3)).toBe(WORKSPACE_POSITION);
    expect(getAdjacentTabBarPosition(-1, TAB_BAR_STEP.NEXT, 3)).toBe(1);
  });

  it("stops at both ends", () => {
    expect(getAdjacentTabBarPosition(-1, TAB_BAR_STEP.PREVIOUS, 3)).toBeNull();
    expect(getAdjacentTabBarPosition(2, TAB_BAR_STEP.NEXT, 3)).toBeNull();
    expect(getAdjacentTabBarPosition(-1, TAB_BAR_STEP.NEXT, 0)).toBeNull();
  });
});

describe("findParentTab", () => {
  it("returns the declared parent", () => {
    expect(findParentTab(WINDOW_TABS, LINES_TAB, NO_ACTIVE_TABS)).toBe(HEADER_TAB);
  });

  it("falls back to the active tab of the level above", () => {
    const orphan = { ...LINES_TAB, parentTabId: undefined };
    expect(findParentTab(WINDOW_TABS, orphan, new Map([[0, HEADER_TAB.id]]))).toBe(HEADER_TAB);
  });

  it("has no parent for a header tab", () => {
    expect(findParentTab(WINDOW_TABS, HEADER_TAB, NO_ACTIVE_TABS)).toBeNull();
  });
});

describe("findChildTab", () => {
  it("prefers the active tab of the child level", () => {
    expect(findChildTab(WINDOW_TABS, HEADER_TAB, new Map([[1, TAXES_TAB.id]]), isAlwaysRendered)).toBe(TAXES_TAB);
  });

  it("falls back to the first rendered child", () => {
    expect(findChildTab(WINDOW_TABS, HEADER_TAB, NO_ACTIVE_TABS, isAlwaysRendered)).toBe(LINES_TAB);
    expect(findChildTab(WINDOW_TABS, HEADER_TAB, NO_ACTIVE_TABS, (id) => id === TAXES_TAB.id)).toBe(TAXES_TAB);
  });

  it("returns null when no child is on screen", () => {
    expect(findChildTab(WINDOW_TABS, HEADER_TAB, NO_ACTIVE_TABS, () => false)).toBeNull();
    expect(findChildTab(WINDOW_TABS, LINES_TAB, NO_ACTIVE_TABS, isAlwaysRendered)).toBeNull();
  });
});
