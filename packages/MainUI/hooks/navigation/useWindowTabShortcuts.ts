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

import { useMemo } from "react";
import { type ShortcutBindings, useShortcutBindings } from "@/hooks/useShortcutBindings";
import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import type { WindowState } from "@/utils/window/constants";
import {
  TAB_BAR_STEP,
  type TabBarStep,
  WORKSPACE_POSITION,
  getAdjacentTabBarPosition,
} from "@/utils/window/tabNavigation";

interface UseWindowTabShortcutsParams {
  /** Open windows in tab bar order. */
  windows: WindowState[];
  onSelectWindow: (windowIdentifier: string) => void;
  /** Closes a window through the unsaved-changes guard, as its close button. */
  onCloseWindow: (window: WindowState) => void;
  onSelectWorkspace: () => void;
  enabled: boolean;
}

/**
 * Classic tab bar shortcuts (`TabSet_*`): close the active window (Alt+Shift+W), move to the
 * previous / next one (Alt+Shift+← / →, or Ctrl+Space+← / →) and jump to the Workspace
 * (Alt+Shift+1). The Workspace counts as the first position; moves stop at both ends.
 */
export function useWindowTabShortcuts({
  windows,
  onSelectWindow,
  onCloseWindow,
  onSelectWorkspace,
  enabled,
}: UseWindowTabShortcutsParams): void {
  const bindings = useMemo<ShortcutBindings>(() => {
    const activeIndex = windows.findIndex((window) => window.isActive);

    const goToPosition = (position: number | null) => {
      if (position === null) return;
      if (position === WORKSPACE_POSITION) {
        onSelectWorkspace();
        return;
      }
      onSelectWindow(windows[position - 1].windowIdentifier);
    };
    const move = (step: TabBarStep) => () => goToPosition(getAdjacentTabBarPosition(activeIndex, step, windows.length));
    const closeActive = () => {
      const activeWindow = windows[activeIndex];
      if (activeWindow) onCloseWindow(activeWindow);
    };

    return {
      [SHORTCUT_IDS.TAB_CLOSE_SELECTED]: { handler: closeActive },
      [SHORTCUT_IDS.TAB_SELECT_PREVIOUS]: { handler: move(TAB_BAR_STEP.PREVIOUS) },
      [SHORTCUT_IDS.TAB_SELECT_NEXT]: { handler: move(TAB_BAR_STEP.NEXT) },
      [SHORTCUT_IDS.TAB_SELECT_WORKSPACE]: { handler: onSelectWorkspace },
    };
  }, [windows, onSelectWindow, onCloseWindow, onSelectWorkspace]);

  useShortcutBindings(bindings, enabled);
}
