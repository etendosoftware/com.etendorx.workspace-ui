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
import { buildRecentItemsScopeKey, RECENT_ITEMS_STORAGE_KEY } from "@/utils/recentItems";
import { useUserStore } from "@/stores/userStore";

export const USER_ID = "user-1";
export const ROLE_ID = "role-1";
export const ORG_ID = "org-1";
export const SCOPE_KEY = buildRecentItemsScopeKey(USER_ID, ROLE_ID, ORG_ID);
export const OTHER_SCOPE_KEY = "other-scope";

/** Builds a Window recent item whose id, window id and name derive from `id`. */
export const buildRecentItem = (id: string, overrides: Partial<RecentItem> = {}): RecentItem => ({
  id,
  name: `Window ${id}`,
  windowId: `window-${id}`,
  type: "Window",
  ...overrides,
});

/** Stores the given items in the localStorage cache under `scopeKey`. */
export const seedRecentItemsCache = (items: RecentItem[], scopeKey: string = SCOPE_KEY) =>
  window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify({ [scopeKey]: items }));

/** Returns the parsed localStorage cache. */
export const readRecentItemsCache = (): Record<string, RecentItem[]> =>
  JSON.parse(window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY) ?? "{}");

/**
 * Backs the global jest.fn() localStorage mock (jest.setup.js) with an in-memory store,
 * so the cache can actually be written and read back.
 */
export const installMemoryLocalStorage = () => {
  const entries = new Map<string, string>();
  const storage = window.localStorage as unknown as Record<"getItem" | "setItem" | "clear", jest.Mock>;
  storage.getItem.mockImplementation((key: string) => entries.get(key) ?? null);
  storage.setItem.mockImplementation((key: string, value: string) => entries.set(key, value));
  storage.clear.mockImplementation(() => entries.clear());
};

/** Sets the user store session (user + organization fixtures) with the given role, or no role. */
export const setUserSession = (roleId?: string) =>
  useUserStore.setState({
    user: { id: USER_ID },
    currentRole: roleId ? { id: roleId } : undefined,
    currentOrganization: { id: ORG_ID },
  } as unknown as Parameters<typeof useUserStore.setState>[0]);
