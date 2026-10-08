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

import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";
import {
  TOOLBAR_SHORTCUT_ACTIONS,
  buildToolbarShortcutBindings,
  getToolbarActionShortcutId,
  pressToolbarAction,
} from "@/utils/toolbar/shortcuts";
import { buildToolbarSections, makeToolbarButton } from "@/utils/toolbar/test-utils/toolbarShortcutFixtures";

const { DELETE, REFRESH, NEW, CANCEL, SAVE, FILTER, FIND } = TOOLBAR_BUTTONS_ACTIONS;

describe("toolbar shortcuts", () => {
  describe("pressToolbarAction", () => {
    it("presses the enabled button of the action, whatever its section", () => {
      const refresh = makeToolbarButton(REFRESH);
      const sections = buildToolbarSections([makeToolbarButton(NEW)], [], [refresh]);

      expect(pressToolbarAction(sections, REFRESH)).toBe(true);
      expect(refresh.onClick).toHaveBeenCalledTimes(1);
    });

    it("does nothing when the button is disabled", () => {
      const remove = makeToolbarButton(DELETE, true);

      expect(pressToolbarAction(buildToolbarSections([], [remove]), DELETE)).toBe(false);
      expect(remove.onClick).not.toHaveBeenCalled();
    });

    it("does nothing when the toolbar has no button for the action", () => {
      expect(pressToolbarAction(buildToolbarSections(), DELETE)).toBe(false);
    });
  });

  describe("buildToolbarShortcutBindings", () => {
    it("binds every classic toolbar shortcut plus Delete on the grid rows", () => {
      const bindings = buildToolbarShortcutBindings(buildToolbarSections());
      expect(Object.keys(bindings).sort()).toEqual(
        [...Object.keys(TOOLBAR_SHORTCUT_ACTIONS), SHORTCUT_IDS.VIEW_GRID_DELETE_SELECTED].sort()
      );
    });

    it("presses the mapped button from the binding handler", () => {
      const remove = makeToolbarButton(DELETE);
      const bindings = buildToolbarShortcutBindings(buildToolbarSections([], [remove]));

      bindings[SHORTCUT_IDS.TOOLBAR_DELETE]?.handler(new KeyboardEvent("keydown"));

      expect(remove.onClick).toHaveBeenCalledTimes(1);
    });

    it("allows only New and Undo from a text field", () => {
      const bindings = buildToolbarShortcutBindings(buildToolbarSections());
      const allowedInInputs = Object.entries(bindings)
        .filter(([, binding]) => binding?.allowInInputs)
        .map(([id]) => id)
        .sort();

      expect(allowedInInputs).toEqual([SHORTCUT_IDS.TOOLBAR_NEW_DOC, SHORTCUT_IDS.TOOLBAR_UNDO].sort());
    });
  });

  describe("getToolbarActionShortcutId", () => {
    it.each([
      [CANCEL, SHORTCUT_IDS.TOOLBAR_UNDO],
      [SAVE, SHORTCUT_IDS.TOOLBAR_SAVE],
      [TOOLBAR_BUTTONS_ACTIONS.SHOW_AUDIT_TRAIL, SHORTCUT_IDS.TOOLBAR_AUDIT],
    ])("advertises the shortcut of %s", (action, id) => {
      expect(getToolbarActionShortcutId(action)).toBe(id);
    });

    it.each([FIND, FILTER])("has no shortcut for %s", (action) => {
      expect(getToolbarActionShortcutId(action)).toBeUndefined();
    });
  });
});
