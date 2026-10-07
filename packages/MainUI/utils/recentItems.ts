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

import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { logger } from "@/utils/logger";

/** localStorage key of the recent items cache (kept as a backup of the server-side list). */
export const RECENT_ITEMS_STORAGE_KEY = "recentlyViewedItems";

/** Classic default of the UINAVBA_RecentListSize preference, used until the backend answers. */
export const DEFAULT_RECENT_LIST_SIZE = 3;

const SCOPE_SEPARATOR = "|";

type RecentItemsCache = Record<string, RecentItem[]>;

/**
 * Builds the key the recent items are scoped by, mirroring the server-side preference scope
 * (user + role + organization). Returns an empty key while the session is not fully known.
 */
export const buildRecentItemsScopeKey = (userId?: string, roleId?: string, orgId?: string): string => {
  if (!userId || !roleId || !orgId) return "";
  return [userId, roleId, orgId].join(SCOPE_SEPARATOR);
};

/** Keeps the newest `size` items, discarding the oldest ones. */
export const trimRecentItems = (items: RecentItem[], size: number): RecentItem[] => items.slice(0, size);

/** Moves (or inserts) the item to the front of the list, without duplicates, trimmed to `size`. */
export const upsertRecentItem = (items: RecentItem[], item: RecentItem, size: number): RecentItem[] =>
  trimRecentItems([item, ...items.filter((current) => current.id !== item.id)], size);

const readCache = (): RecentItemsCache => {
  try {
    const stored = window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as RecentItemsCache) : {};
  } catch (error) {
    logger.warn("[RecentItems] Could not read the local cache:", error);
    return {};
  }
};

/** Reads the cached recent items of the given scope. */
export const readCachedRecentItems = (scopeKey: string): RecentItem[] => {
  if (!scopeKey) return [];
  return readCache()[scopeKey] ?? [];
};

/** Stores the recent items of the given scope in the local cache. */
export const writeCachedRecentItems = (scopeKey: string, items: RecentItem[]): void => {
  if (!scopeKey) return;
  try {
    const cache = readCache();
    window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify({ ...cache, [scopeKey]: items }));
  } catch (error) {
    logger.warn("[RecentItems] Could not write the local cache:", error);
  }
};
