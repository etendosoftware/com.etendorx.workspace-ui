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

import { Metadata } from "../metadata";
import { API_ERP_PROXY, API_KERNEL_SERVLET } from "../constants";

jest.mock("../cache", () => {
  return {
    CacheStore: jest.fn().mockImplementation(() => {
      const store = new Map();
      return {
        get: jest.fn((key) => store.get(key)),
        set: jest.fn((key, value) => store.set(key, value)),
        clear: jest.fn(() => store.clear()),
        delete: jest.fn((key) => store.delete(key)),
      };
    }),
  };
});

describe("Metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Metadata internal state
    (Metadata as any).currentRoleId = null;
    (Metadata as any).cache.clear();

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
      };
    })();

    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  describe("setBaseUrl", () => {
    it("should set base URLs for all clients", () => {
      const spyClient = jest.spyOn(Metadata.client, "setBaseUrl");
      const spyKernel = jest.spyOn(Metadata.kernelClient, "setBaseUrl");
      const spyDatasource = jest.spyOn(Metadata.datasourceServletClient, "setBaseUrl");

      Metadata.setBaseUrl();

      expect(spyClient).toHaveBeenCalledWith(expect.stringContaining(API_ERP_PROXY));
      expect(spyKernel).toHaveBeenCalledWith(expect.stringContaining(API_KERNEL_SERVLET));
      expect(spyDatasource).toHaveBeenCalled();
    });
  });

  describe("setLanguage", () => {
    it("should set language header for clients", () => {
      const spyClient = jest.spyOn(Metadata.client, "setLanguageHeader");
      Metadata.setLanguage("es_ES");
      expect(spyClient).toHaveBeenCalledWith("es_ES");
    });
  });

  describe("setToken", () => {
    it("should set auth header for all clients", () => {
      const spyClient = jest.spyOn(Metadata.client, "setAuthHeader");
      Metadata.setToken("test-token");
      expect(spyClient).toHaveBeenCalledWith("test-token", "Bearer");
    });
  });

  describe("registerInterceptor", () => {
    it("should register interceptors on all clients and return a cleanup function", () => {
      const interceptor = jest.fn();
      const spyClient = jest.spyOn(Metadata.client, "registerInterceptor").mockReturnValue(() => {});
      const spyKernel = jest.spyOn(Metadata.kernelClient, "registerInterceptor").mockReturnValue(() => {});
      const spyDatasource = jest
        .spyOn(Metadata.datasourceServletClient, "registerInterceptor")
        .mockReturnValue(() => {});
      const spyLocation = jest.spyOn(Metadata.locationClient, "registerInterceptor").mockReturnValue(() => {});

      const unregister = Metadata.registerInterceptor(interceptor);
      expect(spyClient).toHaveBeenCalledWith(interceptor);
      expect(spyKernel).toHaveBeenCalledWith(interceptor);
      expect(spyDatasource).toHaveBeenCalledWith(interceptor);
      expect(spyLocation).toHaveBeenCalledWith(interceptor);

      expect(typeof unregister).toBe("function");
    });
  });

  describe("getDatasource", () => {
    it("should call datasourceServletClient.post", async () => {
      const spyPost = jest.spyOn(Metadata.datasourceServletClient, "post").mockResolvedValue({ ok: true } as any);
      await Metadata.getDatasource("test-entity", { param: 1 });
      expect(spyPost).toHaveBeenCalledWith("", {
        entity: "test-entity",
        params: { param: 1 },
      });
    });
  });

  describe("getToolbar", () => {
    it("should fetch from API and cache if not in cache", async () => {
      const mockToolbar = [{ id: "btn1", windows: true }];
      const spyPost = jest.spyOn(Metadata.client, "post").mockResolvedValue({
        data: { response: { data: mockToolbar } },
      } as any);

      const result = await Metadata.getToolbar();
      expect(spyPost).toHaveBeenCalledWith("meta/toolbar");
      expect(result).toEqual(mockToolbar);
    });

    it("should return from cache if available and has windows attribute", async () => {
      const mockToolbar = [{ id: "btn1", windows: true }];
      // Setup cache
      (Metadata as any).cache.set("toolbar", mockToolbar);
      const spyPost = jest.spyOn(Metadata.client, "post");

      const result = await Metadata.getToolbar();
      expect(spyPost).not.toHaveBeenCalled();
      expect(result).toEqual(mockToolbar);
    });
  });

  describe("getWindow", () => {
    it("should fetch and cache window including tabs", async () => {
      const mockWindow = {
        id: "win1",
        tabs: [{ id: "tab1", fields: [] }],
      };
      const spyPost = jest.spyOn(Metadata.client, "post").mockResolvedValue({
        ok: true,
        data: mockWindow,
      } as any);

      const result = await Metadata.getWindow("win1");
      expect(spyPost).toHaveBeenCalledWith("meta/window/win1");
      expect(result).toEqual(mockWindow);
      expect((Metadata as any).cache.get("window-win1-default")).toEqual(mockWindow);
      // Expect default role suffix when no role is set
      expect((Metadata as any).cache.get("tab-tab1-default")).toEqual(mockWindow.tabs[0]);
    });

    it("should throw error if window not found", async () => {
      jest.spyOn(Metadata.client, "post").mockResolvedValue({ ok: false } as any);
      await expect(Metadata.getWindow("invalid")).rejects.toThrow("Window not found");
    });
  });

  describe("getMenu", () => {
    it("should fetch and cache menu based on currentRoleId", async () => {
      const mockMenu = [{ id: "menu1" }];
      const roleId = "role-123";

      localStorage.setItem("currentRoleId", roleId);

      const spyPost = jest.spyOn(Metadata.client, "post").mockResolvedValue({
        data: { menu: mockMenu },
      } as any);

      const result = await Metadata.getMenu();
      expect(result).toEqual(mockMenu);
      expect(spyPost).toHaveBeenCalledWith("meta/menu", { role: roleId });
    });

    it("should return cached menu if role hasn't changed", async () => {
      const mockMenu = [{ id: "menu1" }];
      const roleId = "role-123";

      localStorage.setItem("currentRoleId", roleId);

      (Metadata as any).cache.set("OBMenu", mockMenu);
      (Metadata as any).currentRoleId = roleId;

      const spyPost = jest.spyOn(Metadata.client, "post");

      const result = await Metadata.getMenu();
      expect(spyPost).not.toHaveBeenCalled();
      expect(result).toEqual(mockMenu);
    });
  });

  describe("Role Segregation", () => {
    it("should segregate tab cache by role ID", async () => {
      const mockTab = { id: "tab1" };
      const roleA = "roleA";
      const roleB = "roleB";

      jest.spyOn(Metadata.client, "post").mockResolvedValue({ data: mockTab } as any);

      // Role A
      localStorage.setItem("currentRoleId", roleA);
      await Metadata.getTab("tab1");
      expect((Metadata as any).cache.get(`tab-tab1-${roleA}`)).toEqual(mockTab);

      // Role B
      localStorage.setItem("currentRoleId", roleB);
      // Reset internal currentRoleId if it was cached (though getTab doesn't set it, getMenu does)
      (Metadata as any).currentRoleId = null;

      await Metadata.getTab("tab1");
      expect((Metadata as any).cache.get(`tab-tab1-${roleB}`)).toEqual(mockTab);
    });

    it("should segregate window cache by role ID", async () => {
      const mockWindow = { id: "win1", tabs: [] };
      const roleA = "roleA";
      const roleB = "roleB";

      jest.spyOn(Metadata.client, "post").mockResolvedValue({ ok: true, data: mockWindow } as any);

      // Role A
      localStorage.setItem("currentRoleId", roleA);
      await Metadata.getWindow("win1");
      expect((Metadata as any).cache.get(`window-win1-${roleA}`)).toEqual(mockWindow);

      // Role B
      localStorage.setItem("currentRoleId", roleB);
      (Metadata as any).currentRoleId = null;

      await Metadata.getWindow("win1");
      expect((Metadata as any).cache.get(`window-win1-${roleB}`)).toEqual(mockWindow);
    });
  });

  describe("Cache management", () => {
    it("should clear menu cache", () => {
      (Metadata as any).cache.set("OBMenu", []);
      (Metadata as any).currentRoleId = "some-role";

      Metadata.clearMenuCache();

      expect((Metadata as any).cache.get("OBMenu")).toBeUndefined();
      expect((Metadata as any).currentRoleId).toBeNull();
    });

    it("should clear window cache", () => {
      (Metadata as any).cache.set("window-123-default", {});
      Metadata.clearWindowCache("123");
      expect((Metadata as any).cache.get("window-123-default")).toBeUndefined();
    });
  });

  describe("getTabsColumns", () => {
    it("should return columns for multiple tabs", () => {
      const mockTab = { id: "tab1" };
      const mockFields = [{ name: "field1" }];
      (Metadata as any).cache.set("tab-tab1-default", { fields: mockFields });

      const result = Metadata.getTabsColumns([mockTab as any]);
      expect(result).toEqual({ tab1: mockFields });
    });
  });

  describe("evaluateExpression", () => {
    it("should evaluate string expressions correctly", () => {
      const expr = "OB.Utilities.getValue(currentValues,'status') === 'CO'";
      const values = { status: "CO" };
      expect(Metadata.evaluateExpression(expr, values)).toBe(true);
    });

    it("should return false when expression doesn't match", () => {
      const expr = "OB.Utilities.getValue(currentValues,'status') === 'CO'";
      const values = { status: "DR" };
      expect(Metadata.evaluateExpression(expr, values)).toBe(false);
    });

    it("should evaluate boolean expressions correctly", () => {
      const expr = "OB.Utilities.getValue(currentValues,'active') === true";
      const values = { active: true };
      expect(Metadata.evaluateExpression(expr, values)).toBe(true);
    });
  });

  describe("getColumns", () => {
    it("should return empty array if tab not in cache", () => {
      const columns = Metadata.getColumns("non-existent-tab");
      expect(columns).toEqual([]);
    });
  });
});
