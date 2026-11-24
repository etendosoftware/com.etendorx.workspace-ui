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
import {
  appendUniqueRecords,
  getPageRange,
  isRestartedPage,
  mergeFetchedPage,
  readFetchedPage,
  replaceWithFirstPage,
} from "@/utils/table/datasourcePaging";

const rows = (...ids: string[]): EntityData[] => ids.map((id) => ({ id }));
const ids = (records: EntityData[]) => records.map((record) => record.id);

describe("getPageRange", () => {
  it("asks for pageSize + 1 rows from the given row, as Classic reads _endRow as inclusive", () => {
    expect(getPageRange(0, 100)).toEqual({ startRow: 0, endRow: 100 });
    expect(getPageRange(101, 100)).toEqual({ startRow: 101, endRow: 201 });
  });
});

describe("isRestartedPage", () => {
  it("detects a response that starts before the requested row", () => {
    expect(isRestartedPage(101, 0)).toBe(true);
  });

  it("accepts a response that starts at the requested row", () => {
    expect(isRestartedPage(101, 101)).toBe(false);
  });

  it("never flags the first page or a response without start row", () => {
    expect(isRestartedPage(0, 0)).toBe(false);
    expect(isRestartedPage(101, undefined)).toBe(false);
  });
});

describe("appendUniqueRecords", () => {
  it("appends the new rows after the loaded ones", () => {
    expect(ids(appendUniqueRecords(rows("1", "2"), rows("3", "4")))).toEqual(["1", "2", "3", "4"]);
  });

  it("leaves out the records already loaded and the ones repeated in the page", () => {
    expect(ids(appendUniqueRecords(rows("1", "2"), rows("2", "3", "3")))).toEqual(["1", "2", "3"]);
  });
});

describe("replaceWithFirstPage", () => {
  it("returns the fetched rows when nothing was added locally", () => {
    const fetched = rows("3");
    expect(replaceWithFirstPage(rows("1"), fetched)).toBe(fetched);
  });

  it("keeps the locally added rows the server does not return, before the fetched ones", () => {
    const loaded = [{ id: "new", _locallyAdded: true }, ...rows("1")];
    expect(ids(replaceWithFirstPage(loaded, rows("2")))).toEqual(["new", "2"]);
  });

  it("drops a locally added row the server returns", () => {
    const fetched = rows("new");
    expect(replaceWithFirstPage([{ id: "new", _locallyAdded: true }], fetched)).toBe(fetched);
  });
});

describe("readFetchedPage", () => {
  it("returns the rows, the start of the next page and that more may follow", () => {
    const page = readFetchedPage(101, 100, { data: rows("a", "b"), startRow: 101 });
    expect(page).toEqual({ rows: rows("a", "b"), nextStartRow: 103, hasMore: false });
  });

  it("says more may follow when the page holds pageSize rows or more", () => {
    expect(readFetchedPage(0, 2, { data: rows("1", "2", "3") })?.hasMore).toBe(true);
  });

  it("returns null when Classic answered the first rows again", () => {
    expect(readFetchedPage(101, 100, { data: rows("1"), startRow: 0 })).toBeNull();
  });
});

describe("mergeFetchedPage", () => {
  it("appends a following page without repeated records", () => {
    expect(ids(mergeFetchedPage(rows("1", "2"), rows("2", "3"), true))).toEqual(["1", "2", "3"]);
  });

  it("replaces the loaded rows with a first page", () => {
    expect(ids(mergeFetchedPage(rows("1", "2"), rows("3"), false))).toEqual(["3"]);
  });
});
