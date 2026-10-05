/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { WindowRecoveryInfo, WindowState } from "@/utils/window/constants";
import { createRecoveryWindowState, getWindowIdFromIdentifier } from "@/utils/window/utils";
import {
  findExternalMenuEntry,
  getMenuIdFromExternalPageWindowId,
  normalizeExternalUrl,
} from "@/utils/menu/externalMenuEntry";

/**
 * Rebuilds, on a page reload, the in-app tab of an External menu entry. Its URL is resolved again
 * from the role's menu, never from the browser URL, so a crafted link cannot embed an arbitrary
 * page.
 *
 * @returns the window state, or `null` when the tab must be dropped: the entry is no longer in
 * the menu, has no usable URL, or the menu could not be loaded.
 */
export const recoverExternalPageWindow = async (info: WindowRecoveryInfo): Promise<WindowState | null> => {
  const menuId = getMenuIdFromExternalPageWindowId(getWindowIdFromIdentifier(info.windowIdentifier));
  try {
    const entry = findExternalMenuEntry(await Metadata.getMenu(), menuId);
    const url = normalizeExternalUrl(entry?.url);
    if (!entry || !url) return null;
    return { ...createRecoveryWindowState(info), title: entry.name, initialized: true, externalUrl: url };
  } catch (error) {
    console.warn(`[Recovery] Failed to recover external page ${info.windowIdentifier}, dropping it.`, error);
    return null;
  }
};
