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
export function toInputName(dBColumnName: string): string {
  const camelCased = dBColumnName
    .toLowerCase()
    .split("_")
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
  return `inp${camelCased}`;
}

/**
 * Maps form values to API payload using process parameter metadata.
 *
 * Form values are keyed by parameter.name (display name like "Invoice Organization").
 * API expects inputName format (like "inpadOrgId").
 *
 * @param formValues - Form values keyed by parameter.name
 * @param parameters - ProcessParameters record for mapping
 * @returns Record with inputName keys
 *
 * @example
 * buildProcessParameters(
 *   { "Invoice Organization": "xxx" },
 *   { "Invoice Organization": { name: "Invoice Organization", dBColumnName: "ad_org_id", ... } }
 * )
 * // Returns: { "inpadOrgId": "xxx" }
 */
export function buildProcessParameters(
  formValues: Record<string, unknown>,
  parameters: Record<string, ProcessParameter>
): Record<string, unknown> {
  // Create mapping: name → inputName
  const nameToInputName = new Map<string, string>();
  for (const param of Object.values(parameters)) {
    if (param.dBColumnName) {
      nameToInputName.set(param.name, toInputName(param.dBColumnName));
    }
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(formValues)) {
    const inputName = nameToInputName.get(key) || key;
    // Convert empty strings to undefined
    result[inputName] = value === "" ? undefined : value;
  }
  return result;
}
