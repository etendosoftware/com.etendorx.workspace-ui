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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/** Separator of the derived keys of a field (`<field>$_identifier`, `<field>$_entries`). */
const DERIVED_KEY_SEPARATOR = "$";

/**
 * Whether the user changed a form key since the form last took the record as its reference. A derived key
 * (`<field>$_identifier`, ...) follows its field, so an edited selector keeps the label of the value chosen.
 *
 * @param key form key of the refreshed value
 * @param dirtyFields the dirty fields of react-hook-form, or nothing when the user's edits are not kept
 * @returns true when the refresh must leave the key as the user left it
 */
export const isKeptUserEdit = (key: string, dirtyFields?: Record<string, unknown>): boolean => {
  if (!dirtyFields) return false;
  const field = key.split(DERIVED_KEY_SEPARATOR)[0];
  return Boolean(dirtyFields[field]);
};
