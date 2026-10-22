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

import { useCallback, useState } from "react";
import { logger } from "@/utils/logger";
import {
  buildGridConfiguration,
  parseGridConfiguration,
  rawRecordToSavedView,
  toAppliedViewState,
} from "@/utils/savedViews/transform";
import type {
  AppliedViewState,
  ParsedSavedView,
  RawSavedViewRecord,
  SavedViewScope,
  ViewStateSnapshot,
} from "@/utils/savedViews/types";
import { useUserStore } from "@/stores/userStore";

const BASE_URL = "/api/meta/saved-views";

async function apiFetch(url: string, token: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** Body of a PUT that rewrites a view: everything is resent because the backend only updates the keys present. */
function buildUpdateBody(view: ParsedSavedView, isDefault: boolean, gridConfiguration?: string): string {
  return JSON.stringify({
    name: view.name,
    tab: view.tabId,
    isdefault: isDefault,
    filterclause: view.filterClause,
    gridconfiguration: gridConfiguration ?? (view.config ? JSON.stringify(view.config) : ""),
  });
}

/** Parameters to save a new view: the captured grid and window state plus the view identity. */
export interface SaveViewParams extends ViewStateSnapshot {
  tabId: string;
  name: string;
  isDefault?: boolean;
  /** Omit for a personal (USER-scope) view — only administrators may set a shared scope. */
  scope?: SavedViewScope;
  /** Target role id, only used when scope is "ROLE". */
  roleId?: string;
}

export interface UseSavedViewsReturn {
  views: ParsedSavedView[];
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isUpdatingDefault: boolean;
  error: string | null;
  fetchViews: (tabId: string) => Promise<void>;
  setDefaultView: (viewId: string) => Promise<void>;
  unsetDefaultView: (tabId: string) => Promise<void>;
  saveView: (params: SaveViewParams) => Promise<void>;
  /** Overwrites the grid and window state of an existing view (saving again under the same name). */
  updateView: (viewId: string, state: ViewStateSnapshot) => Promise<void>;
  applyView: (view: ParsedSavedView) => AppliedViewState | null;
  deleteView: (viewId: string) => Promise<void>;
}

export function useSavedViews(): UseSavedViewsReturn {
  const token = useUserStore((s) => s.token);
  const [views, setViews] = useState<ParsedSavedView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViews = useCallback(
    async (tabId: string): Promise<void> => {
      if (!tabId || !token) return;

      setIsLoading(true);
      setError(null);

      try {
        const url = `${BASE_URL}?tab=${encodeURIComponent(tabId)}`;
        const json = (await apiFetch(url, token)) as { response?: { status?: number; data?: unknown[] } };

        if (json?.response?.status !== 0) {
          throw new Error("Failed to fetch saved views");
        }

        const records = (json.response?.data ?? []) as RawSavedViewRecord[];
        const parsed = records.map((r) => {
          const sv = rawRecordToSavedView(r);
          return { ...sv, config: parseGridConfiguration(sv.gridConfiguration) };
        });
        parsed.sort((a, b) => {
          if (a.isDefault === b.isDefault) return 0;
          return a.isDefault ? -1 : 1;
        });
        setViews(parsed);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching saved views";
        logger.error("[useSavedViews] fetchViews failed:", err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const saveView = useCallback(
    async ({ tabId, name, isDefault = false, scope, roleId, ...state }: SaveViewParams): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      setIsSaving(true);
      setError(null);

      try {
        const gridConfiguration = buildGridConfiguration(state);

        // The backend atomically clears any other default sharing this view's (tab, scope)
        // target before persisting isdefault=true — no separate clear-then-set round trip.
        await apiFetch(BASE_URL, token, {
          method: "POST",
          body: JSON.stringify({
            name,
            tab: tabId,
            isdefault: isDefault,
            filterclause: "",
            gridconfiguration: gridConfiguration,
            ...(scope ? { scope } : {}),
            ...(roleId ? { role: roleId } : {}),
          }),
        });

        // Refresh to get the persisted record with server-generated id
        await fetchViews(tabId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error saving view";
        logger.error("[useSavedViews] saveView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [token, fetchViews]
  );

  const setDefaultView = useCallback(
    async (viewId: string): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      const targetView = views.find((v) => v.id === viewId);
      if (!targetView) throw new Error("View not found");

      setIsUpdatingDefault(true);
      setError(null);

      try {
        const tabId = targetView.tabId;

        // The backend atomically clears any sibling default for this view's (tab, scope)
        // target before persisting isdefault=true.
        await apiFetch(`${BASE_URL}/${viewId}`, token, {
          method: "PUT",
          body: buildUpdateBody(targetView, true),
        });

        await fetchViews(tabId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error setting default view";
        logger.error("[useSavedViews] setDefaultView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsUpdatingDefault(false);
      }
    },
    [token, views, fetchViews]
  );

  const unsetDefaultView = useCallback(
    async (tabId: string): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      const currentDefault = views.find((v) => v.isDefault && v.tabId === tabId);
      if (!currentDefault) return;

      setIsUpdatingDefault(true);
      setError(null);

      try {
        await apiFetch(`${BASE_URL}/${currentDefault.id}`, token, {
          method: "PUT",
          body: buildUpdateBody(currentDefault, false),
        });

        await fetchViews(tabId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error unsetting default view";
        logger.error("[useSavedViews] unsetDefaultView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsUpdatingDefault(false);
      }
    },
    [token, views, fetchViews]
  );

  const updateView = useCallback(
    async (viewId: string, state: ViewStateSnapshot): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      const targetView = views.find((v) => v.id === viewId);
      if (!targetView) throw new Error("View not found");

      setIsSaving(true);
      setError(null);

      try {
        await apiFetch(`${BASE_URL}/${viewId}`, token, {
          method: "PUT",
          body: buildUpdateBody(targetView, targetView.isDefault, buildGridConfiguration(state)),
        });

        await fetchViews(targetView.tabId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating view";
        logger.error("[useSavedViews] updateView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [token, views, fetchViews]
  );

  const applyView = useCallback((view: ParsedSavedView): AppliedViewState | null => {
    if (!view.config) {
      logger.warn("[useSavedViews] Cannot apply view — no MRT config:", view.name);
      return null;
    }

    return toAppliedViewState(view.config);
  }, []);

  const deleteView = useCallback(
    async (viewId: string): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      setIsDeleting(true);
      setError(null);

      const viewToDelete = views.find((v) => v.id === viewId);

      try {
        if (!viewToDelete) {
          throw new Error("Cannot delete view: view not found");
        }

        await apiFetch(`${BASE_URL}/${viewId}`, token, { method: "DELETE" });
        setViews((prev) => prev.filter((v) => v.id !== viewId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting view";
        logger.error("[useSavedViews] deleteView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [token, views]
  );

  return {
    views,
    isLoading,
    isSaving,
    isDeleting,
    isUpdatingDefault,
    error,
    fetchViews,
    setDefaultView,
    unsetDefaultView,
    saveView,
    updateView,
    applyView,
    deleteView,
  };
}
