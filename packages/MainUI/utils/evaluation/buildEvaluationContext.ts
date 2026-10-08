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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { resolvePreference } from "@/utils/propertyStore";

export interface EvaluationContextOptions {
  values?: Record<string, unknown>; // Primary values (current record, form values)
  fields?: Record<string, Field>; // Field metadata for the current record, to map DB names

  parentValues?: Record<string, unknown>;
  parentFields?: Record<string, Field>;

  context?: Record<string, unknown>; // Session/Global context
  auxiliaryInputs?: Record<string, string>; // Tab-scoped evaluated auxiliary inputs
  normalizeValues?: boolean;
  defaultValue?: unknown;
  /**
   * AD window id, used to resolve window-scoped preferences the way classic
   * `OB.PropertyStore.get(key, windowId)` does. When omitted, only global preference keys resolve.
   */
  windowId?: string;
}

/** The proxy handed to compiled expressions: a flat record with flexible (case/underscore-insensitive) reads. */
export type EvaluationContext = Record<string, any>;

/** Lowercase without underscores: two keys with the same form are treated as the same name. */
const normalizedForm = (key: string) => key.toLowerCase().replace(/_/g, "");

/** camelCase → SNAKE_CASE, as display logic written against DB column names expects. */
const toSnakeKey = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();

const isEmptyValue = (val: unknown) => val === "" || val === null || val === undefined;

/**
 * Step 3's case/underscore-insensitive overwrite of every key written before `key` under the same name.
 * Guard: do not overwrite an existing non-empty value with an empty one. Session attributes
 * (e.g. PRODUCTTYPE:"") can case-insensitively match real field keys (e.g. productType:"I") and must
 * not corrupt them.
 */
const overwriteSameName = (
  evalContext: Record<string, unknown>,
  sameName: Set<string> | undefined,
  key: string,
  value: unknown
) => {
  if (!sameName) return;
  for (const existingKey of sameName) {
    if (existingKey === key) continue;
    if (isEmptyValue(evalContext[existingKey]) || !isEmptyValue(value)) {
      evalContext[existingKey] = value;
    }
  }
};

interface LookupIndexes {
  /** First key, in Object.keys order, for each lowercase form. */
  byLowercase: Map<string, string>;
  /** First key, in Object.keys order, for each normalized form. */
  byNormalizedForm: Map<string, string>;
}

/**
 * Builds the context that compiled display/read-only logic expressions read from.
 *
 * It supports:
 * 1. Case-insensitive property access, with an underscore-insensitive fallback.
 * 2. Mapping from DB column names (e.g. C_BPARTNER_ID) to HQL property names (e.g. cBpartner)
 *    based on the provided field metadata.
 * 3. Precedence across sources: record values > parent values > auxiliary inputs > session.
 *
 * The result is identical to the pre-ETP-5641 builder (kept as a test oracle in
 * `__mocks__/legacyEvaluationContext.ts`), but the build is O(n) and reads are O(1): keys are grouped by
 * normalized form while they are written, instead of rescanning every key for each value. (O(n) assumes
 * small groups of keys sharing a normalized form, which holds for real session and record data.)
 *
 * Outside the equivalence contract: a `__proto__` input whose value carries accessors that create own
 * keys. Inputs come from JSON, which cannot carry accessors.
 */
export const buildEvaluationContext = (options: EvaluationContextOptions): EvaluationContext => {
  const {
    values,
    fields,
    parentValues,
    parentFields,
    context = {},
    auxiliaryInputs,
    normalizeValues = true,
    defaultValue,
    windowId,
  } = options;

  // Helper to normalize values (true -> 'Y', false -> 'N')
  const normalize = (val: unknown) => {
    if (!normalizeValues) return val;
    if (typeof val === "boolean") return val ? "Y" : "N";
    return val;
  };

  const evalContext: Record<string, any> = {};
  // Own keys written so far, grouped by normalized form (step 3 overwrites every key of a group).
  const keysByNormalizedForm = new Map<string, Set<string>>();

  // Used by steps 1–4 only. Step 5 (mapFields) assigns directly on purpose: it runs after the last group
  // lookup, and the read indexes are built from Object.keys, not from these groups.
  const write = (key: string, value: unknown) => {
    evalContext[key] = value;
    // Assigning `__proto__` calls the prototype setter and creates no own key: never record it.
    if (!Object.prototype.hasOwnProperty.call(evalContext, key)) return;
    const form = normalizedForm(key);
    let group = keysByNormalizedForm.get(form);
    if (!group) {
      group = new Set();
      keysByNormalizedForm.set(form, group);
    }
    group.add(key);
  };

  // 1. Base Context: Start with session/global context
  for (const [key, val] of Object.entries(context)) {
    write(key, normalize(val));
  }

  // 2. Tab-scoped auxiliary inputs (higher priority than session, lower than record values)
  if (auxiliaryInputs) {
    for (const [key, val] of Object.entries(auxiliaryInputs)) {
      const normalizedVal = normalize(val);
      write(key, normalizedVal);
      write(toSnakeKey(key), normalizedVal);
    }
  }

  // 3. Merge & Normalize Values (Current & Parent)
  for (const [key, val] of Object.entries({ ...parentValues, ...values })) {
    const normalizedVal = normalize(val);
    write(key, normalizedVal);
    overwriteSameName(evalContext, keysByNormalizedForm.get(normalizedForm(key)), key, normalizedVal);

    // 4. Fallback: Auto-generate Snake Case
    if (!key.startsWith("$") && !key.startsWith("#")) {
      write(toSnakeKey(key), normalizedVal);
    }
  }

  // 5. Apply Metadata Mapping
  const mapFields = (schemaFields?: Record<string, Field>, sourceValues?: Record<string, unknown>) => {
    if (!schemaFields || !sourceValues) return;

    for (const field of Object.values(schemaFields)) {
      const dbCol = field.column?.dBColumnName || field.columnName;
      if (dbCol && field.hqlName) {
        const val = sourceValues[field.hqlName];
        if (val !== undefined) {
          const normalized = normalize(val);
          evalContext[dbCol] = normalized;
          evalContext[dbCol.toUpperCase()] = normalized;
        }
      }
    }
  };

  mapFields(parentFields, parentValues);
  mapFields(fields, values);

  // Read indexes, built on first lookup and dropped on any write through the proxy.
  let lookupIndexes: LookupIndexes | null = null;
  const getLookupIndexes = (): LookupIndexes => {
    if (lookupIndexes) return lookupIndexes;
    const byLowercase = new Map<string, string>();
    const byNormalizedForm = new Map<string, string>();
    for (const key of Object.keys(evalContext)) {
      const lower = key.toLowerCase();
      if (!byLowercase.has(lower)) byLowercase.set(lower, key);
      const form = lower.replace(/_/g, "");
      if (!byNormalizedForm.has(form)) byNormalizedForm.set(form, key);
    }
    lookupIndexes = { byLowercase, byNormalizedForm };
    return lookupIndexes;
  };
  const invalidateLookupIndexes = () => {
    lookupIndexes = null;
  };

  const resolveProperty = (target: Record<string, any>, prop: string) => {
    // 1. Exact match (including inherited properties, as before)
    if (prop in target) return target[prop];

    const { byLowercase, byNormalizedForm } = getLookupIndexes();
    const lowerProp = prop.toLowerCase();

    // 2. Case-insensitive match (Priority)
    const caseInsensitiveKey = byLowercase.get(lowerProp);
    if (caseInsensitiveKey !== undefined) return target[caseInsensitiveKey];

    // 3. Loose match (Fallback)
    const looseKey = byNormalizedForm.get(lowerProp.replace(/_/g, ""));
    return looseKey !== undefined ? target[looseKey] : undefined;
  };

  const getFromPrefs = (key: string) => {
    // Window-scoped key first, then the global one — the classic OB.PropertyStore.get resolution.
    // The exact/case-insensitive lookup lives in resolvePreference, shared with the OB shims.
    const value = resolvePreference(key, windowId);
    if (value === undefined) return undefined;
    return normalize(value);
  };

  // Check if a cleared foreign key should return empty string.
  // Only applies to UUID-like ID values (32+ hex chars), not to short values like 'Y'/'N'.
  const checkClearedIdentifier = (target: Record<string, any>, prop: string, val: unknown): string | undefined => {
    if (typeof val === "string" && val.length > 8) {
      const identifierVal = resolveProperty(target, `${prop}$_identifier`);
      if (identifierVal === "") return "";
    }
    return undefined;
  };

  // Resolve special prefixed properties (@prop@, #prop, $prop, _prop)
  const resolvePrefixed = (target: Record<string, any>, prop: string): unknown => {
    if (prop.startsWith("@") && prop.endsWith("@")) {
      const cleanVal = resolveProperty(target, prop.slice(1, -1));
      if (cleanVal !== undefined && cleanVal !== null) return cleanVal;
    }
    if (prop.startsWith("#") || prop.startsWith("$")) {
      const valFromPrefs = getFromPrefs(prop.slice(1)) ?? getFromPrefs(prop);
      if (valFromPrefs !== undefined) return valFromPrefs;
    }
    // Server-side DynamicExpressionParser rewrites @#FOO@ → context._FOO as a name
    // sanitization (# is not a valid JS identifier). Recover the original session
    // attribute by looking up #FOO / $FOO in the context, then falling back to the
    // preferences store (localStorage etendo_preferences).
    if (prop.startsWith("_")) {
      const original = prop.slice(1);
      const fromContext = resolveProperty(target, `#${original}`) ?? resolveProperty(target, `$${original}`);
      if (fromContext !== undefined && fromContext !== null) return fromContext;
      const fromPrefs = getFromPrefs(original) ?? getFromPrefs(`#${original}`) ?? getFromPrefs(`$${original}`);
      if (fromPrefs !== undefined) return fromPrefs;
    }
    return undefined;
  };

  return new Proxy(evalContext, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }

      const val = resolveProperty(target, prop);

      // If the field has an empty identifier, treat as empty (Classic behavior for cleared foreign keys)
      const cleared = checkClearedIdentifier(target, prop, val);
      if (cleared !== undefined) return cleared;

      if (val !== undefined && val !== null) return val;

      // Handle @property@, #property, $property access patterns
      const prefixed = resolvePrefixed(target, prop);
      if (prefixed !== undefined) return prefixed;

      // Fallback to default value, then empty string (matching Classic behavior).
      // In Classic, unresolved context variables always resolve to '' (empty string).
      // parseDynamicExpression replaces OB.Utilities.getValue(obj, prop) with obj["prop"],
      // removing the null->'' conversion that getValue provided. The Proxy must handle it.
      return defaultValue !== undefined ? defaultValue : "";
    },
    has(target, prop) {
      if (typeof prop !== "string") return Reflect.has(target, prop);
      if (prop in target) return true;
      return getLookupIndexes().byLowercase.has(prop.toLowerCase());
    },
    // Writes are not expected, but must stay visible to later reads exactly as before.
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver);
      invalidateLookupIndexes();
      return ok;
    },
    defineProperty(target, prop, descriptor) {
      const ok = Reflect.defineProperty(target, prop, descriptor);
      invalidateLookupIndexes();
      return ok;
    },
    deleteProperty(target, prop) {
      const ok = Reflect.deleteProperty(target, prop);
      invalidateLookupIndexes();
      return ok;
    },
  });
};
