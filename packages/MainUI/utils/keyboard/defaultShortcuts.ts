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
  ALTERNATIVE_SHORTCUT_SUFFIX,
  type KeyCombination,
  SHORTCUT_IDS,
  type ShortcutDefinition,
} from "@/utils/keyboard/shortcutIds";

/** Key names in the SmartClient spelling the classic preference uses. */
export const CLASSIC_KEYS = {
  ARROW_UP: "Arrow_Up",
  ARROW_DOWN: "Arrow_Down",
  ARROW_LEFT: "Arrow_Left",
  ARROW_RIGHT: "Arrow_Right",
  PAGE_UP: "Page_Up",
  PAGE_DOWN: "Page_Down",
  DELETE: "Delete",
  ENTER: "Enter",
  ESCAPE: "Escape",
  F2: "f2",
} as const;

type Modifiers = Omit<KeyCombination, "key">;

const CTRL: Modifiers = { ctrl: true };
const ALT: Modifiers = { alt: true };
const ALT_SHIFT: Modifiers = { alt: true, shift: true };
const CTRL_SHIFT: Modifiers = { ctrl: true, shift: true };
const CTRL_ALT: Modifiers = { ctrl: true, alt: true };
const CTRL_SPACE: Modifiers = { ctrl: true, space: true };
const NONE: Modifiers = {};

const define = (id: string, key: string, modifiers: Modifiers): ShortcutDefinition => ({
  id,
  keyComb: { ...modifiers, key },
});

const alternative = (id: string, key: string): ShortcutDefinition =>
  define(`${id}${ALTERNATIVE_SHORTCUT_SUFFIX}`, key, CTRL_SPACE);

/**
 * The System default of `OBUIAPP_KeyboardShortcuts` (`AD_PREFERENCE.xml` of
 * `org.openbravo.client.application`), entry by entry. Used whenever the preference
 * is not available, so the new UI behaves as classic out of the box.
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: readonly ShortcutDefinition[] = [
  define(SHORTCUT_IDS.TAB_CLOSE_SELECTED, "W", ALT_SHIFT),
  define(SHORTCUT_IDS.TAB_SELECT_PARENT, CLASSIC_KEYS.ARROW_UP, ALT_SHIFT),
  alternative(SHORTCUT_IDS.TAB_SELECT_PARENT, CLASSIC_KEYS.ARROW_UP),
  define(SHORTCUT_IDS.TAB_SELECT_CHILD, CLASSIC_KEYS.ARROW_DOWN, ALT_SHIFT),
  alternative(SHORTCUT_IDS.TAB_SELECT_CHILD, CLASSIC_KEYS.ARROW_DOWN),
  define(SHORTCUT_IDS.TAB_SELECT_PREVIOUS, CLASSIC_KEYS.ARROW_LEFT, ALT_SHIFT),
  alternative(SHORTCUT_IDS.TAB_SELECT_PREVIOUS, CLASSIC_KEYS.ARROW_LEFT),
  define(SHORTCUT_IDS.TAB_SELECT_NEXT, CLASSIC_KEYS.ARROW_RIGHT, ALT_SHIFT),
  alternative(SHORTCUT_IDS.TAB_SELECT_NEXT, CLASSIC_KEYS.ARROW_RIGHT),
  define(SHORTCUT_IDS.TAB_SELECT_WORKSPACE, "1", ALT_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_NEW_DOC, "D", CTRL),
  define(SHORTCUT_IDS.TOOLBAR_NEW_ROW, "I", CTRL),
  define(SHORTCUT_IDS.TOOLBAR_SAVE, "S", CTRL),
  define(SHORTCUT_IDS.TOOLBAR_SAVE_CLOSE, "X", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_UNDO, "Z", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_DELETE, CLASSIC_KEYS.DELETE, CTRL),
  define(SHORTCUT_IDS.TOOLBAR_REFRESH, "R", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_EXPORT, "E", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_ATTACHMENTS, "A", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_CLONE, "K", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_PRINT, "P", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_EMAIL, "M", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_AUDIT, "Y", CTRL_SHIFT),
  define(SHORTCUT_IDS.TOOLBAR_LINK, "U", CTRL_SHIFT),
  define(SHORTCUT_IDS.STATUS_BAR_PREVIOUS, CLASSIC_KEYS.PAGE_UP, ALT_SHIFT),
  define(SHORTCUT_IDS.STATUS_BAR_NEXT, CLASSIC_KEYS.PAGE_DOWN, ALT_SHIFT),
  define(SHORTCUT_IDS.STATUS_BAR_MAXIMIZE_RESTORE, CLASSIC_KEYS.ENTER, ALT_SHIFT),
  define(SHORTCUT_IDS.STATUS_BAR_CLOSE, CLASSIC_KEYS.ESCAPE, NONE),
  define(SHORTCUT_IDS.GRID_FOCUS_FILTER, "F", CTRL_SHIFT),
  define(SHORTCUT_IDS.GRID_FOCUS_GRID, CLASSIC_KEYS.ESCAPE, NONE),
  define(SHORTCUT_IDS.GRID_CLEAR_FILTER, CLASSIC_KEYS.DELETE, ALT),
  define(SHORTCUT_IDS.GRID_SELECT_ALL, "A", ALT_SHIFT),
  define(SHORTCUT_IDS.GRID_UNSELECT_ALL, "N", ALT_SHIFT),
  define(SHORTCUT_IDS.VIEW_GRID_EDIT_IN_FORM, CLASSIC_KEYS.F2, CTRL),
  define(SHORTCUT_IDS.VIEW_GRID_EDIT_IN_GRID, CLASSIC_KEYS.F2, NONE),
  define(SHORTCUT_IDS.VIEW_GRID_CANCEL_EDITING, CLASSIC_KEYS.ESCAPE, NONE),
  define(SHORTCUT_IDS.VIEW_GRID_DELETE_SELECTED, CLASSIC_KEYS.DELETE, NONE),
  define(SHORTCUT_IDS.VIEW_FORM_OPEN_LINK_OUT, CLASSIC_KEYS.ENTER, CTRL_ALT),
  define(SHORTCUT_IDS.SELECTOR_SHOW_POPUP, CLASSIC_KEYS.ENTER, CTRL),
  define(SHORTCUT_IDS.SELECTOR_LINK_SHOW_POPUP, CLASSIC_KEYS.ENTER, CTRL),
  define(SHORTCUT_IDS.TREE_ITEM_SHOW_POPUP, CLASSIC_KEYS.ENTER, CTRL),
  define(SHORTCUT_IDS.TREE_ITEM_SHOW_TREE, CLASSIC_KEYS.ARROW_DOWN, ALT),
  define(SHORTCUT_IDS.TREE_ITEM_MOVE_TO_TREE, CLASSIC_KEYS.ARROW_DOWN, NONE),
];
