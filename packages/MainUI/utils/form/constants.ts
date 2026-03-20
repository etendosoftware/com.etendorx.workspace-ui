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

import type { Tab } from "@workspaceui/api-client/src/api/types";

export const CUSTOM_SELECTORS_IDENTIFIERS = {
  LOCATION: "Location",
};

/**
 * Placeholder value used for password fields when editing existing records.
 * The backend sends this value instead of the actual password for security.
 * When saving, if a password field still contains this placeholder value,
 * it should be excluded from the payload to avoid overwriting the real password.
 */
export const PASSWORD_PLACEHOLDER = "***";

export const CALLOUT_TRIGGERS = {
  ON_BLUR: "ON_BLUR",
  ON_CHANGE: "ON_CHANGE",
} as const;

export type CalloutTrigger = (typeof CALLOUT_TRIGGERS)[keyof typeof CALLOUT_TRIGGERS];

/**
 * Field reference codes used in form field type identification
 */
export const FIELD_REFERENCE_CODES = {
  // Password field reference
  PASSWORD: { id: "C5C21C28B39E4683A91779F16C112E40", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // Product reference to datasource
  PRODUCT: { id: "95E2A8B50A254B2AAE6774B8C2F28120", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
  // Generic Selector reference
  SELECTOR: { id: "95E2A8B50A254B2AAE6774B8C2F28120", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Window reference
  WINDOW: { id: "FF80818132D8F0F30132D9BC395D0038", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // String/Text field references
  STRING: { id: "10", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  TEXT_LONG: { id: "14", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // Table directory references
  TABLE_DIR_19: { id: "19", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
  TABLE_DIR_18: { id: "18", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Date and time references
  DATE: { id: "15", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  DATETIME: { id: "16", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  ABSOLUTE_DATETIME: { id: "478169542A1747BD942DD70C8B45089C", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  TIME: { id: "24", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // Boolean reference
  BOOLEAN: { id: "20", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Numeric references
  INTEGER: { id: "11", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  NUMERIC: { id: "12", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  QUANTITY_22: { id: "22", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
  QUANTITY_29: { id: "29", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // List references
  LIST_13: { id: "13", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
  LIST_17: { id: "17", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Select reference with location support
  LOCATION_21: { id: "21", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
  SELECT_30: { id: "30", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Attribute Set Instance (PAttribute) reference
  PATTRIBUTE: { id: "35", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Advanced numeric types
  DECIMAL: { id: "800008", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // Rate type
  RATE: { id: "800019", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

  // Button reference
  BUTTON: { id: "28", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
} as const;

/**
 * Known product selector reference IDs from Etendo Classic.
 * These are the AD_REFERENCE_ID values used as referenceSearchKey
 * for product-type fields (M_Product_ID).
 */
export const PRODUCT_SELECTOR_REFERENCE_IDS = [
  "712D9821BE8246AC95E6C16D8BEEBE5E", // ProductSimple
  "D65D16C78404437AAB008E8040715D2F", // All Products Simple Selector
  "84BD487714B04B838A8D562A30E8792C", // Products (Generic Product Selector)
  "D920A7ED46C542629D2A1054560EBF14", // Item Stockable Products
  "954BA02AD92D4820B4B3A24B104E24C2", // Service Products
  "F784938E74564BCABF9517EB80DB15F5", // Product Complete (ProductStockView)
] as const;

/**
 * Product selector reference IDs that use the ProductStockView datasource
 * (showing stock/warehouse columns instead of pricing columns).
 */
export const PRODUCT_STOCK_VIEW_REFERENCE_IDS = [
  "F784938E74564BCABF9517EB80DB15F5", // Product Complete (M_Product_Stock_V)
] as const;

/**
 * Process execution related reference codes
 */
export const PROCESS_REFERENCE_CODES = {
  // Client reference
  CLIENT: "23C59575B9CF467C9620760EB255B389",

  // Process reference
  PROCESS: "7BABA5FF80494CAFA54DEBD22EC46F01",
} as const;

/**
 * Datasource reference codes
 */
export const DATASOURCE_REFERENCE_CODES = {
  // Product datasource
  PRODUCT: "95E2A8B50A254B2AAE6774B8C2F28120",

  // Fallback selector
  FALLBACK_SELECTOR_ID: "EB3C41F0973A4EDA91E475833792A6D4",
} as const;

/**
 * Gets a set of password field names from tab metadata.
 * Password fields are identified by their column reference code.
 * @param tab The tab metadata containing field definitions
 * @returns Set of field names (hqlName) that are password type fields
 */
export const getPasswordFieldNames = (tab?: Tab): Set<string> => {
  const passwordFields = new Set<string>();
  if (!tab?.fields) return passwordFields;

  for (const field of Object.values(tab.fields)) {
    if (field.column?.reference === FIELD_REFERENCE_CODES.PASSWORD.id && field.hqlName) {
      passwordFields.add(field.hqlName);
    }
  }

  return passwordFields;
};

/**
 * Checks if a password field should be excluded from the save payload.
 * A password field should be excluded if:
 * - It's identified as a password type field by its reference code
 * - Its value is the placeholder ("***")
 * - We're in EDIT mode (not creating a new record)
 *
 * @param fieldName The name of the field to check
 * @param value The current value of the field
 * @param passwordFields Set of password field names from tab metadata
 * @param isNewRecord Whether we're creating a new record
 * @returns True if the field should be excluded from the payload
 */
export const shouldExcludePasswordField = (
  fieldName: string,
  value: unknown,
  passwordFields: Set<string>,
  isNewRecord: boolean
): boolean => {
  if (isNewRecord) return false;
  if (!passwordFields.has(fieldName)) return false;
  return value === PASSWORD_PLACEHOLDER;
};
