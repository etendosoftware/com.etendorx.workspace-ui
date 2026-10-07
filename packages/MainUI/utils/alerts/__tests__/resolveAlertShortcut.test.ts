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

import { parseShortcutList, resolveAlertShortcut, toShortcutKey } from "../resolveAlertShortcut";
import { resolvePreference } from "@/utils/propertyStore";
import { ALERT_SHORTCUT_ID, DEFAULT_ALERT_SHORTCUT } from "../constants";

jest.mock("@/utils/propertyStore", () => ({
  resolvePreference: jest.fn(),
}));

const mockResolvePreference = resolvePreference as jest.Mock;

const mockShortcutPreference = (value: unknown) => mockResolvePreference.mockReturnValue(value);

const shortcutList = (id: string, keyComb: Record<string, unknown>) => JSON.stringify([{ id, keyComb }]);

describe("parseShortcutList", () => {
  it.each([
    ["a JSON list", '[{"id":"a"}]', [{ id: "a" }]],
    ["an already parsed list", [{ id: "a" }], [{ id: "a" }]],
    ["malformed JSON", "[{", []],
    ["a JSON value that is not a list", '{"id":"a"}', []],
    ["a missing value", undefined, []],
  ])("handles %s", (_case, raw, expected) => {
    expect(parseShortcutList(raw)).toEqual(expected);
  });
});

describe("toShortcutKey", () => {
  it.each([
    ["a function key in upper case", { key: "f8" }, "F8"],
    ["a Ctrl combination", { key: "Q", ctrl: true }, "ctrl+q"],
    ["a plain key", { key: "Escape" }, "Escape"],
    ["an Alt combination", { key: "a", alt: true }, null],
    ["a Shift combination", { key: "a", shift: true }, null],
    ["a combination without key", {}, null],
    ["a missing combination", undefined, null],
  ])("translates %s", (_case, keyComb, expected) => {
    expect(toShortcutKey(keyComb)).toBe(expected);
  });
});

describe("resolveAlertShortcut", () => {
  it("uses the shortcut configured in the preference", () => {
    mockShortcutPreference(shortcutList(ALERT_SHORTCUT_ID, { key: "s", ctrl: true }));

    expect(resolveAlertShortcut()).toBe("ctrl+s");
  });

  it.each([
    ["the preference is missing", undefined],
    ["the alert entry is missing", shortcutList("NavBar_OBHelpAbout", { key: "h", ctrl: true })],
    ["the combination is not supported", shortcutList(ALERT_SHORTCUT_ID, { key: "a", alt: true })],
  ])("falls back to the classic default when %s", (_case, value) => {
    mockShortcutPreference(value);

    expect(resolveAlertShortcut()).toBe(DEFAULT_ALERT_SHORTCUT);
  });
});
