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

export const FORM_VALUE_MAPPINGS = {
  true: "Y",
  false: "N",
  null: "null",
} as const;
