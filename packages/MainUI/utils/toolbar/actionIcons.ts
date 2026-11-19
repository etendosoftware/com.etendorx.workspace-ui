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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview Outline icons that replace the toolbar icons stored in the database when those do not match the
 * rest of the set: a full-colour Excel logo and three solid glyphs among outline ones.
 *
 * They are monochrome SVGs drawn with the same ink as the other database icons and render through the same
 * `<img class="icon-base64">`, so hover, disabled and dark mode keep working through the existing global rules.
 * Buttons not listed here, including custom ones added by modules, keep their database icon.
 */

import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";

/** Ink of the toolbar icons stored in the database. */
const ICON_INK = "#102030";

/** Funnel-like list of decreasing bars: the advanced filter builder, distinct from the quick filter funnel. */
const ADVANCED_FILTERS_PATH =
  "M3 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm3 6a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm4 6a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z";

/** Window outline with a header band. */
const TAB_CONTROL_PATH =
  "M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm-1 8v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9H4Zm16-2V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3h16Z";

/** Two panels side by side (`columns.svg` of the component library). */
const SHOW_TABLE_AND_FORM_PATH =
  "M2.87868 2.87868C3.44129 2.31607 4.20435 2 5 2H19C19.7957 2 20.5587 2.31607 21.1213 2.87868C21.6839 3.44129 22 4.20435 22 5V19C22 19.7957 21.6839 20.5587 21.1213 21.1213C20.5587 21.6839 19.7957 22 19 22H5C4.20435 22 3.44129 21.6839 2.87868 21.1213C2.31607 20.5587 2 19.7957 2 19V5C2 4.20435 2.31607 3.44129 2.87868 2.87868ZM5 4C4.73478 4 4.48043 4.10536 4.29289 4.29289C4.10536 4.48043 4 4.73478 4 5V19C4 19.2652 4.10536 19.5196 4.29289 19.7071C4.48043 19.8946 4.73478 20 5 20H11V4H5ZM13 4V20H19C19.2652 20 19.5196 19.8946 19.7071 19.7071C19.8946 19.5196 20 19.2652 20 19V5C20 4.73478 19.8946 4.48043 19.7071 4.29289C19.5196 4.10536 19.2652 4 19 4H13Z";

/** Arrow into a tray (`download.svg` of the component library). */
const EXPORT_CSV_PATH =
  "M12 2C12.5523 2 13 2.44772 13 3V12.5858L16.2929 9.29289C16.6834 8.90237 17.3166 8.90237 17.7071 9.29289C18.0976 9.68342 18.0976 10.3166 17.7071 10.7071L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L11 12.5858V3C11 2.44772 11.4477 2 12 2ZM3 14C3.55228 14 4 14.4477 4 15V19C4 19.2652 4.10536 19.5196 4.29289 19.7071C4.48043 19.8946 4.73478 20 5 20H19C19.2652 20 19.5196 19.8946 19.7071 19.7071C19.8946 19.5196 20 19.2652 20 19V15C20 14.4477 20.4477 14 21 14C21.5523 14 22 14.4477 22 15V19C22 19.7957 21.6839 20.5587 21.1213 21.1213C20.5587 21.6839 19.7957 22 19 22H5C4.20435 22 3.44129 21.6839 2.87868 21.1213C2.31607 20.5587 2 19.7957 2 19V15C2 14.4477 2.44772 14 3 14Z";

/**
 * Builds the data URI of a one-path icon.
 *
 * @param path the path data, drawn on a 24×24 box with the even-odd rule
 * @returns an `image/svg+xml` data URI
 */
export const toIconDataUri = (path: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${ICON_INK}" fill-rule="evenodd" clip-rule="evenodd" d="${path}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const ACTION_ICON_PATHS: Readonly<Record<string, string>> = {
  [TOOLBAR_BUTTONS_ACTIONS.ADVANCED_FILTERS]: ADVANCED_FILTERS_PATH,
  [TOOLBAR_BUTTONS_ACTIONS.TAB_CONTROL]: TAB_CONTROL_PATH,
  [TOOLBAR_BUTTONS_ACTIONS.SHOW_TABLE_AND_FORM]: SHOW_TABLE_AND_FORM_PATH,
  [TOOLBAR_BUTTONS_ACTIONS.EXPORT_CSV]: EXPORT_CSV_PATH,
};

/**
 * Icon of a toolbar button: the outline replacement of its action when there is one, else the stored icon.
 *
 * @param action the button action
 * @param storedIcon the icon stored in the database for the button
 * @returns the icon key to render
 */
export const resolveToolbarIcon = (action: string, storedIcon?: string | null): string | null | undefined => {
  const path = ACTION_ICON_PATHS[action];
  if (path) return toIconDataUri(path);
  return storedIcon;
};
