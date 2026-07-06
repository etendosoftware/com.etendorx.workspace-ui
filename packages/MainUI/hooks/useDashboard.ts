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

import { useEffect } from "react";
import { useDashboardStore, WIDGET_PAGE_SIZE } from "@/stores/dashboardStore";
import type {
  WidgetInstance,
  WidgetClass,
  WidgetDataResponse,
  UpdateLayoutWidget,
  AddWidgetRequest,
} from "@workspaceui/api-client/src/api/dashboard";

export { WIDGET_PAGE_SIZE };

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

/**
 * Reads dashboard state from a Zustand store and triggers an initial fetch
 * only when the role changes. Lifting state out of the component lets the
 * cache survive Home unmount/remount cycles (route changes, window close),
 * so the layout and widget data don't re-fetch on every navigation.
 */
export function useDashboard(roleId?: string): UseDashboardReturn {
  const layout = useDashboardStore((s) => s.layout);
  const widgetData = useDashboardStore((s) => s.widgetData);
  const widgetErrors = useDashboardStore((s) => s.widgetErrors);
  const isLoadingLayout = useDashboardStore((s) => s.isLoadingLayout);
  const layoutError = useDashboardStore((s) => s.layoutError);
  const widgetClasses = useDashboardStore((s) => s.widgetClasses);
  const isLoadingClasses = useDashboardStore((s) => s.isLoadingClasses);
  const classesError = useDashboardStore((s) => s.classesError);

  const loadWidgetClasses = useDashboardStore((s) => s.loadWidgetClasses);
  const refreshWidget = useDashboardStore((s) => s.refreshWidget);
  const fetchWidgetPage = useDashboardStore((s) => s.fetchWidgetPage);
  const updateLayout = useDashboardStore((s) => s.updateLayout);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const updateParams = useDashboardStore((s) => s.updateParams);

  useEffect(() => {
    if (!roleId) return;
    const state = useDashboardStore.getState();
    if (state.loadedRoleId === roleId) return;
    state.resetForRole(roleId);
    state.loadLayout();
    state.loadWidgetClasses();
  }, [roleId]);

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
