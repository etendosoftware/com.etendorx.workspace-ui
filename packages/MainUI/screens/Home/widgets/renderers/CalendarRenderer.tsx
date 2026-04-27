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

import type { CalendarWidgetData, CalendarPeriod } from "@workspaceui/api-client/src/api/dashboard";

const STATUS_STYLES: Record<CalendarPeriod["openClose"], { badge: string; label: string }> = {
  O: { badge: "bg-success-light text-success-main", label: "Open" },
  C: { badge: "bg-transparent-neutral-10 text-baseline-50", label: "Closed" },
};

function getStatus(openClose: CalendarPeriod["openClose"]) {
  return STATUS_STYLES[openClose] ?? STATUS_STYLES.C;
}

function formatDate(iso: string): string {
  try {
    // Parse as local date (YYYY-MM-DD) to avoid UTC→local offset shifting the day.
    const [year, month, day] = iso.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

interface CalendarRendererProps {
  data: CalendarWidgetData;
}

export default function CalendarRenderer({ data }: CalendarRendererProps) {
  if (!data.currentPeriod && data.entries.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="CalendarRenderer__empty">
        —
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="CalendarRenderer__content">
      {/* Current period summary */}
      {data.currentPeriod && (
        <div
          className="flex items-center justify-between gap-2 rounded-lg bg-transparent-neutral-5 px-3 py-2"
          data-testid="CalendarRenderer__current">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-baseline-50 uppercase tracking-wide leading-none mb-0.5">
              Current period
            </span>
            <span className="text-sm font-semibold text-baseline-100 truncate">{data.currentPeriod.name}</span>
            <span className="text-xs text-baseline-50">
              {formatDate(data.currentPeriod.start)} – {formatDate(data.currentPeriod.end)}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatus(data.currentPeriod.openClose).badge}`}
            data-testid="CalendarRenderer__current_status">
            {getStatus(data.currentPeriod.openClose).label}
          </span>
        </div>
      )}

      {/* Period entries */}
      {data.entries.length > 0 && (
        <ul className="flex flex-col gap-1" data-testid="CalendarRenderer__entries">
          {data.entries.map((entry, i) => {
            const status = getStatus(entry.openClose);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: calendar entries have no stable display key
              <li
                key={i}
                className="flex items-center justify-between gap-2 py-1 border-t border-transparent-neutral-10"
                data-testid={`CalendarRenderer__entry_${i}`}>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-baseline-100 truncate">{entry.name}</span>
                  <span className="text-xs text-baseline-50">
                    {formatDate(entry.start)} – {formatDate(entry.end)}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.badge}`}
                  data-testid={`CalendarRenderer__entry_status_${i}`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
