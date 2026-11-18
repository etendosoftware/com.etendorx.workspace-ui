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
import { useTranslation } from "@/hooks/useTranslation";
import { WIDGET_EMPTY_TEXT_CLASSES } from "./chipClasses";

const PRIORITY_STYLES: Record<NotificationItem["priority"], string> = {
  normal: "bg-baseline-10 text-baseline-60",
  high: "bg-error-light text-error-main",
  success: "bg-success-light text-success-main",
};

/** Placeholder of the hidden-items label (`dashboard.widget.more`). */
const COUNT_PLACEHOLDER = "{{count}}";

/**
 * Local date and time of an item, or the raw value when it is not a date.
 *
 * @param time ISO timestamp sent by the server
 * @returns the text to show
 */
export const formatNotificationTime = (time: string): string => {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? time : date.toLocaleString();
};

interface NotificationRendererProps {
  data: NotificationWidgetData;
}

export default function NotificationRenderer({ data }: NotificationRendererProps) {
  const { t } = useTranslation();
  if (data.items.length === 0) {
    return (
      <p className={WIDGET_EMPTY_TEXT_CLASSES} data-testid="NotificationRenderer__empty">
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
          {!item.title && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[item.priority]}`}
              data-testid={`NotificationRenderer__badge_${i}`}>
              {item.priority}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            {item.title && (
              <span className="text-xs font-semibold text-baseline-70" data-testid={`NotificationRenderer__title_${i}`}>
                {item.title}
              </span>
            )}
            <span className="text-sm text-baseline-100 leading-snug">{item.text}</span>
            <span className="text-xs text-baseline-60">{item.time ? formatNotificationTime(item.time) : ""}</span>
          </div>
        </li>
      ))}
      {data.totalCount > data.items.length && (
        <li className="text-xs text-baseline-60" data-testid="NotificationRenderer__more">
          {t("dashboard.widget.more").replace(COUNT_PLACEHOLDER, String(data.totalCount - data.items.length))}
        </li>
      )}
    </ul>
  );
}
