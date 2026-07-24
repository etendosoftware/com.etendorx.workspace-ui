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

import { loadSelectFilterOptions, loadTableDirFilterOptions } from "../columnFilterHelpers";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { FieldType } from "@workspaceui/api-client/src/api/types";

// Test helpers and factories
const createMockSetFilterOptions = () => jest.fn();
const createMockFetchFilterOptions = (mockData: FilterOption[]) => jest.fn().mockResolvedValue(mockData);

const createSelectColumn = (overrides?: Partial<Column>): Column =>
  ({
    id: "status",
    columnName: "status",
    header: "Status",
    type: FieldType.SELECT,
    reference: "17",
    refList: [
      { id: "active", value: "A", label: "Active" },
      { id: "inactive", value: "I", label: "Inactive" },
      { id: "pending", value: "P", label: "Pending" },
    ],
    ...overrides,
  }) as Column;

const createTableDirColumn = (overrides?: Partial<Column>): Column =>
  ({
    id: "product",
    columnName: "product",
    header: "Product",
    reference: "19",
    datasourceId: "Product",
    ...overrides,
  }) as Column;

const createFilterOptions = (count: number, prefix = "item"): FilterOption[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i}`,
    value: `${prefix}${i}`,
    label: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${i}`,
  }));

const COMMON_PARAMS = {
  tabId: "tab123",
  entityName: "SalesOrder",
} as const;

// Helper to run loadTableDirFilterOptions test with common setup
const runLoadTableDirTest = async (params: {
  column: Column;
  columnId: string;
  mockData: FilterOption[];
  offset?: number;
  pageSize?: number;
  searchQuery?: string;
}) => {
  const { column, columnId, mockData, offset = 0, pageSize = 20, searchQuery } = params;
  const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
  const mockSetFilterOptions = createMockSetFilterOptions();

  const result = await loadTableDirFilterOptions({
    column,
    columnId,
    searchQuery,
    ...COMMON_PARAMS,
    fetchFilterOptions: mockFetchFilterOptions,
    setFilterOptions: mockSetFilterOptions,
    offset,
    pageSize,
  });

  return { result, mockFetchFilterOptions, mockSetFilterOptions };
};

describe("columnFilterHelpers", () => {
  describe("loadSelectFilterOptions", () => {
    it("should load and filter SELECT column options without search query", () => {
      const mockColumn = createSelectColumn();
      const mockSetFilterOptions = createMockSetFilterOptions();
      const expectedOptions = mockColumn.refList;

      const result = loadSelectFilterOptions(mockColumn, "status", undefined, mockSetFilterOptions);

      expect(result).toEqual(expectedOptions);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("status", expectedOptions, false, false);
    });

    it("should filter SELECT column options with search query", () => {
      const mockColumn = createSelectColumn();
      const mockSetFilterOptions = createMockSetFilterOptions();
      const expectedOptions = [{ id: "pending", value: "P", label: "Pending" }];

      const result = loadSelectFilterOptions(mockColumn, "status", "pend", mockSetFilterOptions);

      expect(result).toEqual(expectedOptions);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("status", expectedOptions, false, false);
    });

    it("should handle case-insensitive search", () => {
      const mockColumn = createSelectColumn({
        refList: [
          { id: "draft", value: "D", label: "Draft" },
          { id: "completed", value: "C", label: "Completed" },
        ],
      });
      const mockSetFilterOptions = createMockSetFilterOptions();
      const expectedOptions = [{ id: "draft", value: "D", label: "Draft" }];

      const result = loadSelectFilterOptions(mockColumn, "status", "DRAFT", mockSetFilterOptions);

      expect(result).toEqual(expectedOptions);
    });
  });

  describe("loadTableDirFilterOptions", () => {
    it("should use the _distinct query on the grid's own entity when entityName is present, matching Classic", async () => {
      const mockColumn = createTableDirColumn({
        id: "organization",
        columnName: "organization",
        datasourceId: "Organization",
      });
      const mockData = [
        { id: "org1", value: "org1", label: "Organization 1" },
        { id: "org2", value: "org2", label: "Organization 2" },
      ];

      const { result, mockFetchFilterOptions, mockSetFilterOptions } = await runLoadTableDirTest({
        column: mockColumn,
        columnId: "organization",
        mockData,
      });

      expect(result).toEqual(mockData);
      // entityName takes priority over datasourceId: queries distinct values scoped to the grid's own records,
      // and isImplicitFilterApplied is always forced to true regardless of what the caller passed in
      expect(mockFetchFilterOptions).toHaveBeenCalledWith({
        datasourceId: "SalesOrder",
        searchQuery: undefined,
        limit: 20,
        distinctField: "organization",
        tabId: "tab123",
        offset: 0,
        isImplicitFilterApplied: true,
        extraParams: undefined,
      });
      expect(mockSetFilterOptions).toHaveBeenCalledWith("organization", mockData, false, false);
    });

    it("should fall back to the referenced datasource when there is no entityName but datasourceId is present", async () => {
      const mockColumn = createTableDirColumn({
        id: "organization",
        columnName: "organization",
        datasourceId: "Organization",
      });
      const mockData = [{ id: "org1", value: "org1", label: "Organization 1" }];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "organization",
        tabId: "tab123",
        entityName: undefined,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual(mockData);
      expect(mockFetchFilterOptions).toHaveBeenCalledWith({
        datasourceId: "Organization",
        selectorDefinitionId: undefined,
        searchQuery: undefined,
        limit: 20,
        offset: 0,
        isImplicitFilterApplied: undefined,
        extraParams: undefined,
      });
    });

    it("should fall back to referencedEntity when there is no entityName and no datasourceId", async () => {
      const mockColumn = createTableDirColumn({
        id: "businessPartner",
        columnName: "businessPartner",
        reference: "30",
        referencedEntity: "BusinessPartner",
        selectorDefinitionId: "selector123",
        datasourceId: undefined,
      });
      const mockData = [{ id: "bp1", value: "bp1", label: "Partner 1" }];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "businessPartner",
        tabId: "tab123",
        entityName: undefined,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual(mockData);
      expect(mockFetchFilterOptions).toHaveBeenCalledWith({
        datasourceId: "BusinessPartner",
        selectorDefinitionId: "selector123",
        searchQuery: undefined,
        limit: 20,
        offset: 0,
        isImplicitFilterApplied: undefined,
        extraParams: undefined,
      });
    });

    it("should return no options without fetching when there is no entityName, datasourceId, or referencedEntity", async () => {
      const mockColumn = createTableDirColumn({
        id: "characteristic",
        columnName: "characteristic",
        datasourceId: undefined,
        referencedEntity: undefined,
      });
      const mockFetchFilterOptions = createMockFetchFilterOptions([]);
      const mockSetFilterOptions = createMockSetFilterOptions();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "characteristic",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: undefined,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual([]);
      expect(mockFetchFilterOptions).not.toHaveBeenCalled();
    });

    it("should handle pagination with offset and pageSize", async () => {
      const mockColumn = createTableDirColumn();
      const mockData = [
        { id: "prod21", value: "prod21", label: "Product 21" },
        { id: "prod22", value: "prod22", label: "Product 22" },
      ];

      const { mockFetchFilterOptions, mockSetFilterOptions } = await runLoadTableDirTest({
        column: mockColumn,
        columnId: "product",
        mockData,
        offset: 20,
        pageSize: 10,
      });

      // entityName is present, so it queries distinct values on the grid's own entity
      expect(mockFetchFilterOptions).toHaveBeenCalledWith({
        datasourceId: "SalesOrder",
        searchQuery: undefined,
        limit: 10,
        distinctField: "product",
        tabId: "tab123",
        offset: 20,
        isImplicitFilterApplied: true,
        extraParams: undefined,
      });
      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockData, false, true);
    });

    it("should detect hasMore when results equal pageSize", async () => {
      const mockColumn = createTableDirColumn();
      const mockResults = createFilterOptions(20, "prod");

      const { mockSetFilterOptions } = await runLoadTableDirTest({
        column: mockColumn,
        columnId: "product",
        mockData: mockResults,
      });

      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockResults, true, false);
    });

    it("should handle errors gracefully", async () => {
      const mockColumn = createTableDirColumn();
      const mockFetchFilterOptions = jest.fn().mockRejectedValue(new Error("Network error"));
      const mockSetFilterOptions = createMockSetFilterOptions();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual([]);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", [], false, false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should set append to true when offset > 0", async () => {
      const mockColumn = createTableDirColumn();
      const mockData = [{ id: "prod1", value: "prod1", label: "Product 1" }];

      const { mockSetFilterOptions } = await runLoadTableDirTest({
        column: mockColumn,
        columnId: "product",
        mockData,
        offset: 20,
      });

      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockData, false, true);
    });
  });
});
