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
import { useOpenAlertManagement } from "@/hooks/useOpenAlertManagement";
import { useAcknowledgeAlerts } from "./useAcknowledgeAlerts";
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

/** Small text buttons of the widget ("Mark all as read", "View all"). */
const LINK_BUTTON_CLASSES =
  "text-xs font-medium text-(--color-dynamic-main) hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-wait";
/** Round "mark as read" button of an item, in the ink of the widget header icons. */
const ITEM_ACTION_CLASSES =
  "shrink-0 ml-auto rounded p-1 text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer disabled:cursor-wait";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Ids of the items that can be marked as read.
 *
 * @param items the listed items
 * @returns their alert ids
 */
export const getAlertIds = (items: NotificationItem[]): string[] =>
  items.map((item) => item.id).filter((id): id is string => Boolean(id));

interface NotificationRendererProps {
  data: NotificationWidgetData;
  /** Reloads the widget after alerts are marked as read. */
  onDataChanged?: () => Promise<void> | void;
}

export default function NotificationRenderer({ data, onDataChanged }: NotificationRendererProps) {
  const { t } = useTranslation();
  const openAlertManagement = useOpenAlertManagement();
  const { acknowledge, isAcknowledging } = useAcknowledgeAlerts(onDataChanged);
  const alertIds = getAlertIds(data.items);

  return (
    <div className="flex flex-col gap-2" data-testid="NotificationRenderer__container">
      <div className="flex items-center justify-end gap-3">
        {alertIds.length > 0 && (
          <button
            type="button"
            onClick={() => acknowledge(alertIds)}
            disabled={isAcknowledging}
            className={LINK_BUTTON_CLASSES}
            data-testid="NotificationRenderer__mark_all">
            {t("dashboard.widget.markAllRead")}
          </button>
        )}
        <button
          type="button"
          onClick={openAlertManagement}
          className={LINK_BUTTON_CLASSES}
          data-testid="NotificationRenderer__view_all">
          {t("dashboard.widget.viewAllAlerts")}
        </button>
      </div>
      {data.items.length === 0 ? (
        <p className={WIDGET_EMPTY_TEXT_CLASSES} data-testid="NotificationRenderer__empty">
          {t("dashboard.widget.emptyNotifications")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="NotificationRenderer__list">
          {data.items.map((item, i) => (
            <li
              key={item.id ?? `${item.priority}-${item.text}-${item.time}`}
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
                  <span
                    className="text-xs font-semibold text-baseline-70"
                    data-testid={`NotificationRenderer__title_${i}`}>
                    {item.title}
                  </span>
                )}
                <span className="text-sm text-baseline-100 leading-snug">{item.text}</span>
                <span className="text-xs text-baseline-60">{item.time ? formatNotificationTime(item.time) : ""}</span>
              </div>
              {item.id && (
                <button
                  type="button"
                  onClick={() => acknowledge([item.id as string])}
                  disabled={isAcknowledging}
                  title={t("dashboard.widget.markRead")}
                  aria-label={t("dashboard.widget.markRead")}
                  className={ITEM_ACTION_CLASSES}
                  data-testid={`NotificationRenderer__mark_${i}`}>
                  <CheckIcon data-testid="CheckIcon__a5fc5f" />
                </button>
              )}
            </li>
          ))}
          {data.totalCount > data.items.length && (
            <li className="text-xs text-baseline-60" data-testid="NotificationRenderer__more">
              {t("dashboard.widget.more").replace(COUNT_PLACEHOLDER, String(data.totalCount - data.items.length))}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
