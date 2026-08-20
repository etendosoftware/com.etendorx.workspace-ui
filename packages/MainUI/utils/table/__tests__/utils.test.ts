/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  getDisplayColumnDefOptions,
  getMUITableBodyCellProps,
  getCurrentRowCanExpand,
  getNewActiveLevels,
  getNewActiveTabsByLevel,
  getCellTitle,
  mapSummariesToBackend,
  getSummaryCriteria,
  getDefaultImplicitFilter,
  resolveImplicitFilterToggle,
  sortFieldsByGridOrder,
  isGridRenderableColumn,
} from "../utils";
import { FIELD_REFERENCE_CODES } from "../../form/constants";
import { createMockField } from "../../tests/mockHelpers";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { isDateLike, formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { isEmptyObject } from "../../commons";

jest.mock("@workspaceui/componentlibrary/src/utils/dateFormatter");
jest.mock("@workspaceui/api-client/src/utils/search-utils");
jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("../../commons");

const mockGetCachedWindow = Metadata.getCachedWindow as jest.Mock;

describe("table utils", () => {
  describe("getDefaultImplicitFilter", () => {
    const makeTab = (overrides: Partial<Tab>): Tab =>
      ({ hqlfilterclause: "", tabLevel: 1, window: "W1", ...overrides }) as Tab;

    beforeEach(() => {
      mockGetCachedWindow.mockReset();
      mockGetCachedWindow.mockReturnValue({});
    });

    it("is ON when the tab has an HQL filter clause", () => {
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: "e.active = 'Y'" }))).toBe(true);
    });

    it("is ON for a root tab of a transactional (T) window even with no clause", () => {
      mockGetCachedWindow.mockReturnValue({ windowType: "T" });
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: "", tabLevel: 0 }))).toBe(true);
    });

    it("is OFF for a transactional window on a NON-root tab with no clause", () => {
      mockGetCachedWindow.mockReturnValue({ windowType: "T" });
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: "", tabLevel: 1 }))).toBe(false);
    });

    it("is OFF for a non-transactional window with no clause (SQL where clause is not a trigger)", () => {
      mockGetCachedWindow.mockReturnValue({ windowType: "M" });
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: "", tabLevel: 0 }))).toBe(false);
    });

    it("treats a missing (undefined) hqlfilterclause as no clause", () => {
      mockGetCachedWindow.mockReturnValue({ windowType: "M" });
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: undefined, tabLevel: 0 }))).toBe(false);
    });

    it("is OFF when the window metadata is not cached (no windowType resolvable)", () => {
      mockGetCachedWindow.mockReturnValue(undefined);
      expect(getDefaultImplicitFilter(makeTab({ hqlfilterclause: "", tabLevel: 0 }))).toBe(false);
    });
  });

  describe("resolveImplicitFilterToggle", () => {
    it("clears column filters when an id filter is pinning a single record", () => {
      expect(
        resolveImplicitFilterToggle({ hasIdFilter: true, isImplicitFilterApplied: true, initialIsFilterApplied: true })
      ).toEqual({ type: "clearColumnFilters" });
    });

    it("turns the implicit filter OFF when it is currently ON", () => {
      expect(
        resolveImplicitFilterToggle({ hasIdFilter: false, isImplicitFilterApplied: true, initialIsFilterApplied: true })
      ).toEqual({ type: "setImplicit", value: false });
    });

    it("turns the implicit filter ON when it is currently OFF (symmetric toggle)", () => {
      expect(
        resolveImplicitFilterToggle({
          hasIdFilter: false,
          isImplicitFilterApplied: false,
          initialIsFilterApplied: true,
        })
      ).toEqual({ type: "setImplicit", value: true });
    });

    it("falls back to the metadata default when state is undefined", () => {
      expect(
        resolveImplicitFilterToggle({
          hasIdFilter: false,
          isImplicitFilterApplied: undefined,
          initialIsFilterApplied: true,
        })
      ).toEqual({ type: "setImplicit", value: false });
    });
  });

  describe("getDisplayColumnDefOptions", () => {
    it("should return options for tree mode", () => {
      const options = getDisplayColumnDefOptions({ shouldUseTreeMode: true });
      expect(options["mrt-row-expand"].size).toBe(60);
      expect(options["mrt-row-expand"].muiTableHeadCellProps.sx.display).toBe("none");
    });

    it("should return options for normal mode", () => {
      const options = getDisplayColumnDefOptions({ shouldUseTreeMode: false });
      expect(options["mrt-row-expand"].size).toBe(0);
    });
  });

  describe("getMUITableBodyCellProps", () => {
    it("should apply indentation in tree mode for the second column", () => {
      const columns = [{ id: "actions" }, { id: "data-col" }];
      const column = { id: "data-col" };
      const row = { original: { __level: 2 } };
      const sx = { tableBodyCell: { color: "red" } };

      const props = getMUITableBodyCellProps({
        shouldUseTreeMode: true,
        sx,
        columns: columns as any,
        column: column as any,
        row: row as any,
      });

      expect(props).toEqual({
        color: "red",
        paddingLeft: "44px", // 12 + 2 * 16
        position: "relative",
      });
    });

    it("should not apply indentation if not tree mode", () => {
      const sx = { tableBodyCell: { color: "red" } };
      const props = getMUITableBodyCellProps({
        shouldUseTreeMode: false,
        sx,
        columns: [],
        column: { id: "some" } as any,
        row: { original: {} } as any,
      });
      expect(props).toEqual({ color: "red" });
    });

    it("falls back to an empty base style when sx has no tableBodyCell", () => {
      const props = getMUITableBodyCellProps({
        shouldUseTreeMode: true,
        sx: {},
        columns: [{ id: "actions" }, { id: "data-col" }] as any,
        column: { id: "data-col" } as any,
        row: { original: { __level: 1 } } as any,
      });
      expect(props).toEqual({ paddingLeft: "28px", position: "relative" });
    });
  });

  describe("getCurrentRowCanExpand", () => {
    it("should return true in tree mode", () => {
      expect(getCurrentRowCanExpand({ shouldUseTreeMode: true, row: {} as any })).toBe(true);
    });

    it("should check __isParent and showDropIcon in normal mode", () => {
      const row = { original: { __isParent: true, showDropIcon: true } };
      expect(getCurrentRowCanExpand({ shouldUseTreeMode: false, row: row as any })).toBe(true);

      const row2 = { original: { __isParent: true, showDropIcon: false } };
      expect(getCurrentRowCanExpand({ shouldUseTreeMode: false, row: row2 as any })).toBe(false);
    });
  });

  describe("getNewActiveLevels", () => {
    it("should handle expand=true", () => {
      expect(getNewActiveLevels([], 2, true)).toEqual([2]);
    });

    it("should handle expand=false", () => {
      expect(getNewActiveLevels([], 2, false)).toEqual([1, 2]);
      expect(getNewActiveLevels([], 0, false)).toEqual([0]);
    });

    it("should handle navigation levels", () => {
      expect(getNewActiveLevels([0, 1], 2)).toEqual([1, 2]);
      expect(getNewActiveLevels([0, 1], 1)).toEqual([0, 1]);
      expect(getNewActiveLevels([0, 1, 2], 1)).toEqual([0, 1]);
    });
  });

  describe("getNewActiveTabsByLevel", () => {
    it("should set the tabId for the given level", () => {
      const currentMap = new Map([[0, "tab1"]]);
      const newMap = getNewActiveTabsByLevel(currentMap, 1, "tab2");
      expect(newMap.get(0)).toBe("tab1");
      expect(newMap.get(1)).toBe("tab2");
    });
  });

  describe("getCellTitle", () => {
    beforeEach(() => {
      (isDateLike as jest.Mock).mockReturnValue(false);
    });

    it("should return string values as is", () => {
      expect(getCellTitle("hello")).toBe("hello");
    });

    it("should return number values as string", () => {
      expect(getCellTitle(123)).toBe("123");
    });

    it("should format dates if string looks like date", () => {
      (isDateLike as jest.Mock).mockReturnValue(true);
      (formatClassicDate as jest.Mock).mockReturnValue("formatted-date");
      expect(getCellTitle("2023-01-01")).toBe("formatted-date");
    });

    it("should extract label from props if object with props", () => {
      const obj = { props: { label: "my-label" } };
      (isEmptyObject as jest.Mock).mockReturnValue(false);
      expect(getCellTitle(obj)).toBe("my-label");
    });

    it("should return empty string for other types", () => {
      expect(getCellTitle(null)).toBe("");
      expect(getCellTitle(undefined)).toBe("");
      expect(getCellTitle({})).toBe("");
    });
  });

  describe("mapSummariesToBackend", () => {
    it("should map summary column IDs to backend names", () => {
      const baseColumns = [
        { id: "col1", columnName: "COL_1" },
        { id: "col2", columnName: "COL_2" },
      ] as any;
      const summaries = { col1: "sum", col2: "avg" };

      const result = mapSummariesToBackend(summaries, baseColumns);

      expect(result.summaryRequest).toEqual({ COL_1: "sum", COL_2: "avg" });
      expect(result.columnMapping).toEqual({ COL_1: "col1", COL_2: "col2" });
    });

    it("falls back to the column id as backend name when columnName is missing", () => {
      const result = mapSummariesToBackend({ col1: "sum" }, [{ id: "col1" }] as any);

      expect(result.summaryRequest).toEqual({ col1: "sum" });
      expect(result.columnMapping).toEqual({ col1: "col1" });
    });
  });

  describe("getSummaryCriteria", () => {
    it("should combine query criteria and column filter criteria", () => {
      const query = { criteria: [{ field: "f1", value: "v1" }] };
      const tableColumnFilters = [{ id: "f2", value: "v2" }] as any;
      const baseColumns = [] as any;

      const mockColumnFilterCriteria = [{ field: "f2", operator: "eq", value: "v2" }];
      (LegacyColumnFilterUtils.createColumnFilterCriteria as jest.Mock).mockReturnValue(mockColumnFilterCriteria);

      const criteria = getSummaryCriteria(query as any, tableColumnFilters, baseColumns);

      expect(criteria).toEqual([{ field: "f1", value: "v1" }, ...mockColumnFilterCriteria]);
    });

    it("should handle query criteria as single object", () => {
      const query = { criteria: { field: "f1", value: "v1" } };
      (LegacyColumnFilterUtils.createColumnFilterCriteria as jest.Mock).mockReturnValue([]);

      const criteria = getSummaryCriteria(query as any, [], []);
      expect(criteria).toEqual([{ field: "f1", value: "v1" }]);
    });
  });

  describe("sortFieldsByGridOrder", () => {
    /**
     * Builds a field carrying only the properties that drive the grid ordering, so each case
     * reads as the (id, seqNo, gridPosition) triplet it is really testing.
     */
    const makeField = (id: string, sequenceNumber: number | null, gridPosition?: number | null): Field =>
      createMockField({ id, name: id, sequenceNumber, gridPosition } as Partial<Field>);

    const orderOf = (fields: Field[]): string[] => sortFieldsByGridOrder(fields).map((field) => field.id);

    it("orders by gridPosition when it differs from the form sequence number", () => {
      const fields = [makeField("a", 10, 30), makeField("b", 20, 20), makeField("c", 30, 10)];

      expect(orderOf(fields)).toEqual(["c", "b", "a"]);
    });

    it("falls back to sequenceNumber when gridPosition is undefined", () => {
      const fields = [makeField("a", 30), makeField("b", 10), makeField("c", 20)];

      expect(orderOf(fields)).toEqual(["b", "c", "a"]);
    });

    it("falls back to sequenceNumber when gridPosition is null", () => {
      const fields = [makeField("a", 30, null), makeField("b", 10, null)];

      expect(orderOf(fields)).toEqual(["b", "a"]);
    });

    it("mixes gridPosition and sequenceNumber in the same numeric space, like Classic", () => {
      // "b" has no gridPosition, so its seqNo 15 places it between gridPosition 10 and 20.
      const fields = [makeField("a", 100, 10), makeField("b", 15), makeField("c", 100, 20)];

      expect(orderOf(fields)).toEqual(["a", "b", "c"]);
    });

    it("treats gridPosition 0 as a valid first position, not as unset", () => {
      const fields = [makeField("a", 10), makeField("b", 999, 0)];

      expect(orderOf(fields)).toEqual(["b", "a"]);
    });

    it("sends fields with neither gridPosition nor sequenceNumber last", () => {
      const fields = [makeField("a", null), makeField("b", 20), makeField("c", 10)];

      expect(orderOf(fields)).toEqual(["c", "b", "a"]);
    });

    it("breaks gridPosition ties by sequenceNumber", () => {
      const fields = [makeField("a", 20, 10), makeField("b", 5, 10)];

      expect(orderOf(fields)).toEqual(["b", "a"]);
    });

    it("breaks full ties by id so the order is deterministic", () => {
      const fields = [makeField("z", 10, 10), makeField("a", 10, 10)];

      expect(orderOf(fields)).toEqual(["a", "z"]);
    });

    it("keeps audit fields last, since the adapter gives them a high gridPosition", () => {
      const fields = [makeField("createdBy", 1, 9001), makeField("documentNo", 500)];

      expect(orderOf(fields)).toEqual(["documentNo", "createdBy"]);
    });

    it("does not mutate the received array", () => {
      const fields = [makeField("a", 30), makeField("b", 10)];

      sortFieldsByGridOrder(fields);

      expect(fields.map((field) => field.id)).toEqual(["a", "b"]);
    });

    it("returns an empty array when there are no fields", () => {
      expect(sortFieldsByGridOrder([])).toEqual([]);
    });
  });

  describe("isGridRenderableColumn", () => {
    /** Builds the only thing the predicate reads: the column's reference id. */
    const withReference = (reference?: string) => ({ column: reference ? { reference } : {} });

    it("excludes button references, like Classic's ApplicationUtils.isUIButton", () => {
      expect(isGridRenderableColumn(withReference(FIELD_REFERENCE_CODES.BUTTON.id))).toBe(false);
    });

    it("excludes image references, preserving the previous behaviour", () => {
      expect(isGridRenderableColumn(withReference(FIELD_REFERENCE_CODES.IMAGE.id))).toBe(false);
    });

    it("keeps a regular data reference", () => {
      expect(isGridRenderableColumn(withReference(FIELD_REFERENCE_CODES.STRING.id))).toBe(true);
    });

    // Regression guard: `formOfPayment` is a List (17) field carrying a legacy processAction and
    // is a legitimate, visible grid column. Filtering on the process instead of the reference
    // would wrongly drop it.
    it("keeps a non-button field that carries a legacy process action", () => {
      const formOfPayment = {
        ...withReference(FIELD_REFERENCE_CODES.LIST_17.id),
        processAction: { id: "legacy-process-placeholder" },
      };

      expect(isGridRenderableColumn(formOfPayment)).toBe(true);
    });

    it("keeps columns with incomplete metadata instead of dropping them", () => {
      expect(isGridRenderableColumn(withReference())).toBe(true);
      expect(isGridRenderableColumn({})).toBe(true);
      expect(isGridRenderableColumn({ column: null })).toBe(true);
    });
  });
});
