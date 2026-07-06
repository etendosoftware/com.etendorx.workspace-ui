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

import type React from "react";
import { useCallback, useEffect } from "react";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useUserStore } from "@/stores/userStore";

/**
 * Triggers a role-scoped re-fetch of favorites whenever the current role changes.
 * State lives in Zustand — this provider only handles the role-change side-effect.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const currentRole = useUserStore((s) => s.currentRole);
  const roleId = currentRole?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: roleId is a hook-derived value, not a static outer-scope reference
  useEffect(() => {
    useFavoritesStore.getState().resetForRole();
    useFavoritesStore.getState().fetchForRole();
  }, [roleId]);

  return <>{children}</>;
}

/**
 * Backward-compatible hook — new code should import from @/stores/favoritesStore.
 *
 * Reconstructs the original API shape including a reactive `isFavorite` callback
 * that changes reference when favorites change, preserving existing render behavior.
 */
export function useFavoritesContext() {
  const favoriteWindowIds = useFavoritesStore((s) => s.favoriteWindowIds);
  const toggle = useFavoritesStore((s) => s.toggle);
  const seed = useFavoritesStore((s) => s.seed);
  const setMenuMap = useFavoritesStore((s) => s.setMenuMap);
  const menuIdByWindowId = useFavoritesStore((s) => s.menuIdByWindowId);
  const subscribeToToggle = useFavoritesStore((s) => s.subscribeToToggle);

  // Reactive: changes reference when favoriteWindowIds changes so that consumers
  // downstream (e.g. FavoritesDrawerContext) re-render after a toggle.
  const isFavorite = useCallback((windowId: string) => favoriteWindowIds.has(windowId), [favoriteWindowIds]);

  return { isFavorite, toggle, seed, setMenuMap, menuIdByWindowId, subscribeToToggle };
}
