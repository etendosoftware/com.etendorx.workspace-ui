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

export const COPY_FROM_ORDER_PROCESS_ID = "8B81D80B06364566B87853FEECAB5DE0";
export const CREATE_LINES_FROM_ORDER_PROCESS_ID = "AB2EFCAABB7B4EC0A9B30CFB82963FB6";
export const SERVERS_WINDOW_ID = "97A1BDAE0C074F2EB76B195ACA03E9AF";
export const ADD_PAYMENT_ORDER_PROCESS_ID = "9BED7889E1034FE68BD85D5D16857320";
export const CREATE_LINES_FROM_RECEIPT_ID = "7737CA7330FD49FBA7EBC225E85F2BC9";
export const LANDED_COST_PROCESS = "96FE01F2F12F45FC8ED4A1978EBD034C";
export const REACTIVATE_LANDED_COST_PROCESS = "C600DAD457664EFDA6B1AA76931552BA";
export const CREATE_LINE_ID = "6995A4C2592D434A9E16B71E1694CBCA";
export const SYNC_SERVER_PROCESS_ID = "A7E842C7B06D460BA37F8AACD41CFA1E";
export const START_STOP_SERVER_PROCESS_ID = "53F3CA8AE4A34B618454B516DD76BB65";
export const REQUEST_DOMAIN_PROCESS_ID = "8ACE386EA8B7472A8BF6279D4A019E82";
export const DELETE_SERVER_PROCESS_ID = "8F6B9719DDAC4B178212599EE62489D8";
export const FUNDS_TRANSFER_PROCESS_ID = "CC73C4845CDC487395804946EACB225F";
export const PICK_VALIDATE_PROCESS_ID = "40317268E74C445FA85DB97249AFFE37";
export const PACKING_PROCESS_ID = "F3B77135F9D94C8FA1EFA270691265FB";
export const BUTTON_LIST_REFERENCE_ID = "FF80818132F94B500132F9575619000A";
type ProcessDefinition = {
  inpColumnId: string;
  inpPrimaryKeyColumnId: string;
  defaultKeys: Record<string, string>;
  dynamicKeys: Record<string, unknown>;
  staticOptions: Record<string, unknown>;
  additionalPayloadFields?: string[]; // Fields from recordValues to add to payload
  skipParamsLevel?: boolean; // If true, parameters are spread at top level instead of inside _params
};

type WindowDefinition = {
  key: string;
  value: (record: { id?: string } | null | undefined) => string | null;
};

export const PROCESS_DEFINITION_DATA: Record<string, ProcessDefinition> = {
  [COPY_FROM_ORDER_PROCESS_ID]: {
    inpColumnId: "C_Order_ID",
    inpPrimaryKeyColumnId: "inpcOrderId",
    defaultKeys: {
      ad_org_id: "org",
    },
    dynamicKeys: {},
    staticOptions: {},
  },
  [CREATE_LINES_FROM_ORDER_PROCESS_ID]: {
    inpColumnId: "C_Invoice_ID",
    inpPrimaryKeyColumnId: "inpcInvoiceId",
    defaultKeys: {},
    dynamicKeys: {
      invoiceClient: "@Invoice.client@",
      invoiceBusinessPartner: "@Invoice.businessPartner@",
      invoicePriceList: "@Invoice.priceList@",
      invoiceCurrency: "@Invoice.currency@",
      "@Invoice.salesTransaction@": "inpissotrx",
      "@Invoice.priceList@": "inpmPricelistId",
      "@Invoice.documentType@": "inpcDoctypeId",
      "@Invoice.businessPartner@": "inpcBpartnerId",
      "@Invoice.currency@": "inpcCurrencyId",
      "@Invoice.paymentComplete@": "inpispaid",
      "@Invoice.client@": "inpadClientId",
      "@Invoice.organization@": "inpadOrgId",
      "@Invoice.id@": "inpcInvoiceId",
      "@Invoice.invoiceDate@": "inpdateinvoiced",
      "@Invoice.documentStatus@": "inpdocstatus",
      "@Invoice.totalPaid@": "inptotalpaid",
    },
    staticOptions: {},
  },
  [ADD_PAYMENT_ORDER_PROCESS_ID]: {
    inpColumnId: "C_Order_ID",
    inpPrimaryKeyColumnId: "inpcOrderId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
  },
  [CREATE_LINES_FROM_RECEIPT_ID]: {
    inpColumnId: "C_Order_ID",
    inpPrimaryKeyColumnId: "inpcOrderId",
    defaultKeys: {},
    dynamicKeys: {
      "@Invoice.priceList@": "inpmPricelistId",
      "@Invoice.businessPartner@": "inpcBpartnerId",
      "@Invoice.currency@": "inpcCurrencyId",
      "@Invoice.salesTransaction@": "inpissotrx",
      "@Invoice.documentType@": "inpcDoctypeId",
      "@Invoice.paymentComplete@": "inpispaid",
      "@Invoice.client@": "inpadClientId",
      "@Invoice.organization@": "inpadOrgId",
      "@Invoice.id@": "inpcInvoiceId",
      "@Invoice.invoiceDate@": "inpdateinvoiced",
      "@Invoice.documentStatus@": "inpdocstatus",
      "@Invoice.totalPaid@": "inptotalpaid",
    },
    staticOptions: {},
    additionalPayloadFields: ["inpcInvoiceId"],
  },
  [LANDED_COST_PROCESS]: {
    inpColumnId: "M_Landedcost_ID",
    inpPrimaryKeyColumnId: "inpmLandedcostId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    additionalPayloadFields: [],
  },
  [REACTIVATE_LANDED_COST_PROCESS]: {
    inpColumnId: "M_Landedcost_ID",
    inpPrimaryKeyColumnId: "inpmLandedcostId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    additionalPayloadFields: [],
  },
  [CREATE_LINE_ID]: {
    inpColumnId: "C_Order_ID",
    inpPrimaryKeyColumnId: "inpcOrderId",
    defaultKeys: {},
    dynamicKeys: {
      c_order_id: "C_Order_ID",
    },
    staticOptions: {},
  },
  [SYNC_SERVER_PROCESS_ID]: {
    inpColumnId: "SMFSCH_Servers_ID",
    inpPrimaryKeyColumnId: "inpsmfschServersId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    skipParamsLevel: true,
  },
  [START_STOP_SERVER_PROCESS_ID]: {
    inpColumnId: "SMFSCH_Servers_ID",
    inpPrimaryKeyColumnId: "inpsmfschServersId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    skipParamsLevel: true,
  },
  [REQUEST_DOMAIN_PROCESS_ID]: {
    inpColumnId: "SMFSCH_Servers_ID",
    inpPrimaryKeyColumnId: "inpsmfschServersId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    skipParamsLevel: true,
  },
  [DELETE_SERVER_PROCESS_ID]: {
    inpColumnId: "SMFSCH_Servers_ID",
    inpPrimaryKeyColumnId: "inpsmfschServersId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    skipParamsLevel: true,
  },
  [FUNDS_TRANSFER_PROCESS_ID]: {
    inpColumnId: "FIN_Financial_Account_ID",
    inpPrimaryKeyColumnId: "inpfinFinancialAccountId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
    skipParamsLevel: false,
  },
  [PICK_VALIDATE_PROCESS_ID]: {
    inpColumnId: "OBWPL_Pickinglist_ID",
    inpPrimaryKeyColumnId: "inpobwplPickinglistId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
  },
  [PACKING_PROCESS_ID]: {
    inpColumnId: "OBWPL_Pickinglist_ID",
    inpPrimaryKeyColumnId: "inpobwplPickinglistId",
    defaultKeys: {},
    dynamicKeys: {},
    staticOptions: {},
  },
};

export const WINDOW_SPECIFIC_KEYS: Record<string, WindowDefinition> = {
  [SERVERS_WINDOW_ID]: {
    key: "Smfsch_Servers_ID",
    value: (record) => record?.id || null,
  },
};

export const PROCESS_TYPES = {
  PROCESS_DEFINITION: "process-definition",
  REPORT_AND_PROCESS: "report-and-process",
} as const;
