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

"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

export type ThemeMode = "light" | "dark";

/** localStorage key; the inline script in the root layout reads the same one before first paint. */
export const THEME_MODE_KEY = "etendo-theme-mode";

const listeners = new Set<() => void>();

const readMode = (): ThemeMode => {
  try {
    return localStorage.getItem(THEME_MODE_KEY) === "dark" ? "dark" : "light";
  } catch {
    // Storage blocked: fall back to whatever the document currently shows.
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const applyThemeMode = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode;
};

/** Duration of the class-based fallback transition; keep in sync with `.theme-transitioning` in global.css. */
const FALLBACK_TRANSITION_MS = 350;

const switchTheme = (mode: ThemeMode) => {
  applyThemeMode(mode);
  for (const listener of listeners) listener();
};

export const setThemeMode = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    // Storage blocked: the choice only lasts for this page load.
  }

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    switchTheme(mode);
    return;
  }

  // One cross-fade of the whole page: it also covers properties CSS cannot transition on their own
  // (gradients, pseudo-element layers, borders that never declared a transition).
  const root = document.documentElement;
  if (typeof document.startViewTransition === "function") {
    // Elements with their own `transition` would still be halfway between themes when the "new" snapshot is
    // taken and freeze in the old look for a frame, so those transitions are off until the cross-fade ends.
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => {
      flushSync(() => switchTheme(mode));
    });
    transition.finished.finally(() => root.classList.remove("theme-switching"));
    return;
  }

  root.classList.add("theme-transitioning");
  switchTheme(mode);
  window.setTimeout(() => root.classList.remove("theme-transitioning"), FALLBACK_TRANSITION_MS);
};

/** Current mode, re-rendering on change. Server and hydration render as light. */
export const useThemeMode = (): ThemeMode => useSyncExternalStore(subscribe, readMode, () => "light");
