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
import { buildGridConfiguration, parseGridConfiguration } from "@/utils/savedViews/transform";
import type { ParsedSavedView } from "@/utils/savedViews/types";

/**
 * localStorage key prefix for saved views.
 * Format: `savedViews_<tabId>` → JSON array of StoredView.
 *
 * NOTE: This implementation uses localStorage for persistence.
 * When the backend entity OBUIAPP_SavedSearch is available in the Etendo
 * installation, the storage can be migrated to backend by replacing the
 * localStorage helpers below with API calls to /api/datasource/OBUIAPP_SavedSearch.
 * The data structure is intentionally identical to what OBUIAPP_SavedSearch stores.
 */
const LS_KEY_PREFIX = "savedViews_";

/** Shape stored in localStorage — mirrors OBUIAPP_SavedSearch columns exactly. */
interface StoredView {
  id: string;
  name: string;
  tabId: string;
  isDefault: boolean;
  filterClause: string;
  gridConfiguration: string;
}

function lsKey(tabId: string): string {
  return `${LS_KEY_PREFIX}${tabId}`;
}

function loadFromStorage(tabId: string): StoredView[] {
  try {
    const raw = localStorage.getItem(lsKey(tabId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredView[];
  } catch {
    return [];
  }
}

function saveToStorage(tabId: string, views: StoredView[]): void {
  try {
    localStorage.setItem(lsKey(tabId), JSON.stringify(views));
  } catch (err) {
    logger.error("[useSavedViews] Failed to write localStorage:", err);
  }
}

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function storedToView(s: StoredView): ParsedSavedView {
  return {
    id: s.id,
    name: s.name,
    tabId: s.tabId,
    isDefault: s.isDefault,
    filterClause: s.filterClause,
    config: parseGridConfiguration(s.gridConfiguration),
  };
}

export interface UseSavedViewsReturn {
  views: ParsedSavedView[];
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  fetchViews: (tabId: string) => Promise<void>;
  saveView: (params: {
    tabId: string;
    name: string;
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
    isDefault?: boolean;
  }) => Promise<void>;
  applyView: (view: ParsedSavedView) => {
    filters: MRT_ColumnFiltersState;
    visibility: MRT_VisibilityState;
    sorting: MRT_SortingState;
    order: string[];
  } | null;
  deleteView: (viewId: string) => Promise<void>;
}

/**
 * CRUD hook for saved views.
 *
 * Currently persists to localStorage using the same field structure as the
 * OBUIAPP_SavedSearch entity so migration to backend storage is straightforward
 * once that entity is available in the Etendo installation.
 */
export function useSavedViews(): UseSavedViewsReturn {
  const [views, setViews] = useState<ParsedSavedView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViews = useCallback(async (tabId: string): Promise<void> => {
    if (!tabId) return;

    setIsLoading(true);
    setError(null);

    try {
      const stored = loadFromStorage(tabId);
      setViews(stored.map(storedToView));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching saved views";
      logger.error("[useSavedViews] fetchViews failed:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveView = useCallback(
    async ({
      tabId,
      name,
      filters,
      visibility,
      sorting,
      order,
      isDefault = false,
    }: {
      tabId: string;
      name: string;
      filters: MRT_ColumnFiltersState;
      visibility: MRT_VisibilityState;
      sorting: MRT_SortingState;
      order: string[];
      isDefault?: boolean;
    }): Promise<void> => {
      setIsSaving(true);
      setError(null);

      try {
        const gridConfiguration = buildGridConfiguration(filters, visibility, sorting, order);

        const newView: StoredView = {
          id: generateId(),
          name,
          tabId,
          isDefault,
          filterClause: "",
          gridConfiguration,
        };

        const existing = loadFromStorage(tabId);

        // If the new view is default, clear default flag on others
        const updated = isDefault ? existing.map((v) => ({ ...v, isDefault: false })) : [...existing];
        updated.push(newView);

        saveToStorage(tabId, updated);
        setViews(updated.map(storedToView));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error saving view";
        logger.error("[useSavedViews] saveView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const applyView = useCallback(
    (
      view: ParsedSavedView
    ): {
      filters: MRT_ColumnFiltersState;
      visibility: MRT_VisibilityState;
      sorting: MRT_SortingState;
      order: string[];
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
      };
    },
    []
  );

  const deleteView = useCallback(
    async (viewId: string): Promise<void> => {
      setIsDeleting(true);
      setError(null);

      const viewToDelete = views.find((v) => v.id === viewId);

      try {
        if (!viewToDelete?.tabId) {
          throw new Error("Cannot delete view: tabId unknown");
        }

        const existing = loadFromStorage(viewToDelete.tabId);
        const updated = existing.filter((v) => v.id !== viewId);
        saveToStorage(viewToDelete.tabId, updated);
        setViews(updated.map(storedToView));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting view";
        logger.error("[useSavedViews] deleteView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [views]
  );

  return {
    views,
    isLoading,
    isSaving,
    isDeleting,
    error,
    fetchViews,
    saveView,
    applyView,
    deleteView,
  };
}
