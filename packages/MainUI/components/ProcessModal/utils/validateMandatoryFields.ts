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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { FieldType } from "@workspaceui/api-client/src/api/types";

/**
 * Minimal field shape required to detect mandatory-empty fields.
 *
 * P&E grids run the same field through multiple naming transforms — `columnName`
 * is the canonical DB name, but the value can land in the merged record under
 * any of `hqlName`, `name`, or the parent-map key. We check every shape so the
 * lookup matches wherever the value actually was written.
 */
export interface MandatoryCheckField {
  /** DB column name (e.g. "c_glitem_id"). Used as the canonical id in the error set. */
  columnName: string;
  isMandatory?: boolean;
  /** HQL camelCase name (e.g. "g/LItem"); matches keys written to row.original. */
  hqlName?: string;
  /** Human-readable field name (e.g. "G/L Item"); matches MRT column.id / values keys. */
  name?: string;
  /** Parent-map key from Object.entries (e.g. "gLItem"); fallback shape. */
  _key?: string;
}

/** Treats `null`, `undefined`, and the empty string as an empty value (`0` is filled). */
export const isEmptyValue = (value: unknown): boolean => value === null || value === undefined || value === "";

const candidateKeys = (field: MandatoryCheckField): string[] => {
  const keys: Array<string | undefined> = [field.columnName, field.hqlName, field.name, field._key];
  return keys.filter((k): k is string => typeof k === "string" && k.length > 0);
};

/**
 * Returns the set of `columnName`s for fields that are mandatory but whose
 * value in {@code values} is empty under every key shape we know about. Used
 * to short-circuit create-row save in P&E grids when the user leaves a
 * required selector blank.
 */
export const collectMissingMandatory = (
  fields: ReadonlyArray<MandatoryCheckField>,
  values: Record<string, unknown>
): Set<string> => {
  const missing = new Set<string>();
  for (const field of fields) {
    if (!field.isMandatory) continue;
    const filled = candidateKeys(field).some((k) => !isEmptyValue(values[k]));
    if (!filled) missing.add(field.columnName);
  }
  return missing;
};

const NUMERIC_FIELD_TYPES: ReadonlySet<FieldType> = new Set([FieldType.NUMBER, FieldType.QUANTITY]);

export interface NumericDefaultField extends MandatoryCheckField {
  /** Already-resolved FieldType (callers compute via `getFieldReference`). */
  type?: FieldType;
}

/**
 * Returns a fresh object with `0` filled in for every mandatory numeric field
 * left empty in {@code values}. Mirrors classic UI behavior where the unused
 * side of mutually-exclusive amount fields (e.g. `received_in` / `paid_out`)
 * implicitly stays at 0 instead of forcing the user to type it.
 */
export const applyNumericMandatoryDefaults = (
  fields: ReadonlyArray<NumericDefaultField>,
  values: Record<string, unknown>
): Record<string, unknown> => {
  const next = { ...values };
  for (const field of fields) {
    if (!field.isMandatory) continue;
    if (!field.type || !NUMERIC_FIELD_TYPES.has(field.type)) continue;
    const keys = candidateKeys(field);
    const alreadyFilled = keys.some((k) => !isEmptyValue(next[k]));
    if (alreadyFilled) continue;
    for (const k of keys) next[k] = 0;
  }
  return next;
};
