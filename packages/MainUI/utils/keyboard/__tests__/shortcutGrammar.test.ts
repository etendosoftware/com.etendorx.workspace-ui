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
  formatCombination,
  getEventKey,
  matchesCombination,
  normalizeShortcutKey,
  parseShortcutPreference,
} from "@/utils/keyboard/shortcutGrammar";
import { createKeyEvent } from "@/utils/keyboard/test-utils/keyboardEvents";

const SAVE_DEFINITION = { id: "ToolBar_Save", keyComb: { ctrl: true, key: "S" } };

describe("normalizeShortcutKey", () => {
  it.each([
    ["Arrow_Up", "ArrowUp"],
    ["Arrow_Down", "ArrowDown"],
    ["Arrow_Left", "ArrowLeft"],
    ["Arrow_Right", "ArrowRight"],
    ["Page_Up", "PageUp"],
    ["Page_Down", "PageDown"],
    ["f2", "F2"],
    ["F12", "F12"],
    ["d", "D"],
    ["1", "1"],
    ["Delete", "Delete"],
    ["ArrowUp", "ArrowUp"],
  ])("translates %s to %s", (key, expected) => {
    expect(normalizeShortcutKey(key)).toBe(expected);
  });
});

describe("getEventKey", () => {
  it("upper-cases letters typed by the layout", () => {
    expect(getEventKey(createKeyEvent({ key: "d", code: "KeyD" }))).toBe("D");
  });

  it("falls back to the physical key when a modifier changed the character", () => {
    expect(getEventKey(createKeyEvent({ key: "!", code: "Digit1", shift: true }))).toBe("1");
    expect(getEventKey(createKeyEvent({ key: "å", code: "KeyA", alt: true }))).toBe("A");
  });

  it("keeps named keys", () => {
    expect(getEventKey(createKeyEvent({ key: "PageUp", code: "PageUp" }))).toBe("PageUp");
    expect(getEventKey(createKeyEvent({ key: "F2", code: "F2" }))).toBe("F2");
  });

  it("keeps a symbol without an alphanumeric physical key", () => {
    expect(getEventKey(createKeyEvent({ key: "-", code: "Minus" }))).toBe("-");
  });
});

describe("matchesCombination", () => {
  const ctrlShiftX = { ctrl: true, shift: true, key: "X" };

  it("matches when every modifier is in the requested state", () => {
    expect(matchesCombination(createKeyEvent({ key: "X", ctrl: true, shift: true }), ctrlShiftX, false)).toBe(true);
  });

  it("treats Meta as Ctrl", () => {
    expect(matchesCombination(createKeyEvent({ key: "X", meta: true, shift: true }), ctrlShiftX, false)).toBe(true);
  });

  it("rejects extra or missing modifiers", () => {
    expect(matchesCombination(createKeyEvent({ key: "x", ctrl: true }), ctrlShiftX, false)).toBe(false);
    expect(
      matchesCombination(createKeyEvent({ key: "X", ctrl: true, shift: true, alt: true }), ctrlShiftX, false)
    ).toBe(false);
  });

  it("matches Alt+Shift combinations and special keys", () => {
    const previous = { alt: true, shift: true, key: "Page_Up" };
    expect(matchesCombination(createKeyEvent({ key: "PageUp", alt: true, shift: true }), previous, false)).toBe(true);
    expect(matchesCombination(createKeyEvent({ key: "F2" }), { key: "f2" }, false)).toBe(true);
    expect(matchesCombination(createKeyEvent({ key: "Delete" }), { key: "Delete" }, false)).toBe(true);
  });

  it("requires Space for the chord combinations and its absence otherwise", () => {
    const chord = { ctrl: true, space: true, key: "Arrow_Left" };
    const arrow = createKeyEvent({ key: "ArrowLeft", ctrl: true });
    expect(matchesCombination(arrow, chord, true)).toBe(true);
    expect(matchesCombination(arrow, chord, false)).toBe(false);
    expect(matchesCombination(arrow, { ctrl: true, key: "Arrow_Left" }, true)).toBe(false);
  });
});

describe("parseShortcutPreference", () => {
  it("parses the JSON string sent by the backend", () => {
    expect(parseShortcutPreference(JSON.stringify([SAVE_DEFINITION]))).toEqual([SAVE_DEFINITION]);
  });

  it("accepts an already parsed array", () => {
    expect(parseShortcutPreference([SAVE_DEFINITION])).toEqual([SAVE_DEFINITION]);
  });

  it("skips entries without an id or a key", () => {
    const raw = JSON.stringify([SAVE_DEFINITION, { id: "NoKey", keyComb: {} }, { keyComb: { key: "A" } }, null]);
    expect(parseShortcutPreference(raw)).toEqual([SAVE_DEFINITION]);
  });

  it.each([
    ["missing", undefined],
    ["malformed", "[{"],
    ["not a list", '{"id":"x"}'],
    ["empty", "[]"],
    ["without valid entries", '[{"id":"x"}]'],
  ])("returns null when the value is %s", (_label, raw) => {
    expect(parseShortcutPreference(raw)).toBeNull();
  });
});

describe("formatCombination", () => {
  it.each([
    [{ ctrl: true, shift: true, key: "R" }, "Ctrl+Shift+R"],
    [{ alt: true, shift: true, key: "Page_Up" }, "Alt+Shift+PgUp"],
    [{ ctrl: true, space: true, key: "Arrow_Up" }, "Ctrl+Space+↑"],
    [{ ctrl: true, key: "Delete" }, "Ctrl+Del"],
    [{ key: "f2" }, "F2"],
    [{ key: "Escape" }, "Esc"],
  ])("renders %o as %s", (combination, expected) => {
    expect(formatCombination(combination)).toBe(expected);
  });
});
