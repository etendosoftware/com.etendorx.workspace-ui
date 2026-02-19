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

import { SearchUtils, LegacyColumnFilterUtils } from "../search-utils";

describe("SearchUtils Expanded", () => {
  describe("getDateCriteria", () => {
    const field = "dateField";
    it("handles full date correctly", () => {
      const criteria = SearchUtils.getDateCriteria(field, "2023-12-25");
      expect(criteria).toEqual([{ fieldName: field, operator: "equals", value: "2023-12-25" }]);
    });

    it("handles year-month correctly", () => {
      const criteria = SearchUtils.getDateCriteria(field, "2023-02");
      expect(criteria).toHaveLength(2);
      expect(criteria[0]).toEqual({ fieldName: field, operator: "greaterOrEqual", value: "2023-02-01" });
      expect(criteria[1]).toEqual({ fieldName: field, operator: "lessOrEqual", value: "2023-02-31" });
    });

    it("handles year correctly", () => {
      const criteria = SearchUtils.getDateCriteria(field, "2024");
      expect(criteria).toHaveLength(2);
      expect(criteria[0].value).toBe("2024-01-01");
      expect(criteria[1].value).toBe("2024-12-31");
    });
  });

  describe("combineSearchAndColumnFilters", () => {
    it("should combine search query and column filters correctly", () => {
      const columns = [{ id: "n1", columnName: "documentNo" }] as any;
      const searchQuery = "ABC";
      const columnFilters = [
        {
          id: "n1",
          selectedOptions: [{ id: "opt1", label: "123", value: "123" }],
        },
      ] as any;

      const result = SearchUtils.combineSearchAndColumnFilters(columns, searchQuery, columnFilters);

      expect(result).toHaveLength(2);
      expect(result[0].operator).toBe("or"); // search
      expect(result[1].operator).toBe("and"); // column filter wrap
    });
  });
});

describe("LegacyColumnFilterUtils Expanded", () => {
  describe("isDateField", () => {
    it("identifies date fields by various means", () => {
      expect(LegacyColumnFilterUtils.isDateField("created", { columnName: "id" } as any)).toBe(true);
      expect(LegacyColumnFilterUtils.isDateField("f", { type: "date" } as any)).toBe(true);
      expect(LegacyColumnFilterUtils.isDateField("f", { reference: "15" } as any)).toBe(true);
      expect(LegacyColumnFilterUtils.isDateField("f", { reference: "10" } as any)).toBe(false);
    });
  });

  describe("isBooleanField", () => {
    it("identifies boolean fields", () => {
      expect(LegacyColumnFilterUtils.isBooleanField({ type: "boolean" } as any)).toBe(true);
      expect(LegacyColumnFilterUtils.isBooleanField({ column: { reference: "20" } } as any)).toBe(true);
      expect(LegacyColumnFilterUtils.isBooleanField({ type: "string" } as any)).toBe(false);
    });
  });

  describe("formatValueForType", () => {
    it("formats numeric values correctly", () => {
      const col = { type: "number" } as any;
      // The current implementation only does a simple replace(",", ".")
      // So "1234,56" -> "1234.56" -> 1234.56
      // But "1.234,56" -> "1.234.56" -> 1.234
      expect(LegacyColumnFilterUtils.formatValueForType("1234,56", col)).toBe(1234.56);
      expect(LegacyColumnFilterUtils.formatValueForType("abc", col)).toBeNull();
    });

    it("formats boolean values correctly", () => {
      const col = { type: "boolean" } as any;
      expect(LegacyColumnFilterUtils.formatValueForType("Yes", col)).toBe("true");
      expect(LegacyColumnFilterUtils.formatValueForType("No", col)).toBe("false");
    });
  });

  describe("Logical Filtering", () => {
    const field = "name";
    const col = { columnName: field } as any;

    it("parses OR conditions correctly", () => {
      const result = (LegacyColumnFilterUtils as any).parseLogicalFilter(field, "A | B", col);
      expect(result.operator).toBe("or");
      expect(result.criteria).toHaveLength(2);
      expect(result.criteria[0].value).toBe("A");
      expect(result.criteria[1].value).toBe("B");
    });

    it("parses AND conditions correctly", () => {
      const result = (LegacyColumnFilterUtils as any).parseLogicalFilter(field, "A & B", col);
      expect(result.operator).toBe("and");
      expect(result.criteria).toHaveLength(2);
    });

    it("parses NOT conditions correctly", () => {
      const result = (LegacyColumnFilterUtils as any).parseLogicalFilter(field, "!ABC", col);
      expect(result.operator).toBe("notContains");
      expect(result.value).toBe("ABC");
    });

    it("parses comparison operators correctly", () => {
      const numCol = { type: "number" } as any;
      const res1 = (LegacyColumnFilterUtils as any).parseLogicalFilter("qty", ">= 10", numCol);
      expect(res1.operator).toBe("greaterOrEqual");
      expect(res1.value).toBe(10);

      const res2 = (LegacyColumnFilterUtils as any).parseLogicalFilter("qty", "< 5", numCol);
      expect(res2.operator).toBe("lessThan");
      expect(res2.value).toBe(5);
    });
  });

  describe("Date range parsing", () => {
    it("parses date ranges in strings", () => {
      const dateCol = { columnName: "date", type: "date" } as any;
      const val = "27-10-2023 - 31-10-2023";
      const result = (LegacyColumnFilterUtils as any).parseDateRangeIfExists(val, dateCol);
      expect(result).toEqual({
        from: "27-10-2023",
        to: "31-10-2023",
      });
    });

    it("handles partial date ranges", () => {
      const dateCol = { columnName: "date", type: "date" } as any;
      const val = "27-10-2023 - ";
      const result = (LegacyColumnFilterUtils as any).parseDateRangeIfExists(val, dateCol);
      expect(result).toEqual({
        from: "27-10-2023",
        to: null,
      });
    });
  });
});
