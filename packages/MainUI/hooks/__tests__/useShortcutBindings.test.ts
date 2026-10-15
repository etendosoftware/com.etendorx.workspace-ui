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

import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { CurrentWindowProvider } from "@/contexts/CurrentWindowContext";
import {
  SHORTCUT_ROOT_ATTRIBUTE,
  type ShortcutBindings,
  isOutsideShortcutRoot,
  useShortcutBindings,
} from "@/hooks/useShortcutBindings";
import { useWindowStore } from "@/stores/windowStore";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { KEYBOARD_SHORTCUTS_PREFERENCE, SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import { uninstallSpaceChordTracker } from "@/utils/keyboard/spaceChordTracker";
import { type KeyPress, appendElement, pressKey, withSpaceHeld } from "@/utils/keyboard/test-utils/keyboardEvents";

jest.mock("@/stores/windowStore", () => ({ useWindowStore: jest.fn() }));

const WINDOW_IDENTIFIER = "win-1";
const INPUT_TAG = "input";

const CTRL_SHIFT_R: KeyPress = { key: "R", code: "KeyR", ctrl: true, shift: true };
const CTRL_S: KeyPress = { key: "s", code: "KeyS", ctrl: true };
const ALT_SHIFT_RIGHT: KeyPress = { key: "ArrowRight", alt: true, shift: true };
const CTRL_RIGHT: KeyPress = { key: "ArrowRight", ctrl: true };

const mockedWindowStore = useWindowStore as unknown as jest.Mock;

const setWindowActive = (isActive: boolean) =>
  mockedWindowStore.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({ windows: { [WINDOW_IDENTIFIER]: { isActive } } })
  );

const renderBindings = (bindings: ShortcutBindings, enabled = true, windowIdentifier?: string) => {
  const wrapper = ({ children }: { children: ReactNode }) =>
    windowIdentifier
      ? createElement(CurrentWindowProvider, { windowIdentifier, windowId: "143", children })
      : createElement("div", null, children);
  return renderHook(() => useShortcutBindings(bindings, enabled), { wrapper });
};

describe("useShortcutBindings", () => {
  beforeEach(() => {
    installLocalStorageMock();
    setWindowActive(true);
  });

  afterEach(() => {
    uninstallSpaceChordTracker();
    document.body.innerHTML = "";
  });

  it("fires the binding of a Ctrl+Shift combination and prevents the browser default", () => {
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } });

    const event = pressKey(CTRL_SHIFT_R);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not fire for a key without a binding", () => {
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } });

    const event = pressKey(CTRL_S);

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("fires the same binding from the primary and the Ctrl+Space alternative", () => {
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TAB_SELECT_NEXT]: { handler } });

    pressKey(ALT_SHIFT_RIGHT);
    withSpaceHeld(() => pressKey(CTRL_RIGHT));

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not take Ctrl+Arrow for the chord when Space is not held", () => {
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TAB_SELECT_NEXT]: { handler } });

    pressKey(CTRL_RIGHT);

    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    ["F2", SHORTCUT_IDS.VIEW_GRID_EDIT_IN_GRID, { key: "F2" }],
    ["Alt+Shift+PageDown", SHORTCUT_IDS.STATUS_BAR_NEXT, { key: "PageDown", alt: true, shift: true }],
    ["Delete", SHORTCUT_IDS.VIEW_GRID_DELETE_SELECTED, { key: "Delete" }],
  ])("recognizes the special key %s", (_label, id, press) => {
    const handler = jest.fn();
    renderBindings({ [id]: { handler } });

    pressKey(press);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("uses the keys of the preference instead of the default", () => {
    savePreferences({
      [KEYBOARD_SHORTCUTS_PREFERENCE]: JSON.stringify([
        { id: SHORTCUT_IDS.TOOLBAR_REFRESH, keyComb: { ctrl: true, shift: true, key: "L" } },
      ]),
    });
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } });

    pressKey(CTRL_SHIFT_R);
    expect(handler).not.toHaveBeenCalled();

    pressKey({ key: "L", code: "KeyL", ctrl: true, shift: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  describe("with the focus in a text field", () => {
    it("does not fire a navigation shortcut", () => {
      const handler = jest.fn();
      renderBindings({ [SHORTCUT_IDS.STATUS_BAR_NEXT]: { handler } });

      pressKey({ key: "PageDown", alt: true, shift: true }, appendElement(INPUT_TAG));

      expect(handler).not.toHaveBeenCalled();
    });

    it("fires a binding that allows text fields", () => {
      const handler = jest.fn();
      renderBindings({ [SHORTCUT_IDS.TOOLBAR_SAVE]: { handler, allowInInputs: true } });

      pressKey(CTRL_S, appendElement(INPUT_TAG));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  it("does not fire when disabled", () => {
    const handler = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } }, false);

    pressKey(CTRL_SHIFT_R);

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire inside a hidden window and fires inside the active one", () => {
    const handler = jest.fn();
    setWindowActive(false);
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } }, true, WINDOW_IDENTIFIER);
    pressKey(CTRL_SHIFT_R);
    expect(handler).not.toHaveBeenCalled();

    setWindowActive(true);
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } }, true, WINDOW_IDENTIFIER);
    pressKey(CTRL_SHIFT_R);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("runs a single binding per key press", () => {
    const first = jest.fn();
    const second = jest.fn();
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler: first } });
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler: second } });

    pressKey(CTRL_SHIFT_R);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  describe("with a scope", () => {
    it("leaves an out-of-scope key press to the next binding of the same keys", () => {
      const scoped = jest.fn();
      const fallback = jest.fn();
      renderBindings({
        [SHORTCUT_IDS.GRID_FOCUS_GRID]: { handler: scoped, isInScope: () => false },
        [SHORTCUT_IDS.STATUS_BAR_CLOSE]: { handler: fallback },
      });

      pressKey({ key: "Escape" });

      expect(scoped).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it("does not consume an out-of-scope key press", () => {
      const handler = jest.fn();
      renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler, isInScope: () => false } });

      const event = pressKey(CTRL_SHIFT_R);

      expect(handler).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it("fires inside its scope", () => {
      const handler = jest.fn();
      renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler, isInScope: () => true } });

      pressKey(CTRL_SHIFT_R);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores key presses coming from a portal outside the layout", () => {
    const handler = jest.fn();
    const layout = appendElement("div");
    layout.setAttribute(SHORTCUT_ROOT_ATTRIBUTE, "true");
    const insideLayout = appendElement("button", layout);
    const portal = appendElement("button");
    renderBindings({ [SHORTCUT_IDS.TOOLBAR_REFRESH]: { handler } });

    pressKey(CTRL_SHIFT_R, portal);
    pressKey(CTRL_SHIFT_R, insideLayout);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("isOutsideShortcutRoot", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("never treats the body or non elements as outside", () => {
    appendElement("div").setAttribute(SHORTCUT_ROOT_ATTRIBUTE, "true");
    expect(isOutsideShortcutRoot(document.body)).toBe(false);
    expect(isOutsideShortcutRoot(document)).toBe(false);
    expect(isOutsideShortcutRoot(null)).toBe(false);
  });

  it("treats nothing as outside when no layout is marked", () => {
    expect(isOutsideShortcutRoot(appendElement("button"))).toBe(false);
  });
});
