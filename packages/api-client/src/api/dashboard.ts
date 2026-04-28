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
  | "PROCESS"
  | "CALENDAR";

export type WidgetLayer = "SYSTEM" | "CLIENT" | "USER";

export interface WidgetParamListValue {
  value: string;
  label: string;
}

export interface WidgetParam {
  name: string;
  displayName: string;
  description?: string;
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
  available?: boolean;
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
  available?: boolean;
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

export interface CalendarPeriod {
  id: string;
  name: string;
  start: string;
  end: string;
  openClose: "O" | "C";
  type?: string;
}

export interface CalendarWidgetData {
  currentPeriod: CalendarPeriod | null;
  entries: CalendarPeriod[];
  dateFrom: string;
  dateTo: string;
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
  | ProcessWidgetData
  | CalendarWidgetData;

export interface WidgetDataMeta {
  lastUpdate: string;
  totalRows: number | null;
  hasMore: boolean;
}

export interface WidgetDataResponse {
  widgetInstanceId: string;
  type: WidgetType;
  available?: boolean;
  data: WidgetData | null;
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

// ── Serialization helpers ─────────────────────────────────────────────────────

/**
 * Serializes a layout payload to JSON ensuring integer fields are encoded as
 * decimal numbers (e.g. "2.0" instead of "2"). This is required because Java's
 * Jackson parser maps bare JSON integers to java.lang.Integer when deserializing
 * into a generic Map, and the backend casts those values to BigDecimal — which
 * throws a ClassCastException. Sending "2.0" forces Jackson to use Double,
 * which the backend can handle correctly.
 */
function serializeLayoutBody(payload: UpdateLayoutRequest): string {
  const rows = payload.widgets
    .map((w) => {
      const col = `${Math.round(w.col)}.0`;
      const row = `${Math.round(w.row)}.0`;
      const width = `${Math.max(1, Math.round(w.width))}.0`;
      const height = `${Math.max(1, Math.round(w.height))}.0`;
      return `{"instanceId":${JSON.stringify(w.instanceId)},"col":${col},"row":${row},"width":${width},"height":${height},"isVisible":${w.isVisible}}`;
    })
    .join(",");
  return `{"widgets":[${rows}]}`;
}

function serializeAddWidgetBody(payload: AddWidgetRequest): string {
  const parts: string[] = [`"widgetClassId":${JSON.stringify(payload.widgetClassId)}`];
  if (payload.col !== undefined) parts.push(`"col":${Math.round(payload.col)}.0`);
  if (payload.row !== undefined) parts.push(`"row":${Math.round(payload.row)}.0`);
  if (payload.width !== undefined) parts.push(`"width":${Math.max(1, Math.round(payload.width))}.0`);
  if (payload.height !== undefined) parts.push(`"height":${Math.max(1, Math.round(payload.height))}.0`);
  if (payload.parameters !== undefined) parts.push(`"parameters":${JSON.stringify(payload.parameters)}`);
  return `{${parts.join(",")}}`;
}

export interface ToggleFavoriteResponse {
  action: "added" | "removed";
  menuId: string;
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

export async function fetchWidgetData(
  instanceId: string,
  params?: { page?: number; pageSize?: number }
): Promise<WidgetDataResponse> {
  const query = params
    ? `?${new URLSearchParams({ ...(params.page !== undefined && { page: String(params.page) }), ...(params.pageSize !== undefined && { pageSize: String(params.pageSize) }) }).toString()}`
    : "";
  const response = await Metadata.client.request(
    `${DASHBOARD_BASE}/widget/${encodeURIComponent(instanceId)}/data${query}`,
    { method: "GET" }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch widget data for ${instanceId}: ${response.status}`);
  }
  return response.data as WidgetDataResponse;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function updateDashboardLayout(payload: UpdateLayoutRequest): Promise<{ status: string }> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/dashboard/layout`, {
    method: "PUT",
    body: serializeLayoutBody(payload),
    headers: JSON_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Failed to update dashboard layout: ${response.status}`);
  }
  return response.data as { status: string };
}

export async function addDashboardWidget(payload: AddWidgetRequest): Promise<AddWidgetResponse> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/dashboard/widget`, {
    method: "POST",
    body: serializeAddWidgetBody(payload),
    headers: JSON_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Failed to add widget: ${response.status}`);
  }
  return response.data as AddWidgetResponse;
}

export async function fetchFavorites(): Promise<FavoritesWidgetData> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/favorites`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.status}`);
  }
  return response.data as FavoritesWidgetData;
}

export async function toggleFavorite(menuId: string): Promise<ToggleFavoriteResponse> {
  const response = await Metadata.client.request(`${DASHBOARD_BASE}/favorites/toggle`, {
    method: "POST",
    body: JSON.stringify({ menuId }),
    headers: JSON_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle favorite: ${response.status}`);
  }
  return response.data as ToggleFavoriteResponse;
}

export async function updateWidgetParams(
  instanceId: string,
  parameters: Record<string, string>
): Promise<{ status: string }> {
  const response = await Metadata.client.request(
    `${DASHBOARD_BASE}/dashboard/widget/${encodeURIComponent(instanceId)}/params`,
    {
      method: "PATCH",
      body: JSON.stringify({ parameters }),
      headers: JSON_HEADERS,
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to update widget params for ${instanceId}: ${response.status}`);
  }
  return response.data as { status: string };
}

export async function deleteDashboardWidget(instanceId: string): Promise<DeleteWidgetResponse> {
  const response = await Metadata.client.request(
    `${DASHBOARD_BASE}/dashboard/widget/${encodeURIComponent(instanceId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(`Failed to delete widget ${instanceId}: ${response.status}`);
  }
  return response.data as DeleteWidgetResponse;
}
