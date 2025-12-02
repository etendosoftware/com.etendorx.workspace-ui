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
import WindowProvider from "../../contexts/window";
import { useTableStatePersistenceTab } from "../useTableStatePersistenceTab";
import type React from "react";
import { setupNextNavigationMocks } from "@/utils/tests/mockHelpers";

// Mock Next.js navigation hooks
const { mockReplace, mockSearchParams } = setupNextNavigationMocks();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

describe("useTableStatePersistenceTab", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <WindowProvider>{children}</WindowProvider>;

  const windowId = "window1";
  const tabId = "tab1";

  // Helper: Render hook with default window and tab
  const renderTableHook = (customWindowId = windowId, customTabId = tabId) => {
    return renderHook(() => useTableStatePersistenceTab({ windowIdentifier: customWindowId, tabId: customTabId }), {
      wrapper,
    });
  };

  // Helper: Test direct value update for any table property
  const testDirectUpdate = <T,>({
    setter,
    getter,
    testValue,
  }: {
    setter: (value: T) => void;
    getter: () => T;
    testValue: T;
  }) => {
    act(() => setter(testValue));
    expect(getter()).toEqual(testValue);
  };

  beforeEach(() => {
    mockReplace.mockClear();
    // Clear all search params
    Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));

    // Initialize default windows in URL params
    mockSearchParams.set("w_window1", "active");
    mockSearchParams.set("wi_window1", "window1");
    mockSearchParams.set("o_window1", "1");

    mockSearchParams.set("w_window2", "active");
    mockSearchParams.set("wi_window2", "window2");
    mockSearchParams.set("o_window2", "2");
  });

  it("should return default values for new tab", () => {
    const { result } = renderTableHook();

    expect(result.current.tableColumnFilters).toEqual([]);
    expect(result.current.tableColumnVisibility).toEqual({});
    expect(result.current.tableColumnSorting).toEqual([]);
    expect(result.current.tableColumnOrder).toEqual([]);
  });

  it("should provide setter functions", () => {
    const { result } = renderTableHook();

    expect(typeof result.current.setTableColumnFilters).toBe("function");
    expect(typeof result.current.setTableColumnVisibility).toBe("function");
    expect(typeof result.current.setTableColumnSorting).toBe("function");
    expect(typeof result.current.setTableColumnOrder).toBe("function");
  });

  it("should update and retrieve table filters with direct value", () => {
    const { result } = renderTableHook();
    const testFilters = [{ id: "column1", value: "test" }];

    testDirectUpdate({
      setter: result.current.setTableColumnFilters,
      getter: () => result.current.tableColumnFilters,
      testValue: testFilters,
    });
  });

  it("should update table filters with updater function", () => {
    const { result } = renderTableHook();
    const initialFilters = [{ id: "column1", value: "initial" }];
    const newFilter = { id: "column2", value: "new" };

    act(() => {
      result.current.setTableColumnFilters(initialFilters);
    });

    act(() => {
      result.current.setTableColumnFilters((prev) => [...prev, newFilter]);
    });

    expect(result.current.tableColumnFilters).toEqual([...initialFilters, newFilter]);
  });

  it("should update and retrieve table visibility with direct value", () => {
    const { result } = renderTableHook();
    const testVisibility = { column1: false, column2: true };

    testDirectUpdate({
      setter: result.current.setTableColumnVisibility,
      getter: () => result.current.tableColumnVisibility,
      testValue: testVisibility,
    });
  });

  it("should update table visibility with updater function", () => {
    const { result } = renderTableHook();
    const initialVisibility = { column1: true };

    act(() => {
      result.current.setTableColumnVisibility(initialVisibility);
    });

    act(() => {
      result.current.setTableColumnVisibility((prev) => ({ ...prev, column2: false }));
    });

    expect(result.current.tableColumnVisibility).toEqual({ column1: true, column2: false });
  });

  it("should update and retrieve table sorting with direct value", () => {
    const { result } = renderTableHook();
    const testSorting = [{ id: "column1", desc: false }];

    testDirectUpdate({
      setter: result.current.setTableColumnSorting,
      getter: () => result.current.tableColumnSorting,
      testValue: testSorting,
    });
  });

  it("should update table sorting with updater function", () => {
    const { result } = renderTableHook();
    const initialSorting = [{ id: "column1", desc: false }];

    act(() => {
      result.current.setTableColumnSorting(initialSorting);
    });

    act(() => {
      result.current.setTableColumnSorting((prev) =>
        prev.map((sort) => (sort.id === "column1" ? { ...sort, desc: true } : sort))
      );
    });

    expect(result.current.tableColumnSorting).toEqual([{ id: "column1", desc: true }]);
  });

  it("should update and retrieve table order with direct value", () => {
    const { result } = renderTableHook();
    const testOrder = ["column1", "column2", "column3"];

    testDirectUpdate({
      setter: result.current.setTableColumnOrder,
      getter: () => result.current.tableColumnOrder,
      testValue: testOrder,
    });
  });

  it("should update table order with updater function", () => {
    const { result } = renderTableHook();
    const initialOrder = ["column1", "column2"];

    act(() => {
      result.current.setTableColumnOrder(initialOrder);
    });

    act(() => {
      result.current.setTableColumnOrder((prev) => [...prev, "column3"]);
    });

    expect(result.current.tableColumnOrder).toEqual(["column1", "column2", "column3"]);
  });

  it("should isolate state between different window/tab combinations", () => {
    const { result: result1 } = renderTableHook("window1", "tab1");
    const { result: result2 } = renderTableHook("window1", "tab2");
    const { result: result3 } = renderTableHook("window2", "tab1");

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
    const { result, rerender } = renderTableHook();

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

    rerender();

    expect(result.current.tableColumnFilters).toEqual(testFilters);
    expect(result.current.tableColumnVisibility).toEqual(testVisibility);
    expect(result.current.tableColumnSorting).toEqual(testSorting);
    expect(result.current.tableColumnOrder).toEqual(testOrder);
  });

  it("should handle rapid consecutive updates correctly", () => {
    const { result } = renderTableHook();

    act(() => {
      result.current.setTableColumnFilters([{ id: "column1", value: "first" }]);
      result.current.setTableColumnFilters([{ id: "column1", value: "second" }]);
      result.current.setTableColumnFilters([{ id: "column1", value: "final" }]);
    });

    expect(result.current.tableColumnFilters).toEqual([{ id: "column1", value: "final" }]);
  });
});
