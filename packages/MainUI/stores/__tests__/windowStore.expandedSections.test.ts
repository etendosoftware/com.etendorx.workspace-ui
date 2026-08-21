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

/**
 * Unit tests for the per-tab persistence of the form section expansion
 * preference (setTabExpandedSections) in the window store.
 */

import { useWindowStore } from "../windowStore";
import { createDefaultTabState } from "@/utils/window/utils";
import { TAB_MODES } from "@/utils/url/constants";

const WINDOW_1 = "win1_1";
const WINDOW_2 = "win2_1";
const TAB_1 = "tab1";
const TAB_2 = "tab2";
const MAIN = "_main";

/** Reads the stored preference of a tab, undefined when it was never set. */
const getStored = (windowIdentifier: string, tabId: string): string[] | undefined =>
  useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.expandedSections;

beforeEach(() => {
  useWindowStore.setState({
    windows: {},
    dirtyWindows: {},
    isRecoveryLoading: false,
    recoveryError: null,
    triggerRecovery: () => {},
  });
});

describe("windowStore setTabExpandedSections", () => {
  it("creates the window and the tab when they do not exist yet", () => {
    useWindowStore.getState().setTabExpandedSections(WINDOW_1, TAB_1, [MAIN]);

    expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN]);
  });

  it("stores the tab level received when the tab entry has to be created", () => {
    useWindowStore.getState().setTabExpandedSections(WINDOW_1, TAB_1, [MAIN], 2);

    expect(useWindowStore.getState().windows[WINDOW_1].tabs[TAB_1].level).toBe(2);
  });

  it("replaces the stored list instead of merging it, so sections can be collapsed", () => {
    const store = useWindowStore.getState();
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN, "g1"]);
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN]);

    expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN]);
  });

  it("stores an empty list as a real preference, distinguishable from no preference", () => {
    useWindowStore.getState().setTabExpandedSections(WINDOW_1, TAB_1, []);

    expect(getStored(WINDOW_1, TAB_1)).toEqual([]);
    expect(getStored(WINDOW_1, TAB_2)).toBeUndefined();
  });

  it("leaves the preference undefined in a freshly created tab state", () => {
    expect(createDefaultTabState().expandedSections).toBeUndefined();
  });

  it("keeps the preference independent per tab of the same window", () => {
    const store = useWindowStore.getState();
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN, "g1"]);
    store.setTabExpandedSections(WINDOW_1, TAB_2, [MAIN]);
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN]);

    expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN]);
    expect(getStored(WINDOW_1, TAB_2)).toEqual([MAIN]);
  });

  it("keeps the preference independent per window for the same tab id", () => {
    const store = useWindowStore.getState();
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN, "g1"]);
    store.setTabExpandedSections(WINDOW_2, TAB_1, []);

    expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN, "g1"]);
    expect(getStored(WINDOW_2, TAB_1)).toEqual([]);
  });

  it("drops the preference when the window is closed", () => {
    const store = useWindowStore.getState();
    store.setWindowActive({ windowIdentifier: WINDOW_1 });
    store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN]);

    useWindowStore.getState().cleanupWindow(WINDOW_1);

    expect(getStored(WINDOW_1, TAB_1)).toBeUndefined();
  });

  it("drops the preference when the whole state is cleaned", () => {
    useWindowStore.getState().setTabExpandedSections(WINDOW_1, TAB_1, [MAIN]);

    useWindowStore.getState().cleanState();

    expect(getStored(WINDOW_1, TAB_1)).toBeUndefined();
  });

  describe("preservation across unrelated tab resets", () => {
    beforeEach(() => {
      const store = useWindowStore.getState();
      store.setTabExpandedSections(WINDOW_1, TAB_1, [MAIN, "g1"]);
      store.setTabExpandedSections(WINDOW_1, TAB_2, [MAIN]);
    });

    it("is preserved when the form state of the tab is cleared", () => {
      useWindowStore.getState().clearTabFormState(WINDOW_1, TAB_1);

      expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN, "g1"]);
    });

    it("is preserved when the children selections are cleared", () => {
      useWindowStore.getState().clearChildrenSelections(WINDOW_1, [TAB_2], true);

      expect(getStored(WINDOW_1, TAB_2)).toEqual([MAIN]);
    });

    it("is preserved when a parent selection changes and clears its children", () => {
      useWindowStore.getState().setTabFormState(WINDOW_1, TAB_2, { mode: TAB_MODES.FORM, recordId: "rec1" });

      useWindowStore.getState().setSelectedRecordAndClearChildren(WINDOW_1, TAB_1, "rec2", [TAB_2]);

      expect(getStored(WINDOW_1, TAB_1)).toEqual([MAIN, "g1"]);
      expect(getStored(WINDOW_1, TAB_2)).toEqual([MAIN]);
    });
  });
});
