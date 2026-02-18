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

import { renderHook, act } from "@testing-library/react";
import { useGridColumnFilters } from "../useGridColumnFilters";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { MRT_ColumnFiltersState } from "material-react-table";
import { ColumnFilterUtils } from "@workspaceui/api-client/src/utils/column-filter-utils";

// Mock the dependencies
const mockSetColumnFilter = jest.fn();
const mockSetFilterOptions = jest.fn();
const mockLoadMoreFilterOptions = jest.fn();
const mockFetchFilterOptions = jest.fn();

jest.mock("@workspaceui/api-client/src/hooks/useColumnFilters", () => ({
  useColumnFilters: () => ({
    columnFilters: [],
    setColumnFilter: mockSetColumnFilter,
    setFilterOptions: mockSetFilterOptions,
    loadMoreFilterOptions: mockLoadMoreFilterOptions,
  }),
}));

jest.mock("@workspaceui/api-client/src/hooks/useColumnFilterData", () => ({
  useColumnFilterData: () => ({
    fetchFilterOptions: mockFetchFilterOptions,
  }),
}));

jest.mock("@/utils/columnFilterHelpers", () => ({
  loadSelectFilterOptions: jest.fn().mockResolvedValue([{ id: "opt1", label: "Option 1", value: "opt1" }]),
  loadTableDirFilterOptions: jest.fn().mockResolvedValue([{ id: "entity1", label: "Entity 1", value: "entity1" }]),
}));

describe("useGridColumnFilters", () => {
  const mockSetAppliedTableFilters = jest.fn();
  const mockSetColumnFilters = jest.fn();

  const mockColumns: Column[] = [
    {
      id: "name",
      columnName: "name",
      name: "name",
      header: "Name",
      type: "string",
    } as Column,
    {
      id: "status",
      columnName: "status",
      name: "status",
      header: "Status",
      type: "SELECT",
      refList: [
        { id: "active", searchKey: "active", _identifier: "Active" },
        { id: "inactive", searchKey: "inactive", _identifier: "Inactive" },
      ],
    } as unknown as Column,
    {
      id: "organization",
      columnName: "organization",
      name: "organization",
      header: "Organization",
      referencedEntity: "Organization",
    } as Column,
  ];

  const defaultParams = {
    columns: mockColumns,
    tabId: "test-tab-id",
    entityName: "TestEntity",
    setAppliedTableFilters: mockSetAppliedTableFilters,
    setColumnFilters: mockSetColumnFilters,
    isImplicitFilterApplied: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return all expected functions and values", () => {
      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      expect(result.current.advancedColumnFilters).toBeDefined();
      expect(result.current.setColumnFilter).toBeDefined();
      expect(result.current.setFilterOptions).toBeDefined();
      expect(result.current.loadMoreFilterOptions).toBeDefined();
      expect(result.current.handleColumnFilterChange).toBeDefined();
      expect(result.current.handleLoadFilterOptions).toBeDefined();
      expect(result.current.handleLoadMoreFilterOptions).toBeDefined();
    });
  });

  describe("handleColumnFilterChange", () => {
    it("should update filters when options are selected", async () => {
      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      const selectedOptions = [{ id: "active", label: "Active", value: "active" }];

      await act(async () => {
        await result.current.handleColumnFilterChange("status", selectedOptions);
      });

      expect(mockSetColumnFilter).toHaveBeenCalledWith("status", selectedOptions);
      expect(mockSetAppliedTableFilters).toHaveBeenCalled();
      expect(mockSetColumnFilters).toHaveBeenCalled();
    });

    it("should remove filter when empty options are passed", async () => {
      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      await act(async () => {
        await result.current.handleColumnFilterChange("status", []);
      });

      expect(mockSetColumnFilter).toHaveBeenCalledWith("status", []);
      expect(mockSetAppliedTableFilters).toHaveBeenCalled();
      expect(mockSetColumnFilters).toHaveBeenCalled();
    });

    it("should update applied table filters with FilterOption objects", async () => {
      let capturedAppliedFilters: MRT_ColumnFiltersState = [];
      const customSetApplied = jest.fn((updater) => {
        if (typeof updater === "function") {
          capturedAppliedFilters = updater([]);
        }
      });

      const { result } = renderHook(() =>
        useGridColumnFilters({
          ...defaultParams,
          setAppliedTableFilters: customSetApplied,
        })
      );

      const selectedOptions = [{ id: "active", label: "Active", value: "active" }];

      await act(async () => {
        await result.current.handleColumnFilterChange("status", selectedOptions);
      });

      expect(capturedAppliedFilters).toEqual([
        {
          id: "status",
          value: selectedOptions,
        },
      ]);
    });

    it("should replace existing filter for the same column", async () => {
      let capturedFilters: MRT_ColumnFiltersState = [];
      const customSetFilters = jest.fn((updater) => {
        if (typeof updater === "function") {
          capturedFilters = updater([
            { id: "status", value: [{ id: "inactive", label: "Inactive", value: "inactive" }] },
          ]);
        }
      });

      const { result } = renderHook(() =>
        useGridColumnFilters({
          ...defaultParams,
          setColumnFilters: customSetFilters,
        })
      );

      const newOptions = [{ id: "active", label: "Active", value: "active" }];

      await act(async () => {
        await result.current.handleColumnFilterChange("status", newOptions);
      });

      expect(capturedFilters).toEqual([{ id: "status", value: newOptions }]);
    });
  });

  describe("handleLoadFilterOptions", () => {
    it("should return empty array when column is not found", async () => {
      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadFilterOptions("nonexistent");
      });

      expect(options).toEqual([]);
    });

    it("should load select filter options for SELECT columns", async () => {
      // Mock isSelectColumn to return true for status column
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(true);
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(false);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadFilterOptions("status");
      });

      expect(options).toEqual([{ id: "opt1", label: "Option 1", value: "opt1" }]);
    });

    it("should load table dir filter options for TableDir columns", async () => {
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(false);
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(true);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadFilterOptions("organization");
      });

      expect(options).toEqual([{ id: "entity1", label: "Entity 1", value: "entity1" }]);
    });

    it("should return empty array for non-filterable columns", async () => {
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(false);
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(false);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadFilterOptions("name");
      });

      expect(options).toEqual([]);
    });

    it("should pass search query to load functions", async () => {
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(true);

      const loadSelectFilterOptions = jest.requireMock("@/utils/columnFilterHelpers").loadSelectFilterOptions;

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      await act(async () => {
        await result.current.handleLoadFilterOptions("status", "search term");
      });

      expect(loadSelectFilterOptions).toHaveBeenCalledWith(
        expect.anything(),
        "status",
        "search term",
        expect.anything()
      );
    });
  });

  describe("handleLoadMoreFilterOptions", () => {
    it("should return empty array when column is not found", async () => {
      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadMoreFilterOptions("nonexistent");
      });

      expect(options).toEqual([]);
    });

    it("should return empty array for non-TableDir columns", async () => {
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(false);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadMoreFilterOptions("status");
      });

      expect(options).toEqual([]);
    });

    it("should load more options for TableDir columns", async () => {
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(true);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      let options: unknown[] = [];
      await act(async () => {
        options = await result.current.handleLoadMoreFilterOptions("organization");
      });

      expect(options).toEqual([{ id: "entity1", label: "Entity 1", value: "entity1" }]);
      expect(mockLoadMoreFilterOptions).toHaveBeenCalled();
    });

    it("should prevent duplicate fetches for the same column", async () => {
      jest.spyOn(ColumnFilterUtils, "isTableDirColumn").mockReturnValue(true);

      const loadTableDirFilterOptions = jest.requireMock("@/utils/columnFilterHelpers").loadTableDirFilterOptions;

      // Create a slow promise to simulate in-flight request
      let resolvePromise: (value: unknown[]) => void;
      const slowPromise = new Promise<unknown[]>((resolve) => {
        resolvePromise = resolve;
      });
      loadTableDirFilterOptions.mockReturnValueOnce(slowPromise);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      // Start first fetch (will be pending) and immediately try second
      let firstResult: unknown[] = [];
      let secondResult: unknown[] = [];

      await act(async () => {
        // Start first fetch but don't await it yet
        const firstPromise = result.current.handleLoadMoreFilterOptions("organization");

        // Second fetch should return empty immediately due to duplicate prevention
        secondResult = await result.current.handleLoadMoreFilterOptions("organization");

        // Now resolve the slow promise and await first result
        resolvePromise!([{ id: "org1", label: "Org 1", value: "org1" }]);
        firstResult = await firstPromise;
      });

      expect(secondResult).toEqual([]);
      expect(firstResult).toEqual([{ id: "org1", label: "Org 1", value: "org1" }]);
    });
  });

  describe("column lookup", () => {
    it("should find column by id", async () => {
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(true);

      const { result } = renderHook(() => useGridColumnFilters(defaultParams));

      await act(async () => {
        await result.current.handleLoadFilterOptions("status");
      });

      const loadSelectFilterOptions = jest.requireMock("@/utils/columnFilterHelpers").loadSelectFilterOptions;
      expect(loadSelectFilterOptions).toHaveBeenCalledWith(
        expect.objectContaining({ id: "status" }),
        "status",
        undefined,
        expect.anything()
      );
    });

    it("should find column by columnName", async () => {
      jest.spyOn(ColumnFilterUtils, "isSelectColumn").mockReturnValue(true);

      const columnsWithDifferentId: Column[] = [
        {
          id: "different-id",
          columnName: "myStatus",
          name: "status",
          header: "Status",
          type: "SELECT",
        } as Column,
      ];

      const { result } = renderHook(() =>
        useGridColumnFilters({
          ...defaultParams,
          columns: columnsWithDifferentId,
        })
      );

      await act(async () => {
        await result.current.handleLoadFilterOptions("myStatus");
      });

      const loadSelectFilterOptions = jest.requireMock("@/utils/columnFilterHelpers").loadSelectFilterOptions;
      expect(loadSelectFilterOptions).toHaveBeenCalledWith(
        expect.objectContaining({ columnName: "myStatus" }),
        "myStatus",
        undefined,
        expect.anything()
      );
    });
  });
});
