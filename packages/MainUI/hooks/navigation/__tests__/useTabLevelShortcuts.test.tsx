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
import { useFocusContext } from "@/contexts/focus";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { useWindowStore } from "@/stores/windowStore";
import { useTabLevelShortcuts, useWindowActivationFocus } from "@/hooks/navigation/useTabLevelShortcuts";
import { type KeyPress, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { HEADER_TAB, LINES_TAB, WINDOW_TABS } from "@/utils/window/test-utils/tabNavigationFixtures";

jest.mock("@/contexts/focus", () => ({ useFocusContext: jest.fn() }));
jest.mock("@/hooks/useTableStatePersistenceTab", () => ({ useTableStatePersistenceTab: jest.fn() }));
jest.mock("@/stores/windowStore", () => ({ useWindowStore: jest.fn() }));

const WINDOW_IDENTIFIER = "win-1";
const OTHER_WINDOW_TAB = "other-window-tab";

/** Renders inside the window `WINDOW_IDENTIFIER`, whose activity `arrange` decides. */
const inWindow = ({ children }: { children: ReactNode }) =>
  createElement(CurrentWindowProvider, { windowIdentifier: WINDOW_IDENTIFIER, windowId: "143", children });

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
  (useWindowStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
    selector({ windows: { [WINDOW_IDENTIFIER]: { isActive: isWindowActive } } })
  );
};

describe("useTabLevelShortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
  });

  it("moves the focus from a child tab to its parent", () => {
    arrange({ activeFocusId: LINES_TAB.id });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS), { wrapper: inWindow });

    pressKey(PARENT);

    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
    expect(setActiveLevel).toHaveBeenCalledWith(LINES_TAB.tabLevel, false);
  });

  it("moves the focus from the header to its rendered child", () => {
    arrange({ activeFocusId: HEADER_TAB.id });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS), { wrapper: inWindow });

    pressKey(CHILD);

    expect(setFocus).toHaveBeenCalledWith(LINES_TAB.id);
    expect(setActiveLevel).toHaveBeenCalledWith(LINES_TAB.tabLevel);
    expect(setActiveTabsByLevel).toHaveBeenCalledWith(LINES_TAB);
  });

  it.each([
    ["the header has no parent", HEADER_TAB.id, PARENT, undefined],
    ["no child is on screen", HEADER_TAB.id, CHILD, [HEADER_TAB.id]],
    ["the focus belongs to another window", OTHER_WINDOW_TAB, CHILD, undefined],
  ])("does nothing when %s", (_label, activeFocusId, press, renderedTabs) => {
    arrange({ activeFocusId, renderedTabs });
    renderHook(() => useTabLevelShortcuts(WINDOW_TABS), { wrapper: inWindow });

    pressKey(press);

    expect(setFocus).not.toHaveBeenCalled();
  });
});

describe("useWindowActivationFocus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("focuses the header tab when the window is activated with the focus elsewhere", () => {
    arrange({ activeFocusId: OTHER_WINDOW_TAB });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS), { wrapper: inWindow });

    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
  });

  it("keeps the focus that already belongs to the window", () => {
    arrange({ activeFocusId: LINES_TAB.id });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS), { wrapper: inWindow });

    expect(setFocus).not.toHaveBeenCalled();
  });

  it("does nothing while the window is hidden", () => {
    arrange({ activeFocusId: OTHER_WINDOW_TAB, isWindowActive: false });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS), { wrapper: inWindow });

    expect(setFocus).not.toHaveBeenCalled();
  });

  it("falls back to the first header tab and to nothing without tabs", () => {
    arrange({ activeFocusId: null });
    (useTableStatePersistenceTab as jest.Mock).mockReturnValue({ activeTabsByLevel: new Map() });
    renderHook(() => useWindowActivationFocus(WINDOW_TABS), { wrapper: inWindow });
    renderHook(() => useWindowActivationFocus([]), { wrapper: inWindow });

    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(setFocus).toHaveBeenCalledWith(HEADER_TAB.id);
  });
});
