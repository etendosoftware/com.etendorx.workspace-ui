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

import { extractValue } from "@/utils/commons";
import {
  DEFAULT_DOCUMENTS_KEYS,
  DEFAULT_PROCESS_KEYS,
  DEFAULT_AD_CLIENT_ID_KEYS,
  DEFAULT_AD_ORG_ID_KEYS,
  DEFAULT_DOC_STATUS,
  DEFAULT_IS_PROCESSING,
  DEFAULT_AD_CLIENT_ID,
  DEFAULT_AD_ORG_ID,
  DEFAULT_POSTED_KEYS,
  REQUIRED_PARAMS_KEYS,
  DEFAULT_REQUIRED_PARAMS_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID,
  DEFAULT_POSTED,
} from "@/utils/processes/manual/constants";
import type { GetParamsProps } from "@/utils/processes/manual/types";
import data from "@/utils/processes/manual/data.json";

export const getDocumentStatus = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_DOCUMENTS_KEYS, DEFAULT_DOC_STATUS);
};

export const getProcessing = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_PROCESS_KEYS, DEFAULT_IS_PROCESSING);
};

export const getAdClientId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_AD_CLIENT_ID_KEYS, DEFAULT_AD_CLIENT_ID);
};

export const getAdOrgId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_AD_ORG_ID_KEYS, DEFAULT_AD_ORG_ID);
};

export const getBusinessPartnerId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_BUSINESS_PARTNER_ID_KEYS, DEFAULT_BUSINESS_PARTNER_ID);
};

export const checkIfRecordIsPosted = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_POSTED_KEYS, DEFAULT_POSTED);
};

export const getParams = ({
  currentButtonId,
  record,
  recordId,
  windowId,
  tabId,
  tableId,
  token,
  isPostedProcess,
}: GetParamsProps): URLSearchParams => {
  const processActionData = data[currentButtonId as keyof typeof data];
  const commandAction = processActionData.command;

  const docStatus = getDocumentStatus(record);
  const isProcessing = getProcessing(record);
  const adClientId = getAdClientId(record);
  const adOrgId = getAdOrgId(record);
  const businessPartnerId = getBusinessPartnerId(record);
  const isPostedRecord = checkIfRecordIsPosted(record);

  const params = new URLSearchParams();

  params.append(REQUIRED_PARAMS_KEYS.isPopUpCall, DEFAULT_REQUIRED_PARAMS_KEYS.isPopUpCall);
  params.append(REQUIRED_PARAMS_KEYS.command, commandAction);
  params.append(REQUIRED_PARAMS_KEYS.inpcOrderId, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpKey, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpWindowId, windowId);
  params.append(REQUIRED_PARAMS_KEYS.inpwindowId, windowId);
  params.append(REQUIRED_PARAMS_KEYS.inpTabId, tabId);
  params.append(REQUIRED_PARAMS_KEYS.inpTableId, tableId);
  params.append(REQUIRED_PARAMS_KEYS.inpcBpartnerId, businessPartnerId);
  params.append(REQUIRED_PARAMS_KEYS.inpadClientId, adClientId);
  params.append(REQUIRED_PARAMS_KEYS.inpadOrgId, adOrgId);
  params.append(REQUIRED_PARAMS_KEYS.inpkeyColumnId, processActionData.inpkeyColumnId);
  params.append(REQUIRED_PARAMS_KEYS.keyColumnName, processActionData.keyColumnName);
  params.append(REQUIRED_PARAMS_KEYS.inpdocstatus, docStatus);
  params.append(REQUIRED_PARAMS_KEYS.inpprocessing, isProcessing);
  params.append(REQUIRED_PARAMS_KEYS.inpposted, isPostedRecord);

  if (isPostedProcess) {
    params.append(REQUIRED_PARAMS_KEYS.inpdocaction, DEFAULT_REQUIRED_PARAMS_KEYS.inpodcStatusPosted);
  } else {
    params.append(REQUIRED_PARAMS_KEYS.inpdocaction, DEFAULT_REQUIRED_PARAMS_KEYS.inpdocStatus);
  }

  if (token) {
    params.append(REQUIRED_PARAMS_KEYS.token, token);
  }

  return params;
};
