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

type SourceObject = Record<string, any>;
type TargetObject = Record<string, any>;

export function mapKeysWithDefaults(source: SourceObject): TargetObject {
  const keyMap: Record<string, { target: string; default: any }> = {
    inpdocumentno: { target: "payment_documentno", default: null },
    inpporeference: { target: "reference_no", default: null },
    inpcCurrencyId: { target: "c_currency_id", default: null },
    inpcBpartnerId: { target: "received_from", default: null },
    inpfinPaymentmethodId: { target: "fin_paymentmethod_id", default: null },
    fin_payment_id: { target: "fin_payment_id", default: null },
    inpgrandtotal: { target: "actual_payment", default: 0 },
    inpdateacct: { target: "payment_date", default: null },
    inptotallines: { target: "amount_inv_ords", default: 0 },
    inpissotrx: { target: "issotrx", default: false },
    inpcOrderId: { target: "c_order_id", default: null },
    DOCBASETYPE: { target: "DOCBASETYPE", default: "ARR" },
    inpadOrgId: { target: "ad_org_id", default: null },
    converted_amount: { target: "conversion_rate", default: 0 },
    "Action Regarding Document": { target: "document_action", default: null },
    "Converted Amount": { target: "converted_amount", default: null },
    "Deposit To": { target: "fin_financial_account_id", default: null },
  };

  const result: TargetObject = {};

  for (const [key, value] of Object.entries(source)) {
    let mappedValue = value !== "" && value != null ? value : keyMap[key]?.default;
    mappedValue = mappedValue === "Y" ? true : mappedValue === "N" ? false : mappedValue;

    if (keyMap[key]) {
      result[keyMap[key].target] = mappedValue;
    } else {
      result[key] = mappedValue;
    }
  }

  for (const { target, default: defaultValue } of Object.values(keyMap)) {
    if (!(target in result)) {
      result[target] = defaultValue;
    }
  }

  function recursiveUpdateSelection(obj: any, parentActualPayment?: number) {
    if (!obj || typeof obj !== "object") return;

    const currentActualPayment = obj.actual_payment ?? parentActualPayment;

    for (const [key, value] of Object.entries(obj)) {
      if (key === "_selection" && Array.isArray(value)) {
        obj[key] = value.map((item: any) => ({
          ...item,
          amount: currentActualPayment ?? 0,
        }));
      } else if (typeof value === "object") {
        recursiveUpdateSelection(value, currentActualPayment);
      }
    }
  }

  recursiveUpdateSelection(result);

  return transformDates(result);
}

export function transformDates(obj: any): any {
  if (typeof obj === "string") {
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    return dateRegex.test(obj) ? obj.replace(dateRegex, "$3-$2-$1") : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(transformDates);
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, transformDates(value)]));
  }
  return obj;
}
