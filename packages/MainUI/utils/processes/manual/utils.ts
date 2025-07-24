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
} from "@/utils/processes/manual/constants";
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

export const getParams = ({
  currentButtonId,
  record,
  recordId,
  windowId,
  tabId,
  token,
  isPostedProcess,
}: {
  currentButtonId: string;
  record: Record<string, unknown>;
  recordId: string;
  windowId: string;
  tabId: string;
  token: string | null;
  isPostedProcess: boolean;
}): URLSearchParams => {
  const processActionData = data[currentButtonId as keyof typeof data];
  const commandAction = processActionData.command;

  const docStatus = getDocumentStatus(record);
  const isProcessing = getProcessing(record);
  const adClientId = getAdClientId(record);
  const adOrgId = getAdOrgId(record);

  const params = new URLSearchParams();

  params.append("IsPopUpCall", "1");
  params.append("Command", commandAction);
  params.append("inpcOrderId", recordId);
  params.append("inpKey", recordId);
  params.append("inpwindowId", windowId);
  params.append("inpTabId", tabId);
  params.append("inpadClientId", adClientId);
  params.append("inpadOrgId", adOrgId);
  params.append("inpkeyColumnId", processActionData.inpkeyColumnId);
  params.append("keyColumnName", processActionData.keyColumnName);

  if (isPostedProcess) {
    params.append("inpdocstatus", docStatus);
    params.append("inpprocessing", isProcessing);
    params.append("inpdocaction", "P");
  } else {
    params.append("inpdocstatus", docStatus);
    params.append("inpprocessing", isProcessing);
    params.append("inpdocaction", "CO");
  }

  if (token) {
    params.append("token", token);
  }

  return params;
};
