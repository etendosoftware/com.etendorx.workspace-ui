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

import type { StockAlertWidgetData } from "@workspaceui/api-client/src/api/dashboard";

interface StockAlertRendererProps {
  data: StockAlertWidgetData;
}

function StockLevelBar({ current, minimum }: { current: number; minimum: number }) {
  const pct = minimum > 0 ? Math.min((current / minimum) * 100, 100) : 0;
  const barColor = pct <= 30 ? "bg-error-main" : pct <= 60 ? "bg-warning-main" : "bg-success-main";
  return (
    <div
      className="w-16 h-1.5 rounded-full bg-transparent-neutral-10 overflow-hidden"
      data-testid="StockAlertRenderer__bar">
      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StockAlertRenderer({ data }: StockAlertRendererProps) {
  if (data.items.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="StockAlertRenderer__empty">
        —
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="StockAlertRenderer__list">
      {data.items.map((item) => (
        <li
          key={item.productId}
          className="flex items-center justify-between gap-3"
          data-testid={`StockAlertRenderer__item_${item.productId}`}>
          <span className="text-sm text-baseline-100 truncate flex-1">{item.productName}</span>
          <div className="flex items-center gap-2 shrink-0">
            <StockLevelBar
              current={item.currentStock}
              minimum={item.estimatedStock}
              data-testid="StockLevelBar__7d1af5"
            />
            <span className="text-xs text-baseline-50 tabular-nums">
              {item.currentStock}/{item.estimatedStock} {item.unit}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
