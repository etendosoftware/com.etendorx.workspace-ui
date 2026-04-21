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

import type {
  WidgetType,
  WidgetData,
  KpiWidgetData,
  QueryListWidgetData,
  HtmlWidgetData,
  UrlWidgetData,
  NotificationWidgetData,
  StockAlertWidgetData,
  FavoritesWidgetData,
  RecentDocsWidgetData,
  RecentlyViewedWidgetData,
  ProcessWidgetData,
} from "@workspaceui/api-client/src/api/dashboard";
import KpiRenderer from "./renderers/KpiRenderer";
import QueryListRenderer from "./renderers/QueryListRenderer";
import HtmlRenderer from "./renderers/HtmlRenderer";
import UrlRenderer from "./renderers/UrlRenderer";
import NotificationRenderer from "./renderers/NotificationRenderer";
import StockAlertRenderer from "./renderers/StockAlertRenderer";
import FavoritesRenderer from "./renderers/FavoritesRenderer";
import RecentDocsRenderer from "./renderers/RecentDocsRenderer";
import RecentlyViewedRenderer from "./renderers/RecentlyViewedRenderer";
import ProcessRenderer from "./renderers/ProcessRenderer";
import FallbackRenderer from "./renderers/FallbackRenderer";

interface WidgetRendererProps {
  type: WidgetType;
  data: WidgetData;
}

export default function WidgetRenderer({ type, data }: WidgetRendererProps) {
  switch (type) {
    case "KPI":
      return <KpiRenderer data={data as KpiWidgetData} data-testid="KpiRenderer__9fb9f4" />;
    case "QUERY_LIST":
      return <QueryListRenderer data={data as QueryListWidgetData} data-testid="QueryListRenderer__9fb9f4" />;
    case "HTML":
      return <HtmlRenderer data={data as HtmlWidgetData} data-testid="HtmlRenderer__9fb9f4" />;
    case "URL":
      return <UrlRenderer data={data as UrlWidgetData} data-testid="UrlRenderer__9fb9f4" />;
    case "NOTIFICATION":
      return <NotificationRenderer data={data as NotificationWidgetData} data-testid="NotificationRenderer__9fb9f4" />;
    case "STOCK_ALERT":
      return <StockAlertRenderer data={data as StockAlertWidgetData} data-testid="StockAlertRenderer__9fb9f4" />;
    case "FAVORITES":
      return <FavoritesRenderer data={data as FavoritesWidgetData} data-testid="FavoritesRenderer__9fb9f4" />;
    case "RECENT_DOCS":
      return <RecentDocsRenderer data={data as RecentDocsWidgetData} data-testid="RecentDocsRenderer__9fb9f4" />;
    case "RECENTLY_VIEWED":
      return (
        <RecentlyViewedRenderer data={data as RecentlyViewedWidgetData} data-testid="RecentlyViewedRenderer__9fb9f4" />
      );
    case "PROCESS":
      return <ProcessRenderer data={data as ProcessWidgetData} data-testid="ProcessRenderer__9fb9f4" />;
    default:
      return <FallbackRenderer type={type} data-testid="FallbackRenderer__9fb9f4" />;
  }
}
