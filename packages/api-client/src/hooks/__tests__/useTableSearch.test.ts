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

/**
 * @jest-environment jsdom
 */

// Bypass TS module resolution for root dependency
const { renderHook, act } = require("@testing-library/react");
import { useTableSearch } from "../useTableSearch";

// Mock dependencies
jest.mock("../useColumnFilters", () => ({
  useColumnFilters: jest.fn(({ onFiltersChange, columns }) => ({
    columnFilters: [],
    setColumnFilter: jest.fn(),
    clearColumnFilter: jest.fn(),
    clearAllFilters: jest.fn(),
    loadFilterOptions: jest.fn(),
    getFilterableColumns: jest.fn(() => []),
    hasActiveFilters: false,
  })),
}));

jest.mock("../../../src/api/datasource", () => ({
  datasource: {
    get: jest.fn(),
  },
}));

// Mock SearchUtils to control criteria calculation
jest.mock("../../utils/search-utils", () => ({
  SearchUtils: {
    combineSearchAndColumnFilters: jest.fn(() => [{ fieldName: "mockCriteria" }]),
  },
}));

import { useColumnFilters } from "../useColumnFilters";
import { SearchUtils } from "../../utils/search-utils";

describe("hooks/useTableSearch", () => {
  const mockColumns = [{ id: "c1" }] as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates search query and recalulates criteria", () => {
    const onSearchChange = jest.fn();
    const { result } = renderHook(() => useTableSearch({ columns: mockColumns, onSearchChange }));

    act(() => {
      result.current.setSearchQuery("new query");
    });

    expect(result.current.searchQuery).toBe("new query");
    expect(result.current.hasActiveSearch).toBe(true);
    expect(SearchUtils.combineSearchAndColumnFilters).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("clears all search and filters", () => {
    const onSearchChange = jest.fn();
    const clearAllFilters = jest.fn();
    (useColumnFilters as jest.Mock).mockReturnValue({
      columnFilters: [],
      clearAllFilters,
      getFilterableColumns: jest.fn(() => []),
    });

    const { result } = renderHook(() => useTableSearch({ columns: mockColumns, onSearchChange }));

    act(() => {
      result.current.setSearchQuery("some query");
      result.current.clearAllSearchAndFilters();
    });

    expect(result.current.searchQuery).toBe("");
    expect(clearAllFilters).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith([]);
  });

  it("returns search criteria from SearchUtils", () => {
    const mockCriteria = [{ fieldName: "f1", operator: "equals", value: "v1" }];
    (SearchUtils.combineSearchAndColumnFilters as jest.Mock).mockReturnValue(mockCriteria);

    const { result } = renderHook(() => useTableSearch({ columns: mockColumns }));

    expect(result.current.searchCriteria).toBe(mockCriteria);
  });
});
