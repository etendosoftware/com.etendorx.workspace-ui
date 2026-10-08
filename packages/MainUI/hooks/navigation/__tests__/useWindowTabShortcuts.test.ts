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

import { renderHook } from "@testing-library/react";
import { useWindowTabShortcuts } from "@/hooks/navigation/useWindowTabShortcuts";
import { type KeyPress, appendElement, pressKey, withSpaceHeld } from "@/utils/keyboard/test-utils/keyboardEvents";
import { uninstallSpaceChordTracker } from "@/utils/keyboard/spaceChordTracker";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import type { WindowState } from "@/utils/window/constants";
import { makeWindow } from "@/utils/window/test-utils/tabNavigationFixtures";

const NEXT: KeyPress = { key: "ArrowRight", alt: true, shift: true };
const PREVIOUS: KeyPress = { key: "ArrowLeft", alt: true, shift: true };
const CLOSE: KeyPress = { key: "W", code: "KeyW", alt: true, shift: true };
const WORKSPACE: KeyPress = { key: "!", code: "Digit1", alt: true, shift: true };

const FIRST = "first";
const SECOND = "second";

const renderTabBar = (windows: WindowState[], enabled = true) => {
  const handlers = { onSelectWindow: jest.fn(), onCloseWindow: jest.fn(), onSelectWorkspace: jest.fn() };
  renderHook(() => useWindowTabShortcuts({ windows, enabled, ...handlers }));
  return handlers;
};

describe("useWindowTabShortcuts", () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => {
    uninstallSpaceChordTracker();
    document.body.innerHTML = "";
  });

  it("moves to the next and previous windows", () => {
    const { onSelectWindow } = renderTabBar([makeWindow(FIRST, true), makeWindow(SECOND)]);

    pressKey(NEXT);

    expect(onSelectWindow).toHaveBeenCalledWith(SECOND);
  });

  it("does the same with the Ctrl+Space alternative", () => {
    const { onSelectWindow } = renderTabBar([makeWindow(FIRST), makeWindow(SECOND, true)]);

    withSpaceHeld(() => pressKey({ key: "ArrowLeft", ctrl: true }));

    expect(onSelectWindow).toHaveBeenCalledWith(FIRST);
  });

  it("goes back to the Workspace from the first window and stops there", () => {
    const { onSelectWorkspace, onSelectWindow } = renderTabBar([makeWindow(FIRST, true)]);

    pressKey(PREVIOUS);
    expect(onSelectWorkspace).toHaveBeenCalledTimes(1);

    pressKey(NEXT);
    expect(onSelectWindow).not.toHaveBeenCalled();
  });

  it("does nothing before the Workspace", () => {
    const { onSelectWorkspace, onSelectWindow } = renderTabBar([makeWindow(FIRST)]);

    pressKey(PREVIOUS);

    expect(onSelectWorkspace).not.toHaveBeenCalled();
    expect(onSelectWindow).not.toHaveBeenCalled();
  });

  it("closes the active window through the close handler", () => {
    const active = makeWindow(SECOND, true);
    const { onCloseWindow } = renderTabBar([makeWindow(FIRST), active]);

    pressKey(CLOSE);

    expect(onCloseWindow).toHaveBeenCalledWith(active);
  });

  it("closes nothing on the Workspace", () => {
    const { onCloseWindow } = renderTabBar([makeWindow(FIRST)]);

    pressKey(CLOSE);

    expect(onCloseWindow).not.toHaveBeenCalled();
  });

  it("jumps to the Workspace", () => {
    const { onSelectWorkspace } = renderTabBar([makeWindow(FIRST, true)]);

    pressKey(WORKSPACE);

    expect(onSelectWorkspace).toHaveBeenCalledTimes(1);
  });

  it("ignores the shortcuts from a text field and while disabled", () => {
    const { onSelectWindow } = renderTabBar([makeWindow(FIRST, true), makeWindow(SECOND)]);
    pressKey(NEXT, appendElement("input"));
    expect(onSelectWindow).not.toHaveBeenCalled();

    const disabled = renderTabBar([makeWindow(FIRST, true), makeWindow(SECOND)], false);
    pressKey(NEXT);
    expect(disabled.onSelectWindow).not.toHaveBeenCalled();
  });
});
