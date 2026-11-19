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

import type React from "react";
import type { WidgetType } from "@workspaceui/api-client/src/api/dashboard";

/** Icon of each widget type, shared by the "Add widget" dialog and the header of the widget cards. */
export const WIDGET_TYPE_ICONS: Record<WidgetType, React.ReactElement> = {
  FAVORITES: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  RECENT_DOCS: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  RECENTLY_VIEWED: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  NOTIFICATION: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  STOCK_ALERT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  KPI: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  COPILOT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L9.5 8.5 3 9.27l5 4.87-1.18 6.88L12 17.77l5.18 3.25L16 14.14l5-4.87-6.5-.77L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  QUERY_LIST: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  HTML: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m16 18 6-6-6-6M8 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  URL: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  PROCESS: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  CALENDAR: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * Badge colour per widget type: an 800 text on the 15% tint (a 300 text in dark mode, where these hues are
 * not remapped) keeps every badge above 4.5:1. Blue already flips to a light lilac in dark mode.
 */
export const WIDGET_TYPE_COLOR: Record<WidgetType, string> = {
  FAVORITES: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
  RECENT_DOCS: "bg-blue-500/15 text-blue-800",
  RECENTLY_VIEWED: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
  NOTIFICATION: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  STOCK_ALERT: "bg-red-500/15 text-red-800 dark:text-red-300",
  KPI: "bg-green-500/15 text-green-800 dark:text-green-300",
  COPILOT: "bg-purple-500/15 text-purple-800 dark:text-purple-300",
  QUERY_LIST: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
  HTML: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300",
  URL: "bg-teal-500/15 text-teal-800 dark:text-teal-300",
  PROCESS: "bg-slate-500/15 text-slate-800 dark:text-slate-300",
  CALENDAR: "bg-blue-500/15 text-blue-800",
};

/** Square chip holding the 16px icon of a widget type, in the colour of that type. */
const TYPE_ICON_CHIP_CLASSES =
  "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md [&>svg]:h-4 [&>svg]:w-4";

/**
 * Coloured icon of a widget type. Every card has the same surface; this chip tells the widgets apart.
 *
 * @param type the widget type
 * @returns the icon chip
 */
export const WidgetTypeIcon = ({ type }: { type: WidgetType }) => (
  <span
    className={`${TYPE_ICON_CHIP_CLASSES} ${WIDGET_TYPE_COLOR[type] ?? WIDGET_TYPE_COLOR.PROCESS}`}
    data-testid={`WidgetTypeIcon__${type}`}>
    {WIDGET_TYPE_ICONS[type] ?? WIDGET_TYPE_ICONS.PROCESS}
  </span>
);
