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
export const createSmartContext = (options: SmartContextOptions) => {
  const { values = {}, fields, parentValues, parentFields, context = {} } = options;

  // Create lookup maps for DB Column Name -> HQL Name
  const colToHql = new Map<string, string>();

  if (fields) {
    Object.values(fields).forEach((f) => {
      if (f.column?.dBColumnName) {
        // Map UPPERCASE column name to hqlName
        colToHql.set(f.column.dBColumnName.toUpperCase(), f.hqlName);
      }
    });
  }

  const parentColToHql = new Map<string, string>();
  if (parentFields) {
    Object.values(parentFields).forEach((f) => {
      if (f.column?.dBColumnName) {
        parentColToHql.set(f.column.dBColumnName.toUpperCase(), f.hqlName);
      }
    });
  }

  // Combine data for direct access (highest priority first)
  // We use this base object for 'in' operator checks and direct access
  const baseData = { ...context, ...parentValues, ...values };

  return new Proxy(baseData, {
    get: (target, prop: string | symbol) => {
      if (typeof prop !== "string") return Reflect.get(target, prop);

      // 1. Direct match
      if (prop in target) return target[prop];

      const upperProp = prop.toUpperCase();

      // 2. Check DB Column Mapping (Current Record)
      if (colToHql.has(upperProp)) {
        const hqlName = colToHql.get(upperProp)!;
        // Check in values first, then record/parent?
        // Usually local fields are in 'values' relative to the record
        if (values && hqlName in values) return values[hqlName];
        
        // Sometimes the value might be in the combined target directly?
        if (hqlName in target) return target[hqlName];
      }

      // 3. Check DB Column Mapping (Parent Record)
      if (parentColToHql.has(upperProp)) {
        const hqlName = parentColToHql.get(upperProp)!;
        if (parentValues && hqlName in parentValues) return parentValues[hqlName];
      }

      // 4. Case-insensitive key match
      // Helper to find key in object case-insensitively
      const findIn = (obj: Record<string, unknown> | undefined) => {
        if (!obj) return undefined;
        const key = Object.keys(obj).find((k) => k.toUpperCase() === upperProp);
        return key ? obj[key] : undefined;
      };

      let val = findIn(values);
      if (val !== undefined) return val;

      val = findIn(parentValues);
      if (val !== undefined) return val;

      val = findIn(context);
      if (val !== undefined) return val;

      return undefined;
    },
    
    // Implement 'has' to support 'prop in proxy' checks if needed
    has: (target, prop) => {
       if (typeof prop !== "string") return Reflect.has(target, prop);
       if (Reflect.has(target, prop)) return true;
       const upperProp = prop.toUpperCase();
       if (colToHql.has(upperProp)) return true;
       if (parentColToHql.has(upperProp)) return true;
       // We don't exhaustively check case-insensitive existence for performance
       // unless absolutely necessary.
       return false;
    }
  });
};
