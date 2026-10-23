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

/** Classic preference holding the keyboard shortcut list (`OB.KeyboardManager.Shortcuts.setPredefinedList`). */
export const KEYBOARD_SHORTCUTS_PREFERENCE = "OBUIAPP_KeyboardShortcuts";

/** Suffix classic uses for the equivalent combination of a shortcut (e.g. the Ctrl+Space chords). */
export const ALTERNATIVE_SHORTCUT_SUFFIX = "_Alternative";

/** Classic shortcut ids, exactly as they appear in the `OBUIAPP_KeyboardShortcuts` preference. */
export const SHORTCUT_IDS = {
  TAB_CLOSE_SELECTED: "TabSet_CloseSelectedTab",
  TAB_SELECT_PARENT: "TabSet_SelectParentTab",
  TAB_SELECT_CHILD: "TabSet_SelectChildTab",
  TAB_SELECT_PREVIOUS: "TabSet_SelectPreviousTab",
  TAB_SELECT_NEXT: "TabSet_SelectNextTab",
  TAB_SELECT_WORKSPACE: "TabSet_SelectWorkspaceTab",
  TOOLBAR_NEW_DOC: "ToolBar_NewDoc",
  TOOLBAR_NEW_ROW: "ToolBar_NewRow",
  TOOLBAR_SAVE: "ToolBar_Save",
  TOOLBAR_SAVE_CLOSE: "ToolBar_SaveClose",
  TOOLBAR_UNDO: "ToolBar_Undo",
  TOOLBAR_DELETE: "ToolBar_Eliminate",
  TOOLBAR_REFRESH: "ToolBar_Refresh",
  TOOLBAR_EXPORT: "ToolBar_Export",
  TOOLBAR_ATTACHMENTS: "ToolBar_Attachments",
  TOOLBAR_CLONE: "ToolBar_Clone",
  TOOLBAR_PRINT: "ToolBar_Print",
  TOOLBAR_EMAIL: "ToolBar_Email",
  TOOLBAR_AUDIT: "ToolBar_Audit",
  TOOLBAR_LINK: "ToolBar_Link",
  STATUS_BAR_PREVIOUS: "StatusBar_Previous",
  STATUS_BAR_NEXT: "StatusBar_Next",
  STATUS_BAR_MAXIMIZE_RESTORE: "StatusBar_Maximize-Restore",
  STATUS_BAR_CLOSE: "StatusBar_Close",
  GRID_FOCUS_FILTER: "Grid_FocusFilter",
  GRID_FOCUS_GRID: "Grid_FocusGrid",
  GRID_CLEAR_FILTER: "Grid_ClearFilter",
  GRID_SELECT_ALL: "Grid_SelectAll",
  GRID_UNSELECT_ALL: "Grid_UnselectAll",
  VIEW_GRID_EDIT_IN_FORM: "ViewGrid_EditInForm",
  VIEW_GRID_EDIT_IN_GRID: "ViewGrid_EditInGrid",
  VIEW_GRID_CANCEL_EDITING: "ViewGrid_CancelEditing",
  VIEW_GRID_DELETE_SELECTED: "ViewGrid_DeleteSelectedRecords",
  VIEW_FORM_OPEN_LINK_OUT: "ViewForm_OpenLinkOut",
  SELECTOR_SHOW_POPUP: "Selector_ShowPopup",
  SELECTOR_LINK_SHOW_POPUP: "SelectorLink_ShowPopup",
  TREE_ITEM_SHOW_POPUP: "TreeItem_ShowPopup",
  TREE_ITEM_SHOW_TREE: "TreeItem_ShowTree",
  TREE_ITEM_MOVE_TO_TREE: "TreeItem_MoveToTree",
} as const;

export type ShortcutId = (typeof SHORTCUT_IDS)[keyof typeof SHORTCUT_IDS];

/** Key combination in the classic `keyComb` format. Missing modifiers mean "not pressed". */
export interface KeyCombination {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  /** Space held down while the key is pressed: the classic Ctrl+Space chord. */
  space?: boolean;
}

/** One entry of the `OBUIAPP_KeyboardShortcuts` preference. */
export interface ShortcutDefinition {
  id: string;
  keyComb: KeyCombination;
}
