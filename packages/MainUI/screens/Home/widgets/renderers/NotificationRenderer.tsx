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

import type { NotificationWidgetData, NotificationItem } from "@workspaceui/api-client/src/api/dashboard";

const PRIORITY_STYLES: Record<NotificationItem["priority"], string> = {
  normal: "bg-baseline-10 text-baseline-60",
  high: "bg-error-light text-error-main",
  success: "bg-success-light text-success-main",
};

interface NotificationRendererProps {
  data: NotificationWidgetData;
}

export default function NotificationRenderer({ data }: NotificationRendererProps) {
  if (data.items.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="NotificationRenderer__empty">
        —
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="NotificationRenderer__list">
      {data.items.map((item, i) => (
        <li
          key={`${item.priority}-${item.text}-${item.time}`}
          className="flex items-start gap-2"
          data-testid={`NotificationRenderer__item_${i}`}>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[item.priority]}`}
            data-testid={`NotificationRenderer__badge_${i}`}>
            {item.priority}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-baseline-100 leading-snug">{item.text}</span>
            <span className="text-xs text-baseline-50">{item.time}</span>
          </div>
        </li>
      ))}
      {data.totalCount > data.items.length && (
        <li className="text-xs text-baseline-50" data-testid="NotificationRenderer__more">
          +{data.totalCount - data.items.length} más
        </li>
      )}
    </ul>
  );
}
