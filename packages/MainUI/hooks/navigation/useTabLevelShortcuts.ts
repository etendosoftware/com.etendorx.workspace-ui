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

import { useEffect, useMemo, useRef } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useFocusContext } from "@/contexts/focus";
import { type ShortcutBindings, useIsCurrentWindowActive, useShortcutBindings } from "@/hooks/useShortcutBindings";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import { findChildTab, findParentTab } from "@/utils/window/tabNavigation";

/**
 * Classic `TabSet_SelectParentTab` / `TabSet_SelectChildTab` (Alt+Shift+↑ / ↓, or Ctrl+Space+↑ / ↓):
 * moves the focus from the focused tab of this window to its parent or child tab, the same steps
 * as a click on that tab. Tabs that are not on screen are never targeted.
 */
export function useTabLevelShortcuts(tabs: Tab[]): void {
  const windowIdentifier = useCurrentWindowIdentifier();
  const { activeFocusId, setFocus, hasRegion } = useFocusContext();
  const { activeTabsByLevel, setActiveLevel, setActiveTabsByLevel } = useTableStatePersistenceTab({
    windowIdentifier: windowIdentifier || "",
    tabId: "",
  });

  const bindings = useMemo<ShortcutBindings>(() => {
    const focusedTab = tabs.find((tab) => tab.id === activeFocusId);

    const selectParent = () => {
      const parent = focusedTab && findParentTab(tabs, focusedTab, activeTabsByLevel);
      if (!focusedTab || !parent) return;
      setFocus(parent.id);
      // Shows the parent level next to the focused one, as the breadcrumb does.
      setActiveLevel(focusedTab.tabLevel, false);
    };

    const selectChild = () => {
      const child = focusedTab && findChildTab(tabs, focusedTab, activeTabsByLevel, hasRegion);
      if (!child) return;
      setFocus(child.id);
      setActiveLevel(child.tabLevel);
      setActiveTabsByLevel(child);
    };

    return {
      [SHORTCUT_IDS.TAB_SELECT_PARENT]: { handler: selectParent },
      [SHORTCUT_IDS.TAB_SELECT_CHILD]: { handler: selectChild },
    };
  }, [tabs, activeFocusId, activeTabsByLevel, setFocus, hasRegion, setActiveLevel, setActiveTabsByLevel]);

  useShortcutBindings(bindings);
}

/**
 * Hidden windows stay mounted, so coming back to one does not mount (and focus) its header tab
 * again. When the window becomes the active one while the keyboard focus belongs to another
 * window, the focus returns to its active header tab, so its shortcuts work without a click.
 */
export function useWindowActivationFocus(tabs: Tab[]): void {
  const windowIdentifier = useCurrentWindowIdentifier();
  const isWindowActive = useIsCurrentWindowActive();
  const { activeFocusId, setFocus } = useFocusContext();
  const { activeTabsByLevel } = useTableStatePersistenceTab({ windowIdentifier: windowIdentifier || "", tabId: "" });

  const latestRef = useRef({ tabs, activeFocusId, activeTabsByLevel, setFocus });
  latestRef.current = { tabs, activeFocusId, activeTabsByLevel, setFocus };

  useEffect(() => {
    if (!isWindowActive) return;
    const latest = latestRef.current;
    if (latest.tabs.some((tab) => tab.id === latest.activeFocusId)) return;
    const headerTabId = latest.activeTabsByLevel.get(0) ?? latest.tabs.find((tab) => tab.tabLevel === 0)?.id;
    if (headerTabId) latest.setFocus(headerTabId);
  }, [isWindowActive]);
}
