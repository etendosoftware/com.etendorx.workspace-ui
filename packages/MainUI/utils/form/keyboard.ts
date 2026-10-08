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

/**
 * Keyboard predicates shared by the form field editors.
 *
 * These are field-local shortcuts: they are handled where the field is rendered,
 * not through `useKeyboardShortcuts` (which listens on `document` and would fire
 * for every mounted field at once).
 */

import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { KeyEventLike } from "@/utils/keyboard/shortcutGrammar";
import { SHORTCUT_IDS, type ShortcutId } from "@/utils/keyboard/shortcutIds";
import { matchesShortcut } from "@/utils/keyboard/shortcutRegistry";

export const FORM_KEYS = {
  ENTER: "Enter",
  TAB: "Tab",
  SPACE: " ",
} as const;

/** Attribute identifying the portal a dropdown renders itself into. */
export const DROPDOWN_PORTAL_ATTRIBUTE = "data-dropdown-portal";

/** Selector matching the portal of one specific dropdown. */
export const buildDropdownPortalSelector = (dropdownId: string): string => {
  return `[${DROPDOWN_PORTAL_ATTRIBUTE}="${dropdownId}"]`;
};

/** Classic popup shortcut of each reference whose field opens a record picker. */
const POPUP_SHORTCUT_BY_REFERENCE: Record<string, ShortcutId> = {
  [FIELD_REFERENCE_CODES.SELECTOR_AS_LINK.id]: SHORTCUT_IDS.SELECTOR_LINK_SHOW_POPUP,
  [FIELD_REFERENCE_CODES.TREE_REFERENCE.id]: SHORTCUT_IDS.TREE_ITEM_SHOW_POPUP,
};

/**
 * The classic shortcut that opens the picker of a field: `TreeItem_ShowPopup` for tree references,
 * `SelectorLink_ShowPopup` for selectors as link and `Selector_ShowPopup` for the rest.
 */
export const getSelectorPopupShortcutId = (referenceId?: string): ShortcutId =>
  POPUP_SHORTCUT_BY_REFERENCE[referenceId ?? ""] ?? SHORTCUT_IDS.SELECTOR_SHOW_POPUP;

/**
 * The shortcut that opens the record picker of a reference field (Ctrl+Enter by default), read
 * from the keyboard shortcut preference like every classic shortcut.
 */
export const isSelectorPopupShortcut = (
  event: KeyEventLike,
  shortcutId: ShortcutId = SHORTCUT_IDS.SELECTOR_SHOW_POPUP
): boolean => {
  return matchesShortcut(event, shortcutId);
};

/**
 * Whether a React event originated inside an open dropdown. Dropdowns are
 * rendered through a portal, so their events still bubble up the React tree of
 * the field that owns them.
 */
export const isEventFromDropdownPortal = (event: Pick<React.SyntheticEvent, "target">): boolean => {
  const target = event.target as Element | null;
  return Boolean(target?.closest?.(`[${DROPDOWN_PORTAL_ATTRIBUTE}]`));
};

/** The label of a field that navigates to its referenced record (rendered as a button). */
const FIELD_LINK_LABEL_SELECTOR = 'label[role="button"]';

/**
 * Classic `ViewForm_OpenLinkOut` (Ctrl+Alt+Enter): from anywhere inside a field, opens the record
 * its value references, the same as clicking the field label. Fields without a navigable label,
 * and key presses coming from an open dropdown, are left alone.
 *
 * @param event - Key press on the field container
 * @returns Whether the link was followed
 */
export const handleFieldLinkOutShortcut = (event: React.KeyboardEvent<HTMLElement>): boolean => {
  if (!matchesShortcut(event, SHORTCUT_IDS.VIEW_FORM_OPEN_LINK_OUT)) return false;
  if (isEventFromDropdownPortal(event)) return false;
  const linkLabel = event.currentTarget.querySelector<HTMLElement>(FIELD_LINK_LABEL_SELECTOR);
  if (!linkLabel) return false;
  event.preventDefault();
  event.stopPropagation();
  linkLabel.click();
  return true;
};

/** What a key press on the trigger of a tree field asks for. */
export const TREE_TRIGGER_ACTIONS = { SHOW_TREE: "showTree", MOVE_TO_TREE: "moveToTree" } as const;
export type TreeTriggerAction = (typeof TREE_TRIGGER_ACTIONS)[keyof typeof TREE_TRIGGER_ACTIONS];

/**
 * Classic tree field shortcuts: `TreeItem_ShowTree` (Alt+↓) opens the tree and, once it is open,
 * `TreeItem_MoveToTree` (↓) moves the keyboard into it.
 *
 * @returns The action to run, or `null` when the key press is not a tree shortcut
 */
export const getTreeTriggerAction = (event: KeyEventLike, isTreeOpen: boolean): TreeTriggerAction | null => {
  if (matchesShortcut(event, SHORTCUT_IDS.TREE_ITEM_SHOW_TREE)) return TREE_TRIGGER_ACTIONS.SHOW_TREE;
  if (isTreeOpen && matchesShortcut(event, SHORTCUT_IDS.TREE_ITEM_MOVE_TO_TREE)) {
    return TREE_TRIGGER_ACTIONS.MOVE_TO_TREE;
  }
  return null;
};
