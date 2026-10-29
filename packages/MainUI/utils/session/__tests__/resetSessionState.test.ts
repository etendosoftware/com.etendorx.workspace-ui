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

import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useFormPersonalizationStore } from "@/stores/formPersonalizationStore";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useWindowStore } from "@/stores/windowStore";
import { prefetchStore } from "@/utils/prefetchStore";
import { registerSessionReset, resetSessionState } from "../resetSessionState";

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { clearCache: jest.fn() } }));

const WINDOW_URL = "/window?wi_0=143_1&ti_0=186&ri_0=ABC";

/** Leaves every session store with state of the previous user. */
function fillSessionStores() {
  useWindowStore.setState({
    windows: { "143_1": { windowId: "143" } } as never,
    dirtyWindows: { "143_1": { form: true } },
    accessDeniedWindowCount: 2,
  });
  useLiveTabValuesStore.setState({ entries: { "143_1": { "186": {} } } as never });
  useUnsavedChangesStore.setState({ request: { onProceed: jest.fn() } as never, bypassUnloadWarning: true });
  useToolbarStore.setState({ byTabId: { "186": {} } as never });
  useDashboardStore.setState({ loadedRoleId: "role-1" });
  useFormPersonalizationStore.setState({ entries: { key: { status: "error" } } });
  useProcessMonitorStore.setState({ isOpen: true } as never);
  prefetchStore.set("key", Promise.resolve());
}

describe("resetSessionState", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", WINDOW_URL);
  });

  it("leaves no window, form or toolbar state of the previous user", () => {
    fillSessionStores();

    resetSessionState();

    const windowState = useWindowStore.getState();
    expect(windowState.windows).toEqual({});
    expect(windowState.dirtyWindows).toEqual({});
    expect(windowState.accessDeniedWindowCount).toBe(0);
    expect(useLiveTabValuesStore.getState().entries).toEqual({});
    expect(useUnsavedChangesStore.getState().request).toBeNull();
    expect(useUnsavedChangesStore.getState().bypassUnloadWarning).toBe(false);
    expect(useToolbarStore.getState().byTabId).toEqual({});
    expect(useDashboardStore.getState().loadedRoleId).toBeNull();
    expect(useFormPersonalizationStore.getState().entries).toEqual({});
    expect(useProcessMonitorStore.getState()).toEqual(
      expect.objectContaining(useProcessMonitorStore.getInitialState())
    );
  });

  it("keeps the store actions usable after the reset", () => {
    resetSessionState();

    useLiveTabValuesStore.getState().publishTabValues("143_1", "186", { recordId: "ABC", values: {} });

    expect(useLiveTabValuesStore.getState().entries["143_1"]).toBeDefined();
  });

  it("clears the cached data", () => {
    prefetchStore.set("key", Promise.resolve());

    resetSessionState();

    expect(datasource.clearCache).toHaveBeenCalled();
    expect(prefetchStore.get("key")).toBeUndefined();
  });

  it("drops the windows kept in the URL and keeps the route", () => {
    resetSessionState();

    expect(window.location.pathname).toBe("/window");
    expect(window.location.search).toBe("");
  });

  it("leaves a URL without query untouched", () => {
    window.history.replaceState(null, "", "/");
    const replaceState = jest.spyOn(window.history, "replaceState");

    resetSessionState();

    expect(replaceState).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it("runs every registered cleanup once, even when registered twice", () => {
    const cleanup = jest.fn();
    registerSessionReset(cleanup);
    registerSessionReset(cleanup);

    resetSessionState();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
