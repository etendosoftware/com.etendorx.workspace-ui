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

import { useCallback, useEffect, useRef, useState } from "react";

export const WIDGET_PAGE_SIZE = 10;
import {
  fetchDashboardLayout,
  fetchWidgetData,
  fetchWidgetClasses,
  updateDashboardLayout,
  addDashboardWidget,
  deleteDashboardWidget,
  updateWidgetParams,
} from "@workspaceui/api-client/src/api/dashboard";
import type {
  WidgetInstance,
  WidgetClass,
  WidgetDataResponse,
  UpdateLayoutWidget,
  AddWidgetRequest,
} from "@workspaceui/api-client/src/api/dashboard";
import { logger } from "@/utils/logger";

export interface UseDashboardReturn {
  layout: WidgetInstance[];
  widgetData: Record<string, WidgetDataResponse>;
  widgetErrors: Record<string, string>;
  isLoadingLayout: boolean;
  layoutError: string | null;
  widgetClasses: WidgetClass[];
  isLoadingClasses: boolean;
  classesError: string | null;
  loadWidgetClasses: () => Promise<void>;
  refreshWidget: (instanceId: string) => Promise<void>;
  fetchWidgetPage: (instanceId: string, page: number, pageSize: number) => Promise<void>;
  updateLayout: (widgets: UpdateLayoutWidget[]) => Promise<void>;
  addWidget: (payload: AddWidgetRequest) => Promise<void>;
  removeWidget: (instanceId: string) => Promise<void>;
  updateParams: (instanceId: string, parameters: Record<string, string>) => Promise<void>;
}

export function useDashboard(roleId?: string): UseDashboardReturn {
  const [layout, setLayout] = useState<WidgetInstance[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetDataResponse>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [widgetClasses, setWidgetClasses] = useState<WidgetClass[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const fetchOneWidgetData = useCallback(
    async (instanceId: string, page = 1, pageSize = WIDGET_PAGE_SIZE): Promise<void> => {
      try {
        const data = await fetchWidgetData(instanceId, { page, pageSize });
        setWidgetData((prev) => ({ ...prev, [instanceId]: data }));
        setWidgetErrors((prev) => {
          const next = { ...prev };
          delete next[instanceId];
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`[useDashboard] Failed to fetch data for widget ${instanceId}:`, message);
        setWidgetErrors((prev) => ({ ...prev, [instanceId]: message }));
      }
    },
    []
  );

  const clearIntervals = useCallback(() => {
    for (const id of Object.values(intervalsRef.current)) {
      clearInterval(id);
    }
    intervalsRef.current = {};
  }, []);

  const setupAutoRefresh = useCallback(
    (instances: WidgetInstance[]) => {
      clearIntervals();
      for (const instance of instances) {
        if (instance.refreshInterval > 0) {
          intervalsRef.current[instance.instanceId] = setInterval(
            () => fetchOneWidgetData(instance.instanceId),
            instance.refreshInterval * 1000
          );
        }
      }
    },
    [clearIntervals, fetchOneWidgetData]
  );

  const loadLayout = useCallback(async () => {
    setIsLoadingLayout(true);
    setLayoutError(null);
    try {
      const response = await fetchDashboardLayout();
      setLayout(response.widgets);

      // Fetch all widget data in parallel
      await Promise.allSettled(response.widgets.map((w) => fetchOneWidgetData(w.instanceId)));

      setupAutoRefresh(response.widgets);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("[useDashboard] Failed to load dashboard layout:", message);
      setLayoutError(message);
    } finally {
      setIsLoadingLayout(false);
    }
  }, [fetchOneWidgetData, setupAutoRefresh]);

  // Silent refresh: updates layout/data without toggling the loading state so the
  // grid stays mounted. Used after add/remove to avoid an unmount→remount cycle
  // that can race against backend write propagation.
  const silentRefreshLayout = useCallback(async () => {
    try {
      const response = await fetchDashboardLayout();
      setLayout(response.widgets);
      await Promise.allSettled(response.widgets.map((w) => fetchOneWidgetData(w.instanceId)));
      setupAutoRefresh(response.widgets);
    } catch (err) {
      logger.warn("[useDashboard] Failed to silently refresh layout:", err);
    }
  }, [fetchOneWidgetData, setupAutoRefresh]);

  const loadWidgetClasses = useCallback(async (): Promise<void> => {
    setIsLoadingClasses(true);
    setClassesError(null);
    try {
      const response = await fetchWidgetClasses();
      setWidgetClasses(response.classes);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("[useDashboard] Failed to load widget classes:", message);
      setClassesError(message);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    // Reset state before re-fetching for new role
    setLayout([]);
    setWidgetData({});
    setWidgetErrors({});
    setLayoutError(null);
    loadLayout();
    loadWidgetClasses();
    return clearIntervals;
  }, [roleId, loadLayout, loadWidgetClasses, clearIntervals]);

  const refreshWidget = useCallback(
    async (instanceId: string): Promise<void> => {
      await fetchOneWidgetData(instanceId);
    },
    [fetchOneWidgetData]
  );

  const fetchWidgetPage = useCallback(
    async (instanceId: string, page: number, pageSize: number): Promise<void> => {
      await fetchOneWidgetData(instanceId, page, pageSize);
    },
    [fetchOneWidgetData]
  );

  const updateLayout = useCallback(async (widgets: UpdateLayoutWidget[]): Promise<void> => {
    // Optimistic update
    setLayout((prev) =>
      prev.map((instance) => {
        const update = widgets.find((w) => w.instanceId === instance.instanceId);
        if (!update) return instance;
        return {
          ...instance,
          position: { col: update.col, row: update.row, width: update.width, height: update.height },
        };
      })
    );

    try {
      await updateDashboardLayout({ widgets });
    } catch (err) {
      // Log the failure but do NOT re-fetch the layout.
      // Re-fetching would discard any widgets added since the last successful
      // load (e.g. a widget just added whose positions haven't been saved yet
      // because the backend PUT is broken). The optimistic local state is
      // a better UX than reverting to a potentially stale server state.
      logger.warn("[useDashboard] Failed to persist layout update:", err);
    }
  }, []);

  const addWidget = useCallback(
    async (payload: AddWidgetRequest): Promise<void> => {
      await addDashboardWidget(payload);
      // Use loadLayout (full refresh) to guarantee fresh data from the backend.
      // silentRefreshLayout has a race condition: the GET can arrive before the
      // backend commits the POST, returning the old layout without the new widget.
      await loadLayout();
    },
    [loadLayout]
  );

  const updateParams = useCallback(
    async (instanceId: string, parameters: Record<string, string>): Promise<void> => {
      await updateWidgetParams(instanceId, parameters);
      await refreshWidget(instanceId);
    },
    [refreshWidget]
  );

  const removeWidget = useCallback(
    async (instanceId: string): Promise<void> => {
      // Optimistic removal
      setLayout((prev) => prev.filter((w) => w.instanceId !== instanceId));
      setWidgetData((prev) => {
        const next = { ...prev };
        delete next[instanceId];
        return next;
      });

      // Clear auto-refresh for this widget
      if (intervalsRef.current[instanceId]) {
        clearInterval(intervalsRef.current[instanceId]);
        delete intervalsRef.current[instanceId];
      }

      try {
        await deleteDashboardWidget(instanceId);
      } catch (err) {
        logger.warn("[useDashboard] Failed to delete widget:", err);
        // Re-fetch to restore server state on failure
        await silentRefreshLayout();
      }
    },
    [silentRefreshLayout]
  );

  return {
    layout,
    widgetData,
    widgetErrors,
    isLoadingLayout,
    layoutError,
    widgetClasses,
    isLoadingClasses,
    classesError,
    loadWidgetClasses,
    refreshWidget,
    fetchWidgetPage,
    updateLayout,
    addWidget,
    removeWidget,
    updateParams,
  };
}
