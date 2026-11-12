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

import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import type { EntityData, Tab, TabPrintConfig } from "@workspaceui/api-client/src/api/types";
import { isUnsavedRow } from "@/utils/toolbar/auditTrail";

/**
 * Business Partner header tab. Its print process is a statistics sheet of a single partner, so
 * classic disables Print with more than one record selected (Issue 0023270, ob-toolbar.js).
 */
export const BUSINESS_PARTNER_TAB_ID = "220";

/**
 * Classic page that stores the selected records in session and opens the print process
 * (`OB.ToolbarUtils.print`), served through the `/meta/legacy` forward.
 */
export const PRINTER_REPORTS_LEGACY_PATH = "/businessUtility/PrinterReports.html";
const PRINTER_REPORTS_COMMAND = "DEFAULT";
/** Button type classic sends for Print, which applies the AttachByDefault preference. */
const PRINT_BUTTON_TYPE = "printButton";

const COMMAND_PARAM = "Command";
const PDF_PATH_PARAM = "inppdfpath";
const HIDDEN_KEY_PARAM = "inphiddenkey";
const HIDDEN_VALUE_PARAM = "inphiddenvalue";
const DIRECT_PRINT_PARAM = "inpdirectprint";
const BUTTON_TYPE_PARAM = "inpButtonType";
const TAB_ID_PARAM = "inpTabId";
const WINDOW_ID_PARAM = "inpwindowId";
const TOKEN_PARAM = "token";
const YES = "Y";
const NO = "N";
const RECORD_IDS_SEPARATOR = ",";

/** Separate browser window, like the classic print popup. */
const PRINT_POPUP_NAME = "etendoPrint";
const PRINT_POPUP_FEATURES = "width=900,height=600,resizable=yes,scrollbars=yes";

interface PrintSelectionParams {
  tabId: string;
  selectedRecords: EntityData[];
  isNewRecord: boolean;
}

/**
 * Whether the selection can be emailed. Same rules as the classic
 * `BUTTON_PROPERTIES.email.updateState`: a selected record that is already saved.
 */
export const isEmailUnavailable = ({ selectedRecords, isNewRecord }: PrintSelectionParams): boolean =>
  selectedRecords.length === 0 || isNewRecord || selectedRecords.some(isUnsavedRow);

/**
 * Whether the selection can be printed. Same rules as the classic
 * `BUTTON_PROPERTIES.print.updateState`: the Email rules, plus a single record on the Business
 * Partner tab.
 */
export const isPrintUnavailable = (params: PrintSelectionParams): boolean =>
  isEmailUnavailable(params) || (params.tabId === BUSINESS_PARTNER_TAB_ID && params.selectedRecords.length > 1);

interface BuildLegacyPrintUrlParams {
  publicHost: string;
  tab: Tab;
  printConfig: TabPrintConfig;
  recordIds: string[];
  token?: string | null;
}

/**
 * Builds the URL of the classic `PrinterReports` page with the same parameters
 * `OB.ToolbarUtils.print` sends: the print URL, the key column and the selected record ids.
 */
export const buildLegacyPrintUrl = ({
  publicHost,
  tab,
  printConfig,
  recordIds,
  token,
}: BuildLegacyPrintUrlParams): string => {
  const params = new URLSearchParams({
    [COMMAND_PARAM]: PRINTER_REPORTS_COMMAND,
    [PDF_PATH_PARAM]: printConfig.url,
    [HIDDEN_VALUE_PARAM]: recordIds.join(RECORD_IDS_SEPARATOR),
    [DIRECT_PRINT_PARAM]: printConfig.directPrint ? YES : NO,
    [BUTTON_TYPE_PARAM]: PRINT_BUTTON_TYPE,
    [TAB_ID_PARAM]: tab.id,
    [WINDOW_ID_PARAM]: tab.window,
  });
  if (printConfig.keyParam) {
    params.set(HIDDEN_KEY_PARAM, printConfig.keyParam);
  }
  if (token) {
    params.set(TOKEN_PARAM, token);
  }
  return `${publicHost}${API_IFRAME_FORWARD_PATH}${PRINTER_REPORTS_LEGACY_PATH}?${params.toString()}`;
};

/**
 * Opens the classic print page in its own browser window.
 *
 * @returns `false` when the browser blocked the window.
 */
export const openLegacyPrintPopup = (url: string): boolean =>
  Boolean(window.open(url, PRINT_POPUP_NAME, PRINT_POPUP_FEATURES));
