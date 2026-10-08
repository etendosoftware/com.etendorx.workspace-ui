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
import { useFocusContext } from "@/contexts/focus";
import { useIsCurrentWindowActive } from "@/hooks/useShortcutBindings";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { useTabLevelShortcuts, useWindowActivationFocus } from "@/hooks/navigation/useTabLevelShortcuts";
import { type KeyPress, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { HEADER_TAB, LINES_TAB, WINDOW_TABS } from "@/utils/window/test-utils/tabNavigationFixtures";

jest.mock("@/contexts/focus", () => ({ useFocusContext: jest.fn() }));
jest.mock("@/hooks/useTableStatePersistenceTab", () => ({ useTableStatePersistenceTab: jest.fn() }));
jest.mock("@/hooks/useShortcutBindings", () => ({
  ...jest.requireActual("@/hooks/useShortcutBindings"),
  useIsCurrentWindowActive: jest.fn(),
}));

const PARENT: KeyPress = { key: "ArrowUp", alt: true, shift: true };
const CHILD: KeyPress = { key: "ArrowDown", alt: true, shift: true };

const setFocus = jest.fn();
const setActiveLevel = jest.fn();
const setActiveTabsByLevel = jest.fn();

const arrange = ({
  activeFocusId,
  renderedTabs = WINDOW_TABS.map((tab) => tab.id),
  isWindowActive = true,
}: {
  activeFocusId: string | null;
  renderedTabs?: string[];
  isWindowActive?: boolean;
}) => {
  (useFocusContext as jest.Mock).mockReturnValue({
    activeFocusId,
    setFocus,
    hasRegion: (id: string) => renderedTabs.includes(id),
  });
  (useTableStatePersistenceTab as jest.Mock).mockReturnValue({
    activeTabsByLevel: new Map([[0, HEADER_TAB.id]]),
    setActiveLevel,
    setActiveTabsByLevel,
  });
  (useIsCurrentWindowActive as jest.Mock).mockReturnValue(isWindowActive);
};

describe("useTabLevelShortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
  });

  it("moves the focus from a child tab to its parent", () => {
    arrange({ activeFocusId: LINES_TAB.id });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS));

    pressKey(PARENT);

    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
    expect(setActiveLevel).toHaveBeenCalledWith(LINES_TAB.tabLevel, false);
  });

  it("moves the focus from the header to its rendered child", () => {
    arrange({ activeFocusId: HEADER_TAB.id });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS));

    pressKey(CHILD);

    expect(setFocus).toHaveBeenCalledWith(LINES_TAB.id);
    expect(setActiveLevel).toHaveBeenCalledWith(LINES_TAB.tabLevel);
    expect(setActiveTabsByLevel).toHaveBeenCalledWith(LINES_TAB);
  });

  it.each([
    ["the header has no parent", HEADER_TAB.id, PARENT, undefined],
    ["no child is on screen", HEADER_TAB.id, CHILD, [HEADER_TAB.id]],
    ["the focus belongs to another window", "other-window-tab", CHILD, undefined],
  ])("does nothing when %s", (_label, activeFocusId, press, renderedTabs) => {
    arrange({ activeFocusId, renderedTabs });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS));

    pressKey(press);

    expect(setFocus).not.toHaveBeenCalled();
  });
});

describe("useWindowActivationFocus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("focuses the header tab when the window is activated with the focus elsewhere", () => {
    arrange({ activeFocusId: "other-window-tab" });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS));

    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
  });

  it("keeps the focus that already belongs to the window", () => {
    arrange({ activeFocusId: LINES_TAB.id });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS));

    expect(setFocus).not.toHaveBeenCalled();
  });

  it("does nothing while the window is hidden", () => {
    arrange({ activeFocusId: "other-window-tab", isWindowActive: false });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS));

    expect(setFocus).not.toHaveBeenCalled();
  });

  it("falls back to the first header tab and to nothing without tabs", () => {
    arrange({ activeFocusId: null });
    (useTableStatePersistenceTab as jest.Mock).mockReturnValue({ activeTabsByLevel: new Map() });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS));
    renderHook(() => useWindowActivationFocus([]));

    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
  });
});
