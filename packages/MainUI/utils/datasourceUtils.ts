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

// Value mappings for boolean and null values (same as FormView)
export const FORM_VALUE_MAPPINGS = {
  true: "Y",
  false: "N",
  null: "null",
} as const;

/**
 * Transform form values to Classic backend format
 * This uses the SAME logic as FormView's useTableDirDatasource.transformFormValues
 */
export const transformValueToClassicFormat = (value: unknown): string => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "null";
  }

  const stringValue = String(value);

  // Transform ISO dates (YYYY-MM-DD) to Classic format (DD-MM-YYYY)
  const isISODate = /^\d{4}-\d{2}-\d{2}$/.test(stringValue);
  const formattedValue = isISODate ? stringValue.split("-").reverse().join("-") : stringValue;

  // Apply boolean/null mappings
  const safeValue = Object.prototype.hasOwnProperty.call(FORM_VALUE_MAPPINGS, formattedValue)
    ? FORM_VALUE_MAPPINGS[formattedValue as keyof typeof FORM_VALUE_MAPPINGS]
    : formattedValue;

  return safeValue;
};
