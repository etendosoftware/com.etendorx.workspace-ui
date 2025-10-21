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
import WindowProvider, { useWindowContext } from "../../contexts/window";
import { useTableStatePersistenceTab } from "../../hooks/useTableStatePersistenceTab";

describe("Table State Persistence - Performance Tests", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <WindowProvider>{children}</WindowProvider>;

  describe("Memory Usage", () => {
    it("should handle multiple windows efficiently", () => {
      const { result: contextHook } = renderHook(() => useWindowContext(), { wrapper });

      const startTime = performance.now();

      // Create 100 windows with 10 tabs each
      act(() => {
        for (let w = 0; w < 100; w++) {
          for (let t = 0; t < 10; t++) {
            contextHook.current.setTableFilters(`window${w}`, `tab${t}`, [
              { id: "column1", value: `value${w}-${t}` },
              { id: "column2", value: `value${w}-${t}-2` },
            ]);
            contextHook.current.setTableVisibility(`window${w}`, `tab${t}`, {
              column1: w % 2 === 0,
              column2: t % 2 === 0,
              column3: true,
            });
          }
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      // Verify all state was created
      const allState = contextHook.current.getAllState();
      expect(Object.keys(allState)).toHaveLength(100);

      // Each window should have 10 tabs
      for (const windowState of Object.values(allState)) {
        expect(Object.keys(windowState)).toHaveLength(10);
      }
    });

    it("should handle large state objects without performance degradation", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      // Create very large filter arrays
      const largeFilters = Array.from({ length: 1000 }, (_, i) => ({
        id: `column${i}`,
        value: `value${i}`.repeat(100), // Long string values
      }));

      const startTime = performance.now();

      act(() => {
        result.current.setTableColumnFilters(largeFilters);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly even with large data (less than 300ms)
      expect(duration).toBeLessThan(300);
      expect(result.current.tableColumnFilters).toEqual(largeFilters);
    });

    it("should cleanup memory efficiently", () => {
      const { result: contextHook } = renderHook(() => useWindowContext(), { wrapper });

      // Create a lot of windows
      act(() => {
        for (let i = 0; i < 200; i++) {
          contextHook.current.setTableFilters(`window${i}`, "tab1", [{ id: "test", value: `value${i}` }]);
        }
      });

      // Verify initial state
      expect(Object.keys(contextHook.current.getAllState())).toHaveLength(200);

      const startTime = performance.now();

      // Clean up all windows
      act(() => {
        for (let i = 0; i < 200; i++) {
          contextHook.current.cleanupWindow(`window${i}`);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Cleanup should be fast (less than 200ms for 200 windows)
      expect(duration).toBeLessThan(200);

      // All state should be cleaned
      expect(Object.keys(contextHook.current.getAllState())).toHaveLength(0);
    });
  });

  describe("State Access Performance", () => {
    it("should retrieve state quickly even with many windows", () => {
      const { result: contextHook } = renderHook(() => useWindowContext(), { wrapper });

      // Create many windows
      act(() => {
        for (let w = 0; w < 50; w++) {
          for (let t = 0; t < 20; t++) {
            contextHook.current.setTableFilters(`window${w}`, `tab${t}`, [{ id: "test", value: `${w}-${t}` }]);
          }
        }
      });

      // Test retrieval performance
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const windowId = `window${i % 50}`;
        const tabId = `tab${i % 20}`;
        const state = contextHook.current.getTableState(windowId, tabId);
        expect(state.filters).toBeDefined();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000 retrievals should be fast (less than 1000ms = 1ms per retrieval)
      expect(duration).toBeLessThan(1000);

      // Also verify that individual retrieval is fast (average < 1ms per call)
      const averageTimePerRetrieval = duration / 1000;
      expect(averageTimePerRetrieval).toBeLessThan(1);
    });

    it("should handle concurrent state updates efficiently", () => {
      const hooks = Array.from({ length: 20 }, (_, i) =>
        renderHook(() => useTableStatePersistenceTab(`window${i}`, "tab1"), { wrapper })
      );

      const startTime = performance.now();

      // Concurrent updates from multiple hooks
      act(() => {
        hooks.forEach((hook, index) => {
          hook.result.current.setTableColumnFilters([{ id: "test", value: `value${index}` }]);
          hook.result.current.setTableColumnVisibility({ [`col${index}`]: true });
          hook.result.current.setTableColumnSorting([{ id: `sort${index}`, desc: index % 2 === 0 }]);
          hook.result.current.setTableColumnOrder([`order${index}`]);
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Concurrent updates should be fast (less than 300ms)
      expect(duration).toBeLessThan(300);

      // Verify all updates were applied correctly
      hooks.forEach((hook, index) => {
        expect(hook.result.current.tableColumnFilters).toEqual([{ id: "test", value: `value${index}` }]);
        expect(hook.result.current.tableColumnVisibility).toEqual({ [`col${index}`]: true });
        expect(hook.result.current.tableColumnSorting).toEqual([{ id: `sort${index}`, desc: index % 2 === 0 }]);
        expect(hook.result.current.tableColumnOrder).toEqual([`order${index}`]);
      });
    });
  });

  describe("React Re-render Optimization", () => {
    it("should minimize unnecessary re-renders", () => {
      let renderCount = 0;

      const TestHook = () => {
        renderCount++;
        return useTableStatePersistenceTab("windowA", "tabX");
      };

      const { result } = renderHook(TestHook, { wrapper });

      const initialRenderCount = renderCount;

      // Update state
      act(() => {
        result.current.setTableColumnFilters([{ id: "test", value: "value1" }]);
      });

      // Should trigger minimal re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);

      // Multiple updates in same act should not cause excessive re-renders
      const beforeBatchUpdate = renderCount;

      act(() => {
        result.current.setTableColumnFilters([{ id: "test", value: "value2" }]);
        result.current.setTableColumnVisibility({ test: true });
        result.current.setTableColumnSorting([{ id: "test", desc: true }]);
      });

      expect(renderCount - beforeBatchUpdate).toBeLessThanOrEqual(2);
    });

    it("should not re-render unrelated hooks when state changes", () => {
      let windowARenderCount = 0;
      let windowBRenderCount = 0;

      const WindowAHook = () => {
        windowARenderCount++;
        return useTableStatePersistenceTab("windowA", "tabX");
      };

      const WindowBHook = () => {
        windowBRenderCount++;
        return useTableStatePersistenceTab("windowB", "tabY");
      };

      const { result: windowA } = renderHook(WindowAHook, { wrapper });
      const { result: windowB } = renderHook(WindowBHook, { wrapper });

      const initialCountA = windowARenderCount;
      const initialCountB = windowBRenderCount;

      // Update only Window A
      act(() => {
        windowA.current.setTableColumnFilters([{ id: "test", value: "valueA" }]);
      });

      // Window A should re-render, Window B should not
      expect(windowARenderCount).toBeGreaterThan(initialCountA);
      expect(windowBRenderCount).toBe(initialCountB);

      // Verify both hooks maintain separate state
      expect(windowB.current.tableColumnFilters).toBeDefined();
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should not retain references after cleanup", () => {
      const { result: contextHook } = renderHook(() => useWindowContext(), { wrapper });

      // Create state
      act(() => {
        contextHook.current.setTableFilters("windowA", "tabX", [{ id: "test", value: "value" }]);
      });

      // Get reference to state before cleanup
      const stateBefore = contextHook.current.getAllState();
      expect(stateBefore.windowA).toBeDefined();

      // Cleanup
      act(() => {
        contextHook.current.cleanupWindow("windowA");
      });

      // Verify cleanup
      const stateAfter = contextHook.current.getAllState();
      expect(stateAfter.windowA).toBeUndefined();

      // Old reference should not be affected by new operations
      expect(stateBefore.windowA).toBeDefined(); // Original reference still exists

      // But accessing through context should return default
      expect(contextHook.current.getTableState("windowA", "tabX").filters).toEqual([]);
    });

    it("should handle rapid mount/unmount cycles without leaks", () => {
      // Simulate rapid component mounting/unmounting
      const iterations = 100;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const { result, unmount } = renderHook(() => useTableStatePersistenceTab("windowA", `tab${i}`), { wrapper });

        act(() => {
          result.current.setTableColumnFilters([{ id: "test", value: `value${i}` }]);
        });

        unmount();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete without significant performance degradation
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Edge Case Performance", () => {
    it("should handle rapid state changes efficiently", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      const startTime = performance.now();

      // Rapid fire updates
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.setTableColumnFilters([{ id: "test", value: `value${i}` }]);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(200);
      expect(result.current.tableColumnFilters).toEqual([{ id: "test", value: "value999" }]);
    });

    it("should handle deep object updates efficiently", () => {
      const { result } = renderHook(() => useTableStatePersistenceTab("windowA", "tabX"), { wrapper });

      // Create deeply nested filter structure
      const deepFilters = Array.from({ length: 100 }, (_, i) => ({
        id: `column${i}`,
        value: {
          type: "complex",
          conditions: Array.from({ length: 10 }, (_, j) => ({
            operator: "equals",
            value: `condition${i}-${j}`,
            metadata: {
              user: "testUser",
              timestamp: Date.now(),
              nested: {
                level1: {
                  level2: {
                    level3: `deep${i}-${j}`,
                  },
                },
              },
            },
          })),
        },
      }));

      const startTime = performance.now();

      act(() => {
        result.current.setTableColumnFilters(deepFilters);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle deep objects efficiently (less than 300ms)
      expect(duration).toBeLessThan(300);
      expect(result.current.tableColumnFilters).toEqual(deepFilters);
    });
  });
});
