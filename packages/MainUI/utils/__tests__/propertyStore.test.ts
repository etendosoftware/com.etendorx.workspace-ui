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
 * All portions are Copyright © 2024–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { savePreferences, clearPreferences, getStoredPreferences } from "../propertyStore";

describe("propertyStore", () => {
  const originalLocalStorage = global.window?.localStorage;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      };
    })();

    if (!global.window) {
      (global as any).window = {};
    }
    Object.defineProperty(global.window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterAll(() => {
    if (originalLocalStorage) {
      Object.defineProperty(global.window, "localStorage", {
        value: originalLocalStorage,
      });
    }
  });

  describe("savePreferences", () => {
    it("should save preferences to localStorage", () => {
      const prefs = { theme: "dark", language: "en" };
      savePreferences(prefs);

      expect(window.localStorage.setItem).toHaveBeenCalledWith("etendo_preferences", JSON.stringify(prefs));
    });

    it("should handle error when saving to localStorage", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage full");
      });

      savePreferences({ a: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("clearPreferences", () => {
    it("should remove etendo_preferences from localStorage", () => {
      clearPreferences();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("etendo_preferences");
    });

    it("should handle error when clearing localStorage", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error("Error");
      });

      clearPreferences();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getStoredPreferences", () => {
    it("should return parsed preferences when they exist", () => {
      const prefs = { theme: "light" };
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(prefs));

      expect(getStoredPreferences()).toEqual(prefs);
    });

    it("should return empty object when no preferences exist", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      expect(getStoredPreferences()).toEqual({});
    });

    it("should return empty object and log error on invalid JSON", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      (window.localStorage.getItem as jest.Mock).mockReturnValue("invalid-json");

      expect(getStoredPreferences()).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should return empty object when window/localStorage is missing", () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing missing window
      global.window = undefined;

      expect(getStoredPreferences()).toEqual({});
      global.window = originalWindow;
    });
  });
});
