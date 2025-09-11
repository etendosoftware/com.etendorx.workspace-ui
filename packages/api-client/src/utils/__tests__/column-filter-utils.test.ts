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

import { ColumnFilterUtils, type ColumnFilterState, type FilterOption } from "../column-filter-utils";
import type { Column } from "../../api/types";
import { FieldType } from "../../api/types";

// Helper functions to reduce test duplication
const createMockFilterState = (
  id: string,
  selectedOptions: FilterOption[],
  isMultiSelect = false,
  availableOptions: FilterOption[] = [],
  loading = false
): ColumnFilterState => ({
  id,
  selectedOptions,
  isMultiSelect,
  availableOptions,
  loading,
});

const createMockCriteria = (fieldName: string, operator: string, value: string) => ({
  fieldName,
  operator,
  value,
});

const createMockAdvancedCriteria = (fieldName: string, operator: string, value: string) => ({
  fieldName,
  operator,
  value,
  _constructor: "AdvancedCriteria",
});

describe("ColumnFilterUtils", () => {
  const selectColumn: Column = {
    id: "status",
    columnName: "status",
    label: "Status",
    type: FieldType.SELECT,
    refList: [
      { id: "active", label: "Active", value: "A" },
      { id: "inactive", label: "Inactive", value: "I" },
    ],
  } as unknown as Column;

  const tableDirColumn: Column = {
    id: "category",
    columnName: "category",
    label: "Category",
    type: FieldType.TABLEDIR,
    referencedEntity: "Category",
  } as unknown as Column;

  const textColumn: Column = {
    id: "name",
    columnName: "name",
    label: "Name",
    type: FieldType.TEXT,
  } as unknown as Column;

  const businessPartnerColumn: Column = {
    id: "businessPartner",
    columnName: "businessPartner",
    label: "Business Partner",
    type: FieldType.SELECT,
    referencedEntity: "BusinessPartner",
    datasourceId: "BusinessPartner",
  } as unknown as Column;

  describe("supportsDropdownFilter", () => {
    it("should return true for SELECT columns", () => {
      expect(ColumnFilterUtils.supportsDropdownFilter(selectColumn)).toBe(true);
    });

    it("should return true for TABLEDIR columns", () => {
      expect(ColumnFilterUtils.supportsDropdownFilter(tableDirColumn)).toBe(true);
    });

    it("should return true for SELECT columns with referencedEntity (businessPartner case)", () => {
      expect(ColumnFilterUtils.supportsDropdownFilter(businessPartnerColumn)).toBe(true);
    });

    it("should return false for other column types", () => {
      expect(ColumnFilterUtils.supportsDropdownFilter(textColumn)).toBe(false);
    });
  });

  describe("isSelectColumn", () => {
    it("should return true for SELECT columns with refList", () => {
      expect(ColumnFilterUtils.isSelectColumn(selectColumn)).toBe(true);
    });

    it("should return false for SELECT columns without refList", () => {
      const selectWithoutRefList: Column = {
        ...selectColumn,
        refList: undefined,
      };
      expect(ColumnFilterUtils.isSelectColumn(selectWithoutRefList)).toBe(false);
    });

    it("should return false for SELECT columns with referencedEntity (businessPartner case)", () => {
      expect(ColumnFilterUtils.isSelectColumn(businessPartnerColumn)).toBe(false);
    });

    it("should return false for non-SELECT columns", () => {
      expect(ColumnFilterUtils.isSelectColumn(tableDirColumn)).toBe(false);
      expect(ColumnFilterUtils.isSelectColumn(textColumn)).toBe(false);
    });
  });

  describe("isTableDirColumn", () => {
    it("should return true for TABLEDIR columns with referencedEntity", () => {
      expect(ColumnFilterUtils.isTableDirColumn(tableDirColumn)).toBe(true);
    });

    it("should return false for TABLEDIR columns without referencedEntity", () => {
      const tableDirWithoutEntity: Column = {
        ...tableDirColumn,
        referencedEntity: undefined,
      };
      expect(ColumnFilterUtils.isTableDirColumn(tableDirWithoutEntity)).toBe(false);
    });

    it("should return true for SELECT columns with referencedEntity (businessPartner case)", () => {
      expect(ColumnFilterUtils.isTableDirColumn(businessPartnerColumn)).toBe(true);
    });

    it("should return false for non-TABLEDIR/non-reference columns", () => {
      expect(ColumnFilterUtils.isTableDirColumn(selectColumn)).toBe(false);
      expect(ColumnFilterUtils.isTableDirColumn(textColumn)).toBe(false);
    });
  });

  describe("getSelectOptions", () => {
    it("should return filter options for SELECT columns", () => {
      const options = ColumnFilterUtils.getSelectOptions(selectColumn);
      expect(options).toEqual([
        { id: "active", label: "Active", value: "A" },
        { id: "inactive", label: "Inactive", value: "I" },
      ]);
    });

    it("should return empty array for non-SELECT columns", () => {
      expect(ColumnFilterUtils.getSelectOptions(tableDirColumn)).toEqual([]);
      expect(ColumnFilterUtils.getSelectOptions(textColumn)).toEqual([]);
    });

    it("should return empty array for SELECT columns without refList", () => {
      const selectWithoutRefList: Column = {
        ...selectColumn,
        refList: undefined,
      };
      expect(ColumnFilterUtils.getSelectOptions(selectWithoutRefList)).toEqual([]);
    });

    it("should handle empty refList", () => {
      const selectWithEmptyRefList: Column = {
        ...selectColumn,
        refList: [],
      };
      expect(ColumnFilterUtils.getSelectOptions(selectWithEmptyRefList)).toEqual([]);
    });
  });

  describe("createColumnFilterCriteria", () => {
    const singleFilterOption: FilterOption = { id: "active", label: "Active", value: "A" };
    const multipleFilterOptions: FilterOption[] = [
      { id: "active", label: "Active", value: "A" },
      { id: "inactive", label: "Inactive", value: "I" },
    ];

    it("should create criteria for single selection", () => {
      const columnFilters: ColumnFilterState[] = [createMockFilterState("status", [singleFilterOption])];

      const criteria = ColumnFilterUtils.createColumnFilterCriteria(columnFilters);

      expect(criteria).toEqual([createMockCriteria("status", "equals", "A")]);
    });

    it("should create OR criteria for multiple selections", () => {
      const columnFilters: ColumnFilterState[] = [createMockFilterState("status", multipleFilterOptions, true)];

      const criteria = ColumnFilterUtils.createColumnFilterCriteria(columnFilters);

      expect(criteria).toEqual([
        {
          operator: "or",
          criteria: [createMockCriteria("status", "equals", "A"), createMockCriteria("status", "equals", "I")],
        },
      ]);
    });

    it("should handle multiple column filters", () => {
      const columnFilters: ColumnFilterState[] = [
        createMockFilterState("status", [singleFilterOption]),
        createMockFilterState("category", [{ id: "cat1", label: "Category 1", value: "CAT1" }]),
      ];

      const criteria = ColumnFilterUtils.createColumnFilterCriteria(columnFilters);

      expect(criteria).toEqual([
        createMockCriteria("status", "equals", "A"),
        createMockCriteria("category", "equals", "CAT1"),
      ]);
    });

    it("should ignore filters with no selected options", () => {
      const columnFilters: ColumnFilterState[] = [
        createMockFilterState("status", []),
        createMockFilterState("category", [{ id: "cat1", label: "Category 1", value: "CAT1" }]),
      ];

      const criteria = ColumnFilterUtils.createColumnFilterCriteria(columnFilters);

      expect(criteria).toEqual([createMockCriteria("category", "equals", "CAT1")]);
    });

    it("should return empty array for no filters", () => {
      const criteria = ColumnFilterUtils.createColumnFilterCriteria([]);
      expect(criteria).toEqual([]);
    });
  });

  describe("createEtendoClassicCriteria", () => {
    it("should return null for empty filters", () => {
      const result = ColumnFilterUtils.createEtendoClassicCriteria([]);
      expect(result).toBeNull();
    });

    it("should create JSON string for single filter with single selection", () => {
      const columnFilters: ColumnFilterState[] = [
        {
          id: "status",
          selectedOptions: [{ id: "active", label: "Active", value: "A" }],
          isMultiSelect: false,
          availableOptions: [],
          loading: false,
        },
      ];

      const result = ColumnFilterUtils.createEtendoClassicCriteria(columnFilters);
      const parsed = JSON.parse(result!);

      expect(parsed).toEqual({
        fieldName: "status",
        operator: "equals",
        value: "A",
        _constructor: "AdvancedCriteria",
      });
    });

    it("should create JSON string for single filter with multiple selections", () => {
      const columnFilters: ColumnFilterState[] = [
        {
          id: "status",
          selectedOptions: [
            { id: "active", label: "Active", value: "A" },
            { id: "inactive", label: "Inactive", value: "I" },
          ],
          isMultiSelect: true,
          availableOptions: [],
          loading: false,
        },
      ];

      const result = ColumnFilterUtils.createEtendoClassicCriteria(columnFilters);
      const parsed = JSON.parse(result!);

      expect(parsed).toEqual({
        operator: "or",
        criteria: [
          { fieldName: "status", operator: "equals", value: "A", _constructor: "AdvancedCriteria" },
          { fieldName: "status", operator: "equals", value: "I", _constructor: "AdvancedCriteria" },
        ],
        _constructor: "AdvancedCriteria",
      });
    });

    it("should create AND criteria for multiple filters", () => {
      const columnFilters: ColumnFilterState[] = [
        {
          id: "status",
          selectedOptions: [{ id: "active", label: "Active", value: "A" }],
          isMultiSelect: false,
          availableOptions: [],
          loading: false,
        },
        {
          id: "category",
          selectedOptions: [{ id: "cat1", label: "Category 1", value: "CAT1" }],
          isMultiSelect: false,
          availableOptions: [],
          loading: false,
        },
      ];

      const result = ColumnFilterUtils.createEtendoClassicCriteria(columnFilters);
      const parsed = JSON.parse(result!);

      expect(parsed).toEqual({
        operator: "and",
        criteria: [
          { fieldName: "status", operator: "equals", value: "A", _constructor: "AdvancedCriteria" },
          { fieldName: "category", operator: "equals", value: "CAT1", _constructor: "AdvancedCriteria" },
        ],
        _constructor: "AdvancedCriteria",
      });
    });

    it("should ignore filters with no selected options", () => {
      const columnFilters: ColumnFilterState[] = [
        {
          id: "status",
          selectedOptions: [],
          isMultiSelect: false,
          availableOptions: [],
          loading: false,
        },
        {
          id: "category",
          selectedOptions: [{ id: "cat1", label: "Category 1", value: "CAT1" }],
          isMultiSelect: false,
          availableOptions: [],
          loading: false,
        },
      ];

      const result = ColumnFilterUtils.createEtendoClassicCriteria(columnFilters);
      const parsed = JSON.parse(result!);

      expect(parsed).toEqual({
        fieldName: "category",
        operator: "equals",
        value: "CAT1",
        _constructor: "AdvancedCriteria",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed refList", () => {
      const malformedSelectColumn: Column = {
        ...selectColumn,
        refList: [{ id: "valid", label: "Valid", value: "V" }, { id: null, label: undefined, value: "" }, {}] as any,
      };

      const options = ColumnFilterUtils.getSelectOptions(malformedSelectColumn);

      // Should handle malformed entries gracefully
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({ id: "valid", label: "Valid", value: "V" });
    });

    it("should handle undefined column properties", () => {
      const undefinedColumn: Column = {} as any;

      expect(ColumnFilterUtils.supportsDropdownFilter(undefinedColumn)).toBe(false);
      expect(ColumnFilterUtils.isSelectColumn(undefinedColumn)).toBe(false);
      expect(ColumnFilterUtils.isTableDirColumn(undefinedColumn)).toBe(false);
      expect(ColumnFilterUtils.getSelectOptions(undefinedColumn)).toEqual([]);
    });
  });
});
