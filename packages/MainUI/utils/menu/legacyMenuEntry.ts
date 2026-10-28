/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import { findItemByIdentifier } from "@workspaceui/componentlibrary/src/utils/menuUtils";
import { type ReportPopupBlockedTexts, notifyReportPopupBlocked, tryOpenReportPopup } from "@/utils/reportPopup";
import formsData from "@/utils/processes/forms/data.json";
import type { ExtendedMenu } from "./menuItemDispatch";
import { MENU_ITEM_TYPES } from "./menuItemTypes";

interface FormData {
  paramUrl: string;
}

export interface ManualProcessResult {
  url: string;
  size: "default" | "large";
}

const buildProcessUrl = (processId: string, token: string | null, baseUrl: string): string => {
  const params = new URLSearchParams({
    Command: `BUTTON${processId}`,
    IsPopUpCall: "1",
  });
  if (token) {
    params.append("token", token);
  }
  return `${baseUrl}${API_IFRAME_FORWARD_PATH}/ad_actionButton/ActionButton_Responser.html?${params.toString()}`;
};

/**
 * Builds the Classic `security/Menu.html` URL that loads the given form address. The address is
 * the one the backend resolved for the form (its default mapping, as Classic opens it), so forms
 * provided by modules load from their own path and not from `/ad_forms/`.
 */
const buildFormUrl = (formPath: string, token: string | null, baseUrl: string): string => {
  const params = new URLSearchParams({
    noprefs: "true",
    hideMenu: "true",
    Command: "DEFAULT",
  });
  if (token) {
    params.append("token", token);
  }
  return `${baseUrl}${API_IFRAME_FORWARD_PATH}/security/Menu.html?url=${formPath}&${params.toString()}`;
};

/**
 * Gets the iframe configuration for legacy manual processes (Process/Form types).
 * Process Definition entries are handled separately via ProcessDefinitionModal.
 */
export const getManualProcessConfig = (
  item: ExtendedMenu,
  token: string | null,
  baseUrl: string
): ManualProcessResult | null => {
  if (item.type === MENU_ITEM_TYPES.PROCESS && item.processId) {
    return {
      url: buildProcessUrl(item.processId, token, baseUrl),
      size: "default",
    };
  }

  if (item.type === MENU_ITEM_TYPES.FORM && item.formId) {
    // Prefer formUrl from backend; fall back to data.json for older backend versions
    const formPath = item.formUrl ?? (formsData as Record<string, FormData>)[item.formId]?.paramUrl;
    if (!formPath) return null;
    return { url: buildFormUrl(formPath, token, baseUrl), size: "large" };
  }

  return null;
};

export const getManualProcessUrl = (item: Menu): string | null => {
  return item.processUrl || null;
};

/** ProcessManual and Report entries are opened in Etendo Classic. */
export const isClassicProcessMenuItem = (item: Menu): boolean =>
  item.type === MENU_ITEM_TYPES.PROCESS_MANUAL || item.type === MENU_ITEM_TYPES.REPORT;

/**
 * Opens the Classic URL of a ProcessManual / Report entry: modal processes in a popup, the rest
 * in a new tab. When the browser blocks it, a notice offers to open it manually.
 */
export const openClassicProcessUrl = (
  classicUrl: string,
  isModalProcess: boolean | undefined,
  popupBlockedTexts: ReportPopupBlockedTexts
): void => {
  if (isModalProcess) {
    if (!tryOpenReportPopup(classicUrl)) {
      notifyReportPopupBlocked(() => tryOpenReportPopup(classicUrl), popupBlockedTexts);
    }
    return;
  }

  // Fallback: Open in new tab
  if (!window.open(classicUrl, "_blank")) {
    notifyReportPopupBlocked(() => window.open(classicUrl, "_blank"), popupBlockedTexts);
  }
};

/** Window name and size of the popup that shows the Classic form of a menu entry. */
const LEGACY_POPUP_TARGET = "Test";
const LEGACY_POPUP_FEATURES = "width=950,height=700";

/** Opens the Classic popup; false when the browser blocked it. */
const tryOpenLegacyPopup = (url: string): boolean => {
  const popup = window.open(url, LEGACY_POPUP_TARGET, LEGACY_POPUP_FEATURES);
  return Boolean(popup) && !popup?.closed;
};

/**
 * Opens the Classic form of a menu entry in a popup. When the browser blocks it, a notice offers
 * to open it manually, with the same URL (and so the same token), as reports do.
 */
export const openLegacyManualProcess = (url: string, popupBlockedTexts: ReportPopupBlockedTexts): void => {
  if (!tryOpenLegacyPopup(url)) {
    notifyReportPopupBlocked(() => tryOpenLegacyPopup(url), popupBlockedTexts);
  }
};

/**
 * Looks a stored entry (e.g. a recent item) up in the live menu tree, so it is opened with the
 * fields the menu carries today (form address, process URL...). The match must keep the stored
 * type: a Window whose id equals the entry id must never be taken for it.
 *
 * @returns the live entry, or `null` when the menu no longer has an entry of that type and id.
 */
export const findLiveMenuEntry = (
  menu: Menu[] | null | undefined,
  item: Pick<Menu, "id" | "type">
): ExtendedMenu | null => {
  const found = findItemByIdentifier(menu ?? undefined, item.id);
  if (found?.type !== item.type) return null;
  return found;
};
