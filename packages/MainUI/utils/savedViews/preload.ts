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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Longest time a request started when the user hovers a window (menu, recent items, favorites) is used for the
 * opening of that window: the next opening takes it instead of asking again, so the grids do not wait for it.
 * Older ones are asked again, as every opening reads the settings of the window, as classic does.
 */
export const PRELOAD_MAX_AGE_MS = 10_000;

interface Preload<T> {
  startedAt: number;
  request: Promise<T>;
}

/** Requests started for a window before it is opened, taken once by its next opening. */
export interface PreloadCache<T> {
  /** Starts the request of the window unless a recent one is already there. */
  preload: (windowId: string, request: () => Promise<T>) => void;
  /** The recent request of the window, if any; it is used once. */
  take: (windowId: string) => Promise<T> | undefined;
  /** Forgets every request: what they read may have changed (the user stored views or columns). */
  clear: () => void;
}

export function createPreloadCache<T>(now: () => number = Date.now): PreloadCache<T> {
  const preloads = new Map<string, Preload<T>>();
  const isRecent = (preload: Preload<T> | undefined): preload is Preload<T> =>
    preload !== undefined && now() - preload.startedAt <= PRELOAD_MAX_AGE_MS;

  return {
    preload: (windowId, request) => {
      if (isRecent(preloads.get(windowId))) return;
      preloads.set(windowId, { startedAt: now(), request: request() });
    },
    take: (windowId) => {
      const preload = preloads.get(windowId);
      preloads.delete(windowId);
      return isRecent(preload) ? preload.request : undefined;
    },
    clear: () => preloads.clear(),
  };
}
