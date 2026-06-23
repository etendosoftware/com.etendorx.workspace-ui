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

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
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

export const WIDGET_PAGE_SIZE = 10;

// Module-level — auto-refresh intervals aren't reactive state. Survives across
// component unmount/remount so the dashboard cache stays warm.
const refreshIntervals = new Map<string, ReturnType<typeof setInterval>>();

function clearAllIntervals(): void {
  for (const id of refreshIntervals.values()) clearInterval(id);
  refreshIntervals.clear();
}

function setupAutoRefresh(instances: WidgetInstance[], refreshFn: (instanceId: string) => void): void {
  clearAllIntervals();
  for (const instance of instances) {
    if (instance.refreshInterval > 0) {
      refreshIntervals.set(
        instance.instanceId,
        setInterval(() => refreshFn(instance.instanceId), instance.refreshInterval * 1000)
      );
    }
  }
}

interface DashboardStore {
  // ---- State ------------------------------------------------------------
  layout: WidgetInstance[];
  widgetData: Record<string, WidgetDataResponse>;
  widgetErrors: Record<string, string>;
  isLoadingLayout: boolean;
  layoutError: string | null;
  widgetClasses: WidgetClass[];
  isLoadingClasses: boolean;
  classesError: string | null;
  /** Role whose data currently lives in the store; null if uninitialized. */
  loadedRoleId: string | null;

  // ---- Actions ----------------------------------------------------------
  loadLayout: () => Promise<void>;
  silentRefreshLayout: () => Promise<void>;
  loadWidgetClasses: () => Promise<void>;
  refreshWidget: (instanceId: string) => Promise<void>;
  fetchWidgetPage: (instanceId: string, page: number, pageSize: number) => Promise<void>;
  updateLayout: (widgets: UpdateLayoutWidget[]) => Promise<void>;
  addWidget: (payload: AddWidgetRequest) => Promise<void>;
  removeWidget: (instanceId: string) => Promise<void>;
  updateParams: (instanceId: string, parameters: Record<string, string>) => Promise<void>;
  /** Clears all state and marks the new role; consumers should follow up with loadLayout/loadWidgetClasses. */
  resetForRole: (roleId: string) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => {
      // Single-widget fetch — used by loadLayout, refreshWidget, fetchWidgetPage and the auto-refresh intervals.
      const fetchOneWidgetData = async (instanceId: string, page = 1, pageSize = WIDGET_PAGE_SIZE): Promise<void> => {
        try {
          const data = await fetchWidgetData(instanceId, { page, pageSize });
          set((s) => ({
            widgetData: { ...s.widgetData, [instanceId]: data },
            widgetErrors: (() => {
              if (!(instanceId in s.widgetErrors)) return s.widgetErrors;
              const next = { ...s.widgetErrors };
              delete next[instanceId];
              return next;
            })(),
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn(`[dashboardStore] Failed to fetch data for widget ${instanceId}:`, message);
          set((s) => ({ widgetErrors: { ...s.widgetErrors, [instanceId]: message } }));
        }
      };

      return {
        // ---- Initial state ----------------------------------------------
        layout: [],
        widgetData: {},
        widgetErrors: {},
        isLoadingLayout: false,
        layoutError: null,
        widgetClasses: [],
        isLoadingClasses: false,
        classesError: null,
        loadedRoleId: null,

        // ---- Lifecycle --------------------------------------------------
        resetForRole: (roleId) => {
          clearAllIntervals();
          set({
            layout: [],
            widgetData: {},
            widgetErrors: {},
            isLoadingLayout: false,
            layoutError: null,
            widgetClasses: [],
            isLoadingClasses: false,
            classesError: null,
            loadedRoleId: roleId,
          });
        },

        // ---- Reads ------------------------------------------------------
        loadLayout: async () => {
          set({ isLoadingLayout: true, layoutError: null });
          try {
            const response = await fetchDashboardLayout();
            set({ layout: response.widgets });
            await Promise.allSettled(response.widgets.map((w) => fetchOneWidgetData(w.instanceId)));
            setupAutoRefresh(response.widgets, fetchOneWidgetData);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn("[dashboardStore] Failed to load dashboard layout:", message);
            set({ layoutError: message });
          } finally {
            set({ isLoadingLayout: false });
          }
        },

        // Silent refresh: avoids toggling the loading flag so the grid doesn't unmount/remount.
        silentRefreshLayout: async () => {
          try {
            const response = await fetchDashboardLayout();
            set({ layout: response.widgets });
            await Promise.allSettled(response.widgets.map((w) => fetchOneWidgetData(w.instanceId)));
            setupAutoRefresh(response.widgets, fetchOneWidgetData);
          } catch (err) {
            logger.warn("[dashboardStore] Failed to silently refresh layout:", err);
          }
        },

        loadWidgetClasses: async () => {
          set({ isLoadingClasses: true, classesError: null });
          try {
            const response = await fetchWidgetClasses();
            set({ widgetClasses: response.classes });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn("[dashboardStore] Failed to load widget classes:", message);
            set({ classesError: message });
          } finally {
            set({ isLoadingClasses: false });
          }
        },

        refreshWidget: async (instanceId) => {
          await fetchOneWidgetData(instanceId);
        },

        fetchWidgetPage: async (instanceId, page, pageSize) => {
          await fetchOneWidgetData(instanceId, page, pageSize);
        },

        // ---- Writes -----------------------------------------------------
        updateLayout: async (widgets) => {
          // Optimistic update
          set((s) => ({
            layout: s.layout.map((instance) => {
              const update = widgets.find((w) => w.instanceId === instance.instanceId);
              if (!update) return instance;
              return {
                ...instance,
                position: { col: update.col, row: update.row, width: update.width, height: update.height },
              };
            }),
          }));

          try {
            await updateDashboardLayout({ widgets });
          } catch (err) {
            // Log the failure but do NOT re-fetch the layout.
            // Re-fetching would discard any widgets added since the last successful
            // load (e.g. a widget just added whose positions haven't been saved yet
            // because the backend PUT is broken). The optimistic local state is
            // a better UX than reverting to a potentially stale server state.
            logger.warn("[dashboardStore] Failed to persist layout update:", err);
          }
        },

        addWidget: async (payload) => {
          await addDashboardWidget(payload);
          // Use loadLayout (full refresh) to guarantee fresh data from the backend.
          // silentRefreshLayout has a race condition: the GET can arrive before the
          // backend commits the POST, returning the old layout without the new widget.
          await get().loadLayout();
        },

        updateParams: async (instanceId, parameters) => {
          await updateWidgetParams(instanceId, parameters);
          await fetchOneWidgetData(instanceId);
        },

        removeWidget: async (instanceId) => {
          // Optimistic removal
          set((s) => {
            const nextData = { ...s.widgetData };
            delete nextData[instanceId];
            return {
              layout: s.layout.filter((w) => w.instanceId !== instanceId),
              widgetData: nextData,
            };
          });

          // Clear auto-refresh for this widget
          const intervalId = refreshIntervals.get(instanceId);
          if (intervalId) {
            clearInterval(intervalId);
            refreshIntervals.delete(instanceId);
          }

          try {
            await deleteDashboardWidget(instanceId);
          } catch (err) {
            logger.warn("[dashboardStore] Failed to delete widget:", err);
            // Re-fetch to restore server state on failure
            await get().silentRefreshLayout();
          }
        },
      };
    },
    { name: "DashboardStore" }
  )
);
