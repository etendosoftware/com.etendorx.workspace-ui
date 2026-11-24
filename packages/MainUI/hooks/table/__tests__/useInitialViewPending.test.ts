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
import { INITIAL_VIEW_WAIT_MS, useInitialViewPending } from "../useInitialViewPending";
import { markInitialViewResolved } from "@/stores/initialViewStore";
import { resetSessionState } from "@/utils/session/resetSessionState";

jest.mock("@/utils/session/resetSessionState");

const WINDOW = "143_1";
const TAB = "tab-1";

const renderPending = () => renderHook(() => useInitialViewPending(WINDOW, TAB));

beforeEach(() => {
  jest.useFakeTimers();
  resetSessionState();
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

  it("cancels the wait when the grid unmounts", () => {
    const { unmount } = renderPending();

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
