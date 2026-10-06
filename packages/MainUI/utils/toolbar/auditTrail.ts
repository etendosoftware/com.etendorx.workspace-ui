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
import type { EntityData } from "@workspaceui/api-client/src/api/types";

/**
 * Whether the Audit Trail viewer can be opened for the current selection. Mirrors the
 * classic `BUTTON_PROPERTIES.audit.updateState` rules (ob-toolbar.js).
 */
export const AUDIT_TRAIL_STATUS = {
  /** No selection (popup without a record) or one saved record that was modified. */
  READY: "READY",
  /** More than one record selected — classic warns with message JS28. */
  MULTIPLE: "MULTIPLE",
  /** A new unsaved record, or a record never modified. */
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type AuditTrailStatus = (typeof AUDIT_TRAIL_STATUS)[keyof typeof AUDIT_TRAIL_STATUS];

/** Classic Audit Trail popup (`AuditTrailPopup`), served through the `/meta/legacy` forward. */
export const AUDIT_TRAIL_LEGACY_PATH = "/businessUtility/AuditTrail.html";
const AUDIT_TRAIL_HISTORY_COMMAND = "POPUP_HISTORY";

const COMMAND_PARAM = "Command";
const TAB_ID_PARAM = "inpTabId";
const TABLE_ID_PARAM = "inpTableId";
const RECORD_ID_PARAM = "inpRecordId";
const CLIENT_TZ_OFFSET_PARAM = "inpClientTZOffset";
const TOKEN_PARAM = "token";

/**
 * Separate browser window with the classic popup size (`OB.ToolbarUtils.showAuditTrail` opens it
 * as a 900×600 popup). An iframe is not viable: the classic DataGrid reads `parent.frameMenu`,
 * which a cross-origin parent window blocks.
 */
const AUDIT_TRAIL_POPUP_NAME = "etendoAuditTrail";
const AUDIT_TRAIL_POPUP_FEATURES = "width=900,height=600,resizable=yes,scrollbars=yes";

const CREATION_DATE_PROPERTY = "creationDate";
const UPDATED_PROPERTY = "updated";
/** Id prefix the grid gives to inline rows that are not saved yet. */
const UNSAVED_ROW_ID_PREFIX = "new_";

const toTime = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const time = Date.parse(String(value));
  return Number.isNaN(time) ? null : time;
};

/**
 * Tells whether a record was never modified: both `creationDate` and `updated` are present and
 * equal. Same check as the classic `BUTTON_PROPERTIES.audit.updateState`, which leaves the button
 * enabled when a timestamp is missing.
 */
export const isRecordNeverModified = (record: EntityData): boolean => {
  const created = toTime(record[CREATION_DATE_PROPERTY]);
  const updated = toTime(record[UPDATED_PROPERTY]);
  if (created === null || updated === null) {
    return false;
  }
  return created === updated;
};

const isUnsavedRow = (record: EntityData): boolean => String(record.id).startsWith(UNSAVED_ROW_ID_PREFIX);

interface AuditTrailStatusParams {
  selectedRecords: EntityData[];
  isNewRecord: boolean;
}

/**
 * Resolves whether the Audit Trail can be opened for the given selection. Without a selection
 * it stays available, as in Classic: the popup opens without a record, which still gives access
 * to the deleted records of the tab.
 */
export const getAuditTrailStatus = ({ selectedRecords, isNewRecord }: AuditTrailStatusParams): AuditTrailStatus => {
  if (selectedRecords.length > 1) {
    return AUDIT_TRAIL_STATUS.MULTIPLE;
  }
  if (isNewRecord) {
    return AUDIT_TRAIL_STATUS.UNAVAILABLE;
  }
  const [record] = selectedRecords;
  if (record && (isUnsavedRow(record) || isRecordNeverModified(record))) {
    return AUDIT_TRAIL_STATUS.UNAVAILABLE;
  }
  return AUDIT_TRAIL_STATUS.READY;
};

interface BuildAuditTrailUrlParams {
  publicHost: string;
  tabId: string;
  tableId: string;
  /** Omitted when nothing is selected, like the classic popup call. */
  recordId?: string;
  token?: string | null;
}

/**
 * Builds the URL of the classic Audit Trail popup. The browser time zone offset is sent so
 * audit times are shown in the user's local time, exactly as `OB.ToolbarUtils.showAuditTrail`.
 */
export const buildAuditTrailUrl = ({
  publicHost,
  tabId,
  tableId,
  recordId,
  token,
}: BuildAuditTrailUrlParams): string => {
  const params = new URLSearchParams({
    [COMMAND_PARAM]: AUDIT_TRAIL_HISTORY_COMMAND,
    [TAB_ID_PARAM]: tabId,
    [TABLE_ID_PARAM]: tableId,
    [CLIENT_TZ_OFFSET_PARAM]: String(new Date().getTimezoneOffset()),
  });
  if (recordId) {
    params.set(RECORD_ID_PARAM, recordId);
  }
  if (token) {
    params.set(TOKEN_PARAM, token);
  }
  return `${publicHost}${API_IFRAME_FORWARD_PATH}${AUDIT_TRAIL_LEGACY_PATH}?${params.toString()}`;
};

/**
 * Opens the classic Audit Trail popup in its own browser window.
 *
 * @returns `false` when the browser blocked the window.
 */
export const openAuditTrailPopup = (url: string): boolean =>
  Boolean(window.open(url, AUDIT_TRAIL_POPUP_NAME, AUDIT_TRAIL_POPUP_FEATURES));
