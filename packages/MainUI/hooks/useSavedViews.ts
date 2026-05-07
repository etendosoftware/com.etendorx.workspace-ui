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
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";
import { logger } from "@/utils/logger";
import { buildGridConfiguration, parseGridConfiguration, rawRecordToSavedView } from "@/utils/savedViews/transform";
import type { ParsedSavedView, RawSavedViewRecord } from "@/utils/savedViews/types";
import { useUserContext } from "@/hooks/useUserContext";

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
  saveView: (params: {
    tabId: string;
    name: string;
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
    implicitFilterApplied: boolean;
    isDefault?: boolean;
  }) => Promise<void>;
  applyView: (view: ParsedSavedView) => {
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
    implicitFilterApplied: boolean;
  } | null;
  deleteView: (viewId: string) => Promise<void>;
}

export function useSavedViews(): UseSavedViewsReturn {
  const { token } = useUserContext();
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
        setViews(
          records.map((r) => {
            const sv = rawRecordToSavedView(r);
            return { ...sv, config: parseGridConfiguration(sv.gridConfiguration) };
          })
        );
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
    async ({
      tabId,
      name,
      filters,
      visibility,
      sorting,
      order,
      implicitFilterApplied,
      isDefault = false,
    }: {
      tabId: string;
      name: string;
      filters: MRT_ColumnFiltersState;
      visibility: MRT_VisibilityState;
      sorting: MRT_SortingState;
      order: string[];
      implicitFilterApplied: boolean;
      isDefault?: boolean;
    }): Promise<void> => {
      if (!token) throw new Error("Not authenticated");

      setIsSaving(true);
      setError(null);

      try {
        const gridConfiguration = buildGridConfiguration(filters, visibility, sorting, order, implicitFilterApplied);

        // If saving as default, clear isDefault on existing default view first
        if (isDefault) {
          const currentDefault = views.find((v) => v.isDefault && v.tabId === tabId);
          if (currentDefault) {
            await apiFetch(`${BASE_URL}/${currentDefault.id}`, token, {
              method: "PUT",
              body: JSON.stringify({
                name: currentDefault.name,
                tab: tabId,
                isdefault: false,
                filterclause: currentDefault.filterClause,
                gridconfiguration: currentDefault.config ? JSON.stringify(currentDefault.config) : "",
              }),
            });
          }
        }

        await apiFetch(BASE_URL, token, {
          method: "POST",
          body: JSON.stringify({
            name,
            tab: tabId,
            isdefault: isDefault,
            filterclause: "",
            gridconfiguration: gridConfiguration,
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
    [token, views, fetchViews]
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

        // Clear current default if different from target
        const currentDefault = views.find((v) => v.isDefault && v.tabId === tabId && v.id !== viewId);
        if (currentDefault) {
          await apiFetch(`${BASE_URL}/${currentDefault.id}`, token, {
            method: "PUT",
            body: JSON.stringify({
              name: currentDefault.name,
              tab: tabId,
              isdefault: false,
              filterclause: currentDefault.filterClause,
              gridconfiguration: currentDefault.config ? JSON.stringify(currentDefault.config) : "",
            }),
          });
        }

        await apiFetch(`${BASE_URL}/${viewId}`, token, {
          method: "PUT",
          body: JSON.stringify({
            name: targetView.name,
            tab: tabId,
            isdefault: true,
            filterclause: targetView.filterClause,
            gridconfiguration: targetView.config ? JSON.stringify(targetView.config) : "",
          }),
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
          body: JSON.stringify({
            name: currentDefault.name,
            tab: tabId,
            isdefault: false,
            filterclause: currentDefault.filterClause,
            gridconfiguration: currentDefault.config ? JSON.stringify(currentDefault.config) : "",
          }),
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

  const applyView = useCallback(
    (
      view: ParsedSavedView
    ): {
      filters: MRT_ColumnFiltersState;
      visibility: MRT_VisibilityState;
      sorting: MRT_SortingState;
      order: string[];
      implicitFilterApplied: boolean;
    } | null => {
      if (!view.config) {
        logger.warn("[useSavedViews] Cannot apply view — no MRT config:", view.name);
        return null;
      }

      return {
        filters: view.config.filters,
        visibility: view.config.visibility,
        sorting: view.config.sorting,
        order: view.config.order,
        implicitFilterApplied: view.config.implicitFilterApplied,
      };
    },
    []
  );

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
    applyView,
    deleteView,
  };
}
