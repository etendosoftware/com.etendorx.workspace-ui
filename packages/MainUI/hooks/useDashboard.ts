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
import {
  fetchDashboardLayout,
  fetchWidgetData,
  updateDashboardLayout,
  addDashboardWidget,
  deleteDashboardWidget,
} from "@workspaceui/api-client/src/api/dashboard";
import type {
  WidgetInstance,
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
  refreshWidget: (instanceId: string) => Promise<void>;
  updateLayout: (widgets: UpdateLayoutWidget[]) => Promise<void>;
  addWidget: (payload: AddWidgetRequest) => Promise<void>;
  removeWidget: (instanceId: string) => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [layout, setLayout] = useState<WidgetInstance[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetDataResponse>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const fetchOneWidgetData = useCallback(async (instanceId: string): Promise<void> => {
    try {
      const data = await fetchWidgetData(instanceId);
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
  }, []);

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
            instance.refreshInterval * 1000,
          );
        }
      }
    },
    [clearIntervals, fetchOneWidgetData],
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

  useEffect(() => {
    loadLayout();
    return clearIntervals;
  }, [loadLayout, clearIntervals]);

  const refreshWidget = useCallback(
    async (instanceId: string): Promise<void> => {
      await fetchOneWidgetData(instanceId);
    },
    [fetchOneWidgetData],
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
      }),
    );

    try {
      await updateDashboardLayout({ widgets });
    } catch (err) {
      logger.warn("[useDashboard] Failed to persist layout update:", err);
      // Re-fetch to restore server state on failure
      await loadLayout();
    }
  }, [loadLayout]);

  const addWidget = useCallback(
    async (payload: AddWidgetRequest): Promise<void> => {
      await addDashboardWidget(payload);
      await loadLayout();
    },
    [loadLayout],
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
        await loadLayout();
      }
    },
    [loadLayout],
  );

  return {
    layout,
    widgetData,
    widgetErrors,
    isLoadingLayout,
    layoutError,
    refreshWidget,
    updateLayout,
    addWidget,
    removeWidget,
  };
}
