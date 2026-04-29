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

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type React from "react";
import { toggleFavorite as toggleFavoriteApi, fetchFavorites } from "@workspaceui/api-client/src/api/dashboard";
import type { FavoriteItem } from "@workspaceui/api-client/src/api/dashboard";
import { logger } from "@/utils/logger";
import { useUserContext } from "@/hooks/useUserContext";

interface FavoritesContextType {
  isFavorite: (windowId: string) => boolean;
  toggle: (menuId: string, windowId?: string) => Promise<void>;
  /**
   * Fallback seed: called by FavoritesRenderer if the GET /favorites endpoint
   * is not yet available. Seeds only once and only if no fetch succeeded.
   */
  seed: (items: FavoriteItem[]) => void;
  /** Register the windowId→menuId map built from the menu tree (for breadcrumb lookup). */
  setMenuMap: (map: Map<string, string>) => void;
  menuIdByWindowId: Map<string, string>;
  /**
   * Subscribe a callback that fires after each successful toggle.
   * Returns an unsubscribe function.
   */
  subscribeToToggle: (fn: () => void) => () => void;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { currentRole } = useUserContext();
  const roleId = currentRole?.id;

  const [favoriteWindowIds, setFavoriteWindowIds] = useState<Set<string>>(new Set());
  const [menuIdByWindowId, setMenuIdByWindowIdState] = useState<Map<string, string>>(new Map());

  // Track whether state was seeded from an authoritative source (fetch or seed)
  // to avoid the fallback seed overwriting a successful fetch.
  const seededRef = useRef(false);

  // Listeners notified after each successful toggle (used by Home to refresh the widget).
  const toggleListenersRef = useRef<Set<() => void>>(new Set());

  // Re-fetch from GET /meta/favorites whenever the role changes so the sidebar
  // star state stays in sync with the role-scoped backend response.
  useEffect(() => {
    seededRef.current = false;
    setFavoriteWindowIds(new Set());
    fetchFavorites()
      .then((data) => {
        seededRef.current = true;
        setFavoriteWindowIds(new Set(data.items.map((i) => i.windowId)));
      })
      .catch((err) => {
        // Endpoint may not exist yet — fall back to seeding from widget data.
        logger.warn("[FavoritesContext] GET /favorites not available, will seed from widget:", err);
      });
  }, [roleId]);

  const isFavorite = useCallback((windowId: string) => favoriteWindowIds.has(windowId), [favoriteWindowIds]);

  const subscribeToToggle = useCallback((fn: () => void) => {
    toggleListenersRef.current.add(fn);
    return () => {
      toggleListenersRef.current.delete(fn);
    };
  }, []);

  const toggle = useCallback(async (menuId: string, windowId?: string) => {
    // Optimistic update
    if (windowId) {
      setFavoriteWindowIds((prev) => {
        const next = new Set(prev);
        if (next.has(windowId)) next.delete(windowId);
        else next.add(windowId);
        return next;
      });
    }

    try {
      const result = await toggleFavoriteApi(menuId);
      // Confirm the server's authoritative action
      if (windowId) {
        setFavoriteWindowIds((prev) => {
          const next = new Set(prev);
          if (result.action === "removed") next.delete(windowId);
          else next.add(windowId);
          return next;
        });
      }
      // Notify subscribers (e.g. Home refreshes the FAVORITES widget)
      for (const fn of toggleListenersRef.current) fn();
    } catch (err) {
      logger.warn("[FavoritesContext] Failed to toggle favorite:", err);
      // Revert optimistic update
      if (windowId) {
        setFavoriteWindowIds((prev) => {
          const next = new Set(prev);
          if (next.has(windowId)) next.delete(windowId);
          else next.add(windowId);
          return next;
        });
      }
    }
  }, []);

  const seed = useCallback((items: FavoriteItem[]) => {
    if (seededRef.current) return;
    seededRef.current = true;
    setFavoriteWindowIds(new Set(items.map((i) => i.windowId)));
  }, []);

  const setMenuMap = useCallback((map: Map<string, string>) => {
    setMenuIdByWindowIdState(map);
  }, []);

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggle, seed, setMenuMap, menuIdByWindowId, subscribeToToggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavoritesContext must be used within FavoritesProvider");
  return ctx;
}
