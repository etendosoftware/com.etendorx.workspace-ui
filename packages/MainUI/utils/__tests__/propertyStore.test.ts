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

import { installLocalStorageMock } from "../testUtils/localStorageMock";
import {
  savePreferences,
  clearPreferences,
  getStoredPreferences,
  setStoredPreference,
  resolvePreference,
  getStoredPreference,
} from "../propertyStore";

describe("propertyStore", () => {
  const originalLocalStorage = global.window?.localStorage;

  beforeEach(() => {
    installLocalStorageMock();
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

  describe("setStoredPreference", () => {
    it("should merge a single key without dropping existing preferences", () => {
      savePreferences({ existing: "keep" });
      setStoredPreference("UomManagement", "Y");

      expect(getStoredPreferences()).toEqual({ existing: "keep", UomManagement: "Y" });
    });

    it("should overwrite an existing key", () => {
      savePreferences({ theme: "dark" });
      setStoredPreference("theme", "light");

      expect(getStoredPreferences().theme).toBe("light");
    });
  });

  describe("resolvePreference", () => {
    const KEY = "OBUIAPP_RefreshAfterDeletion";
    const WINDOW_ID = "129";
    const SCOPED_KEY = `${KEY}_${WINDOW_ID}`;

    it("should prefer the window-scoped key over the global one", () => {
      savePreferences({ [KEY]: "N", [SCOPED_KEY]: "Y" });

      expect(resolvePreference(KEY, WINDOW_ID)).toBe("Y");
    });

    it("should fall back to the global key when no window-scoped entry exists", () => {
      savePreferences({ [KEY]: "Y" });

      expect(resolvePreference(KEY, WINDOW_ID)).toBe("Y");
    });

    it("should fall back to the global key when the window-scoped entry is empty", () => {
      savePreferences({ [KEY]: "Y", [SCOPED_KEY]: "" });

      expect(resolvePreference(KEY, WINDOW_ID)).toBe("Y");
    });

    it("should ignore window-scoped entries when no window id is given", () => {
      savePreferences({ [SCOPED_KEY]: "Y" });

      expect(resolvePreference(KEY)).toBeUndefined();
    });

    it("should match keys case-insensitively", () => {
      savePreferences({ UomManagement: "Y" });

      expect(resolvePreference("uommanagement")).toBe("Y");
    });

    it("should match window-scoped keys case-insensitively", () => {
      savePreferences({ [SCOPED_KEY]: "Y" });

      expect(resolvePreference(KEY.toLowerCase(), WINDOW_ID)).toBe("Y");
    });

    it("should return undefined when the preference is absent", () => {
      savePreferences({});

      expect(resolvePreference(KEY, WINDOW_ID)).toBeUndefined();
    });

    it("should return the raw stored value without coercing it", () => {
      // The expression engine normalizes booleans to 'Y'/'N' itself, so the resolver must not
      // stringify them first.
      savePreferences({ someFlag: true });

      expect(resolvePreference("someFlag")).toBe(true);
    });
  });

  describe("getStoredPreference", () => {
    it("should coerce the resolved value to a string", () => {
      savePreferences({ someFlag: true });

      expect(getStoredPreference("someFlag")).toBe("true");
    });

    it("should return undefined when the preference is absent", () => {
      savePreferences({});

      expect(getStoredPreference("missing")).toBeUndefined();
    });

    it("should resolve the window-scoped key", () => {
      savePreferences({ Pref: "global", Pref_129: "scoped" });

      expect(getStoredPreference("Pref", "129")).toBe("scoped");
    });
  });
});
