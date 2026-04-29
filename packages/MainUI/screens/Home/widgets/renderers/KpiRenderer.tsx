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

import type { KpiWidgetData } from "@workspaceui/api-client/src/api/dashboard";

interface KpiRendererProps {
  data: KpiWidgetData;
}

export default function KpiRenderer({ data }: KpiRendererProps) {
  let trendColor = "";
  if (data.trend != null) {
    trendColor =
      data.trend.startsWith("+") || data.trend.toLowerCase() === "up" ? "text-success-main" : "text-error-main";
  }

  return (
    <div className="flex flex-col gap-1" data-testid="KpiRenderer__content">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-baseline-100" data-testid="KpiRenderer__value">
          {data.value}
        </span>
        {data.unit && (
          <span className="text-base text-baseline-50" data-testid="KpiRenderer__unit">
            {data.unit}
          </span>
        )}
      </div>
      {data.label && (
        <span className="text-sm text-baseline-50" data-testid="KpiRenderer__label">
          {data.label}
        </span>
      )}
      {data.trend != null && (
        <span className={`text-xs font-medium ${trendColor}`} data-testid="KpiRenderer__trend">
          {data.trend}
        </span>
      )}
    </div>
  );
}
