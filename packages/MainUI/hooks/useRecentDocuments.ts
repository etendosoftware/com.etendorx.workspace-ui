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

import { useCallback } from "react";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { useUserContext } from "./useUserContext";

export interface RecentDocument {
  id: string;
  identifier: string;
  windowId: string;
  windowTitle: string;
  tabId: string;
  tabLevel: number;
  viewedAt: number;
}

const RECENT_DOCUMENTS_KEY = "recentDocuments";
const MAX_RECENT_DOCUMENTS = 10;

export function useRecentDocuments() {
  const { currentRole } = useUserContext();
  const roleId = currentRole?.id ?? "";

  const [stored, setStored] = useLocalStorage<Record<string, RecentDocument[]>>(RECENT_DOCUMENTS_KEY, {});

  const documents: RecentDocument[] = roleId ? (stored[roleId] ?? []) : [];

  const addRecentDocument = useCallback(
    (doc: Omit<RecentDocument, "viewedAt">) => {
      if (!roleId || !doc.id || !doc.windowId) return;

      setStored((prev) => {
        const current = prev[roleId] ?? [];

        // Remove existing entry for same record (same id + windowId + tabId)
        const filtered = current.filter(
          (d) => !(d.id === doc.id && d.windowId === doc.windowId && d.tabId === doc.tabId)
        );

        // Prepend new entry (most recent first)
        const updated = [{ ...doc, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_DOCUMENTS);

        return { ...prev, [roleId]: updated };
      });
    },
    [roleId, setStored]
  );

  return { documents, addRecentDocument };
}
