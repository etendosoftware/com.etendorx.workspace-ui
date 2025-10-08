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

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import TableStatePersistenceProvider, { useTableStatePersistence } from "../../contexts/tableStatePersistence";
import { useTableStatePersistenceTab } from "../../hooks/useTableStatePersistenceTab";
import type { MRT_ColumnFiltersState, MRT_VisibilityState, MRT_SortingState } from "material-react-table";

describe("Table State Persistence - Integration Tests", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
  );

  describe("Complete Window Switching Workflow", () => {
    it("should persist state correctly during window switching", () => {
      // Simulate Window A with Tab X
      const { result: windowA } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      // Simulate Window B with Tab Y
      const { result: windowB } = renderHook(() => useTableStatePersistenceTab("windowB", "tabY"), { wrapper });

      // Apply configurations to Window A
      act(() => {
        windowA.current.setTableColumnFilters([{ id: "name", value: "test" }]);
        windowA.current.setTableColumnVisibility({ name: false, status: true });
        windowA.current.setTableColumnSorting([{ id: "status", desc: false }]);
        windowA.current.setTableColumnOrder(["status", "name"]);
      });

      // Apply different configurations to Window B
      act(() => {
        windowB.current.setTableColumnFilters([{ id: "status", value: "active" }]);
        windowB.current.setTableColumnVisibility({ name: true, status: false });
        windowB.current.setTableColumnSorting([{ id: "name", desc: true }]);
        windowB.current.setTableColumnOrder(["name", "status"]);
      });

      // Verify Window A maintains its configuration
      expect(windowA.current.tableColumnFilters).toEqual([{ id: "name", value: "test" }]);
      expect(windowA.current.tableColumnVisibility).toEqual({ name: false, status: true });
      expect(windowA.current.tableColumnSorting).toEqual([{ id: "status", desc: false }]);
      expect(windowA.current.tableColumnOrder).toEqual(["status", "name"]);

      // Verify Window B maintains its different configuration
      expect(windowB.current.tableColumnFilters).toEqual([{ id: "status", value: "active" }]);
      expect(windowB.current.tableColumnVisibility).toEqual({ name: true, status: false });
      expect(windowB.current.tableColumnSorting).toEqual([{ id: "name", desc: true }]);
      expect(windowB.current.tableColumnOrder).toEqual(["name", "status"]);
    });

    it("should handle multiple tabs per window", () => {
      // Window A with multiple tabs
      const { result: tabX } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });
      const { result: tabY } = renderHook(() => useTableStatePersistenceTab("windowA", "tabY"), { wrapper });

      // Configure each tab differently
      act(() => {
        tabX.current.setTableColumnFilters([{ id: "name", value: "filter1" }]);
        tabY.current.setTableColumnFilters([{ id: "status", value: "filter2" }]);
      });

      // Verify isolation between tabs in same window
      expect(tabX.current.tableColumnFilters).toEqual([{ id: "name", value: "filter1" }]);
      expect(tabY.current.tableColumnFilters).toEqual([{ id: "status", value: "filter2" }]);
    });

    it("should handle parent-child tab relationships", () => {
      // Parent tab
      const { result: parentTab } = renderHook(() => useTableStatePersistenceTab("windowA", "parentTab"), { wrapper });

      // Child tab
      const { result: childTab } = renderHook(() => useTableStatePersistenceTab("windowA", "childTab"), { wrapper });

      // Configure parent
      act(() => {
        parentTab.current.setTableColumnVisibility({ parentColumn: true });
      });

      // Configure child
      act(() => {
        childTab.current.setTableColumnVisibility({ childColumn: true });
      });

      // Verify independence
      expect(parentTab.current.tableColumnVisibility).toEqual({ parentColumn: true });
      expect(childTab.current.tableColumnVisibility).toEqual({ childColumn: true });
    });
  });

  describe("Window Closing and Cleanup", () => {
    it("should clean up window state when window is closed", () => {
      const { result: contextHook } = renderHook(() => useTableStatePersistence(), { wrapper });

      // Set some state using context hook directly
      act(() => {
        contextHook.current.setTableFilters("windowA", "tabX", [{ id: "test", value: "value" }]);
      });

      // Verify state exists
      expect(contextHook.current.getTableState("windowA", "tabX").filters).toEqual([{ id: "test", value: "value" }]);

      // Clean up window
      act(() => {
        contextHook.current.cleanupWindow("windowA");
      });

      // Verify state is cleaned up
      expect(contextHook.current.getTableState("windowA", "tabX").filters).toEqual([]);
    });

    it("should not affect other windows when cleaning up", () => {
      const { result: contextHook } = renderHook(() => useTableStatePersistence(), { wrapper });

      // Set state in multiple windows
      act(() => {
        contextHook.current.setTableFilters("windowA", "tabX", [{ id: "testA", value: "valueA" }]);
        contextHook.current.setTableFilters("windowB", "tabY", [{ id: "testB", value: "valueB" }]);
      });

      // Clean up window A
      act(() => {
        contextHook.current.cleanupWindow("windowA");
      });

      // Verify window A is cleaned up
      expect(contextHook.current.getTableState("windowA", "tabX").filters).toEqual([]);

      // Verify window B is unaffected
      expect(contextHook.current.getTableState("windowB", "tabY").filters).toEqual([{ id: "testB", value: "valueB" }]);
    });
  });

  describe("State Persistence with Different Table Configurations", () => {
    it("should handle complex column filter configurations", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      const complexFilters: MRT_ColumnFiltersState = [
        { id: "name", value: ["John", "Jane"] },
        { id: "status", value: "active" },
        { id: "date", value: { start: "2024-01-01", end: "2024-12-31" } },
      ];

      act(() => {
        result.current.setTableColumnFilters(complexFilters);
      });

      expect(result.current.tableColumnFilters).toEqual(complexFilters);
    });

    it("should handle complex visibility configurations", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      const complexVisibility: MRT_VisibilityState = {
        id: false,
        name: true,
        email: false,
        phone: true,
        address: false,
        company: true,
        department: false,
        salary: false,
      };

      act(() => {
        result.current.setTableColumnVisibility(complexVisibility);
      });

      expect(result.current.tableColumnVisibility).toEqual(complexVisibility);
    });

    it("should handle complex sorting configurations", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      const complexSorting: MRT_SortingState = [
        { id: "department", desc: false },
        { id: "name", desc: true },
        { id: "salary", desc: false },
      ];

      act(() => {
        result.current.setTableColumnSorting(complexSorting);
      });

      expect(result.current.tableColumnSorting).toEqual(complexSorting);
    });

    it("should handle complex column order configurations", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      const complexOrder = [
        "actions",
        "id",
        "avatar",
        "name",
        "email",
        "phone",
        "company",
        "department",
        "salary",
        "status",
        "createdAt",
        "updatedAt",
      ];

      act(() => {
        result.current.setTableColumnOrder(complexOrder);
      });

      expect(result.current.tableColumnOrder).toEqual(complexOrder);
    });
  });

  describe("Rapid State Changes", () => {
    it("should handle rapid consecutive updates", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      // Rapid filter updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.setTableColumnFilters([{ id: "test", value: `value${i}` }]);
        }
      });

      expect(result.current.tableColumnFilters).toEqual([{ id: "test", value: "value9" }]);
    });

    it("should handle rapid window switches", () => {
      const windows = ["windowA", "windowB", "windowC", "windowD", "windowE"];
      const hooks = windows.map((windowId) =>
        renderHook(() => useTableStatePersistenceTab(windowId, "tab1"), { wrapper })
      );

      // Rapid configuration of multiple windows
      act(() => {
        hooks.forEach((hook, index) => {
          hook.result.current.setTableColumnFilters([{ id: "test", value: `window${index}` }]);
        });
      });

      // Verify each window maintains its state
      hooks.forEach((hook, index) => {
        expect(hook.result.current.tableColumnFilters).toEqual([{ id: "test", value: `window${index}` }]);
      });
    });
  });

  describe("Memory Management", () => {
    it("should efficiently handle large state objects", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      // Create large state objects
      const largeFilters = Array.from({ length: 100 }, (_, i) => ({
        id: `column${i}`,
        value: `value${i}`,
      }));

      const largeVisibility = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`column${i}`, i % 2 === 0]));

      const largeOrder = Array.from({ length: 100 }, (_, i) => `column${i}`);

      act(() => {
        result.current.setTableColumnFilters(largeFilters);
        result.current.setTableColumnVisibility(largeVisibility);
        result.current.setTableColumnOrder(largeOrder);
      });

      expect(result.current.tableColumnFilters).toEqual(largeFilters);
      expect(result.current.tableColumnVisibility).toEqual(largeVisibility);
      expect(result.current.tableColumnOrder).toEqual(largeOrder);
    });

    it("should handle memory cleanup efficiently", () => {
      const { result: contextHook } = renderHook(() => useTableStatePersistence(), { wrapper });

      // Create multiple windows with state
      const numberOfWindows = 50;
      for (let i = 0; i < numberOfWindows; i++) {
        act(() => {
          contextHook.current.setTableFilters(`window${i}`, "tab1", [{ id: "test", value: `value${i}` }]);
        });
      }

      // Verify all windows have state
      const initialState = contextHook.current.getAllState();
      expect(Object.keys(initialState)).toHaveLength(numberOfWindows);

      // Clean up half the windows
      act(() => {
        for (let i = 0; i < numberOfWindows / 2; i++) {
          contextHook.current.cleanupWindow(`window${i}`);
        }
      });

      // Verify cleanup worked
      const cleanedState = contextHook.current.getAllState();
      expect(Object.keys(cleanedState)).toHaveLength(numberOfWindows / 2);
    });
  });

  describe("React Hooks Integration", () => {
    it("should work correctly with React strict mode", () => {
      const StrictWrapper = ({ children }: { children: React.ReactNode }) => (
        <React.StrictMode>
          <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
        </React.StrictMode>
      );

      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper: StrictWrapper });

      act(() => {
        result.current.setTableColumnFilters([{ id: "test", value: "value" }]);
      });

      expect(result.current.tableColumnFilters).toEqual([{ id: "test", value: "value" }]);
    });

    it("should handle component unmounting gracefully", () => {
      const { result, unmount } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      act(() => {
        result.current.setTableColumnFilters([{ id: "test", value: "value" }]);
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Provider Edge Cases", () => {
    it("should throw error when used outside provider", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTableStatePersistence());
      }).toThrow("useTableStatePersistence must be used within a TableStatePersistenceProvider");

      consoleError.mockRestore();
    });

    it("should handle provider re-mounting", () => {
      const Wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
      );

      // First render with first provider
      const { result: result1, unmount: unmount1 } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), {
        wrapper: Wrapper1,
      });

      // Set some state
      act(() => {
        result1.current.setTableColumnFilters([{ id: "test", value: "value1" }]);
      });

      // Verify state exists
      expect(result1.current.tableColumnFilters).toEqual([{ id: "test", value: "value1" }]);

      // Unmount first provider
      unmount1();

      // Create new provider instance
      const Wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
      );

      // Render with new provider
      const { result: result2 } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), {
        wrapper: Wrapper2,
      });

      // State should be reset with new provider
      expect(result2.current.tableColumnFilters).toEqual([]);
    });
  });
});
