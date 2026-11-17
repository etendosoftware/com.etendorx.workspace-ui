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
 * Whether a numeric field already holds `next`, so leaving the field changes nothing.
 *
 * What the form holds can be a number, the same number as text (`"2.64"`, `"5.00"`), an empty text, `null` or nothing
 * at all, depending on where the record came from. The user entering and leaving a field without typing is not a
 * change: writing the parsed value back would mark the record as modified only because its type or its empty value
 * differs (ETP-6338).
 *
 * @param current - the value the form holds for the field.
 * @param next - the number the field text parses to, or null when it is empty.
 */
export const isSameNumericValue = (current: unknown, next: number | null): boolean => {
  const isEmpty = current === null || current === undefined || (typeof current === "string" && current.trim() === "");
  if (isEmpty) {
    return next === null;
  }
  if (next === null) {
    return false;
  }
  const currentNumber = typeof current === "number" ? current : Number(current);
  return !Number.isNaN(currentNumber) && currentNumber === next;
};
