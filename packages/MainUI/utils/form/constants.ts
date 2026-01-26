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

/**
 * Field reference codes used in form field type identification
 */
export const FIELD_REFERENCE_CODES = {
  // Password field reference
  PASSWORD: "C5C21C28B39E4683A91779F16C112E40",

  // Product reference to datasource
  PRODUCT: "95E2A8B50A254B2AAE6774B8C2F28120",
  // Generic Selector reference
  SELECTOR: "95E2A8B50A254B2AAE6774B8C2F28120",

  // Window reference
  WINDOW: "FF80818132D8F0F30132D9BC395D0038",

  // String/Text field references
  STRING: "10",
  TEXT_LONG: "14",

  // Table directory references
  TABLE_DIR_19: "19",
  TABLE_DIR_18: "18",

  // Date and time references
  DATE: "15",
  DATETIME: "16",
  ABSOLUTE_DATETIME: "478169542A1747BD942DD70C8B45089C",

  // Boolean reference
  BOOLEAN: "20",

  // Numeric references
  INTEGER: "11",
  NUMERIC: "12",
  QUANTITY_22: "22",
  QUANTITY_29: "29",

  // List references
  LIST_13: "13",
  LIST_17: "17",

  // Select reference with location support
  LOCATION_21: "21",
  SELECT_30: "30",

  // Advanced numeric types
  DECIMAL: "800008",

  // Rate type
  RATE: "800019",

  // Button reference
  BUTTON: "28",
} as const;

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
    if (field.column?.reference === FIELD_REFERENCE_CODES.PASSWORD && field.hqlName) {
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
