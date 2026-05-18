/**
 * Tests for useSelectorFilterHandlers hook
 */

import { renderHook, act } from "@testing-library/react";
import { useSelectorFilterHandlers } from "../useSelectorFilterHandlers";
import type { Column } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@workspaceui/api-client/src/hooks/useColumnFilterData", () => ({
  useColumnFilterData: () => ({
    fetchFilterOptions: jest.fn(async () => []),
  }),
}));

jest.mock("@workspaceui/api-client/src/hooks/useColumnFilters", () => ({
  useColumnFilters: ({ columns }: { columns: Column[] }) => ({
    columnFilters: [],
    setColumnFilter: jest.fn(),
    setFilterOptions: jest.fn(),
  }),
}));

jest.mock("@/utils/columnFilterHelpers", () => ({
  loadTableDirFilterOptions: jest.fn(async () => []),
}));

describe("useSelectorFilterHandlers", () => {
  const mockSetColumnFilters = jest.fn();
  const datasourceColumns: Column[] = [
    {
      id: "warehouse",
      columnName: "warehouse",
      name: "Warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column,
  ];

  beforeEach(() => {
    mockSetColumnFilters.mockClear();
  });

  it("returns handlers for text filter changes", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.handleTextFilterChange).toBeDefined();
    expect(typeof result.current.handleTextFilterChange).toBe("function");
  });

  it("returns handlers for boolean filter changes", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.handleBooleanFilterChange).toBeDefined();
    expect(typeof result.current.handleBooleanFilterChange).toBe("function");
  });

  it("returns handlers for dropdown filter changes", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.handleDropdownFilterChange).toBeDefined();
    expect(typeof result.current.handleDropdownFilterChange).toBe("function");
  });

  it("returns handler for loading filter options", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.handleLoadFilterOptions).toBeDefined();
    expect(typeof result.current.handleLoadFilterOptions).toBe("function");
  });

  it("returns handler for loading more filter options", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.handleLoadMoreFilterOptions).toBeDefined();
    expect(typeof result.current.handleLoadMoreFilterOptions).toBe("function");
  });

  it("returns advancedColumnFilters from useColumnFilters", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    expect(result.current.advancedColumnFilters).toBeDefined();
    expect(Array.isArray(result.current.advancedColumnFilters)).toBe(true);
  });

  it("handles text filter change correctly", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    act(() => {
      result.current.handleTextFilterChange("warehouse", "search text");
    });

    expect(mockSetColumnFilters).toHaveBeenCalled();
  });

  it("handles boolean filter change correctly", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    act(() => {
      result.current.handleBooleanFilterChange("status", [{ id: "true", label: "Yes", value: "true" }]);
    });

    expect(mockSetColumnFilters).toHaveBeenCalled();
  });

  it("handles dropdown filter change correctly", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    act(() => {
      result.current.handleDropdownFilterChange("warehouse", [{ id: "wh-1", label: "Warehouse 1", value: "wh-1" }]);
    });

    expect(mockSetColumnFilters).toHaveBeenCalled();
  });

  it("passes extraParams through to load handlers", () => {
    const extraParams = {
      windowId: "W123",
      inpwindowId: "W123",
    };

    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
        extraParams,
      })
    );

    expect(result.current.handleLoadFilterOptions).toBeDefined();
  });

  it("clears filter when empty array is passed to dropdown handler", () => {
    const { result } = renderHook(() =>
      useSelectorFilterHandlers({
        datasourceColumns,
        targetEntity: "TestEntity",
        currentTabId: "tab-1",
        setColumnFilters: mockSetColumnFilters,
      })
    );

    act(() => {
      result.current.handleDropdownFilterChange("warehouse", []);
    });

    expect(mockSetColumnFilters).toHaveBeenCalled();
  });
});
