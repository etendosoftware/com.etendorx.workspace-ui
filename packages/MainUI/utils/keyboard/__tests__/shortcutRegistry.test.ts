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

import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { DEFAULT_KEYBOARD_SHORTCUTS } from "@/utils/keyboard/defaultShortcuts";
import { KEYBOARD_SHORTCUTS_PREFERENCE, SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import {
  getCombinationsFor,
  getEffectiveShortcuts,
  getShortcutLabel,
  withShortcutHint,
} from "@/utils/keyboard/shortcutRegistry";

const REFRESH = SHORTCUT_IDS.TOOLBAR_REFRESH;
const REFRESH_TEXT = "Refresh";
const UNKNOWN_SHORTCUT = "Unknown_Shortcut";

const storeShortcutPreference = (value: unknown) => savePreferences({ [KEYBOARD_SHORTCUTS_PREFERENCE]: value });

describe("shortcutRegistry", () => {
  beforeEach(() => installLocalStorageMock());

  it("ships the 43 classic entries", () => {
    expect(DEFAULT_KEYBOARD_SHORTCUTS).toHaveLength(43);
    expect(new Set(DEFAULT_KEYBOARD_SHORTCUTS.map((definition) => definition.id)).size).toBe(43);
  });

  it("uses the classic default when the preference is missing", () => {
    expect(getEffectiveShortcuts().get(REFRESH)).toEqual({ ctrl: true, shift: true, key: "R" });
  });

  it("uses the classic default when the preference is malformed", () => {
    storeShortcutPreference("not json");
    expect(getEffectiveShortcuts().get(REFRESH)).toEqual({ ctrl: true, shift: true, key: "R" });
  });

  it("lets the preference replace the whole list, as classic does", () => {
    storeShortcutPreference(JSON.stringify([{ id: REFRESH, keyComb: { ctrl: true, shift: true, key: "L" } }]));

    expect(getEffectiveShortcuts().get(REFRESH)).toEqual({ ctrl: true, shift: true, key: "L" });
    expect(getEffectiveShortcuts().has(SHORTCUT_IDS.TOOLBAR_SAVE)).toBe(false);
  });

  it("picks up a changed preference without a reload", () => {
    expect(getShortcutLabel(REFRESH)).toBe("Ctrl+Shift+R");
    storeShortcutPreference(JSON.stringify([{ id: REFRESH, keyComb: { alt: true, key: "R" } }]));
    expect(getShortcutLabel(REFRESH)).toBe("Alt+R");
  });

  it("returns the primary combination followed by its alternative", () => {
    expect(getCombinationsFor(SHORTCUT_IDS.TAB_SELECT_NEXT)).toEqual([
      { alt: true, shift: true, key: "Arrow_Right" },
      { ctrl: true, space: true, key: "Arrow_Right" },
    ]);
    expect(getCombinationsFor(UNKNOWN_SHORTCUT)).toEqual([]);
  });

  it("has no label for an unknown id", () => {
    expect(getShortcutLabel(UNKNOWN_SHORTCUT)).toBeUndefined();
  });

  describe("withShortcutHint", () => {
    it("appends the shortcut to the text", () => {
      expect(withShortcutHint(REFRESH_TEXT, REFRESH)).toBe("Refresh (Ctrl+Shift+R)");
    });

    it("leaves the text alone without a shortcut or without a text", () => {
      expect(withShortcutHint(REFRESH_TEXT)).toBe(REFRESH_TEXT);
      expect(withShortcutHint(REFRESH_TEXT, UNKNOWN_SHORTCUT)).toBe(REFRESH_TEXT);
      expect(withShortcutHint("", REFRESH)).toBe("");
    });
  });
});
