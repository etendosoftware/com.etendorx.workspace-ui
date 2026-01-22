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
import { useColumnFilters } from "../useColumnFilters";

describe("hooks/useColumnFilters", () => {
  const mockColumns = [
    { id: "col1", columnName: "column1", filterable: true, type: "select" },
    { id: "col2", columnName: "column2", filterable: true, type: "list" },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes column filters based on filterable columns", () => {
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns }));

    expect(result.current.columnFilters).toHaveLength(2);
    expect(result.current.columnFilters[0].id).toBe("col1");
    expect(result.current.columnFilters[1].id).toBe("col2");
  });

  it("updates a column filter", () => {
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns }));

    const selectedOptions = [{ id: "opt1", label: "Option 1", value: "val1" }];

    act(() => {
      result.current.setColumnFilter("col1", selectedOptions);
    });

    expect(result.current.columnFilters[0].selectedOptions).toEqual(selectedOptions);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("clears a specific column filter", () => {
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns }));

    act(() => {
      result.current.setColumnFilter("col1", [{ id: "o1", label: "L1", value: "V1" }]);
      result.current.clearColumnFilter("col1");
    });

    expect(result.current.columnFilters[0].selectedOptions).toEqual([]);
  });

  it("clears all filters", () => {
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns }));

    act(() => {
      result.current.setColumnFilter("col1", [{ id: "o1", label: "L1", value: "V1" }]);
      result.current.setColumnFilter("col2", [{ id: "o2", label: "L2", value: "V2" }]);
      result.current.clearAllFilters();
    });

    expect(result.current.columnFilters[0].selectedOptions).toEqual([]);
    expect(result.current.columnFilters[1].selectedOptions).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("manages filter options loading state", async () => {
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns }));

    await act(async () => {
      await result.current.loadFilterOptions("col1", "search query");
    });

    expect(result.current.columnFilters[0].loading).toBe(true);
    expect(result.current.columnFilters[0].searchQuery).toBe("search query");

    act(() => {
      result.current.setFilterOptions("col1", [{ id: "o1", label: "L1", value: "V1" }], false);
    });

    expect(result.current.columnFilters[0].loading).toBe(false);
    expect(result.current.columnFilters[0].availableOptions).toHaveLength(1);
    expect(result.current.columnFilters[0].availableOptions[0].id).toBe("o1");
  });

  it("calls onFiltersChange when filters change", () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => useColumnFilters({ columns: mockColumns, onFiltersChange }));

    act(() => {
      result.current.setColumnFilter("col1", [{ id: "o1", label: "L1", value: "V1" }]);
    });

    expect(onFiltersChange).toHaveBeenCalled();
  });
});
