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

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

/** In-memory localStorage for tests. */
let storage: Record<string, string> = {};

beforeEach(() => {
  storage = {};

  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: jest.fn((key: string) => storage[key] ?? null),
      setItem: jest.fn((key: string, val: string) => {
        storage[key] = val;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        storage = {};
      }),
    },
    writable: true,
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_GRID_CONFIG = JSON.stringify({
  version: 1,
  source: "workspace-ui",
  filters: [{ id: "status", value: "active" }],
  visibility: { name: true, status: false },
  sorting: [{ id: "name", desc: false }],
  order: ["name", "status"],
});

function seedStorage(tabId: string, views: object[]) {
  storage[`savedViews_${tabId}`] = JSON.stringify(views);
}

// ---------------------------------------------------------------------------
// fetchViews
// ---------------------------------------------------------------------------
describe("useSavedViews — fetchViews", () => {
  it("returns an empty list when no views are stored", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns stored views for the given tabId", async () => {
    seedStorage("tab-abc", [
      {
        id: "view-001",
        name: "Sales Orders",
        tabId: "tab-abc",
        isDefault: false,
        filterClause: "",
        gridConfiguration: VALID_GRID_CONFIG,
      },
      {
        id: "view-002",
        name: "Default View",
        tabId: "tab-abc",
        isDefault: true,
        filterClause: "",
        gridConfiguration: VALID_GRID_CONFIG,
      },
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
    seedStorage("tab-abc", [
      {
        id: "view-001",
        name: "Config Test",
        tabId: "tab-abc",
        isDefault: false,
        filterClause: "",
        gridConfiguration: VALID_GRID_CONFIG,
      },
    ]);

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
  });

  it("does not load when tabId is empty", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("");
    });

    expect(result.current.views).toHaveLength(0);
    expect(localStorage.getItem).not.toHaveBeenCalled();
  });

  it("sets isLoading to false after fetch completes", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("returns empty list when localStorage contains invalid JSON", async () => {
    storage["savedViews_tab-abc"] = "not-valid-json";

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it("does not mix views from different tabs", async () => {
    seedStorage("tab-abc", [
      { id: "v1", name: "View A", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);
    seedStorage("tab-xyz", [
      { id: "v2", name: "View X", tabId: "tab-xyz", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].id).toBe("v1");
  });
});

// ---------------------------------------------------------------------------
// saveView
// ---------------------------------------------------------------------------
describe("useSavedViews — saveView", () => {
  it("persists a new view to localStorage", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "My View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      });
    });

    const stored = JSON.parse(storage["savedViews_tab-abc"]);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("My View");
    expect(stored[0].tabId).toBe("tab-abc");
  });

  it("adds view to existing list without removing others", async () => {
    seedStorage("tab-abc", [
      { id: "existing", name: "Old View", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
      await result.current.saveView({
        tabId: "tab-abc",
        name: "New View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      });
    });

    const stored = JSON.parse(storage["savedViews_tab-abc"]);
    expect(stored).toHaveLength(2);
  });

  it("stores grid configuration as a JSON string", async () => {
    const filters = [{ id: "amount", value: "100" }];
    const visibility = { amount: true };
    const sorting = [{ id: "amount", desc: true }];
    const order = ["amount"];

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "Grid Config Test",
        filters,
        visibility,
        sorting,
        order,
      });
    });

    const stored = JSON.parse(storage["savedViews_tab-abc"]);
    const gridConfig = JSON.parse(stored[0].gridConfiguration);

    expect(gridConfig.version).toBe(1);
    expect(gridConfig.source).toBe("workspace-ui");
    expect(gridConfig.filters).toEqual(filters);
    expect(gridConfig.visibility).toEqual(visibility);
    expect(gridConfig.sorting).toEqual(sorting);
    expect(gridConfig.order).toEqual(order);
  });

  it("clears isDefault on other views when saving a default view", async () => {
    seedStorage("tab-abc", [
      { id: "v1", name: "Old Default", tabId: "tab-abc", isDefault: true, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
      await result.current.saveView({
        tabId: "tab-abc",
        name: "New Default",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        isDefault: true,
      });
    });

    const stored = JSON.parse(storage["savedViews_tab-abc"]) as Array<{ isDefault: boolean; name: string }>;
    const oldView = stored.find((v) => v.name === "Old Default");
    const newView = stored.find((v) => v.name === "New Default");

    expect(oldView?.isDefault).toBe(false);
    expect(newView?.isDefault).toBe(true);
  });

  it("sets isSaving to false after save completes", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      });
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("updates local views state after saving", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({
        tabId: "tab-abc",
        name: "Saved View",
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      });
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].name).toBe("Saved View");
  });

  it("generates a unique id for each saved view", async () => {
    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.saveView({ tabId: "tab-abc", name: "A", filters: [], visibility: {}, sorting: [], order: [] });
      await result.current.saveView({ tabId: "tab-abc", name: "B", filters: [], visibility: {}, sorting: [], order: [] });
    });

    const ids = result.current.views.map((v) => v.id);
    expect(new Set(ids).size).toBe(2);
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
      },
    };

    const state = result.current.applyView(view);

    expect(state).not.toBeNull();
    expect(state?.filters).toEqual([{ id: "status", value: "active" }]);
    expect(state?.visibility).toEqual({ status: true });
    expect(state?.sorting).toEqual([{ id: "status", desc: false }]);
    expect(state?.order).toEqual(["status"]);
  });

  it("returns null when the view has no config (Classic view or unparseable)", () => {
    const { result } = renderHook(() => useSavedViews());

    const classicView = {
      id: "v-classic",
      name: "Classic View",
      tabId: "tab-abc",
      isDefault: false,
      filterClause: "",
      config: null,
    };

    const state = result.current.applyView(classicView);

    expect(state).toBeNull();
  });

  it("returns empty arrays/objects when the config has empty state", () => {
    const { result } = renderHook(() => useSavedViews());

    const view = {
      id: "v-empty",
      name: "Empty State View",
      tabId: "tab-abc",
      isDefault: false,
      filterClause: "",
      config: {
        version: 1 as const,
        source: "workspace-ui" as const,
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      },
    };

    const state = result.current.applyView(view);

    expect(state?.filters).toEqual([]);
    expect(state?.visibility).toEqual({});
    expect(state?.sorting).toEqual([]);
    expect(state?.order).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deleteView
// ---------------------------------------------------------------------------
describe("useSavedViews — deleteView", () => {
  it("removes the view from localStorage", async () => {
    seedStorage("tab-abc", [
      { id: "view-001", name: "View A", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
      { id: "view-002", name: "View B", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.deleteView("view-001");
    });

    const stored = JSON.parse(storage["savedViews_tab-abc"]) as Array<{ id: string }>;
    expect(stored.find((v) => v.id === "view-001")).toBeUndefined();
    expect(stored).toHaveLength(1);
  });

  it("removes the deleted view from local state", async () => {
    seedStorage("tab-abc", [
      { id: "view-001", name: "View A", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
      { id: "view-002", name: "View B", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    expect(result.current.views).toHaveLength(2);

    await act(async () => {
      await result.current.deleteView("view-001");
    });

    expect(result.current.views.find((v) => v.id === "view-001")).toBeUndefined();
    expect(result.current.views).toHaveLength(1);
  });

  it("sets isDeleting to false after deletion completes", async () => {
    seedStorage("tab-abc", [
      { id: "view-001", name: "View A", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

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

  it("leaves other views intact after deleting one", async () => {
    seedStorage("tab-abc", [
      { id: "v1", name: "Keep Me", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
      { id: "v2", name: "Delete Me", tabId: "tab-abc", isDefault: false, filterClause: "", gridConfiguration: "" },
    ]);

    const { result } = renderHook(() => useSavedViews());

    await act(async () => {
      await result.current.fetchViews("tab-abc");
    });

    await act(async () => {
      await result.current.deleteView("v2");
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].id).toBe("v1");
  });
});
