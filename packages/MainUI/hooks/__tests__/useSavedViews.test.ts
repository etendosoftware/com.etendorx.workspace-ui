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
import { useSavedViews } from "../useSavedViews";

jest.mock("@/utils/logger");
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: jest.fn(() => ({ token: "test-token" })),
}));

// ---------------------------------------------------------------------------
// fetch mock helpers
// ---------------------------------------------------------------------------

function makeResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockFetchOk(data: unknown[] = []) {
  return jest
    .spyOn(global, "fetch")
    .mockReturnValue(makeResponse({ response: { status: 0, data, totalRows: data.length } }));
}

function makeFetchViewsResponse(data: unknown[] = []) {
  return makeResponse({ response: { status: 0, data, totalRows: data.length } });
}

function mockFetchError() {
  return jest.spyOn(global, "fetch").mockReturnValue(makeResponse({ error: "Server error" }, false, 500));
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_GRID_CONFIG = JSON.stringify({
  version: 1,
  source: "workspace-ui",
  filters: [{ id: "status", value: "active" }],
  visibility: { name: true, status: false },
  sorting: [{ id: "name", desc: false }],
  order: ["name", "status"],
  implicitFilterApplied: true,
});

function makeRawRecord(overrides = {}) {
  return {
    id: "view-001",
    name: "Sales Orders",
    tab: "tab-abc",
    user: "100",
    isdefault: false,
    filterclause: "",
    gridconfiguration: VALID_GRID_CONFIG,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fetchViews
// ---------------------------------------------------------------------------
describe("useSavedViews — fetchViews", () => {
  it("returns an empty list when no views are stored", async () => {
    mockFetchOk([]);
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns stored views for the given tabId", async () => {
    mockFetchOk([
      makeRawRecord({ id: "view-001", name: "Sales Orders", isdefault: false }),
      makeRawRecord({ id: "view-002", name: "Default View", isdefault: true }),
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(2);
    expect(result.current.views[0].id).toBe("view-001");
    expect(result.current.views[0].name).toBe("Sales Orders");
    expect(result.current.views[0].tabId).toBe("tab-abc");
    expect(result.current.views[0].isDefault).toBe(false);
    expect(result.current.views[0].config).not.toBeNull();
  });

  it("parses grid configuration into a valid MRT config object", async () => {
    mockFetchOk([makeRawRecord()]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    const config = result.current.views[0].config;
    expect(config?.version).toBe(1);
    expect(config?.source).toBe("workspace-ui");
    expect(config?.filters).toEqual([{ id: "status", value: "active" }]);
    expect(config?.visibility).toEqual({ name: true, status: false });
    expect(config?.sorting).toEqual([{ id: "name", desc: false }]);
    expect(config?.order).toEqual(["name", "status"]);
    expect(config?.implicitFilterApplied).toBe(true);
  });

  it("does not load when tabId is empty", async () => {
    const spy = jest.spyOn(global, "fetch");
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("");
    });

    expect(result.current.views).toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("sets isLoading to false after fetch completes", async () => {
    mockFetchOk([]);
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("sets error when server returns non-zero status", async () => {
    mockFetchError();
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(0);
    expect(result.current.error).not.toBeNull();
  });

  it("sends tabId as criteria in the fetch URL", async () => {
    const spy = mockFetchOk([]);
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-xyz");
    });

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("tab-xyz");
    expect(url).toContain("/meta/saved-views");
  });
});

// ---------------------------------------------------------------------------
// saveView
// ---------------------------------------------------------------------------
describe("useSavedViews — saveView", () => {
  it("calls add endpoint and refreshes views", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      // First call: POST add
      .mockReturnValueOnce(makeResponse({ response: { status: 0, data: makeRawRecord({ name: "My View" }) } }))
      // Second call: fetchViews after save
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ name: "My View" })]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "My View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        implicitFilterApplied: false,
      });
    });

    const postCall = spy.mock.calls.find((c) => {
      const opts = c[1] as RequestInit;
      return opts?.method === "POST";
    });
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.name).toBe("My View");
    expect(body.tab).toBe("tab-abc");
  });

  it("sets isSaving to false after save completes", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeResponse({ response: { status: 0, data: makeRawRecord() } }))
      .mockReturnValueOnce(makeFetchViewsResponse([]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        implicitFilterApplied: true,
      });
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("stores grid configuration as workspace-ui JSON", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeResponse({ response: { status: 0, data: makeRawRecord() } }))
      .mockReturnValueOnce(makeFetchViewsResponse([]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "Grid Config Test",
        filters: [{ id: "amount", value: "100" }],
        visibility: { amount: true },
        sorting: [{ id: "amount", desc: true }],
        order: ["amount"],
        implicitFilterApplied: false,
      });
    });

    const postCall = spy.mock.calls.find((c) => (c[1] as RequestInit)?.method === "POST");
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    const gridConfig = JSON.parse(body.gridconfiguration);

    expect(gridConfig.version).toBe(1);
    expect(gridConfig.source).toBe("workspace-ui");
    expect(gridConfig.filters).toEqual([{ id: "amount", value: "100" }]);
  });

  it("throws and sets error when server returns error on save", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeResponse({ error: "Server error" }, false, 500));

    const { result } = renderHook(() => useSavedViews());
    let thrown = false;

    await act(async () => {
      try {
        await result.current.saveView({
          tabId: "tab-abc",
          name: "View",
          filters: [],
          visibility: {},
          sorting: [],
          order: [],
          implicitFilterApplied: true,
        });
      } catch {
        thrown = true;
      }
    });

    expect(thrown).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyView
// ---------------------------------------------------------------------------
describe("useSavedViews — applyView", () => {
  it("returns the MRT state from a view that has a valid config", () => {
    const { result } = renderHook(() => useSavedViews());

    const view = {
      id: "v1",
      name: "My View",
      tabId: "tab-abc",
      isDefault: false,
      filterClause: "",
      config: {
        version: 1 as const,
        source: "workspace-ui" as const,
        filters: [{ id: "status", value: "active" }],
        visibility: { status: true },
        sorting: [{ id: "status", desc: false }],
        order: ["status"],
        implicitFilterApplied: true,
      },
    };

    const state = result.current.applyView(view);

    expect(state).not.toBeNull();
    expect(state?.filters).toEqual([{ id: "status", value: "active" }]);
    expect(state?.visibility).toEqual({ status: true });
    expect(state?.sorting).toEqual([{ id: "status", desc: false }]);
    expect(state?.order).toEqual(["status"]);
  });

  it("returns null when the view has no config", () => {
    const { result } = renderHook(() => useSavedViews());

    const state = result.current.applyView({
      id: "v-classic",
      name: "Classic View",
      tabId: "tab-abc",
      isDefault: false,
      filterClause: "",
      config: null,
    });

    expect(state).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setDefaultView
// ---------------------------------------------------------------------------
describe("useSavedViews — setDefaultView", () => {
  it("calls PUT on the target view with isdefault:true and refreshes", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: false })]))
      .mockReturnValueOnce(makeResponse(null, true, 204))
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: true })]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.setDefaultView("view-001");
    });

    const putCall = spy.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT");
    expect(putCall).toBeDefined();
    const putUrl = putCall![0] as string;
    expect(putUrl).toContain("view-001");

    const body = JSON.parse((putCall![1] as RequestInit).body as string);
    expect(body.isdefault).toBe(true);
    expect(result.current.isUpdatingDefault).toBe(false);
  });

  it("clears the previous default before setting the new one", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(
        makeFetchViewsResponse([
          makeRawRecord({ id: "view-001", isdefault: true }),
          makeRawRecord({ id: "view-002", isdefault: false }),
        ])
      )
      .mockReturnValueOnce(makeResponse(null, true, 204))
      .mockReturnValueOnce(makeResponse(null, true, 204))
      .mockReturnValueOnce(
        makeFetchViewsResponse([
          makeRawRecord({ id: "view-001", isdefault: false }),
          makeRawRecord({ id: "view-002", isdefault: true }),
        ])
      );

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.setDefaultView("view-002");
    });

    const putCalls = spy.mock.calls.filter((c) => (c[1] as RequestInit)?.method === "PUT");
    expect(putCalls).toHaveLength(2);

    const clearBody = JSON.parse((putCalls[0][1] as RequestInit).body as string);
    expect(clearBody.isdefault).toBe(false);
    expect(putCalls[0][0] as string).toContain("view-001");

    const setBody = JSON.parse((putCalls[1][1] as RequestInit).body as string);
    expect(setBody.isdefault).toBe(true);
    expect(putCalls[1][0] as string).toContain("view-002");
  });

  it("throws when viewId is not found in current views", async () => {
    const { result } = renderHook(() => useSavedViews());
    let thrown = false;

    await act(async () => {
      try {
        await result.current.setDefaultView("non-existent");
      } catch {
        thrown = true;
      }
    });

    expect(thrown).toBe(true);
    expect(result.current.isUpdatingDefault).toBe(false);
  });

  it("throws and sets error when server returns error", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: false })]))
      .mockReturnValueOnce(makeResponse({ error: "Server error" }, false, 500));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    let thrown = false;
    await act(async () => {
      try {
        await result.current.setDefaultView("view-001");
      } catch {
        thrown = true;
      }
    });

    expect(thrown).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.isUpdatingDefault).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unsetDefaultView
// ---------------------------------------------------------------------------
describe("useSavedViews — unsetDefaultView", () => {
  it("calls PUT on the current default with isdefault:false and refreshes", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: true })]))
      .mockReturnValueOnce(makeResponse(null, true, 204))
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: false })]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.unsetDefaultView("tab-abc");
    });

    const putCall = spy.mock.calls.find((c) => (c[1] as RequestInit)?.method === "PUT");
    expect(putCall).toBeDefined();
    const body = JSON.parse((putCall![1] as RequestInit).body as string);
    expect(body.isdefault).toBe(false);
    expect(result.current.isUpdatingDefault).toBe(false);
  });

  it("does nothing when there is no default view for the tab", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: false })]));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    const callsBefore = spy.mock.calls.length;

    await act(async () => {
      await result.current.unsetDefaultView("tab-abc");
    });

    expect(spy.mock.calls.length).toBe(callsBefore);
    expect(result.current.isUpdatingDefault).toBe(false);
  });

  it("throws and sets error when server returns error", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord({ id: "view-001", isdefault: true })]))
      .mockReturnValueOnce(makeResponse({ error: "Server error" }, false, 500));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    let thrown = false;
    await act(async () => {
      try {
        await result.current.unsetDefaultView("tab-abc");
      } catch {
        thrown = true;
      }
    });

    expect(thrown).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.isUpdatingDefault).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deleteView
// ---------------------------------------------------------------------------
describe("useSavedViews — deleteView", () => {
  it("calls remove endpoint and removes view from local state", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(
        makeFetchViewsResponse([makeRawRecord({ id: "view-001" }), makeRawRecord({ id: "view-002" })])
      )
      .mockReturnValueOnce(makeResponse(null, true, 204));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(2);

    await act(async () => {
      await result.current.deleteView("view-001");
    });

    const deleteCall = spy.mock.calls.find((c) => {
      const opts = c[1] as RequestInit;
      return opts?.method === "DELETE";
    });
    expect(deleteCall).toBeDefined();
    const deleteUrl = deleteCall![0] as string;
    expect(deleteUrl).toContain("view-001");
    expect(result.current.views.find((v) => v.id === "view-001")).toBeUndefined();
  });

  it("sets isDeleting to false after deletion completes", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(makeFetchViewsResponse([makeRawRecord()]))
      .mockReturnValueOnce(makeResponse(null, true, 204));

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.deleteView("view-001");
    });

    expect(result.current.isDeleting).toBe(false);
  });

  it("throws and sets error when viewId not found in current views", async () => {
    const { result } = renderHook(() => useSavedViews());
    let thrown = false;

    await act(async () => {
      try {
        await result.current.deleteView("non-existent-id");
      } catch {
        thrown = true;
      }
    });

    expect(thrown).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });
});
