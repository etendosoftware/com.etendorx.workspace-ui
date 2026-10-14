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

import type { WindowState } from "@/utils/window/constants";
import { getWindowIdFromIdentifier } from "@/utils/window/utils";

/** Shown when neither the window state nor its metadata carries a name. */
export const UNTITLED_WINDOW_TITLE = "Untitled Window";

/** Minimal shape needed from the metadata store — only the window name is read. */
export type WindowsMetadata = Record<string, { name?: string } | undefined>;

/**
 * Resolves the label of an open window.
 *
 * The state title is set when the window is opened from the menu, but windows
 * rebuilt from the URL start without one, so the metadata name is the fallback.
 */
export const getTitleForWindow = (window: WindowState, windowsMetadata: WindowsMetadata): string => {
  if (window.title) {
    return window.title;
  }
  const windowId = getWindowIdFromIdentifier(window.windowIdentifier);
  const metadataName = windowsMetadata[windowId]?.name;
  if (metadataName) {
    return metadataName;
  }
  return UNTITLED_WINDOW_TITLE;
};
