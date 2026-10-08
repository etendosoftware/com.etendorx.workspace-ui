/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { fetchRecentItems, saveRecentItems } from "@workspaceui/api-client/src/api/recentItems";
import type { RecentItemsResponse } from "@workspaceui/api-client/src/api/recentItems";
import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { logger } from "@/utils/logger";
import {
  DEFAULT_RECENT_LIST_SIZE,
  readCachedRecentItems,
  upsertRecentItem,
  writeCachedRecentItems,
} from "@/utils/recentItems";

interface RecentItemsStore {
  /** Current user + role + organization scope; empty while the session is not known. */
  scopeKey: string;
  /** Recent items, newest first. */
  items: RecentItem[];
  /** Maximum number of items (UINAVBA_RecentListSize preference). */
  size: number;
  /** Called by RecentItemsProvider when the scope changes: shows the local cache, then syncs with the server. */
  loadForScope: (scopeKey: string) => Promise<void>;
  /** Moves the item to the front of the list and persists the list server-side. */
  add: (item: RecentItem) => Promise<void>;
  /** Replaces the items locally only (e.g. refreshed translations), without writing to the server. */
  setItems: (items: RecentItem[]) => void;
}

const isSameList = (left: RecentItem[], right: RecentItem[]) => JSON.stringify(left) === JSON.stringify(right);

export const useRecentItemsStore = create<RecentItemsStore>()(
  devtools(
    (set, get) => {
      // Bumped by every scope change and every add (not by local-only updates such as translations).
      let revision = 0;

      const setLocalItems = (items: RecentItem[]) => {
        set({ items });
        writeCachedRecentItems(get().scopeKey, items);
      };

      // Applies a server response only if no other add or scope change happened meanwhile, so a
      // slow response can never overwrite newer state.
      const applyServerList = (requestRevision: number, data: RecentItemsResponse<RecentItem>) => {
        if (requestRevision !== revision) return;
        set({ size: data.size });
        setLocalItems(data.items);
      };

      return {
        scopeKey: "",
        items: [],
        size: DEFAULT_RECENT_LIST_SIZE,

        loadForScope: async (scopeKey: string) => {
          const requestRevision = ++revision;
          set({ scopeKey, items: readCachedRecentItems(scopeKey) });
          if (!scopeKey) return;

          try {
            applyServerList(requestRevision, await fetchRecentItems<RecentItem>());
          } catch (err) {
            logger.warn("[RecentItemsStore] GET /recent-items not available, using the local cache:", err);
          }
        },

        add: async (item: RecentItem) => {
          const { scopeKey, items, size } = get();
          if (!scopeKey) return;

          const next = upsertRecentItem(items, item, size);
          if (isSameList(items, next)) return;
          const requestRevision = ++revision;
          setLocalItems(next);

          try {
            applyServerList(requestRevision, await saveRecentItems(next));
          } catch (err) {
            // The local cache keeps the change as a backup; the next successful save syncs it.
            logger.warn("[RecentItemsStore] Failed to save recent items:", err);
          }
        },

        setItems: setLocalItems,
      };
    },
    { name: "RecentItemsStore" }
  )
);
