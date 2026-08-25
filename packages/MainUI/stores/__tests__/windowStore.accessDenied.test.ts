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

import { useWindowStore } from "../windowStore";

const WINDOW_IDENTIFIER = "102_1787227156318";

beforeEach(() => {
  useWindowStore.setState({
    windows: {},
    dirtyWindows: {},
    isRecoveryLoading: false,
    recoveryError: null,
    triggerRecovery: () => {},
    accessDeniedWindowCount: 0,
  });
});

describe("windowStore access denied counter", () => {
  it("starts at zero", () => {
    expect(useWindowStore.getState().accessDeniedWindowCount).toBe(0);
  });

  it("stores the number of discarded windows", () => {
    useWindowStore.getState().setAccessDeniedWindowCount(2);

    expect(useWindowStore.getState().accessDeniedWindowCount).toBe(2);
  });

  it("is cleared when a window becomes active", () => {
    useWindowStore.getState().setAccessDeniedWindowCount(1);
    useWindowStore.getState().setWindowActive({ windowIdentifier: WINDOW_IDENTIFIER });

    const state = useWindowStore.getState();
    expect(state.accessDeniedWindowCount).toBe(0);
    expect(state.windows[WINDOW_IDENTIFIER]?.isActive).toBe(true);
  });

  it("is cleared on cleanState, so a role change does not keep a stale screen", () => {
    useWindowStore.getState().setAccessDeniedWindowCount(3);
    useWindowStore.getState().cleanState();

    const state = useWindowStore.getState();
    expect(state.accessDeniedWindowCount).toBe(0);
    expect(state.windows).toEqual({});
  });

  it("survives closing a window, so the screen stays after the last window is discarded", () => {
    useWindowStore.getState().setAccessDeniedWindowCount(1);
    useWindowStore.getState().cleanupWindow(WINDOW_IDENTIFIER);

    expect(useWindowStore.getState().accessDeniedWindowCount).toBe(1);
  });
});
