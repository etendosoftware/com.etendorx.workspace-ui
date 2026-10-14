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

/** True while the platform's "command" modifier is held (Ctrl, or Cmd on macOS). */
const hasCommandModifier = (event: Pick<React.KeyboardEvent, "ctrlKey" | "metaKey">): boolean => {
  return event.ctrlKey || event.metaKey;
};

/**
 * Ctrl+Enter — the `Selector_ShowPopup` shortcut of Etendo Classic, which opens
 * the record picker of a reference field.
 */
export const isSelectorPopupShortcut = (event: React.KeyboardEvent): boolean => {
  return event.key === FORM_KEYS.ENTER && hasCommandModifier(event);
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
