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

export const DEFAULT_DOC_STATUS = "DR";
export const DEFAULT_IS_PROCESSING = "N";
export const DEFAULT_AD_CLIENT_ID = "23C59575B9CF467C9620760EB255B389";
export const DEFAULT_AD_ORG_ID = "7BABA5FF80494CAFA54DEBD22EC46F01";
export const DEFAULT_BUSINESS_PARTNER_ID = "";

export const DEFAULT_DOCUMENTS_KEYS = ["documentStatus", "docstatus", "docStatus", "DOCSTATUS", "DocStatus"];
export const DEFAULT_PROCESS_KEYS = ["processing", "isprocessing", "isProcessing", "PROCESSING", "Processing"];
export const DEFAULT_AD_CLIENT_ID_KEYS = [
  "adClientId",
  "AD_Client_ID",
  "aD_Client_ID",
  "adclientid",
  "AdClientId",
  "client",
];
export const DEFAULT_AD_ORG_ID_KEYS = ["adOrgId", "AD_Org_ID", "aD_Org_ID", "adorgid", "AdOrgId", "organization"];
export const DEFAULT_BUSINESS_PARTNER_ID_KEYS = ["businessPartner", "cBpartnerId", "CBPartnerId", "c_bpartner_id"];

export const REQUIRED_PARAMS_KEYS = {
  isPopUpCall: "IsPopUpCall",
  command: "Command",
  inpcOrderId: "inpcOrderId",
  inpKey: "inpKey",
  inpwindowId: "inpwindowId",
  inpWindowId: "inpWindowId",
  inpTabId: "inpTabId",
  inpTableId: "inpTableId",
  inpcBpartnerId: "inpcBpartnerId",
  inpadClientId: "inpadClientId",
  inpadOrgId: "inpadOrgId",
  inpkeyColumnId: "inpkeyColumnId",
  keyColumnName: "keyColumnName",
  inpdocstatus: "inpdocstatus",
  inpprocessing: "inpprocessing",
  inpdocaction: "inpdocaction",
  token: "token",
};

export const DEFAULT_REQUIRED_PARAMS_KEYS = {
  isPopUpCall: "1",
  inpdocStatus: "CO",
  inpodcStatusPosted: "P",
};
