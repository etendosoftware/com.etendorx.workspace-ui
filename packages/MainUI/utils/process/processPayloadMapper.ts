/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Converts a dBColumnName to inputName format.
 *
 * Pattern: "inp" + camelCase(dBColumnName)
 *
 * @example
 * toInputName("ad_org_id") // Returns: "inpadOrgId"
 * toInputName("c_order_id") // Returns: "inpcOrderId"
 */
export const toInputName = (dBColumnName: string): string => {
  const camelCased = dBColumnName
    .toLowerCase()
    .split("_")
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
  return `inp${camelCased}`;
};

/**
 * Creates a mapping from parameter name to database column name.
 *
 * @param parameters - The process parameters definition.
 * @returns A map where the key is the parameter name and the value is the DB column name.
 */
const createParamNameMapping = (parameters: Record<string, ProcessParameter>): Map<string, string> => {
  const mapping = new Map<string, string>();
  for (const param of Object.values(parameters)) {
    if (param.dBColumnName) {
      mapping.set(param.name, param.dBColumnName);
    }
  }
  return mapping;
};

/**
 * Determines if a key should be ignored in the payload construction.
 * Keys ending with "_data" are typically metadata and should be excluded.
 *
 * @param key - The key to check.
 * @returns True if the key should be ignored, false otherwise.
 */
const shouldIgnoreKey = (key: string): boolean => {
  return key.endsWith("_data");
};

/**
 * Resolves the final key name for the payload.
 * It tries to find a mapped DB column name; otherwise, it returns the original key.
 *
 * @param key - The original key from the form values.
 * @param mapping - The mapping from parameter name to DB column name.
 * @returns The resolved key name.
 */
const resolveKey = (key: string, mapping: Map<string, string>): string => {
  return mapping.get(key) || key;
};

/**
 * Transforms the value based on specific business rules.
 * - Empty strings are converted to null.
 * - Boolean values are converted to "Y" (true) or "N" (false).
 *
 * @param value - The value to transform.
 * @returns The transformed value.
 */
const transformValue = (value: unknown): unknown => {
  if (value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? "Y" : "N";
  }
  return value;
};

/**
 * Maps form values to API payload using process parameter metadata.
 *
 * Form values are keyed by parameter.name (display name like "Invoice Organization").
 * API expects dBColumnName format (like "AD_Org_ID").
 * Keys ending in "_data" are ignored.
 *
 * @param formValues - Form values keyed by parameter.name
 * @param parameters - ProcessParameters record for mapping
 * @returns Record with dBColumnName keys
 *
 * @example
 * buildProcessParameters(
 *   { "Invoice Organization": "xxx", "Invoice Organization_data": "..." },
 *   { "Invoice Organization": { name: "Invoice Organization", dBColumnName: "AD_Org_ID", ... } }
 * )
 * // Returns: { "AD_Org_ID": "xxx" }
 */
export const buildProcessParameters = (
  formValues: Record<string, unknown>,
  parameters: Record<string, ProcessParameter>
): Record<string, unknown> => {
  const nameToDbColumnName = createParamNameMapping(parameters);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(formValues)) {
    if (shouldIgnoreKey(key)) {
      continue;
    }

    const finalKey = resolveKey(key, nameToDbColumnName);
    const finalValue = transformValue(value);

    result[finalKey] = finalValue;
  }
  return result;
};
