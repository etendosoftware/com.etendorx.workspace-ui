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

/**
 * Hides the inactive values of a List reference from a dropdown, as Classic does, while keeping the value
 * the record currently stores so it is still shown and can be kept.
 *
 * @param options - Values of the list reference. `active` is `false` for the ones inactive in the dictionary;
 * when the server does not report it, the value is treated as active.
 * @param currentValue - Value stored in the record (its `value`, i.e. the search key).
 */
export const filterActiveListOptions = <T extends { value?: string; active?: boolean }>(
  options: readonly T[],
  currentValue?: unknown
): T[] =>
  options.filter((option) => option.active !== false || (currentValue != null && option.value === currentValue));

/** Allowed values of a List field as the server reports them (`$_entries`): `id` is the list value. */
export interface ListEntry {
  id: string;
  label: string;
}

/**
 * Restricts the options of a List dropdown to the entries the server returned for the field, which already apply
 * its validation rule (also the ones that depend on other fields). The value stored in the record is always kept,
 * even when the rule no longer allows it, so existing records still display it.
 *
 * @param options - All the (active) values of the list reference.
 * @param entries - `$_entries` of the field. Without entries the options are returned untouched.
 * @param currentValue - Value stored in the record (the list `value`).
 */
export const restrictListOptionsToEntries = <T extends { value?: string }>(
  options: readonly T[],
  entries: readonly ListEntry[] | undefined,
  currentValue?: unknown
): T[] => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [...options];
  }
  const allowed = new Set(entries.map((entry) => entry.id));
  return options.filter(
    (option) =>
      (option.value != null && allowed.has(option.value)) || (currentValue != null && option.value === currentValue)
  );
};
