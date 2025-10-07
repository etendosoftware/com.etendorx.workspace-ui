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

import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import TableStatePersistenceProvider from "../../contexts/tableStatePersistence";
import { useTableStatePersistenceTab } from "../useTableStatePersistenceTab";

describe("useTableStatePersistenceTab", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
  );

  const windowId = "window1";
  const tabId = "tab1";

  it("should return default values for new tab", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    expect(result.current.tableColumnFilters).toEqual([]);
    expect(result.current.tableColumnVisibility).toEqual({});
    expect(result.current.tableColumnSorting).toEqual([]);
    expect(result.current.tableColumnOrder).toEqual([]);
  });

  it("should provide setter functions", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    expect(typeof result.current.setTableColumnFilters).toBe("function");
    expect(typeof result.current.setTableColumnVisibility).toBe("function");
    expect(typeof result.current.setTableColumnSorting).toBe("function");
    expect(typeof result.current.setTableColumnOrder).toBe("function");
  });

  it("should update and retrieve table filters with direct value", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const testFilters = [{ id: "column1", value: "test" }];

    act(() => {
      result.current.setTableColumnFilters(testFilters);
    });

    expect(result.current.tableColumnFilters).toEqual(testFilters);
  });

  it("should update table filters with updater function", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const initialFilters = [{ id: "column1", value: "initial" }];
    const newFilter = { id: "column2", value: "new" };

    // Set initial value
    act(() => {
      result.current.setTableColumnFilters(initialFilters);
    });

    // Update with function
    act(() => {
      result.current.setTableColumnFilters((prev) => [...prev, newFilter]);
    });

    expect(result.current.tableColumnFilters).toEqual([...initialFilters, newFilter]);
  });

  it("should update and retrieve table visibility with direct value", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const testVisibility = { column1: false, column2: true };

    act(() => {
      result.current.setTableColumnVisibility(testVisibility);
    });

    expect(result.current.tableColumnVisibility).toEqual(testVisibility);
  });

  it("should update table visibility with updater function", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const initialVisibility = { column1: true };

    // Set initial value
    act(() => {
      result.current.setTableColumnVisibility(initialVisibility);
    });

    // Update with function
    act(() => {
      result.current.setTableColumnVisibility((prev) => ({ ...prev, column2: false }));
    });

    expect(result.current.tableColumnVisibility).toEqual({ column1: true, column2: false });
  });

  it("should update and retrieve table sorting with direct value", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const testSorting = [{ id: "column1", desc: false }];

    act(() => {
      result.current.setTableColumnSorting(testSorting);
    });

    expect(result.current.tableColumnSorting).toEqual(testSorting);
  });

  it("should update table sorting with updater function", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const initialSorting = [{ id: "column1", desc: false }];

    // Set initial value
    act(() => {
      result.current.setTableColumnSorting(initialSorting);
    });

    // Update with function
    act(() => {
      result.current.setTableColumnSorting((prev) =>
        prev.map((sort) => (sort.id === "column1" ? { ...sort, desc: true } : sort))
      );
    });

    expect(result.current.tableColumnSorting).toEqual([{ id: "column1", desc: true }]);
  });

  it("should update and retrieve table order with direct value", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const testOrder = ["column1", "column2", "column3"];

    act(() => {
      result.current.setTableColumnOrder(testOrder);
    });

    expect(result.current.tableColumnOrder).toEqual(testOrder);
  });

  it("should update table order with updater function", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const initialOrder = ["column1", "column2"];

    // Set initial value
    act(() => {
      result.current.setTableColumnOrder(initialOrder);
    });

    // Update with function
    act(() => {
      result.current.setTableColumnOrder((prev) => [...prev, "column3"]);
    });

    expect(result.current.tableColumnOrder).toEqual(["column1", "column2", "column3"]);
  });

  it("should isolate state between different window/tab combinations", () => {
    const { result: result1 } = renderHook(() => useTableStatePersistenceTab("window1", "tab1"), { wrapper });
    const { result: result2 } = renderHook(() => useTableStatePersistenceTab("window1", "tab2"), { wrapper });
    const { result: result3 } = renderHook(() => useTableStatePersistenceTab("window2", "tab1"), { wrapper });

    const filters1 = [{ id: "column1", value: "window1-tab1" }];
    const filters2 = [{ id: "column2", value: "window1-tab2" }];
    const filters3 = [{ id: "column3", value: "window2-tab1" }];

    act(() => {
      result1.current.setTableColumnFilters(filters1);
      result2.current.setTableColumnFilters(filters2);
      result3.current.setTableColumnFilters(filters3);
    });

    expect(result1.current.tableColumnFilters).toEqual(filters1);
    expect(result2.current.tableColumnFilters).toEqual(filters2);
    expect(result3.current.tableColumnFilters).toEqual(filters3);
  });

  it("should maintain state consistency across re-renders", () => {
    const { result, rerender } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    const testFilters = [{ id: "column1", value: "persistent" }];
    const testVisibility = { column1: false };
    const testSorting = [{ id: "column1", desc: true }];
    const testOrder = ["column2", "column1"];

    act(() => {
      result.current.setTableColumnFilters(testFilters);
      result.current.setTableColumnVisibility(testVisibility);
      result.current.setTableColumnSorting(testSorting);
      result.current.setTableColumnOrder(testOrder);
    });

    // Re-render the hook
    rerender();

    expect(result.current.tableColumnFilters).toEqual(testFilters);
    expect(result.current.tableColumnVisibility).toEqual(testVisibility);
    expect(result.current.tableColumnSorting).toEqual(testSorting);
    expect(result.current.tableColumnOrder).toEqual(testOrder);
  });

  it("should handle rapid consecutive updates correctly", () => {
    const { result } = renderHook(() => useTableStatePersistenceTab(windowId, tabId), { wrapper });

    act(() => {
      result.current.setTableColumnFilters([{ id: "column1", value: "first" }]);
      result.current.setTableColumnFilters([{ id: "column1", value: "second" }]);
      result.current.setTableColumnFilters([{ id: "column1", value: "final" }]);
    });

    expect(result.current.tableColumnFilters).toEqual([{ id: "column1", value: "final" }]);
  });
});
