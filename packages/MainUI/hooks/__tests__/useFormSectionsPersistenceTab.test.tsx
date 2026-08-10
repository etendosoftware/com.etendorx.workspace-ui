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
 * Unit tests for useFormSectionsPersistenceTab, which keeps the collapse/expand
 * preference of the form sections alive across FormView unmounting.
 *
 * The scenarios mirror the acceptance criteria of ETP-4634: the metadata state is
 * applied only on the first open of a tab, later openings reuse the user
 * preference, and preferences never leak between tabs or windows.
 */

import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { useFormSectionsPersistenceTab } from "../useFormSectionsPersistenceTab";
import { useWindowStore } from "@/stores/windowStore";

const WINDOW_1 = "win1_1";
const WINDOW_2 = "win2_1";
const TAB_1 = "tab1";
const TAB_2 = "tab2";
const MAIN = "_main";
const COLLAPSED_BY_METADATA = "g2";
const EXPANDED_BY_METADATA = "g1";

type HookResult = RenderHookResult<ReturnType<typeof useFormSectionsPersistenceTab>, unknown>;

/** Mounts the hook for a given window/tab pair, as FormView does. */
const renderSectionsHook = (windowIdentifier = WINDOW_1, tabId = TAB_1): HookResult =>
  renderHook(() => useFormSectionsPersistenceTab({ windowIdentifier, tabId }));

/** Simulates FormView being unmounted (back to the grid) and mounted again. */
const remount = (rendered: HookResult, windowIdentifier = WINDOW_1, tabId = TAB_1): HookResult => {
  rendered.unmount();
  return renderSectionsHook(windowIdentifier, tabId);
};

/** Seeds the metadata defaults the way the FormView effect does. */
const seed = (rendered: HookResult, defaults: string[]) => {
  act(() => rendered.result.current.initializeExpandedSections(() => defaults));
};

const collapseSection = (rendered: HookResult, sectionId: string) => {
  act(() => rendered.result.current.setExpandedSections((prev) => prev.filter((id) => id !== sectionId)));
};

const expandSection = (rendered: HookResult, sectionId: string) => {
  act(() => rendered.result.current.setExpandedSections((prev) => [...prev, sectionId]));
};

beforeEach(() => {
  useWindowStore.setState({ windows: {} });
});

describe("useFormSectionsPersistenceTab", () => {
  it("applies the metadata state on the first open of a tab", () => {
    const rendered = renderSectionsHook();

    expect(rendered.result.current.expandedSections).toEqual([]);
    seed(rendered, [MAIN, EXPANDED_BY_METADATA]);

    expect(rendered.result.current.expandedSections).toEqual([MAIN, EXPANDED_BY_METADATA]);
    expect(useWindowStore.getState().windows[WINDOW_1].tabs[TAB_1].expandedSections).toEqual([
      MAIN,
      EXPANDED_BY_METADATA,
    ]);
  });

  it("keeps a section collapsed by the user after the form is reopened", () => {
    let rendered = renderSectionsHook();
    seed(rendered, [MAIN, EXPANDED_BY_METADATA]);
    collapseSection(rendered, EXPANDED_BY_METADATA);

    rendered = remount(rendered);
    seed(rendered, [MAIN, EXPANDED_BY_METADATA]);

    expect(rendered.result.current.expandedSections).toEqual([MAIN]);
  });

  it("keeps a section expanded by the user after the form is reopened", () => {
    let rendered = renderSectionsHook();
    seed(rendered, [MAIN]);
    expandSection(rendered, COLLAPSED_BY_METADATA);

    rendered = remount(rendered);
    seed(rendered, [MAIN]);

    expect(rendered.result.current.expandedSections).toEqual([MAIN, COLLAPSED_BY_METADATA]);
  });

  it("treats an empty preference as a real preference and never recomputes the defaults", () => {
    let rendered = renderSectionsHook();
    seed(rendered, [MAIN]);
    act(() => rendered.result.current.setExpandedSections([]));

    rendered = remount(rendered);
    const computeDefaults = jest.fn(() => [MAIN]);
    act(() => rendered.result.current.initializeExpandedSections(computeDefaults));

    expect(rendered.result.current.expandedSections).toEqual([]);
    expect(computeDefaults).not.toHaveBeenCalled();
  });

  it("does not recompute the defaults when a preference already exists", () => {
    const rendered = renderSectionsHook();
    seed(rendered, [MAIN]);

    const computeDefaults = jest.fn(() => [MAIN, EXPANDED_BY_METADATA]);
    act(() => rendered.result.current.initializeExpandedSections(computeDefaults));

    expect(computeDefaults).not.toHaveBeenCalled();
    expect(rendered.result.current.expandedSections).toEqual([MAIN]);
  });

  it("keeps preferences independent between tabs of the same window", () => {
    const firstTab = renderSectionsHook(WINDOW_1, TAB_1);
    const secondTab = renderSectionsHook(WINDOW_1, TAB_2);

    seed(firstTab, [MAIN, EXPANDED_BY_METADATA]);
    collapseSection(firstTab, EXPANDED_BY_METADATA);
    seed(secondTab, [MAIN, EXPANDED_BY_METADATA]);

    expect(firstTab.result.current.expandedSections).toEqual([MAIN]);
    expect(secondTab.result.current.expandedSections).toEqual([MAIN, EXPANDED_BY_METADATA]);
  });

  it("keeps preferences independent between window instances showing the same tab", () => {
    const firstWindow = renderSectionsHook(WINDOW_1, TAB_1);
    const secondWindow = renderSectionsHook(WINDOW_2, TAB_1);

    seed(firstWindow, [MAIN, EXPANDED_BY_METADATA]);
    collapseSection(firstWindow, EXPANDED_BY_METADATA);
    seed(secondWindow, [MAIN, EXPANDED_BY_METADATA]);

    expect(firstWindow.result.current.expandedSections).toEqual([MAIN]);
    expect(secondWindow.result.current.expandedSections).toEqual([MAIN, EXPANDED_BY_METADATA]);
  });

  it("builds consecutive updates on the persisted value, not on a stale render closure", () => {
    const rendered = renderSectionsHook();
    seed(rendered, [MAIN]);

    act(() => {
      rendered.result.current.setExpandedSections((prev) => [...prev, EXPANDED_BY_METADATA]);
      rendered.result.current.setExpandedSections((prev) => [...prev, COLLAPSED_BY_METADATA]);
    });

    expect(rendered.result.current.expandedSections).toEqual([MAIN, EXPANDED_BY_METADATA, COLLAPSED_BY_METADATA]);
  });

  it("returns a stable empty array while the tab has no preference", () => {
    const rendered = renderSectionsHook();
    const initial = rendered.result.current.expandedSections;

    act(() => useWindowStore.getState().setTableFilters(WINDOW_1, TAB_2, []));

    expect(rendered.result.current.expandedSections).toBe(initial);
  });
});
