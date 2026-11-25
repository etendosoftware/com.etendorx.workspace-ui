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

import { renderHook, act } from "@testing-library/react";
import { useAutoApplyDefaultView } from "../useAutoApplyDefaultView";
import { useWindowStore } from "@/stores/windowStore";
import { getInitialViewKey, useInitialViewStore } from "@/stores/initialViewStore";
import { loadTabColumnConfiguration } from "@/utils/savedViews/gridConfiguration";
import { loadTabDefaultView } from "@/utils/savedViews/defaultViews";
import { parseGridConfiguration } from "@/utils/savedViews/transform";
import { resetSessionState } from "@/utils/session/resetSessionState";
import { DEFAULT_VIEW_TAB_ID, VALID_GRID_CONFIG } from "@/utils/testUtils/savedViews";

jest.mock("@/utils/logger");
jest.mock("@/utils/session/resetSessionState");
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: any) => any) => selector({ token: "test-token" }),
}));
jest.mock("@/stores/windowStore", () => ({
  useWindowStore: { getState: jest.fn(() => ({ windows: {} })) },
}));
jest.mock("@/utils/savedViews/gridConfiguration", () => ({
  ...jest.requireActual("@/utils/savedViews/gridConfiguration"),
  loadTabColumnConfiguration: jest.fn(),
}));
jest.mock("@/utils/savedViews/defaultViews", () => ({ loadTabDefaultView: jest.fn() }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_WINDOW = "win-1";
const mockLoadDefaultView = loadTabDefaultView as jest.Mock;

/** The tab's default view is the one stored with the given grid configuration. */
const givenDefaultView = (gridConfiguration = VALID_GRID_CONFIG) =>
  mockLoadDefaultView.mockResolvedValue(parseGridConfiguration(gridConfiguration));

const givenNoDefaultView = () => mockLoadDefaultView.mockResolvedValue(null);

const isResolved = (windowIdentifier = DEFAULT_WINDOW, tabId = DEFAULT_VIEW_TAB_ID) =>
  Boolean(useInitialViewStore.getState().resolved[getInitialViewKey(windowIdentifier, tabId)]);

interface RenderOptions {
  tabId?: string;
  windowIdentifier?: string;
  onApplyColumnConfiguration?: jest.Mock;
}

async function renderAndWait(
  onApplyView: jest.Mock,
  { tabId = DEFAULT_VIEW_TAB_ID, windowIdentifier = DEFAULT_WINDOW, onApplyColumnConfiguration }: RenderOptions = {}
) {
  const hookResult = renderHook(() =>
    useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView, onApplyColumnConfiguration })
  );
  await act(async () => {});
  return hookResult;
}

beforeEach(() => {
  mockLoadDefaultView.mockReset();
  // Clears the restored column configurations and the resolved tabs of the previous test
  resetSessionState();
});

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAutoApplyDefaultView", () => {
  it("loads and applies the default view on mount", async () => {
    givenDefaultView();
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(mockLoadDefaultView).toHaveBeenCalledWith(DEFAULT_WINDOW, DEFAULT_VIEW_TAB_ID);
    expect(onApplyView).toHaveBeenCalledTimes(1);
    expect(onApplyView).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ id: "status", value: "active" }],
        visibility: { status: true },
        sorting: [{ id: "status", desc: false }],
        order: ["status"],
        implicitFilterApplied: true,
        grouping: [],
      })
    );
  });

  it("does not load when tabId is empty", async () => {
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView, { tabId: "" });

    expect(mockLoadDefaultView).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not load when windowIdentifier is empty", async () => {
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView, { windowIdentifier: "" });

    expect(mockLoadDefaultView).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply a view when the tab has none", async () => {
    givenNoDefaultView();
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("applies the view only once per windowIdentifier+tabId combination", async () => {
    givenDefaultView();
    const onApplyView = jest.fn();

    const { rerender } = renderHook(
      ({ tabId, windowIdentifier }: { tabId: string; windowIdentifier: string }) =>
        useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView }),
      { initialProps: { tabId: DEFAULT_VIEW_TAB_ID, windowIdentifier: DEFAULT_WINDOW } }
    );

    await act(async () => {});

    rerender({ tabId: DEFAULT_VIEW_TAB_ID, windowIdentifier: DEFAULT_WINDOW });
    await act(async () => {});

    expect(onApplyView).toHaveBeenCalledTimes(1);
  });

  it("does not clobber a linked-item reconstruction's hard filter (initializedWithDirectLink)", async () => {
    givenDefaultView();
    (useWindowStore.getState as jest.Mock).mockReturnValueOnce({
      windows: { [DEFAULT_WINDOW]: { tabs: { [DEFAULT_VIEW_TAB_ID]: { initializedWithDirectLink: true } } } },
    });
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("restores implicitFilterApplied:false when it was saved as false", async () => {
    givenDefaultView(
      JSON.stringify({
        version: 1,
        source: "workspace-ui",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        implicitFilterApplied: false,
      })
    );
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).toHaveBeenCalledWith(expect.objectContaining({ implicitFilterApplied: false }));
  });

  it("restores the grouping of a grouped default view", async () => {
    givenDefaultView(JSON.stringify({ ...JSON.parse(VALID_GRID_CONFIG), grouping: ["status"] }));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).toHaveBeenCalledWith(expect.objectContaining({ grouping: ["status"] }));
  });

  describe("first load of the grid", () => {
    it("lets the grid load once the default view is applied", async () => {
      givenDefaultView();
      let resolvedWhenApplied: boolean | undefined;
      const onApplyView = jest.fn(() => {
        resolvedWhenApplied = isResolved();
      });

      await renderAndWait(onApplyView);

      expect(resolvedWhenApplied).toBe(false);
      expect(isResolved()).toBe(true);
    });

    it("lets the grid load when the tab has no default view", async () => {
      givenNoDefaultView();

      await renderAndWait(jest.fn());

      expect(isResolved()).toBe(true);
    });

    it("lets the grid load when the default view cannot be read", async () => {
      mockLoadDefaultView.mockRejectedValue(new Error("network"));

      await renderAndWait(jest.fn());

      expect(isResolved()).toBe(true);
    });

    it("lets the grid load when nothing can be applied (no tab)", async () => {
      await renderAndWait(jest.fn(), { tabId: "" });

      expect(isResolved(DEFAULT_WINDOW, "")).toBe(true);
    });

    it("keeps the grid waiting while the default view is loading", async () => {
      mockLoadDefaultView.mockReturnValue(new Promise(() => {}));

      await renderAndWait(jest.fn());

      expect(isResolved()).toBe(false);
    });

    it("does not resolve a tab that unmounted before its view arrived", async () => {
      let answer: (value: null) => void = () => {};
      mockLoadDefaultView.mockReturnValue(
        new Promise((resolve) => {
          answer = resolve;
        })
      );

      const { unmount } = await renderAndWait(jest.fn());
      unmount();
      await act(async () => answer(null));

      expect(isResolved()).toBe(false);
    });
  });

  describe("stored column configuration", () => {
    const COLUMN_CONFIGURATION = {
      version: 1,
      visibility: { status: false },
      order: ["status"],
      sizing: { status: 80 },
    };
    const mockLoad = loadTabColumnConfiguration as jest.Mock;
    let windowSequence = 0;
    /** A fresh window per test: the restored tabs are tracked for the whole life of a window. */
    const nextWindow = () => `win-columns-${++windowSequence}`;

    beforeEach(() => {
      mockLoad.mockReset();
      mockLoad.mockResolvedValue(COLUMN_CONFIGURATION);
    });

    it("restores the stored columns when the tab has no default view", async () => {
      givenNoDefaultView();
      const onApplyColumnConfiguration = jest.fn();
      const windowIdentifier = nextWindow();

      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(mockLoad).toHaveBeenCalledWith(windowIdentifier, DEFAULT_VIEW_TAB_ID);
      expect(onApplyColumnConfiguration).toHaveBeenCalledWith({
        visibility: { status: false },
        order: ["status"],
        sizing: { status: 80 },
        pinning: { left: ["mrt-row-select", "actions"], right: [] },
      });
    });

    it("lets the grid load only after the stored columns are applied", async () => {
      givenNoDefaultView();
      let resolvedWhenApplied: boolean | undefined;
      const windowIdentifier = nextWindow();
      const onApplyColumnConfiguration = jest.fn(() => {
        resolvedWhenApplied = isResolved(windowIdentifier);
      });

      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(resolvedWhenApplied).toBe(false);
      expect(isResolved(windowIdentifier)).toBe(true);
    });

    it("gives the default view precedence over the stored columns", async () => {
      givenDefaultView();
      const onApplyView = jest.fn();
      const onApplyColumnConfiguration = jest.fn();

      await renderAndWait(onApplyView, { windowIdentifier: nextWindow(), onApplyColumnConfiguration });

      expect(onApplyView).toHaveBeenCalledTimes(1);
      expect(mockLoad).not.toHaveBeenCalled();
      expect(onApplyColumnConfiguration).not.toHaveBeenCalled();
    });

    it("restores the stored columns on a direct link, where the default view is skipped", async () => {
      const windowIdentifier = nextWindow();
      (useWindowStore.getState as jest.Mock).mockReturnValueOnce({
        windows: { [windowIdentifier]: { tabs: { [DEFAULT_VIEW_TAB_ID]: { initializedWithDirectLink: true } } } },
      });
      givenDefaultView();
      const onApplyView = jest.fn();
      const onApplyColumnConfiguration = jest.fn();

      await renderAndWait(onApplyView, { windowIdentifier, onApplyColumnConfiguration });

      expect(onApplyView).not.toHaveBeenCalled();
      expect(onApplyColumnConfiguration).toHaveBeenCalledTimes(1);
    });

    it("keeps the session columns when the tab remounts in the same window", async () => {
      givenNoDefaultView();
      const onApplyColumnConfiguration = jest.fn();
      const windowIdentifier = nextWindow();

      const first = await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });
      first.unmount();
      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(onApplyColumnConfiguration).toHaveBeenCalledTimes(1);
    });

    it("restores the stored columns again after a logout", async () => {
      givenNoDefaultView();
      const onApplyColumnConfiguration = jest.fn();
      const windowIdentifier = nextWindow();

      const first = await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });
      first.unmount();
      resetSessionState();
      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(onApplyColumnConfiguration).toHaveBeenCalledTimes(2);
    });

    it("applies nothing when no columns were stored", async () => {
      givenNoDefaultView();
      mockLoad.mockResolvedValue(null);
      const onApplyColumnConfiguration = jest.fn();

      await renderAndWait(jest.fn(), { windowIdentifier: nextWindow(), onApplyColumnConfiguration });

      expect(onApplyColumnConfiguration).not.toHaveBeenCalled();
    });
  });
});
