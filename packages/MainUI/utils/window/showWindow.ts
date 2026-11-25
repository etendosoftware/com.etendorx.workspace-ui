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

import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { isPreferenceYes } from "@/utils/preferences/classicPreferences";
import { isWindowDirty } from "@/utils/window/dirtyState";
import type { WindowState } from "@/utils/window/constants";
import { prefetchWindowViewSettings } from "@/utils/savedViews/defaultViews";

/** Classic preference that lets a window be open more than once (`OBStandardWindow.isSameTab`). */
export const ALLOW_MULTI_TAB_PREFERENCE = "AllowMultiTab";

/**
 * Identifier of the open instance of `windowId`, if any.
 *
 * @param windowId - AD window id (or the id of an in-app external page)
 */
export const findOpenWindowIdentifier = (windowId: string): string | undefined =>
  Object.values(useWindowStore.getState().windows).find((win) => win.windowId === windowId)?.windowIdentifier;

/**
 * Open instance a new opening of `windowId` replaces, as classic `isSameTab`: the open one, unless the window
 * may be open more than once (`AllowMultiTab` = Y).
 *
 * @param windowId - AD window id being opened
 * @returns The identifier of the instance to replace, or `undefined` to open a new one
 */
export function findWindowToReplace(windowId: string): string | undefined {
  if (isPreferenceYes(ALLOW_MULTI_TAB_PREFERENCE, windowId)) {
    return undefined;
  }
  return findOpenWindowIdentifier(windowId);
}

/**
 * Runs `action`, asking first about the unsaved changes of the window it replaces, if any.
 *
 * @param replacedIdentifier - Instance the action replaces, or `undefined` when it replaces none
 * @param action - What to run once the user has saved or discarded the changes
 */
export function runReplacingWindow(replacedIdentifier: string | undefined, action: () => void): void {
  const dirtyWindows = useWindowStore.getState().dirtyWindows;
  if (replacedIdentifier && isWindowDirty(dirtyWindows, replacedIdentifier)) {
    useUnsavedChangesStore.getState().openRequest({ onProceed: action, windowIdentifier: replacedIdentifier });
    return;
  }
  action();
}

export interface ShowWindowParams {
  windowId: string;
  /** Identifier of the new instance (`getNewWindowIdentifier`), the one `windowData` was built for. */
  windowIdentifier: string;
  windowData?: Partial<WindowState>;
}

/**
 * Opens a window as classic does. Unless `AllowMultiTab` is Y for the window, a window that is already open is
 * not opened twice: its instance is replaced, in the same position, by the new one (a fresh view from the
 * menu, or the record of a link), after asking about its unsaved changes. Otherwise a new instance opens.
 *
 * @param params - Window, identifier of the new instance and its initial data
 */
export function showWindow({ windowId, windowIdentifier, windowData }: ShowWindowParams): void {
  const openIdentifier = findWindowToReplace(windowId);
  if (!openIdentifier) {
    // The grids wait for these settings before their first load: request them now, while the window mounts
    prefetchWindowViewSettings(windowIdentifier);
    useWindowStore.getState().setWindowActive({ windowIdentifier, windowData });
    return;
  }
  runReplacingWindow(openIdentifier, () => {
    prefetchWindowViewSettings(windowIdentifier);
    useWindowStore
      .getState()
      .replaceWindow({ windowIdentifier: openIdentifier, newWindowIdentifier: windowIdentifier, windowData });
  });
}
