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
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";
import { logger } from "@/utils/logger";
import { buildGridConfiguration, parseGridConfiguration, rawRecordToSavedView } from "@/utils/savedViews/transform";
import type { ParsedSavedView, RawSavedViewRecord, SavedView } from "@/utils/savedViews/types";

const ENTITY = "OBUIAPP_SavedSearch";

/**
 * Shape of a SmartClient-style write payload sent to the datasource entity route.
 */
interface SmartClientWritePayload {
  dataSource: string;
  operationType: "add" | "update" | "remove";
  data: Record<string, unknown>;
  csrfToken?: string;
}

/**
 * Response shape from datasource entity writes.
 * Classic SmartClient responses wrap the result in `response`.
 */
interface DatasourceWriteResponse {
  response?: {
    status?: number;
    data?: unknown;
    error?: string;
  };
  [key: string]: unknown;
}

/**
 * Reads the auth token from localStorage.
 *
 * DELIBERATE BYPASS: The datasource api-client (`Datasource.get()`) only supports
 * read (fetch) operations. Write operations (add/remove) are not exposed by the
 * api-client, so a raw fetch is used here instead of routing through `datasource`.
 * The token key "token" MUST remain in sync with the key used in
 * `packages/MainUI/contexts/user.tsx` (`useLocalStorage<string | null>("token", null)`).
 */
function getAuthToken(): string {
  try {
    return localStorage.getItem("token") ?? "";
  } catch {
    return "";
  }
}

async function postToEntityDatasource(
  operationType: "add" | "update" | "remove",
  payload: SmartClientWritePayload
): Promise<DatasourceWriteResponse> {
  const token = getAuthToken();
  const url = `/api/datasource/${ENTITY}?_operationType=${operationType}&isc_dataFormat=json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Datasource request failed (${response.status}): ${text}`);
  }

  // Receive as unknown first, then validate shape before returning
  const json: unknown = await response.json();

  if (!json || typeof json !== "object") {
    throw new Error("Datasource response is not a valid object");
  }

  return json as DatasourceWriteResponse;
}

/**
 * Converts a raw datasource fetch response into SavedView array.
 */
function extractViewsFromResponse(raw: unknown): SavedView[] {
  if (!raw || typeof raw !== "object") return [];

  const resp = raw as Record<string, unknown>;
  const response = resp.response as Record<string, unknown> | undefined;
  if (!response) return [];

  const data = response.data;
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (record: unknown): record is Record<string, unknown> =>
        typeof record === "object" && record !== null && typeof (record as Record<string, unknown>).id === "string"
    )
    .map((record) => rawRecordToSavedView(record as RawSavedViewRecord));
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
 * CRUD hook for saved views stored in OBUIAPP_SavedSearch entity.
 *
 * Responsibilities:
 * - Fetch saved views for a given tab
 * - Save the current grid state as a named view
 * - Apply a saved view (returns the state to set)
 * - Delete a saved view
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
      const raw = await datasource.get(ENTITY, {
        criteria: [
          {
            fieldName: "tab",
            operator: "equals",
            value: tabId,
          },
        ],
        _noActiveFilter: "true",
      });

      const savedViews = extractViewsFromResponse(raw);

      const parsed: ParsedSavedView[] = savedViews.map((view) => ({
        id: view.id,
        name: view.name,
        tabId: view.tabId,
        isDefault: view.isDefault,
        filterClause: view.filterClause,
        config: parseGridConfiguration(view.gridConfiguration),
      }));

      setViews(parsed);
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

        const payload: SmartClientWritePayload = {
          dataSource: ENTITY,
          operationType: "add",
          data: {
            obuiappTab: tabId,
            name,
            obuiappIsdefault: isDefault,
            obuiappFilterclause: "",
            obuiappGridconfiguration: gridConfiguration,
          },
        };

        await postToEntityDatasource("add", payload);

        // Refresh the list after saving
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
    [fetchViews]
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
        const payload: SmartClientWritePayload = {
          dataSource: ENTITY,
          operationType: "remove",
          data: { id: viewId },
        };

        await postToEntityDatasource("remove", payload);

        // Update local state immediately for responsive UX
        setViews((prev) => prev.filter((v) => v.id !== viewId));

        // Refresh if we know the tabId
        if (viewToDelete?.tabId) {
          await fetchViews(viewToDelete.tabId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting view";
        logger.error("[useSavedViews] deleteView failed:", err);
        setError(message);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [views, fetchViews]
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
