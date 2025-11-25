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
import WindowProvider, { useWindowContext } from "../../contexts/window";
import { useTableStatePersistenceTab } from "../../hooks/useTableStatePersistenceTab";
import type { MRT_ColumnFiltersState, MRT_VisibilityState, MRT_SortingState } from "material-react-table";

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

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

describe("Table State Persistence - Integration Tests", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <WindowProvider>{children}</WindowProvider>;

  beforeEach(() => {
    mockReplace.mockClear();
    // Clear all search params
    Array.from(mockSearchParams.keys()).forEach(key => mockSearchParams.delete(key));
    
    // Initialize default windows in URL params
    // This ensures WindowProvider has active windows to work with
    mockSearchParams.set('w_windowA', 'active');
    mockSearchParams.set('wi_windowA', 'windowA');
    mockSearchParams.set('o_windowA', '1');
    
    mockSearchParams.set('w_windowB', 'inactive');
    mockSearchParams.set('wi_windowB', 'windowB');
    mockSearchParams.set('o_windowB', '2');
  });

  describe("Complete Window Switching Workflow", () => {
    it("should persist state correctly during window switching", () => {
      // Simulate Window A with Tab X
      const { result: windowA } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

      // Simulate Window B with Tab Y
      const { result: windowB } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowB", tabId: "tabY" }), { wrapper });

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
      const { result: tabX } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });
      const { result: tabY } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabY" }), { wrapper });

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
      const { result: parentTab } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "parentTab" }), { wrapper });

      // Child tab
      const { result: childTab } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "childTab" }), { wrapper });

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

  describe("State Persistence with Different Table Configurations", () => {
    it("should handle complex column filter configurations", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

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
      const { result } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

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
      const { result } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

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
      const { result } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

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
      const { result } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

      // Rapid filter updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.setTableColumnFilters([{ id: "test", value: `value${i}` }]);
        }
      });

      expect(result.current.tableColumnFilters).toEqual([{ id: "test", value: "value9" }]);
    });
  });

  describe("React Hooks Integration", () => {
    it("should handle component unmounting gracefully", () => {
      const { result, unmount } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), { wrapper });

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
        renderHook(() => useWindowContext());
      }).toThrow("useWindowContext must be used within a WindowProvider");

      consoleError.mockRestore();
    });

    it("should handle provider re-mounting", () => {
      const Wrapper1 = ({ children }: { children: React.ReactNode }) => <WindowProvider>{children}</WindowProvider>;

      // First render with first provider
      const { result: result1, unmount: unmount1 } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), {
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
      const Wrapper2 = ({ children }: { children: React.ReactNode }) => <WindowProvider>{children}</WindowProvider>;

      // Render with new provider
      const { result: result2 } = renderHook(() => useTableStatePersistenceTab({ windowIdentifier: "windowA", tabId: "tabX" }), {
        wrapper: Wrapper2,
      });

      // State should be reset with new provider
      expect(result2.current.tableColumnFilters).toEqual([]);
    });
  });
});
