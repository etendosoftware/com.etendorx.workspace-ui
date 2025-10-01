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
import type { Column, FilterOption } from "@workspaceui/api-client/src/api/types";
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
    value: `${prefix}${i}`,
    label: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${i}`,
  }));

const COMMON_PARAMS = {
  tabId: "tab123",
  entityName: "SalesOrder",
} as const;

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
    it("should load TABLEDIR options with datasourceId (uses distinct values path)", async () => {
      const mockColumn = createTableDirColumn({ id: "organization", columnName: "organization", datasourceId: "Organization" });
      const mockData = [
        { value: "org1", label: "Organization 1" },
        { value: "org2", label: "Organization 2" },
      ];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "organization",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual(mockData);
      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 20, "organization", "tab123", 0);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("organization", mockData, false, false);
    });

    it("should load TABLEDIR options with referencedEntity (uses selector path)", async () => {
      const mockColumn = createTableDirColumn({
        id: "businessPartner",
        columnName: "businessPartner",
        reference: "30",
        referencedEntity: "BusinessPartner",
        selectorDefinitionId: "selector123",
        datasourceId: undefined,
      });
      const mockData = [
        { value: "bp1", label: "Partner 1" },
        { value: "bp2", label: "Partner 2" },
      ];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "businessPartner",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual(mockData);
      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 20, "businessPartner", "tab123", 0);
    });

    it("should handle pagination with offset and pageSize", async () => {
      const mockColumn = createTableDirColumn();
      const mockData = [
        { value: "prod21", label: "Product 21" },
        { value: "prod22", label: "Product 22" },
      ];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
        offset: 20,
        pageSize: 10,
      });

      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 10, "product", "tab123", 20);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockData, false, true);
    });

    it("should detect hasMore when results equal pageSize", async () => {
      const mockColumn = createTableDirColumn();
      const mockResults = createFilterOptions(20, "prod");
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockResults);
      const mockSetFilterOptions = createMockSetFilterOptions();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
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
      const mockData = [{ value: "prod1", label: "Product 1" }];
      const mockFetchFilterOptions = createMockFetchFilterOptions(mockData);
      const mockSetFilterOptions = createMockSetFilterOptions();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        ...COMMON_PARAMS,
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
        offset: 20,
      });

      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockData, false, true);
    });
  });
});
