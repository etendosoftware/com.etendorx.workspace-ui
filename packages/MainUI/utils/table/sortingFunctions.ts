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

import type { MRT_SortingFn } from "material-react-table";

type DateValue = string | number | Date | null | undefined;

function validateDateValues(valueA: DateValue, valueB: DateValue): 0 | 1 | -1 | null {
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return 1;
  if (valueB == null) return -1;
  return null;
}

function validateDateObjects(dateA: Date, dateB: Date): 0 | 1 | -1 | null {
  if (Number.isNaN(dateA.getTime()) && Number.isNaN(dateB.getTime())) return 0;
  if (Number.isNaN(dateA.getTime())) return 1;
  if (Number.isNaN(dateB.getTime())) return -1;
  return null;
}

/**
 * Custom sorting function for datetime fields.
 * Sorts by the original datetime value instead of the formatted string representation.
 * This ensures correct chronological sorting for date/datetime columns.
 */
export const dateTimeSortingFn: MRT_SortingFn<Record<string, DateValue>> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue<DateValue>(columnId);
  const valueB = rowB.getValue<DateValue>(columnId);

  const nullCheck = validateDateValues(valueA, valueB);
  if (nullCheck !== null) return nullCheck;

  const dateA = new Date(valueA as string | number | Date);
  const dateB = new Date(valueB as string | number | Date);

  const validCheck = validateDateObjects(dateA, dateB);
  if (validCheck !== null) return validCheck;

  return dateA.getTime() - dateB.getTime();
};

/**
 * Custom sorting function for date-only fields.
 * Sorts by the date portion only, ignoring time component.
 */
export const dateSortingFn: MRT_SortingFn<Record<string, DateValue>> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue<DateValue>(columnId);
  const valueB = rowB.getValue<DateValue>(columnId);

  const nullCheck = validateDateValues(valueA, valueB);
  if (nullCheck !== null) return nullCheck;

  const dateA = new Date(valueA as string | number | Date);
  const dateB = new Date(valueB as string | number | Date);

  const validCheck = validateDateObjects(dateA, dateB);
  if (validCheck !== null) return validCheck;

  const dateAMidnight = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const dateBMidnight = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());

  return dateAMidnight.getTime() - dateBMidnight.getTime();
};
