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

import { Field } from "@workspaceui/api-client/src/api/types";

interface SmartContextOptions {
  values?: Record<string, unknown>; // Primary values (current record, form values)
  fields?: Record<string, Field>; // Field metadata for the current record, to map DB names

  parentValues?: Record<string, unknown>;
  parentFields?: Record<string, Field>;

  context?: Record<string, unknown>; // Session/Global context
}

/**
 * Creates a Proxy object that allows flexible property access for Display Logic evaluation.
 *
 * It supports:
 * 1. Case-insensitive property access.
 * 2. Mapping from DB Column Names (e.g. C_BPARTNER_ID) to HQL Property Names (e.g. cBpartner)
 *    based on provided field metadata.
 * 3. Fallback across multiple data sources (Values > ParentValues > Context).
 */
export const createEvaluationContext = (options: SmartContextOptions) => {
  const { values, fields, parentValues, parentFields, context = {} } = options;

  // Helper to normalize values (true -> 'Y', false -> 'N')
  const normalize = (val: unknown) => {
    if (typeof val === "boolean") return val ? "Y" : "N";
    return val;
  };

  // 1. Base Context: Start with session/global context
  const evalContext: Record<string, any> = { ...context };

  // 2. Merge & Normalize Values (Current & Parent)
  // We prioritize 'values' (current record) over 'parentValues'
  const allValues = { ...parentValues, ...values };

  Object.entries(allValues).forEach(([key, val]) => {
    const normalizedVal = normalize(val);
    evalContext[key] = normalizedVal; // Original key (e.g. allowGroupAccess)

    // 4. Fallback: Auto-generate Snake Case for standard camelCase
    // e.g. allowGroupAccess -> ALLOW_GROUP_ACCESS
    // This helps when metadata is missing
    if (typeof key === "string") {
      // Convert camelCase to SNAKE_CASE for fallback compatibility
      // e.g. allowGroupAccess -> ALLOW_GROUP_ACCESS
      // Only do this if the key doesn't contain special chars used in other contexts
      if (!key.startsWith("$") && !key.startsWith("#")) {
        const snakeKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
        if (!(snakeKey in evalContext)) {
          evalContext[snakeKey] = normalizedVal;
        }
      }
    }
  });

  // 3. Apply Metadata Mapping (if available)
  // Map DB Column Names (e.g. ALLOW_GROUP_ACCESS) to values
  const mapFields = (schemaFields?: Record<string, Field>, sourceValues?: Record<string, unknown>) => {
    if (!schemaFields || !sourceValues) return;

    Object.values(schemaFields).forEach((field) => {
      // Use dBColumnName if available (correct property according to typings)
      const dbCol = field.column?.dBColumnName || field.columnName;
      if (dbCol && field.hqlName) {
        const val = sourceValues[field.hqlName];
        if (val !== undefined) {
          // Add the column name pointing to the normalized value
          const normalized = normalize(val);
          evalContext[dbCol] = normalized;
          evalContext[dbCol.toUpperCase()] = normalized;
        }
      }
    });
  };

  mapFields(parentFields, parentValues);
  mapFields(fields, values);

  return evalContext;
};

export const createSmartContext = createEvaluationContext;
