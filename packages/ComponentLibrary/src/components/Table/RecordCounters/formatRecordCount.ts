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

/** Appended to a record count while more records than the loaded ones exist: "101+". */
export const MORE_RECORDS_SUFFIX = "+";

/**
 * Record count to show for a grid. While more records than the loaded ones exist the count is the loaded
 * rows followed by "+", so a partial number is never read as the total; once every record is loaded it is
 * the exact number.
 *
 * @param count - Records loaded in the grid
 * @param hasMoreRecords - Whether the datasource has records after the loaded ones
 * @returns The count to show, e.g. "101+" or "119"
 */
export function formatRecordCount(count: number, hasMoreRecords = false): string {
  if (hasMoreRecords) {
    return `${count}${MORE_RECORDS_SUFFIX}`;
  }
  return String(count);
}
