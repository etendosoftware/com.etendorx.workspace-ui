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
  REQUIRED_PARAMS_KEYS,
  DEFAULT_REQUIRED_PARAMS_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID,
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

  const params = new URLSearchParams();

  params.append(REQUIRED_PARAMS_KEYS.isPopUpCall, DEFAULT_REQUIRED_PARAMS_KEYS.isPopUpCall);
  params.append(REQUIRED_PARAMS_KEYS.command, commandAction);
  params.append(REQUIRED_PARAMS_KEYS.inpcOrderId, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpKey, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpWindowId, windowId);
  params.append(REQUIRED_PARAMS_KEYS.inpTabId, tabId);
  params.append(REQUIRED_PARAMS_KEYS.inpTableId, tableId);
  params.append(REQUIRED_PARAMS_KEYS.inpcBpartnerId, businessPartnerId);
  params.append(REQUIRED_PARAMS_KEYS.inpadClientId, adClientId);
  params.append(REQUIRED_PARAMS_KEYS.inpadOrgId, adOrgId);
  params.append(REQUIRED_PARAMS_KEYS.inpkeyColumnId, processActionData.inpkeyColumnId);
  params.append(REQUIRED_PARAMS_KEYS.keyColumnName, processActionData.keyColumnName);
  params.append(REQUIRED_PARAMS_KEYS.inpdocstatus, docStatus);
  params.append(REQUIRED_PARAMS_KEYS.inpprocessing, isProcessing);

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
