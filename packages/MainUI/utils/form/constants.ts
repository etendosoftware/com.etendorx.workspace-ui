export const CUSTOM_SELECTORS_IDENTIFIERS = {
  LOCATION: "Location",
};

/**
 * Field reference codes used in form field type identification
 */
export const FIELD_REFERENCE_CODES = {
  // Password field reference
  PASSWORD: "C5C21C28B39E4683A91779F16C112E40",
  
  // Product reference to datasource
  PRODUCT: "95E2A8B50A254B2AAE6774B8C2F28120",
  
  // Window reference
  WINDOW: "FF80818132D8F0F30132D9BC395D0038",
  
  // Table directory references
  TABLE_DIR_19: "19",
  TABLE_DIR_18: "18",
  
  // Date and time references
  DATE: "15",
  DATETIME: "16",
  
  // Boolean reference
  BOOLEAN: "20",
  
  // Numeric references
  QUANTITY_29: "29",
  QUANTITY_22: "22",
  
  // List references
  LIST_17: "17",
  LIST_13: "13",
  
  // Select reference with location support
  SELECT_30: "30",
  LOCATION_21: "21",
  
  // Numeric types
  DECIMAL: "800008",
  INTEGER: "11",
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
