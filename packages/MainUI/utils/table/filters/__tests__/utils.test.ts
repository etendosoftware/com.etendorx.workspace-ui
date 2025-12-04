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

import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import {
  isFilterOptionArray,
  getTextFilterValue,
  getAvailableOptions,
  reconstructSelectedOptions,
  mergeAvailableAndSelectedOptions,
  reconstructFilterState,
} from "../utils";

describe("Filter Utils", () => {
  describe("isFilterOptionArray", () => {
    it("should return true for valid FilterOption array", () => {
      const validArray: FilterOption[] = [
        { id: "1", label: "Option 1", value: "opt1" },
        { id: "2", label: "Option 2", value: "opt2" },
      ];
      expect(isFilterOptionArray(validArray)).toBe(true);
    });

    it("should return false for string array", () => {
      const stringArray = ["value1", "value2"];
      expect(isFilterOptionArray(stringArray)).toBe(false);
    });

    it("should return false for empty array", () => {
      expect(isFilterOptionArray([])).toBe(false);
    });

    it("should return false for non-array values", () => {
      expect(isFilterOptionArray("string")).toBe(false);
      expect(isFilterOptionArray(null)).toBe(false);
      expect(isFilterOptionArray(undefined)).toBe(false);
      expect(isFilterOptionArray({})).toBe(false);
    });

    it("should return false for array of objects without required properties", () => {
      const invalidArray = [{ id: "1", label: "Option 1" }]; // missing 'value'
      expect(isFilterOptionArray(invalidArray)).toBe(false);
    });
  });

  describe("getTextFilterValue", () => {
    const mockColumn: Column = {
      id: "col1",
      columnName: "testColumn",
      name: "Test Column",
      label: "Test",
    } as Column;

    it("should return string value from tableColumnFilters", () => {
      const tableColumnFilters = [{ id: "col1", value: "test value" }];
      expect(getTextFilterValue(mockColumn, tableColumnFilters)).toBe("test value");
    });

    it("should return undefined when filter is FilterOption[]", () => {
      const filterOptions: FilterOption[] = [{ id: "1", label: "Opt", value: "opt" }];
      const tableColumnFilters = [{ id: "col1", value: filterOptions }];
      expect(getTextFilterValue(mockColumn, tableColumnFilters)).toBeUndefined();
    });

    it("should return undefined when no matching filter", () => {
      const tableColumnFilters = [{ id: "differentCol", value: "value" }];
      expect(getTextFilterValue(mockColumn, tableColumnFilters)).toBeUndefined();
    });

    it("should match by columnName when id doesn't match", () => {
      const tableColumnFilters = [{ id: "testColumn", value: "test value" }];
      expect(getTextFilterValue(mockColumn, tableColumnFilters)).toBe("test value");
    });

    it("should return undefined when tableColumnFilters is undefined", () => {
      expect(getTextFilterValue(mockColumn, undefined)).toBeUndefined();
    });
  });

  describe("getAvailableOptions", () => {
    const mockColumn: Column = {
      id: "col1",
      columnName: "testColumn",
      name: "Test Column",
      label: "Test",
    } as Column;

    const booleanOptions: FilterOption[] = [
      { id: "true", label: "Yes", value: "true" },
      { id: "false", label: "No", value: "false" },
    ];

    it("should return boolean options for boolean columns", () => {
      const result = getAvailableOptions(mockColumn, true, undefined, booleanOptions);
      expect(result).toEqual(booleanOptions);
    });

    it("should return filterState options for non-boolean columns", () => {
      const filterState: ColumnFilterState = {
        id: "col1",
        selectedOptions: [],
        availableOptions: [{ id: "1", label: "Option", value: "opt" }],
        isMultiSelect: true,
        loading: false,
        hasMore: false,
        searchQuery: "",
      };
      const result = getAvailableOptions(mockColumn, false, filterState, booleanOptions);
      expect(result).toEqual(filterState.availableOptions);
    });

    it("should return empty array when filterState is undefined", () => {
      const result = getAvailableOptions(mockColumn, false, undefined, booleanOptions);
      expect(result).toEqual([]);
    });
  });

  describe("reconstructSelectedOptions", () => {
    const availableOptions: FilterOption[] = [
      { id: "uuid-1", label: "Option 1", value: "opt1" },
      { id: "uuid-2", label: "Option 2", value: "opt2" },
    ];

    it("should return FilterOption[] when value is already in new format", () => {
      const filterOptions: FilterOption[] = [{ id: "uuid-1", label: "Option 1", value: "opt1" }];
      const currentFilter = { id: "col1", value: filterOptions };

      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual(filterOptions);
    });

    it("should reconstruct from string array (legacy format)", () => {
      const currentFilter = { id: "col1", value: ["opt1", "opt2"] };

      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual([
        { id: "uuid-1", label: "Option 1", value: "opt1" },
        { id: "uuid-2", label: "Option 2", value: "opt2" },
      ]);
    });

    it("should reconstruct from comma-separated string (legacy format)", () => {
      const currentFilter = { id: "col1", value: "opt1, opt2" };

      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual([
        { id: "uuid-1", label: "Option 1", value: "opt1" },
        { id: "uuid-2", label: "Option 2", value: "opt2" },
      ]);
    });

    it("should reconstruct from single string value", () => {
      const currentFilter = { id: "col1", value: "opt1" };

      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual([{ id: "uuid-1", label: "Option 1", value: "opt1" }]);
    });

    it("should create basic FilterOption for unknown values", () => {
      const currentFilter = { id: "col1", value: "unknown-value" };

      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual([{ id: "unknown-value", label: "unknown-value", value: "unknown-value" }]);
    });

    it("should return empty array when currentFilter is undefined", () => {
      const result = reconstructSelectedOptions(undefined, availableOptions);
      expect(result).toEqual([]);
    });

    it("should return empty array when value is undefined", () => {
      const currentFilter = { id: "col1", value: undefined };
      const result = reconstructSelectedOptions(currentFilter, availableOptions);
      expect(result).toEqual([]);
    });
  });

  describe("mergeAvailableAndSelectedOptions", () => {
    it("should merge selected options into available options", () => {
      const availableOptions: FilterOption[] = [
        { id: "1", label: "Option 1", value: "opt1" },
        { id: "2", label: "Option 2", value: "opt2" },
      ];

      const selectedOptions: FilterOption[] = [
        { id: "3", label: "Option 3", value: "opt3" }, // Not in available
        { id: "1", label: "Option 1", value: "opt1" }, // Already in available
      ];

      const result = mergeAvailableAndSelectedOptions(availableOptions, selectedOptions);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ id: "1", label: "Option 1", value: "opt1" });
      expect(result).toContainEqual({ id: "2", label: "Option 2", value: "opt2" });
      expect(result).toContainEqual({ id: "3", label: "Option 3", value: "opt3" });
    });

    it("should not duplicate options that are already in available", () => {
      const availableOptions: FilterOption[] = [{ id: "1", label: "Option 1", value: "opt1" }];

      const selectedOptions: FilterOption[] = [{ id: "1", label: "Option 1", value: "opt1" }];

      const result = mergeAvailableAndSelectedOptions(availableOptions, selectedOptions);

      expect(result).toHaveLength(1);
    });

    it("should preserve original available options order", () => {
      const availableOptions: FilterOption[] = [
        { id: "1", label: "Option 1", value: "opt1" },
        { id: "2", label: "Option 2", value: "opt2" },
      ];

      const selectedOptions: FilterOption[] = [];

      const result = mergeAvailableAndSelectedOptions(availableOptions, selectedOptions);

      expect(result).toEqual(availableOptions);
    });
  });

  describe("reconstructFilterState", () => {
    const mockColumn: Column = {
      id: "col1",
      columnName: "testColumn",
      name: "Test Column",
      label: "Test",
    } as Column;

    const availableOptions: FilterOption[] = [
      { id: "uuid-1", label: "Option 1", value: "opt1" },
      { id: "uuid-2", label: "Option 2", value: "opt2" },
    ];

    it("should reconstruct complete filter state with new format", () => {
      const filterOptions: FilterOption[] = [{ id: "uuid-1", label: "Option 1", value: "opt1" }];
      const currentFilter = { id: "col1", value: filterOptions };

      const result = reconstructFilterState(mockColumn, currentFilter, availableOptions, undefined);

      expect(result).toEqual({
        id: "col1",
        selectedOptions: [{ id: "uuid-1", label: "Option 1", value: "opt1" }],
        availableOptions: [
          { id: "uuid-1", label: "Option 1", value: "opt1" },
          { id: "uuid-2", label: "Option 2", value: "opt2" },
        ],
        isMultiSelect: true,
        loading: false,
        hasMore: false,
        searchQuery: "",
      });
    });

    it("should reconstruct complete filter state with legacy format", () => {
      const currentFilter = { id: "col1", value: ["opt1"] };

      const result = reconstructFilterState(mockColumn, currentFilter, availableOptions, undefined);

      expect(result.selectedOptions).toEqual([{ id: "uuid-1", label: "Option 1", value: "opt1" }]);
    });

    it("should merge selected options into available options", () => {
      const selectedOption: FilterOption = { id: "uuid-3", label: "Option 3", value: "opt3" };
      const currentFilter = { id: "col1", value: [selectedOption] };

      const result = reconstructFilterState(mockColumn, currentFilter, availableOptions, undefined);

      expect(result.availableOptions).toContainEqual(selectedOption);
      expect(result.availableOptions).toHaveLength(3);
    });

    it("should preserve filterState properties", () => {
      const filterState: ColumnFilterState = {
        id: "col1",
        selectedOptions: [],
        availableOptions: [],
        isMultiSelect: true,
        loading: true,
        hasMore: true,
        searchQuery: "test",
      };

      const result = reconstructFilterState(mockColumn, undefined, availableOptions, filterState);

      expect(result.loading).toBe(true);
      expect(result.hasMore).toBe(true);
      expect(result.searchQuery).toBe("test");
    });

    it("should use default values when filterState is undefined", () => {
      const result = reconstructFilterState(mockColumn, undefined, availableOptions, undefined);

      expect(result.loading).toBe(false);
      expect(result.hasMore).toBe(false);
      expect(result.searchQuery).toBe("");
    });
  });
});
