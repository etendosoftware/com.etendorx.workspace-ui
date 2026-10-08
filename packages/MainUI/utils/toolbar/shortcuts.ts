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

import type { ToolbarButton, TopToolbarProps } from "@/components/Toolbar/types";
import type { ShortcutBindings } from "@/hooks/useShortcutBindings";
import { SHORTCUT_IDS, type ShortcutId } from "@/utils/keyboard/shortcutIds";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";

/** Classic toolbar shortcuts and the toolbar action each one presses. */
export const TOOLBAR_SHORTCUT_ACTIONS: Partial<Record<ShortcutId, string>> = {
  [SHORTCUT_IDS.TOOLBAR_NEW_DOC]: TOOLBAR_BUTTONS_ACTIONS.NEW,
  [SHORTCUT_IDS.TOOLBAR_UNDO]: TOOLBAR_BUTTONS_ACTIONS.CANCEL,
  [SHORTCUT_IDS.TOOLBAR_DELETE]: TOOLBAR_BUTTONS_ACTIONS.DELETE,
  [SHORTCUT_IDS.TOOLBAR_REFRESH]: TOOLBAR_BUTTONS_ACTIONS.REFRESH,
  [SHORTCUT_IDS.TOOLBAR_EXPORT]: TOOLBAR_BUTTONS_ACTIONS.EXPORT_CSV,
  [SHORTCUT_IDS.TOOLBAR_ATTACHMENTS]: TOOLBAR_BUTTONS_ACTIONS.ATTACHMENT,
  [SHORTCUT_IDS.TOOLBAR_CLONE]: TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD,
  [SHORTCUT_IDS.TOOLBAR_PRINT]: TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD,
  [SHORTCUT_IDS.TOOLBAR_EMAIL]: TOOLBAR_BUTTONS_ACTIONS.SEND_MAIL,
  [SHORTCUT_IDS.TOOLBAR_AUDIT]: TOOLBAR_BUTTONS_ACTIONS.SHOW_AUDIT_TRAIL,
  [SHORTCUT_IDS.TOOLBAR_LINK]: TOOLBAR_BUTTONS_ACTIONS.SHARE_LINK,
};

/**
 * Actions whose shortcut also works from a text field: Undo (cancel) as classic, and New because
 * the previous Ctrl+N already did.
 */
const ACTIONS_ALLOWED_IN_INPUTS = new Set<string>([TOOLBAR_BUTTONS_ACTIONS.NEW, TOOLBAR_BUTTONS_ACTIONS.CANCEL]);

/**
 * Shortcut shown in the tooltip of each toolbar action. Besides the toolbar shortcuts it includes
 * Save (bound by the form) and Filter, whose button is the grid's "clear filters" action.
 */
const ACTION_TOOLTIP_SHORTCUTS: Record<string, ShortcutId> = {
  ...Object.fromEntries(Object.entries(TOOLBAR_SHORTCUT_ACTIONS).map(([id, action]) => [action, id as ShortcutId])),
  [TOOLBAR_BUTTONS_ACTIONS.SAVE]: SHORTCUT_IDS.TOOLBAR_SAVE,
  [TOOLBAR_BUTTONS_ACTIONS.FILTER]: SHORTCUT_IDS.GRID_CLEAR_FILTER,
};

/** The shortcut id advertised in the tooltip of a toolbar action, if any. */
export function getToolbarActionShortcutId(action: string): ShortcutId | undefined {
  return ACTION_TOOLTIP_SHORTCUTS[action];
}

type ToolbarSections = Pick<TopToolbarProps, "leftSection" | "centerSection" | "rightSection">;

const getSectionButtons = (sections: ToolbarSections): ToolbarButton[] => [
  ...sections.leftSection.buttons,
  ...sections.centerSection.buttons,
  ...sections.rightSection.buttons,
];

/**
 * Presses the toolbar button of `action` exactly as a click would, so its confirmations and
 * modals are reused. Nothing happens when the button is not on the toolbar or is disabled.
 *
 * @returns Whether the button was pressed.
 */
export function pressToolbarAction(sections: ToolbarSections, action: string): boolean {
  const button = getSectionButtons(sections).find((candidate) => candidate.action === action);
  if (!button || button.disabled) return false;
  (button.onClick as () => void)();
  return true;
}

/** Shortcut bindings that press the toolbar buttons of the current tab. */
export function buildToolbarShortcutBindings(sections: ToolbarSections): ShortcutBindings {
  const bindings: ShortcutBindings = {};
  for (const [id, action] of Object.entries(TOOLBAR_SHORTCUT_ACTIONS)) {
    bindings[id as ShortcutId] = {
      handler: () => {
        pressToolbarAction(sections, action);
      },
      allowInInputs: ACTIONS_ALLOWED_IN_INPUTS.has(action),
    };
  }
  return bindings;
}
