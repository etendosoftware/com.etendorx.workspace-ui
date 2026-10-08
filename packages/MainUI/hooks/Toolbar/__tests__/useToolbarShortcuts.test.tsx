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
import { useToolbarShortcuts } from "@/hooks/Toolbar/useToolbarShortcuts";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";
import { type KeyPress, appendElement, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";
import { buildToolbarSections, makeToolbarButton } from "@/utils/toolbar/test-utils/toolbarShortcutFixtures";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { GRID_FOCUS_TARGET_ATTRIBUTE } from "@/utils/window/splitView";

const ctrlShift = (key: string): KeyPress => ({ key, code: `Key${key}`, ctrl: true, shift: true });

describe("useToolbarShortcuts", () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    [TOOLBAR_BUTTONS_ACTIONS.REFRESH, ctrlShift("R")],
    [TOOLBAR_BUTTONS_ACTIONS.EXPORT_CSV, ctrlShift("E")],
    [TOOLBAR_BUTTONS_ACTIONS.ATTACHMENT, ctrlShift("A")],
    [TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD, ctrlShift("K")],
    [TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD, ctrlShift("P")],
    [TOOLBAR_BUTTONS_ACTIONS.SEND_MAIL, ctrlShift("M")],
    [TOOLBAR_BUTTONS_ACTIONS.SHOW_AUDIT_TRAIL, ctrlShift("Y")],
    [TOOLBAR_BUTTONS_ACTIONS.SHARE_LINK, ctrlShift("U")],
    [TOOLBAR_BUTTONS_ACTIONS.CANCEL, ctrlShift("Z")],
    [TOOLBAR_BUTTONS_ACTIONS.NEW, { key: "d", code: "KeyD", ctrl: true }],
    [TOOLBAR_BUTTONS_ACTIONS.DELETE, { key: "Delete", ctrl: true }],
  ])("presses %s with its classic shortcut", (action, press) => {
    const button = makeToolbarButton(action);
    renderHook(() => useToolbarShortcuts(buildToolbarSections([], [button]), true));

    const event = pressKey(press);

    expect(button.onClick).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not press a disabled button", () => {
    const button = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.DELETE, true);
    renderHook(() => useToolbarShortcuts(buildToolbarSections([], [button]), true));

    pressKey({ key: "Delete", ctrl: true });

    expect(button.onClick).not.toHaveBeenCalled();
  });

  it("does nothing while the tab is not focused", () => {
    const button = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.REFRESH);
    renderHook(() => useToolbarShortcuts(buildToolbarSections([button]), false));

    pressKey(ctrlShift("R"));

    expect(button.onClick).not.toHaveBeenCalled();
  });

  it("keeps Refresh out of text fields but lets Undo through", () => {
    const refresh = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.REFRESH);
    const cancel = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.CANCEL);
    renderHook(() => useToolbarShortcuts(buildToolbarSections([refresh], [cancel]), true));
    const input = appendElement("input");

    pressKey(ctrlShift("R"), input);
    pressKey(ctrlShift("Z"), input);

    expect(refresh.onClick).not.toHaveBeenCalled();
    expect(cancel.onClick).toHaveBeenCalledTimes(1);
  });

  describe("Delete on the grid rows", () => {
    const renderWithGrid = () => {
      const button = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.DELETE);
      renderHook(() => useToolbarShortcuts(buildToolbarSections([], [button]), true));
      const grid = appendElement("div");
      grid.setAttribute(GRID_FOCUS_TARGET_ATTRIBUTE, "");
      return { button, grid };
    };

    it("presses Delete when the rows have the focus", () => {
      const { button, grid } = renderWithGrid();

      pressKey({ key: "Delete" }, grid);

      expect(button.onClick).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["outside the grid", () => appendElement("button")],
      ["in the filter row", (grid: Element) => appendElement("button", appendElement("thead", grid))],
    ])("ignores Delete %s", (_label, createTarget) => {
      const { button, grid } = renderWithGrid();

      const event = pressKey({ key: "Delete" }, createTarget(grid));

      expect(button.onClick).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it("uses the buttons of the latest render", () => {
    const first = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.REFRESH, true);
    const second = makeToolbarButton(TOOLBAR_BUTTONS_ACTIONS.REFRESH);
    const { rerender } = renderHook(({ button }) => useToolbarShortcuts(buildToolbarSections([button]), true), {
      initialProps: { button: first },
    });

    rerender({ button: second });
    pressKey(ctrlShift("R"));

    expect(first.onClick).not.toHaveBeenCalled();
    expect(second.onClick).toHaveBeenCalledTimes(1);
  });
});
