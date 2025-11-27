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

// constants/datasource.ts
import { DATASOURCE_REFERENCE_CODES } from "@/utils/form/constants";

export const REFERENCE_IDS = {
  PRODUCT: DATASOURCE_REFERENCE_CODES.PRODUCT,
} as const;

export const PRODUCT_SELECTOR_DEFAULTS = {
  FALLBACK_SELECTOR_ID: DATASOURCE_REFERENCE_CODES.FALLBACK_SELECTOR_ID,
  SEARCH_FIELDS: ["productName", "searchKey"],
} as const;

export const TABLEDIR_SELECTOR_DEFAULTS = {
  SEARCH_FIELDS: ["name", "value", "description"],
} as const;

export const INVOICE_FIELD_MAPPINGS: Record<string, string> = {
  priceList: "inpmPricelistId",
  currency: "inpcCurrencyId",
  businessPartner: "inpcBpartnerId",
  invoiceDate: "inpdateinvoiced",
  organization: "inpadOrgId",
  documentType: "inpcDoctypeId",
  transactionDocument: "inpcDoctypetargetId",
  paymentTerms: "inpcPaymenttermId",
  salesRepresentative: "inpsalesrepId",
  partnerAddress: "inpcBpartnerLocationId",
  paymentMethod: "inpfinPaymentmethodId",
  project: "inpcProjectId",
  costcenter: "inpcCostcenterId",
  salesCampaign: "inpcCampaignId",
  activity: "inpcActivityId",
  asset: "inpaAssetId",
  withholding: "inpwithholding",
  orderReference: "inporderReference",
  salesOrder: "inpcOrderId",
  stDimension: "inpuser1Id",
  ndDimension: "inpuser2Id",
} as const;
