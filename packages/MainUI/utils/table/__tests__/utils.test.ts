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
} from "../utils";
import { isDateLike, formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";
import { isEmptyObject } from "../../commons";

jest.mock("@workspaceui/componentlibrary/src/utils/dateFormatter");
jest.mock("@workspaceui/api-client/src/utils/search-utils");
jest.mock("../../commons");

describe("table utils", () => {
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
});
