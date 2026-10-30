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

import { act, renderHook } from "@testing-library/react";
import { applyThemeMode, setThemeMode, THEME_MODE_KEY, useThemeMode } from "../mode";

const FALLBACK_TRANSITION_MS = 350;

const mockMatchMedia = (reducedMotion: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: reducedMotion });
};

/** The test setup replaces localStorage with jest.fn mocks: back them with a plain map. */
const store = new Map<string, string>();
const getItem = localStorage.getItem as jest.Mock;
const setItem = localStorage.setItem as jest.Mock;
const useWorkingStorage = () => {
  store.clear();
  getItem.mockReset().mockImplementation((key: string) => store.get(key) ?? null);
  setItem.mockReset().mockImplementation((key: string, value: string) => {
    store.set(key, value);
  });
};
const blockStorage = () => {
  const blocked = () => {
    throw new Error("blocked");
  };
  getItem.mockReset().mockImplementation(blocked);
  setItem.mockReset().mockImplementation(blocked);
};

const setViewTransition = (implementation: unknown) => {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    writable: true,
    value: implementation,
  });
};

describe("theme mode", () => {
  beforeEach(() => {
    useWorkingStorage();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.className = "";
    mockMatchMedia(true);
    setViewTransition(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("applyThemeMode", () => {
    it("shows the mode in the data-theme attribute of the document", () => {
      applyThemeMode("dark");

      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });

  describe("useThemeMode", () => {
    it("is light when nothing was stored", () => {
      const { result } = renderHook(() => useThemeMode());

      expect(result.current).toBe("light");
    });

    it("reads the stored mode", () => {
      store.set(THEME_MODE_KEY, "dark");

      const { result } = renderHook(() => useThemeMode());

      expect(result.current).toBe("dark");
    });

    it("falls back to light for a stored value that is not a mode", () => {
      store.set(THEME_MODE_KEY, "sepia");

      const { result } = renderHook(() => useThemeMode());

      expect(result.current).toBe("light");
    });

    it("falls back to the mode the document shows when the storage is blocked", () => {
      blockStorage();
      document.documentElement.dataset.theme = "dark";

      const { result } = renderHook(() => useThemeMode());

      expect(result.current).toBe("dark");
    });

    it("is light when the storage is blocked and the document shows no mode", () => {
      blockStorage();

      const { result } = renderHook(() => useThemeMode());

      expect(result.current).toBe("light");
    });

    it("stops listening when the component unmounts", () => {
      const { result, unmount } = renderHook(() => useThemeMode());
      unmount();

      act(() => setThemeMode("dark"));

      expect(result.current).toBe("light");
    });
  });

  describe("setThemeMode", () => {
    it("stores the mode, applies it and re-renders the components that use it", () => {
      const { result } = renderHook(() => useThemeMode());

      act(() => setThemeMode("dark"));

      expect(store.get(THEME_MODE_KEY)).toBe("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(result.current).toBe("dark");
    });

    it("still switches when the storage is blocked, for this page load only", () => {
      blockStorage();

      expect(() => setThemeMode("dark")).not.toThrow();
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("switches at once without any transition when the user prefers reduced motion", () => {
      const startViewTransition = jest.fn();
      setViewTransition(startViewTransition);

      setThemeMode("dark");

      expect(startViewTransition).not.toHaveBeenCalled();
      expect(document.documentElement.classList.contains("theme-transitioning")).toBe(false);
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("switches without a transition when the browser has no matchMedia", () => {
      (window as { matchMedia?: unknown }).matchMedia = undefined;
      jest.useFakeTimers();

      setThemeMode("dark");

      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("cross-fades the page with a view transition and releases the switching class when it ends", async () => {
      mockMatchMedia(false);
      let resolveFinished: () => void = () => undefined;
      const finished = new Promise<void>((resolve) => {
        resolveFinished = resolve;
      });
      const startViewTransition = jest.fn((update: () => void) => {
        update();
        return { finished };
      });
      setViewTransition(startViewTransition);

      setThemeMode("dark");

      expect(startViewTransition).toHaveBeenCalledTimes(1);
      expect(document.documentElement.classList.contains("theme-switching")).toBe(true);
      expect(document.documentElement.dataset.theme).toBe("dark");

      await act(async () => {
        resolveFinished();
        await finished;
      });

      expect(document.documentElement.classList.contains("theme-switching")).toBe(false);
    });

    it("falls back to a class-based transition when there are no view transitions", () => {
      mockMatchMedia(false);
      jest.useFakeTimers();

      setThemeMode("dark");

      expect(document.documentElement.classList.contains("theme-transitioning")).toBe(true);
      expect(document.documentElement.dataset.theme).toBe("dark");

      act(() => {
        jest.advanceTimersByTime(FALLBACK_TRANSITION_MS);
      });

      expect(document.documentElement.classList.contains("theme-transitioning")).toBe(false);
    });
  });
});
