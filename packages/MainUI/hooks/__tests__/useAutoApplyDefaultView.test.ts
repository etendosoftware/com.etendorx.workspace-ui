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
import { loadTabColumnConfiguration } from "@/utils/savedViews/gridConfiguration";

jest.mock("@/utils/logger");
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_GRID_CONFIG = JSON.stringify({
  version: 1,
  source: "workspace-ui",
  filters: [{ id: "status", value: "active" }],
  visibility: { status: true },
  sorting: [{ id: "status", desc: false }],
  order: ["status"],
  implicitFilterApplied: true,
});

function makeDefaultViewRecord(overrides = {}) {
  return {
    id: "view-001",
    name: "Default View",
    tab: "tab-abc",
    user: "100",
    isdefault: true,
    filterclause: "",
    gridconfiguration: VALID_GRID_CONFIG,
    ...overrides,
  };
}

function makeSmartClientResponse(data: unknown[]) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ response: { status: 0, data, totalRows: data.length } }),
  } as Response);
}

function makeErrorResponse(status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "Server error" }),
  } as Response);
}

interface RenderOptions {
  tabId?: string;
  windowIdentifier?: string;
  onApplyColumnConfiguration?: jest.Mock;
}

async function renderAndWait(
  onApplyView: jest.Mock,
  { tabId = "tab-abc", windowIdentifier = "win-1", onApplyColumnConfiguration }: RenderOptions = {}
) {
  const hookResult = renderHook(() =>
    useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView, onApplyColumnConfiguration })
  );
  await act(async () => {});
  return hookResult;
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAutoApplyDefaultView", () => {
  it("fetches and applies the default view on mount", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

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

  it("does not fetch when tabId is empty", async () => {
    const spy = jest.spyOn(global, "fetch");
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView, { tabId: "" });

    expect(spy).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not fetch when windowIdentifier is empty", async () => {
    const spy = jest.spyOn(global, "fetch");
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView, { windowIdentifier: "" });

    expect(spy).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when the server returns no data", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when the response is not ok", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeErrorResponse(500));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when gridConfiguration is unparseable", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: "{invalid json}" })]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when gridConfiguration is empty", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: "" })]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("sends tabId and isdefault=true in the fetch URL", async () => {
    const spy = jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView, { tabId: "tab-xyz" });

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("tab-xyz");
    expect(url).toContain("isdefault=true");
    expect(url).toContain("/meta/saved-views");
  });

  it("applies the view only once per windowIdentifier+tabId combination", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));
    const onApplyView = jest.fn();

    const { rerender } = renderHook(
      ({ tabId, windowIdentifier }: { tabId: string; windowIdentifier: string }) =>
        useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView }),
      { initialProps: { tabId: "tab-abc", windowIdentifier: "win-1" } }
    );

    await act(async () => {});

    rerender({ tabId: "tab-abc", windowIdentifier: "win-1" });
    await act(async () => {});

    expect(onApplyView).toHaveBeenCalledTimes(1);
  });

  it("does not clobber a linked-item reconstruction's hard filter (initializedWithDirectLink)", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));
    (useWindowStore.getState as jest.Mock).mockReturnValueOnce({
      windows: { "win-1": { tabs: { "tab-abc": { initializedWithDirectLink: true } } } },
    });
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("restores implicitFilterApplied:false when it was saved as false", async () => {
    const configWithFalse = JSON.stringify({
      version: 1,
      source: "workspace-ui",
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
      implicitFilterApplied: false,
    });

    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: configWithFalse })]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).toHaveBeenCalledWith(expect.objectContaining({ implicitFilterApplied: false }));
  });

  it("restores the grouping of a grouped default view", async () => {
    const groupedConfig = JSON.stringify({ ...JSON.parse(VALID_GRID_CONFIG), grouping: ["status"] });

    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: groupedConfig })]));
    const onApplyView = jest.fn();

    await renderAndWait(onApplyView);

    expect(onApplyView).toHaveBeenCalledWith(expect.objectContaining({ grouping: ["status"] }));
  });

  describe("stored column configuration", () => {
    const COLUMN_CONFIGURATION = { version: 1, visibility: { status: false }, order: ["status"], sizing: { status: 80 } };
    const mockLoad = loadTabColumnConfiguration as jest.Mock;
    let windowSequence = 0;
    /** A fresh window per test: the restored tabs are tracked for the whole life of a window. */
    const nextWindow = () => `win-columns-${++windowSequence}`;

    beforeEach(() => {
      mockLoad.mockReset();
      mockLoad.mockResolvedValue(COLUMN_CONFIGURATION);
    });

    it("restores the stored columns when the tab has no default view", async () => {
      jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
      const onApplyColumnConfiguration = jest.fn();
      const windowIdentifier = nextWindow();

      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(mockLoad).toHaveBeenCalledWith(windowIdentifier, "tab-abc");
      expect(onApplyColumnConfiguration).toHaveBeenCalledWith({
        visibility: { status: false },
        order: ["status"],
        sizing: { status: 80 },
        pinning: { left: ["mrt-row-select", "actions"], right: [] },
      });
    });

    it("gives the default view precedence over the stored columns", async () => {
      jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));
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
        windows: { [windowIdentifier]: { tabs: { "tab-abc": { initializedWithDirectLink: true } } } },
      });
      jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));
      const onApplyView = jest.fn();
      const onApplyColumnConfiguration = jest.fn();

      await renderAndWait(onApplyView, { windowIdentifier, onApplyColumnConfiguration });

      expect(onApplyView).not.toHaveBeenCalled();
      expect(onApplyColumnConfiguration).toHaveBeenCalledTimes(1);
    });

    it("keeps the session columns when the tab remounts in the same window", async () => {
      jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
      const onApplyColumnConfiguration = jest.fn();
      const windowIdentifier = nextWindow();

      const first = await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });
      first.unmount();
      await renderAndWait(jest.fn(), { windowIdentifier, onApplyColumnConfiguration });

      expect(onApplyColumnConfiguration).toHaveBeenCalledTimes(1);
    });

    it("applies nothing when no columns were stored", async () => {
      jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
      mockLoad.mockResolvedValue(null);
      const onApplyColumnConfiguration = jest.fn();

      await renderAndWait(jest.fn(), { windowIdentifier: nextWindow(), onApplyColumnConfiguration });

      expect(onApplyColumnConfiguration).not.toHaveBeenCalled();
    });
  });
});
