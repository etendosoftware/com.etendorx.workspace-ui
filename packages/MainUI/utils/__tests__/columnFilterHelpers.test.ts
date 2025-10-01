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

describe("columnFilterHelpers", () => {
  describe("loadSelectFilterOptions", () => {
    it("should load and filter SELECT column options without search query", () => {
      const mockColumn: Column = {
        id: "status",
        columnName: "status",
        header: "Status",
        type: FieldType.SELECT,
        reference: "17", // SELECT reference
        refList: [
          { id: "active", value: "A", label: "Active" },
          { id: "inactive", value: "I", label: "Inactive" },
          { id: "pending", value: "P", label: "Pending" },
        ],
      } as Column;

      const mockSetFilterOptions = jest.fn();

      const result = loadSelectFilterOptions(mockColumn, "status", undefined, mockSetFilterOptions);

      expect(result).toEqual([
        { id: "active", value: "A", label: "Active" },
        { id: "inactive", value: "I", label: "Inactive" },
        { id: "pending", value: "P", label: "Pending" },
      ]);

      expect(mockSetFilterOptions).toHaveBeenCalledWith(
        "status",
        [
          { id: "active", value: "A", label: "Active" },
          { id: "inactive", value: "I", label: "Inactive" },
          { id: "pending", value: "P", label: "Pending" },
        ],
        false,
        false
      );
    });

    it("should filter SELECT column options with search query", () => {
      const mockColumn: Column = {
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
      } as Column;

      const mockSetFilterOptions = jest.fn();

      const result = loadSelectFilterOptions(mockColumn, "status", "pend", mockSetFilterOptions);

      expect(result).toEqual([{ id: "pending", value: "P", label: "Pending" }]);

      expect(mockSetFilterOptions).toHaveBeenCalledWith("status", [{ id: "pending", value: "P", label: "Pending" }], false, false);
    });

    it("should handle case-insensitive search", () => {
      const mockColumn: Column = {
        id: "status",
        columnName: "status",
        header: "Status",
        type: FieldType.SELECT,
        reference: "17",
        refList: [
          { id: "draft", value: "D", label: "Draft" },
          { id: "completed", value: "C", label: "Completed" },
        ],
      } as Column;

      const mockSetFilterOptions = jest.fn();

      const result = loadSelectFilterOptions(mockColumn, "status", "DRAFT", mockSetFilterOptions);

      expect(result).toEqual([{ id: "draft", value: "D", label: "Draft" }]);
    });
  });

  describe("loadTableDirFilterOptions", () => {
    it("should load TABLEDIR options with datasourceId (uses distinct values path)", async () => {
      const mockColumn: Column = {
        id: "organization",
        columnName: "organization",
        header: "Organization",
        reference: "19", // TABLEDIR reference
        datasourceId: "Organization",
      } as Column;

      const mockFetchFilterOptions = jest.fn().mockResolvedValue([
        { value: "org1", label: "Organization 1" },
        { value: "org2", label: "Organization 2" },
      ]);

      const mockSetFilterOptions = jest.fn();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "organization",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual([
        { value: "org1", label: "Organization 1" },
        { value: "org2", label: "Organization 2" },
      ]);

      // When datasourceId exists, needsDistinctValues returns true, so it uses the current datasource
      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 20, "organization", "tab123", 0);

      expect(mockSetFilterOptions).toHaveBeenCalledWith(
        "organization",
        [
          { value: "org1", label: "Organization 1" },
          { value: "org2", label: "Organization 2" },
        ],
        false,
        false
      );
    });

    it("should load TABLEDIR options with referencedEntity (uses selector path)", async () => {
      const mockColumn: Column = {
        id: "businessPartner",
        columnName: "businessPartner",
        header: "Business Partner",
        reference: "30",
        referencedEntity: "BusinessPartner",
        selectorDefinitionId: "selector123",
      } as Column;

      const mockFetchFilterOptions = jest.fn().mockResolvedValue([
        { value: "bp1", label: "Partner 1" },
        { value: "bp2", label: "Partner 2" },
      ]);

      const mockSetFilterOptions = jest.fn();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "businessPartner",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual([
        { value: "bp1", label: "Partner 1" },
        { value: "bp2", label: "Partner 2" },
      ]);

      // When referencedEntity exists, needsDistinctValues returns true, uses entity datasource
      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 20, "businessPartner", "tab123", 0);
    });

    it("should handle pagination with offset and pageSize", async () => {
      const mockColumn: Column = {
        id: "product",
        columnName: "product",
        header: "Product",
        reference: "19",
        datasourceId: "Product",
      } as Column;

      const mockFetchFilterOptions = jest.fn().mockResolvedValue([
        { value: "prod21", label: "Product 21" },
        { value: "prod22", label: "Product 22" },
      ]);

      const mockSetFilterOptions = jest.fn();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
        offset: 20,
        pageSize: 10,
      });

      // When datasourceId exists, it uses the entity datasource path
      expect(mockFetchFilterOptions).toHaveBeenCalledWith("SalesOrder", undefined, undefined, 10, "product", "tab123", 20);

      expect(mockSetFilterOptions).toHaveBeenCalledWith(
        "product",
        [
          { value: "prod21", label: "Product 21" },
          { value: "prod22", label: "Product 22" },
        ],
        false,
        true
      );
    });

    it("should detect hasMore when results equal pageSize", async () => {
      const mockColumn: Column = {
        id: "product",
        columnName: "product",
        header: "Product",
        reference: "19",
        datasourceId: "Product",
      } as Column;

      const mockResults: FilterOption[] = Array.from({ length: 20 }, (_, i) => ({
        value: `prod${i}`,
        label: `Product ${i}`,
      }));

      const mockFetchFilterOptions = jest.fn().mockResolvedValue(mockResults);
      const mockSetFilterOptions = jest.fn();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", mockResults, true, false);
    });

    it("should handle errors gracefully", async () => {
      const mockColumn: Column = {
        id: "product",
        columnName: "product",
        header: "Product",
        reference: "19",
        datasourceId: "Product",
      } as Column;

      const mockFetchFilterOptions = jest.fn().mockRejectedValue(new Error("Network error"));
      const mockSetFilterOptions = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
      });

      expect(result).toEqual([]);
      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", [], false, false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should set append to true when offset > 0", async () => {
      const mockColumn: Column = {
        id: "product",
        columnName: "product",
        header: "Product",
        reference: "19",
        datasourceId: "Product",
      } as Column;

      const mockFetchFilterOptions = jest.fn().mockResolvedValue([{ value: "prod1", label: "Product 1" }]);
      const mockSetFilterOptions = jest.fn();

      await loadTableDirFilterOptions({
        column: mockColumn,
        columnId: "product",
        searchQuery: undefined,
        tabId: "tab123",
        entityName: "SalesOrder",
        fetchFilterOptions: mockFetchFilterOptions,
        setFilterOptions: mockSetFilterOptions,
        offset: 20,
      });

      expect(mockSetFilterOptions).toHaveBeenCalledWith("product", [{ value: "prod1", label: "Product 1" }], false, true);
    });
  });
});
