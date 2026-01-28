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
<<<<<<< HEAD
  normalizeValues?: boolean;
  defaultValue?: unknown;
=======
>>>>>>> a06cbc59 (Hotfix ETP-3201: Fix display Logic evaluation)
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
  const { values, fields, parentValues, parentFields, context = {}, normalizeValues = true, defaultValue } = options;

  // Helper to normalize values (true -> 'Y', false -> 'N')
  const normalize = (val: unknown) => {
    if (!normalizeValues) return val;
    if (typeof val === "boolean") return val ? "Y" : "N";
    return val;
  };

  // 1. Base Context: Start with session/global context
  const evalContext: Record<string, any> = {};
  Object.entries(context).forEach(([key, val]) => {
    evalContext[key] = normalize(val);
  });

  // 2. Merge & Normalize Values (Current & Parent)
  const allValues = { ...parentValues, ...values };

  Object.entries(allValues).forEach(([key, val]) => {
    const normalizedVal = normalize(val);
    evalContext[key] = normalizedVal;

    if (typeof key === "string") {
      const lowerKey = key.toLowerCase();
      const normalizedKey = lowerKey.replace(/_/g, "");

      // 3. Case-Insensitive Overwrite (Strict & Loose)
      Object.keys(evalContext).forEach((existingKey) => {
        if (existingKey === key) return;
        const existingLower = existingKey.toLowerCase();

        if (existingLower === lowerKey || existingLower.replace(/_/g, "") === normalizedKey) {
          evalContext[existingKey] = normalizedVal;
        }
      });

      // 4. Fallback: Auto-generate Snake Case
      if (!key.startsWith("$") && !key.startsWith("#")) {
        const snakeKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
        evalContext[snakeKey] = normalizedVal;
      }
    }
  });

  // 3. Apply Metadata Mapping
  const mapFields = (schemaFields?: Record<string, Field>, sourceValues?: Record<string, unknown>) => {
    if (!schemaFields || !sourceValues) return;

    Object.values(schemaFields).forEach((field) => {
      const dbCol = field.column?.dBColumnName || field.columnName;
      if (dbCol && field.hqlName) {
        const val = sourceValues[field.hqlName];
        if (val !== undefined) {
          const normalized = normalize(val);
          evalContext[dbCol] = normalized;
          evalContext[dbCol.toUpperCase()] = normalized;
        }
      }
    });
  };

  mapFields(parentFields, parentValues);
  mapFields(fields, values);

  const resolveProperty = (target: Record<string, any>, prop: string) => {
    // 1. Exact match
    if (prop in target) return target[prop];

    const lowerProp = prop.toLowerCase();
    const normalizedProp = lowerProp.replace(/_/g, "");
    let looseMatchValue = undefined;
    let looseMatchFound = false;

    // Single loop for both checks
    for (const key of Object.keys(target)) {
      const keyLower = key.toLowerCase();

      // 2. Case-insensitive match (Priority)
      if (keyLower === lowerProp) {
        return target[key];
      }

      // 3. Loose match (Fallback)
      if (!looseMatchFound && keyLower.replace(/_/g, "") === normalizedProp) {
        looseMatchValue = target[key];
        looseMatchFound = true;
      }
    }

    return looseMatchFound ? looseMatchValue : undefined;
  };

  return new Proxy(evalContext, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }

      const val = resolveProperty(target, prop);

      if ((val === null || val === undefined) && defaultValue !== undefined) {
        return defaultValue;
      }
      return val;
    },
    has(target, prop) {
      if (typeof prop !== "string") return Reflect.has(target, prop);
      if (prop in target) return true;
      const lowerProp = prop.toLowerCase();
      return Object.keys(target).some((k) => k.toLowerCase() === lowerProp);
    },
  });
};

export const createSmartContext = createEvaluationContext;
