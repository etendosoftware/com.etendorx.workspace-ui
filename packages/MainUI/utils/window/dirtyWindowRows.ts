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

import type { WindowContextState } from "@/utils/window/constants";
import {
  DIRTY_SOURCE_KINDS,
  type DirtyWindows,
  getDirtySources,
  getDirtyWindowIdentifiers,
} from "@/utils/window/dirtyState";
import { getTitleForWindow, type WindowsMetadata } from "@/utils/window/windowTitle";

export interface DirtyWindowRow {
  windowIdentifier: string;
  title: string;
  /** The window has a form whose save can be triggered from outside the window. */
  hasSavableForm: boolean;
  /** The window has inline-edited grid rows, which can only be discarded from outside. */
  hasGridEditing: boolean;
}

/**
 * One entry per window that still holds unsaved changes, ready to be listed in the
 * unsaved-changes menu.
 *
 * Shared with the code that re-checks the registry after a bulk save: the memoised list of
 * a render is already stale by then, and both must agree on what "still pending" means.
 */
export const buildDirtyWindowRows = (
  dirtyWindows: DirtyWindows,
  windows: WindowContextState,
  windowsData: WindowsMetadata
): DirtyWindowRow[] => {
  const rows: DirtyWindowRow[] = [];

  for (const windowIdentifier of getDirtyWindowIdentifiers(dirtyWindows)) {
    const window = windows[windowIdentifier];
    if (!window) {
      continue;
    }
    const sources = getDirtySources(dirtyWindows, windowIdentifier);
    rows.push({
      windowIdentifier,
      title: getTitleForWindow(window, windowsData),
      hasSavableForm: sources.some((source) => source.kind === DIRTY_SOURCE_KINDS.FORM),
      hasGridEditing: sources.some((source) => source.kind === DIRTY_SOURCE_KINDS.TABLE),
    });
  }

  return rows;
};
