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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import { findItemByIdentifier } from "@workspaceui/componentlibrary/src/utils/menuUtils";
import { MENU_ITEM_TYPES } from "./menuItemTypes";

/** `AD_MESSAGE` shown when a stored entry (favorite, recently visited) cannot be opened with the current role. */
export const ENTRY_UNAVAILABLE_MESSAGE = "OBUIAPP_NoAccess";

/** An entry stored outside the menu that points to a menu entry: a recently visited item or a favorite. */
export interface StoredMenuEntry {
  id: string;
  type?: string;
  windowId?: string | null;
}

/**
 * The live menu entry a stored entry points to: windows are matched by window, the rest by menu id, and the
 * type must be the same, so a window whose id equals a process id is never taken for it.
 *
 * @returns The menu entry, or null when the menu of the current role no longer has it
 */
export function findStoredMenuEntry(menu: Menu[], entry: StoredMenuEntry): Menu | null {
  const lookupId = entry.type === MENU_ITEM_TYPES.WINDOW ? (entry.windowId ?? entry.id) : entry.id;
  const found = lookupId ? findItemByIdentifier(menu, lookupId) : null;
  return found?.type === entry.type ? found : null;
}

/**
 * Whether a stored entry can be opened with the current role: its menu entry is in the role's menu. While the
 * menu is not loaded yet every entry is taken as available, so the lists are not emptied meanwhile.
 */
export function isStoredMenuEntryAvailable(menu: Menu[], entry: StoredMenuEntry): boolean {
  if (!menu.length) return true;
  return findStoredMenuEntry(menu, entry) !== null;
}

/** The stored entry of a favorite: favorites point to windows. */
export function toFavoriteMenuEntry(favorite: { windowId: string }): StoredMenuEntry {
  return { id: favorite.windowId, windowId: favorite.windowId, type: MENU_ITEM_TYPES.WINDOW };
}
