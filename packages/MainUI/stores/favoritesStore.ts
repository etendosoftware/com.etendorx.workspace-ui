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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toggleFavorite as toggleFavoriteApi, fetchFavorites } from "@workspaceui/api-client/src/api/dashboard";
import type { FavoriteItem } from "@workspaceui/api-client/src/api/dashboard";
import { logger } from "@/utils/logger";

// Module-level — mutations don't trigger React re-renders (no Zustand state needed).
const toggleListeners = new Set<() => void>();
let seeded = false;

interface FavoritesStore {
  favoriteWindowIds: Set<string>;
  menuIdByWindowId: Map<string, string>;
  /** Stable function — reads current state via get(). */
  isFavorite: (windowId: string) => boolean;
  toggle: (menuId: string, windowId?: string) => Promise<void>;
  seed: (items: FavoriteItem[]) => void;
  setMenuMap: (map: Map<string, string>) => void;
  subscribeToToggle: (fn: () => void) => () => void;
  /** Called by FavoritesProvider when the role changes. */
  resetForRole: () => void;
  fetchForRole: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
  devtools(
    (set, get) => ({
      favoriteWindowIds: new Set<string>(),
      menuIdByWindowId: new Map<string, string>(),

      isFavorite: (windowId: string) => get().favoriteWindowIds.has(windowId),

      subscribeToToggle: (fn: () => void) => {
        toggleListeners.add(fn);
        return () => {
          toggleListeners.delete(fn);
        };
      },

      seed: (items: FavoriteItem[]) => {
        if (seeded) return;
        seeded = true;
        set({ favoriteWindowIds: new Set(items.map((i) => i.windowId)) });
      },

      setMenuMap: (map: Map<string, string>) => {
        set({ menuIdByWindowId: map });
      },

      resetForRole: () => {
        seeded = false;
        set({ favoriteWindowIds: new Set() });
      },

      fetchForRole: async () => {
        try {
          const data = await fetchFavorites();
          seeded = true;
          set({ favoriteWindowIds: new Set(data.items.map((i) => i.windowId)) });
        } catch (err) {
          logger.warn("[FavoritesStore] GET /favorites not available, will seed from widget:", err);
        }
      },

      toggle: async (menuId: string, windowId?: string) => {
        // Optimistic update
        if (windowId) {
          const next = new Set(get().favoriteWindowIds);
          if (next.has(windowId)) next.delete(windowId);
          else next.add(windowId);
          set({ favoriteWindowIds: next });
        }

        try {
          const result = await toggleFavoriteApi(menuId);
          // Confirm with authoritative server response
          if (windowId) {
            const next = new Set(get().favoriteWindowIds);
            if (result.action === "removed") next.delete(windowId);
            else next.add(windowId);
            set({ favoriteWindowIds: next });
          }
          for (const fn of toggleListeners) fn();
        } catch (err) {
          logger.warn("[FavoritesStore] Failed to toggle favorite:", err);
          // Revert optimistic update
          if (windowId) {
            const next = new Set(get().favoriteWindowIds);
            if (next.has(windowId)) next.delete(windowId);
            else next.add(windowId);
            set({ favoriteWindowIds: next });
          }
        }
      },
    }),
    { name: "FavoritesStore" }
  )
);
