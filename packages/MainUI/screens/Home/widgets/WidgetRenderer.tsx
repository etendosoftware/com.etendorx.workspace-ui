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
      return <KpiRenderer data={data as KpiWidgetData} />;
    case "QUERY_LIST":
      return <QueryListRenderer data={data as QueryListWidgetData} />;
    case "HTML":
      return <HtmlRenderer data={data as HtmlWidgetData} />;
    case "URL":
      return <UrlRenderer data={data as UrlWidgetData} />;
    case "NOTIFICATION":
      return <NotificationRenderer data={data as NotificationWidgetData} />;
    case "STOCK_ALERT":
      return <StockAlertRenderer data={data as StockAlertWidgetData} />;
    case "FAVORITES":
      return <FavoritesRenderer data={data as FavoritesWidgetData} />;
    case "RECENT_DOCS":
      return <RecentDocsRenderer data={data as RecentDocsWidgetData} />;
    case "RECENTLY_VIEWED":
      return <RecentlyViewedRenderer data={data as RecentlyViewedWidgetData} />;
    case "PROCESS":
      return <ProcessRenderer data={data as ProcessWidgetData} />;
    default:
      return <FallbackRenderer type={type} />;
  }
}
