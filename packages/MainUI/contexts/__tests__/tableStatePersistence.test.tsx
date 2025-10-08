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

import { act, renderHook } from "@testing-library/react";
import TableStatePersistenceProvider, { useTableStatePersistence } from "../tableStatePersistence";

describe("TableStatePersistenceContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
  );

  it("should provide context values", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    expect(result.current.getTableState).toBeDefined();
    expect(result.current.setTableFilters).toBeDefined();
    expect(result.current.setTableVisibility).toBeDefined();
    expect(result.current.setTableSorting).toBeDefined();
    expect(result.current.setTableOrder).toBeDefined();
    expect(result.current.cleanupWindow).toBeDefined();
    expect(result.current.getAllState).toBeDefined();
  });

  it("should return default state for non-existent window/tab", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const tableState = result.current.getTableState("window1", "tab1");

    expect(tableState).toEqual({
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
    });
  });

  it("should store and retrieve table filters", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const testFilters = [{ id: "column1", value: "test" }];

    act(() => {
      result.current.setTableFilters("window1", "tab1", testFilters);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.filters).toEqual(testFilters);
  });

  it("should store and retrieve table visibility", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const testVisibility = { column1: false, column2: true };

    act(() => {
      result.current.setTableVisibility("window1", "tab1", testVisibility);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.visibility).toEqual(testVisibility);
  });

  it("should store and retrieve table sorting", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const testSorting = [{ id: "column1", desc: false }];

    act(() => {
      result.current.setTableSorting("window1", "tab1", testSorting);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.sorting).toEqual(testSorting);
  });

  it("should store and retrieve table order", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const testOrder = ["column1", "column2", "column3"];

    act(() => {
      result.current.setTableOrder("window1", "tab1", testOrder);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.order).toEqual(testOrder);
  });

  it("should cleanup window data correctly", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    // Set up some data
    act(() => {
      result.current.setTableFilters("window1", "tab1", [{ id: "column1", value: "test" }]);
      result.current.setTableFilters("window1", "tab2", [{ id: "column2", value: "test2" }]);
      result.current.setTableFilters("window2", "tab1", [{ id: "column3", value: "test3" }]);
    });

    // Verify data exists
    expect(result.current.getTableState("window1", "tab1").filters).toHaveLength(1);
    expect(result.current.getTableState("window1", "tab2").filters).toHaveLength(1);
    expect(result.current.getTableState("window2", "tab1").filters).toHaveLength(1);

    // Cleanup window1
    act(() => {
      result.current.cleanupWindow("window1");
    });

    // Verify window1 data is gone but window2 remains
    expect(result.current.getTableState("window1", "tab1").filters).toEqual([]);
    expect(result.current.getTableState("window1", "tab2").filters).toEqual([]);
    expect(result.current.getTableState("window2", "tab1").filters).toHaveLength(1);
  });

  it("should isolate state between different windows and tabs", () => {
    const { result } = renderHook(() => useTableStatePersistence(), { wrapper });

    const filters1 = [{ id: "column1", value: "window1-tab1" }];
    const filters2 = [{ id: "column2", value: "window1-tab2" }];
    const filters3 = [{ id: "column3", value: "window2-tab1" }];

    act(() => {
      result.current.setTableFilters("window1", "tab1", filters1);
      result.current.setTableFilters("window1", "tab2", filters2);
      result.current.setTableFilters("window2", "tab1", filters3);
    });

    expect(result.current.getTableState("window1", "tab1").filters).toEqual(filters1);
    expect(result.current.getTableState("window1", "tab2").filters).toEqual(filters2);
    expect(result.current.getTableState("window2", "tab1").filters).toEqual(filters3);
  });

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useTableStatePersistence());
    }).toThrow("useTableStatePersistence must be used within a TableStatePersistenceProvider");
  });
});
