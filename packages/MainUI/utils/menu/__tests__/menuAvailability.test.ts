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
import { findStoredMenuEntry, isStoredMenuEntryAvailable, toFavoriteMenuEntry } from "../menuAvailability";
import { MENU_ITEM_TYPES } from "../menuItemTypes";

const WINDOW_ID = "143";
const PROCESS_ID = "PROC1";

const windowEntry = { id: "MENU_WIN", name: "Sales Order", type: MENU_ITEM_TYPES.WINDOW, windowId: WINDOW_ID } as Menu;
const processEntry = { id: PROCESS_ID, name: "Generate Invoices", type: MENU_ITEM_TYPES.PROCESS } as Menu;
const menu = [{ id: "FOLDER", name: "Folder", type: "Summary", children: [windowEntry, processEntry] }] as Menu[];

describe("menuAvailability (ETP-6431)", () => {
  describe("findStoredMenuEntry", () => {
    it("finds a window by its window id, inside folders", () => {
      expect(findStoredMenuEntry(menu, { id: "OLD_MENU_ID", type: MENU_ITEM_TYPES.WINDOW, windowId: WINDOW_ID })).toBe(
        windowEntry
      );
    });

    it("falls back to the id of a window stored without a window id", () => {
      expect(findStoredMenuEntry(menu, { id: WINDOW_ID, type: MENU_ITEM_TYPES.WINDOW })).toBe(windowEntry);
    });

    it("finds the other entries by menu id", () => {
      expect(findStoredMenuEntry(menu, { id: PROCESS_ID, type: MENU_ITEM_TYPES.PROCESS })).toBe(processEntry);
    });

    it("never takes an entry of another type for the stored one", () => {
      expect(findStoredMenuEntry(menu, { id: "X", type: MENU_ITEM_TYPES.WINDOW, windowId: PROCESS_ID })).toBeNull();
    });

    it("finds nothing for an entry without id", () => {
      expect(findStoredMenuEntry(menu, { id: "", type: MENU_ITEM_TYPES.PROCESS })).toBeNull();
    });
  });

  describe("isStoredMenuEntryAvailable", () => {
    it("is true when the role's menu has the entry", () => {
      expect(isStoredMenuEntryAvailable(menu, { id: PROCESS_ID, type: MENU_ITEM_TYPES.PROCESS })).toBe(true);
    });

    it("is false when the role's menu does not have the entry", () => {
      expect(isStoredMenuEntryAvailable(menu, { id: "GONE", type: MENU_ITEM_TYPES.PROCESS })).toBe(false);
    });

    it("is true while the menu is not loaded, so lists are not emptied meanwhile", () => {
      expect(isStoredMenuEntryAvailable([], { id: "GONE", type: MENU_ITEM_TYPES.PROCESS })).toBe(true);
    });
  });

  it("describes a favorite as the window it points to", () => {
    expect(toFavoriteMenuEntry({ windowId: WINDOW_ID })).toEqual({
      id: WINDOW_ID,
      windowId: WINDOW_ID,
      type: MENU_ITEM_TYPES.WINDOW,
    });
  });
});
