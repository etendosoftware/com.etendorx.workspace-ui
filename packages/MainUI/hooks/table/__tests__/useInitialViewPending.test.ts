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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, renderHook } from "@testing-library/react";
import { INITIAL_VIEW_WAIT_MS, tabNeedsInitialView, useInitialViewPending } from "../useInitialViewPending";
import { markInitialViewResolved } from "@/stores/initialViewStore";
import { getSettledTabDefaultView } from "@/utils/savedViews/defaultViews";
import { getSettledTabColumnConfiguration } from "@/utils/savedViews/gridConfiguration";
import { resetSessionState } from "@/utils/session/resetSessionState";

jest.mock("@/utils/session/resetSessionState");
jest.mock("@/utils/savedViews/defaultViews", () => ({ getSettledTabDefaultView: jest.fn() }));
jest.mock("@/utils/savedViews/gridConfiguration", () => ({ getSettledTabColumnConfiguration: jest.fn() }));

const WINDOW = "143_1";
const TAB = "tab-1";

const renderPending = () => renderHook(() => useInitialViewPending(WINDOW, TAB));

const UNKNOWN = undefined;
const NONE = null;
const DEFAULT_VIEW = { filters: [] };
const COLUMNS = { version: 1, visibility: { name: false }, order: ["name"] };
const SORTED_COLUMNS = { ...COLUMNS, sorting: [{ id: "name", desc: true }] };

/** What the window requests answered for the tab (`undefined` while they have not answered). */
const givenSettled = (defaultView: unknown, columnConfiguration: unknown) => {
  (getSettledTabDefaultView as jest.Mock).mockReturnValue(defaultView);
  (getSettledTabColumnConfiguration as jest.Mock).mockReturnValue(columnConfiguration);
};

beforeEach(() => {
  jest.useFakeTimers();
  resetSessionState();
  givenSettled(UNKNOWN, UNKNOWN);
});

afterEach(() => jest.useRealTimers());

describe("useInitialViewPending", () => {
  it("waits while the initial view of the tab is not resolved", () => {
    const { result } = renderPending();

    expect(result.current).toBe(true);
  });

  it("stops waiting once the initial view is resolved", () => {
    const { result } = renderPending();

    act(() => markInitialViewResolved(WINDOW, TAB));

    expect(result.current).toBe(false);
  });

  it("stops waiting after the longest wait, so the grid is never blocked", () => {
    const { result } = renderPending();

    act(() => jest.advanceTimersByTime(INITIAL_VIEW_WAIT_MS - 1));
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it("does not wait for a tab already resolved", () => {
    markInitialViewResolved(WINDOW, TAB);

    const { result } = renderPending();

    expect(result.current).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not wait, from the first render, for a tab with nothing that changes its first request", () => {
    givenSettled(NONE, COLUMNS);

    const { result } = renderPending();

    expect(result.current).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cancels the wait when the grid unmounts", () => {
    const { unmount } = renderPending();

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("tabNeedsInitialView", () => {
  it.each([
    ["the default views have not answered", UNKNOWN, NONE, true],
    ["the stored columns have not answered", NONE, UNKNOWN, true],
    ["the tab has a default view", DEFAULT_VIEW, NONE, true],
    ["the stored columns sort the grid", NONE, SORTED_COLUMNS, true],
    ["the stored columns do not sort the grid", NONE, COLUMNS, false],
    ["nothing is stored for the tab", NONE, NONE, false],
  ])("is %s → %s", (_case, defaultView, columnConfiguration, expected) => {
    givenSettled(defaultView, columnConfiguration);

    expect(tabNeedsInitialView(WINDOW, TAB)).toBe(expected);
  });
});
