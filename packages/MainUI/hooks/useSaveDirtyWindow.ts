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

import { useCallback } from "react";
import { useWindowStore } from "@/stores/windowStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { DIRTY_SOURCE_KINDS, getDirtySources, sortSourcesByTabLevel } from "@/utils/window/dirtyState";

/**
 * Saves the dirty forms of a window, even when that window is not the active one.
 *
 * Every visited window stays mounted (only its visibility is toggled), so each of its
 * tabs still owns a slot in the toolbar store and its `wrappedSave` can be invoked
 * imperatively from here.
 */
export function useSaveDirtyWindow() {
  /**
   * @returns `true` when every dirty form of the window was saved, `false` as soon as
   *          one save fails — the caller keeps the window in the pending list.
   */
  const saveWindow = useCallback(async (windowIdentifier: string): Promise<boolean> => {
    const { dirtyWindows, windows } = useWindowStore.getState();
    const formSources = getDirtySources(dirtyWindows, windowIdentifier).filter(
      (source) => source.kind === DIRTY_SOURCE_KINDS.FORM
    );
    // Root tab first: saving a child record needs its parent to exist already.
    const orderedSources = sortSourcesByTabLevel(formSources, windows[windowIdentifier]);

    for (const source of orderedSources) {
      const save = useToolbarStore.getState().byTabId[source.tabId]?.wrappedSave;
      if (!save) {
        continue;
      }
      const succeeded = await save({ showModal: false });
      if (!succeeded) {
        return false;
      }
    }

    return true;
  }, []);

  return { saveWindow };
}
