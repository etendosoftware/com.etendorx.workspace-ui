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

import { Metadata } from "./metadata";

const DASHBOARD_BASE = "sws/com.etendoerp.metadata.meta";

// ── Types ────────────────────────────────────────────────────────────────────

export type WidgetParamType = "TEXT" | "NUMBER" | "BOOLEAN" | "DATE" | "LIST" | "FK";

export type WidgetType =
  | "FAVORITES"
  | "RECENT_DOCS"
  | "RECENTLY_VIEWED"
  | "NOTIFICATION"
  | "STOCK_ALERT"
  | "KPI"
  | "COPILOT"
  | "QUERY_LIST"
  | "HTML"
  | "URL"
  | "PROCESS";

export type WidgetLayer = "SYSTEM" | "CLIENT" | "USER";

export interface WidgetParamListValue {
  value: string;
  label: string;
}

export interface WidgetParam {
  name: string;
  displayName: string;
  type: WidgetParamType;
  required: boolean;
  fixed: boolean;
  defaultValue: string | null;
  listValues?: WidgetParamListValue[];
}

export interface WidgetClass {
  widgetClassId: string;
  name: string;
  type: WidgetType;
  title: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  refreshInterval: number;
  params: WidgetParam[];
}

export interface WidgetClassesResponse {
  classes: WidgetClass[];
}

export interface WidgetPosition {
  col: number;
  row: number;
  width: number;
  height: number;
}

export interface WidgetInstance {
  instanceId: string;
  widgetClassId: string;
  layer: WidgetLayer;
  position: WidgetPosition;
  seqno: number;
  parameters: Record<string, string>;
  name: string;
  type: WidgetType;
  title: string;
  refreshInterval: number;
}

export interface DashboardLayoutResponse {
  widgets: WidgetInstance[];
}

// ── Per-type data payloads ────────────────────────────────────────────────────

export interface KpiWidgetData {
  value: number;
  unit: string;
  label: string;
  trend: string | null;
  chartType: string;
}

export interface QueryListColumn {
  name: string;
  label: string;
}

export interface QueryListWidgetData {
  columns: QueryListColumn[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface HtmlWidgetData {
  content: string;
}

export interface UrlWidgetData {
  url: string;
  sandbox: boolean;
}

export interface ProxyWidgetData {
  result: unknown;
}

export interface NotificationItem {
  text: string;
  priority: "normal" | "high" | "success";
  time: string;
}

export interface NotificationWidgetData {
  items: NotificationItem[];
  totalCount: number;
}

export interface StockAlertItem {
  productName: string;
  productId: string;
  currentStock: number;
  estimatedStock: number;
  unit: string;
}

export interface StockAlertWidgetData {
  items: StockAlertItem[];
}

export interface FavoriteItem {
  label: string;
  icon: string | null;
  type: string;
  windowId: string;
}

export interface FavoritesWidgetData {
  items: FavoriteItem[];
}

export interface RecentDocItem {
  type: string;
  recordId: string;
  label: string;
  time: string;
}

export interface RecentDocsWidgetData {
  items: RecentDocItem[];
}

export interface RecentlyViewedWidgetData {
  items: RecentDocItem[];
}

export interface CopilotWidgetData {
  messages: unknown[];
}

export interface ProcessWidgetData {
  status: "success" | "error";
  message: string;
  result: {
    processId: string;
    name: string;
  };
}

export type WidgetData =
  | KpiWidgetData
  | QueryListWidgetData
  | HtmlWidgetData
  | UrlWidgetData
  | ProxyWidgetData
  | NotificationWidgetData
  | StockAlertWidgetData
  | FavoritesWidgetData
  | RecentDocsWidgetData
  | RecentlyViewedWidgetData
  | CopilotWidgetData
  | ProcessWidgetData;

export interface WidgetDataMeta {
  lastUpdate: string;
  totalRows: number | null;
  hasMore: boolean;
}

export interface WidgetDataResponse {
  widgetInstanceId: string;
  type: WidgetType;
  data: WidgetData;
  meta: WidgetDataMeta;
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface UpdateLayoutWidget {
  instanceId: string;
  col: number;
  row: number;
  width: number;
  height: number;
  isVisible: boolean;
}

export interface UpdateLayoutRequest {
  widgets: UpdateLayoutWidget[];
}

export interface AddWidgetRequest {
  widgetClassId: string;
  col?: number;
  row?: number;
  width?: number;
  height?: number;
  parameters?: Record<string, string | number | boolean>;
}

export interface AddWidgetResponse {
  instanceId: string;
  status: string;
}

export interface DeleteWidgetResponse {
  status: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchWidgetClasses(): Promise<WidgetClassesResponse> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/widget/classes`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch widget classes: ${response.status}`);
  }
  return response.data as WidgetClassesResponse;
}

export async function fetchDashboardLayout(): Promise<DashboardLayoutResponse> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/dashboard/layout`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard layout: ${response.status}`);
  }
  return response.data as DashboardLayoutResponse;
}

export async function fetchWidgetData(instanceId: string): Promise<WidgetDataResponse> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/widget/${encodeURIComponent(instanceId)}/data`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch widget data for ${instanceId}: ${response.status}`);
  }
  return response.data as WidgetDataResponse;
}

export async function updateDashboardLayout(payload: UpdateLayoutRequest): Promise<{ status: string }> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/dashboard/layout`, {
    method: "PUT",
    body: payload as unknown as Record<string, unknown>,
  });
  if (!response.ok) {
    throw new Error(`Failed to update dashboard layout: ${response.status}`);
  }
  return response.data as { status: string };
}

export async function addDashboardWidget(payload: AddWidgetRequest): Promise<AddWidgetResponse> {
  const response = await Metadata.client.post(`${DASHBOARD_BASE}/dashboard/widget`, payload as unknown as Record<string, unknown>);
  if (!response.ok) {
    throw new Error(`Failed to add widget: ${response.status}`);
  }
  return response.data as AddWidgetResponse;
}

export async function deleteDashboardWidget(instanceId: string): Promise<DeleteWidgetResponse> {
  const response = await Metadata.client.request(
    `${DASHBOARD_BASE}/dashboard/widget/${encodeURIComponent(instanceId)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(`Failed to delete widget ${instanceId}: ${response.status}`);
  }
  return response.data as DeleteWidgetResponse;
}
