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

import type { EntityData } from "@workspaceui/api-client/src/api/types";

/** Rows of a datasource request, as the `_startRow` / `_endRow` params Classic reads. */
export interface PageRange {
  startRow: number;
  endRow: number;
}

/**
 * Rows to ask for a page that starts at `startRow`. Classic reads `_endRow` as inclusive, so the range holds
 * `pageSize + 1` rows: like the Classic grid, the extra row tells whether more records exist.
 *
 * @param startRow - Index of the first row of the page: the number of server rows already loaded
 * @param pageSize - Rows of a page
 * @returns The `startRow` / `endRow` of the request
 */
export function getPageRange(startRow: number, pageSize: number): PageRange {
  return { startRow, endRow: startRow + pageSize };
}

/**
 * Whether Classic answered a page with the first rows again. When a page past the first comes out empty
 * (`DefaultJsonDataService.fetch`), Classic fetches again from row 0 and reports that start row: those rows
 * are already loaded and there is nothing after the last one.
 *
 * @param requestedStartRow - Start row the request asked for
 * @param responseStartRow - `startRow` of the response
 * @returns true when the response starts before the requested row
 */
export function isRestartedPage(requestedStartRow: number, responseStartRow: unknown): boolean {
  return requestedStartRow > 0 && typeof responseStartRow === "number" && responseStartRow < requestedStartRow;
}

/** A page of records read from a datasource answer. */
export interface FetchedPage {
  rows: EntityData[];
  /** Start row of the page after this one: the server rows loaded once it is applied. */
  nextStartRow: number;
  /** Whether more records may follow: the answer holds at least `pageSize` rows. */
  hasMore: boolean;
}

/**
 * Reads the page a datasource answered for a request that started at `startRow`.
 *
 * @param startRow - Start row of the request
 * @param pageSize - Rows of a page
 * @param response - `response` of the datasource answer
 * @returns The page, or null when Classic answered the first rows again: there is nothing after the loaded rows
 */
export function readFetchedPage(
  startRow: number,
  pageSize: number,
  response: { data: EntityData[]; startRow?: number }
): FetchedPage | null {
  if (isRestartedPage(startRow, response.startRow)) {
    return null;
  }
  const rows = response.data;
  return { rows, nextStartRow: startRow + rows.length, hasMore: rows.length >= pageSize };
}

/**
 * Rows the grid shows once a page is applied: a following page is appended, a first page (a new query, a refetch,
 * a search) replaces the loaded rows.
 *
 * @param loaded - Rows already loaded
 * @param fetched - Rows of the page
 * @param appendsPage - Whether the page follows the loaded rows
 * @returns The rows the grid shows
 */
export function mergeFetchedPage(loaded: EntityData[], fetched: EntityData[], appendsPage: boolean): EntityData[] {
  if (appendsPage) {
    return appendUniqueRecords(loaded, fetched);
  }
  return replaceWithFirstPage(loaded, fetched);
}

/**
 * Appends the rows of a new page to the loaded ones, leaving out the records already loaded, so that a record
 * never shows twice even when two loads overlap (e.g. a record created meanwhile moved the rows of the server).
 *
 * @param loaded - Rows already loaded
 * @param fetched - Rows of the new page
 * @returns The loaded rows followed by the new ones
 */
export function appendUniqueRecords(loaded: EntityData[], fetched: EntityData[]): EntityData[] {
  const ids = new Set(loaded.map((record) => String(record.id)));
  const added = fetched.filter((record) => {
    const id = String(record.id);
    if (ids.has(id)) return false;
    ids.add(id);
    return true;
  });
  return loaded.concat(added);
}

/**
 * Rows of a first page (a new query or a refetch) replacing the loaded ones. Rows added by the user to a
 * Pick & Execute input grid (`_locallyAdded`, e.g. GL Items in Add Payment) survive, unless the server
 * returns the same record.
 *
 * @param loaded - Rows already loaded
 * @param fetched - Rows of the first page
 * @returns The rows the grid shows
 */
export function replaceWithFirstPage(loaded: EntityData[], fetched: EntityData[]): EntityData[] {
  const locallyAdded = loaded.filter((record) => record._locallyAdded);
  if (locallyAdded.length === 0) return fetched;
  const fetchedIds = new Set(fetched.map((record) => String(record.id)));
  const survivors = locallyAdded.filter((record) => !fetchedIds.has(String(record.id)));
  return survivors.length === 0 ? fetched : [...survivors, ...fetched];
}
