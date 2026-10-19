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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  fetchRecentDocuments,
  trackRecentDocument as trackRecentDocumentApi,
} from "@workspaceui/api-client/src/api/dashboard";
import type { RecentDocumentItem } from "@workspaceui/api-client/src/api/dashboard";
import { logger } from "@/utils/logger";

const MAX_RECENT_DOCUMENTS = 10;

interface RecentDocumentsStore {
  documents: RecentDocumentItem[];
  /** Called by RecentDocumentsProvider when the role changes. */
  resetForRole: () => void;
  fetchForRole: () => Promise<void>;
  track: (doc: Omit<RecentDocumentItem, "viewedAt">) => Promise<void>;
}

function upsertDocument(current: RecentDocumentItem[], doc: RecentDocumentItem): RecentDocumentItem[] {
  const filtered = current.filter(
    (d) => !(d.recordId === doc.recordId && d.windowId === doc.windowId && d.tabId === doc.tabId)
  );
  return [doc, ...filtered].slice(0, MAX_RECENT_DOCUMENTS);
}

export const useRecentDocumentsStore = create<RecentDocumentsStore>()(
  devtools(
    (set, get) => ({
      documents: [],

      resetForRole: () => {
        set({ documents: [] });
      },

      fetchForRole: async () => {
        try {
          const data = await fetchRecentDocuments();
          set({ documents: data.items });
        } catch (err) {
          logger.warn("[RecentDocumentsStore] GET /recent-documents not available:", err);
        }
      },

      track: async (doc: Omit<RecentDocumentItem, "viewedAt">) => {
        const previous = get().documents;
        const optimisticDoc: RecentDocumentItem = { ...doc, viewedAt: Date.now() };

        // Optimistic update
        set({ documents: upsertDocument(previous, optimisticDoc) });

        try {
          await trackRecentDocumentApi(doc);
        } catch (err) {
          logger.warn("[RecentDocumentsStore] Failed to track recent document:", err);
          // Revert optimistic update
          set({ documents: previous });
        }
      },
    }),
    { name: "RecentDocumentsStore" }
  )
);
