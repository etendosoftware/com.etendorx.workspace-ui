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
 * @fileoverview Unit tests for WindowProvider and useWindowContext
 *
 * Tests the window context implementation:
 * - WindowProvider state management
 * - useWindowContext hook functionality
 * - Table state management
 * - Navigation state management
 * - Form state management
 * - Selected record management
 * - Window lifecycle management
 * - URL synchronization
 */

import { renderHook, act } from "@testing-library/react";
import WindowProvider, { useWindowContext } from "../window";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";
import type { TabFormState } from "../../utils/url/constants";
import { TAB_MODES } from "../../utils/url/constants";
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

// Mock useGlobalUrlStateRecovery hook
jest.mock("@/hooks/useGlobalUrlStateRecovery", () => ({
  useGlobalUrlStateRecovery: () => ({
    recoveredWindows: [],
    isRecoveryLoading: false,
    recoveryError: null,
  }),
}));

// Test helpers
const setupTestEnvironment = () => {
  jest.clearAllMocks();
  mockReplace.mockClear();
  mockSearchParams.delete("w_window1_123456789");
};

const renderWindowContext = () => {
  return renderHook(() => useWindowContext(), {
    wrapper: WindowProvider,
  });
};

const createWindowData = (overrides?: Partial<{ windowIdentifier: string; title: string; [key: string]: any }>) => ({
  windowIdentifier: "window1_123",
  windowData: { title: "Test Window" },
  ...overrides,
});

const createFormState = (overrides?: Partial<TabFormState>): TabFormState => ({
  mode: TAB_MODES.FORM,
  recordId: "record1",
  ...overrides,
});

const mockConsole = (method: "error" | "warn" | "log" = "error") => {
  const spy = jest.spyOn(console, method).mockImplementation(() => {});
  return spy;
};

const actSetWindowActive = (result: any, data: ReturnType<typeof createWindowData>) => {
  act(() => {
    result.current.setWindowActive(data);
  });
};

const expectWindowState = (result: any, expectedIdentifier: string | null, expectedActive = true) => {
  if (expectedIdentifier === null) {
    expect(result.current.activeWindow).toBeNull();
  } else {
    expect(result.current.activeWindow?.windowIdentifier).toBe(expectedIdentifier);
    expect(result.current.activeWindow?.isActive).toBe(expectedActive);
  }
};

const getDefaultTableState = () => ({
  filters: [],
  visibility: {},
  sorting: [],
  order: [],
  isImplicitFilterApplied: undefined,
});

const getDefaultNavigationState = () => ({
  activeLevels: [0],
  activeTabsByLevel: new Map(),
  initialized: false,
});

describe("WindowProvider", () => {
  beforeEach(setupTestEnvironment);

  it("should throw error when useWindowContext is used outside provider", () => {
    const consoleErrorSpy = mockConsole("error");

    expect(() => {
      renderHook(() => useWindowContext());
    }).toThrow("useWindowContext must be used within a WindowProvider");

    consoleErrorSpy.mockRestore();
  });

  it("should provide initial empty state", () => {
    const { result } = renderWindowContext();

    expect(result.current.windows).toEqual([]);
    expect(result.current.activeWindow).toBeNull();
    expect(result.current.isHomeRoute).toBe(true);
  });

  it("should provide all required functions", () => {
    const { result } = renderWindowContext();

    // Getters
    expect(typeof result.current.getTableState).toBe("function");
    expect(typeof result.current.getNavigationState).toBe("function");
    expect(typeof result.current.getActiveWindowIdentifier).toBe("function");
    expect(typeof result.current.getActiveWindowProperty).toBe("function");
    expect(typeof result.current.getAllWindowsIdentifiers).toBe("function");
    expect(typeof result.current.getAllWindows).toBe("function");
    expect(typeof result.current.getActiveWindow).toBe("function");
    expect(typeof result.current.getAllState).toBe("function");

    // Setters
    expect(typeof result.current.setTableFilters).toBe("function");
    expect(typeof result.current.setTableVisibility).toBe("function");
    expect(typeof result.current.setTableSorting).toBe("function");
    expect(typeof result.current.setTableOrder).toBe("function");
    expect(typeof result.current.setTableImplicitFilterApplied).toBe("function");
    expect(typeof result.current.setNavigationActiveLevels).toBe("function");
    expect(typeof result.current.setNavigationActiveTabsByLevel).toBe("function");
    expect(typeof result.current.setWindowActive).toBe("function");
    expect(typeof result.current.setWindowInactive).toBe("function");
    expect(typeof result.current.setAllWindowsInactive).toBe("function");

    // Form state
    expect(typeof result.current.getTabFormState).toBe("function");
    expect(typeof result.current.setTabFormState).toBe("function");
    expect(typeof result.current.clearTabFormState).toBe("function");

    // Selected record
    expect(typeof result.current.getSelectedRecord).toBe("function");
    expect(typeof result.current.setSelectedRecord).toBe("function");
    expect(typeof result.current.clearSelectedRecord).toBe("function");
    expect(typeof result.current.clearChildrenSelections).toBe("function");
    expect(typeof result.current.setSelectedRecordAndClearChildren).toBe("function");

    // Navigation initialization
    expect(typeof result.current.getNavigationInitialized).toBe("function");
    expect(typeof result.current.setNavigationInitialized).toBe("function");

    // Window management
    expect(typeof result.current.cleanupWindow).toBe("function");
    expect(typeof result.current.cleanState).toBe("function");
  });
});

describe("Table state management", () => {
  beforeEach(setupTestEnvironment);

  it("should return default table state for non-existent window", () => {
    const { result } = renderWindowContext();

    const tableState = result.current.getTableState("nonexistent", "tab1");

    expect(tableState).toEqual(getDefaultTableState());
  });

  it("should set and get table filters", () => {
    const { result } = renderWindowContext();

    const filters: MRT_ColumnFiltersState = [{ id: "name", value: "test" }];

    act(() => {
      result.current.setTableFilters("window1", "tab1", filters);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.filters).toEqual(filters);
  });

  it("should set and get table visibility", () => {
    const { result } = renderWindowContext();

    const visibility: MRT_VisibilityState = { column1: false, column2: true };

    act(() => {
      result.current.setTableVisibility("window1", "tab1", visibility);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.visibility).toEqual(visibility);
  });

  it("should merge table visibility updates", () => {
    const { result } = renderWindowContext();

    const visibility1: MRT_VisibilityState = { column1: false };
    const visibility2: MRT_VisibilityState = { column2: true };

    act(() => {
      result.current.setTableVisibility("window1", "tab1", visibility1);
    });

    act(() => {
      result.current.setTableVisibility("window1", "tab1", visibility2);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.visibility).toEqual({ column1: false, column2: true });
  });

  it("should set and get table sorting", () => {
    const { result } = renderWindowContext();

    const sorting: MRT_SortingState = [{ id: "name", desc: false }];

    act(() => {
      result.current.setTableSorting("window1", "tab1", sorting);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.sorting).toEqual(sorting);
  });

  it("should set and get table order", () => {
    const { result } = renderWindowContext();

    const order = ["col1", "col2", "col3"];

    act(() => {
      result.current.setTableOrder("window1", "tab1", order);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.order).toEqual(order);
  });

  it("should set and get implicit filter applied state", () => {
    const { result } = renderWindowContext();

    act(() => {
      result.current.setTableImplicitFilterApplied("window1", "tab1", true);
    });

    const tableState = result.current.getTableState("window1", "tab1");
    expect(tableState.isImplicitFilterApplied).toBe(true);
  });

  it("should handle multiple tabs independently", () => {
    const { result } = renderWindowContext();

    const filters1: MRT_ColumnFiltersState = [{ id: "name", value: "test1" }];
    const filters2: MRT_ColumnFiltersState = [{ id: "name", value: "test2" }];

    act(() => {
      result.current.setTableFilters("window1", "tab1", filters1);
      result.current.setTableFilters("window1", "tab2", filters2);
    });

    expect(result.current.getTableState("window1", "tab1").filters).toEqual(filters1);
    expect(result.current.getTableState("window1", "tab2").filters).toEqual(filters2);
  });
});

describe("Navigation state management", () => {
  beforeEach(setupTestEnvironment);

  it("should return default navigation state for non-existent window", () => {
    const { result } = renderWindowContext();

    const navState = result.current.getNavigationState("nonexistent");

    expect(navState).toEqual(getDefaultNavigationState());
  });

  it("should set and get navigation active levels", () => {
    const { result } = renderWindowContext();

    const activeLevels = [0, 1, 2];

    act(() => {
      result.current.setNavigationActiveLevels("window1", activeLevels);
    });

    const navState = result.current.getNavigationState("window1");
    expect(navState.activeLevels).toEqual(activeLevels);
  });

  it("should set and get navigation active tabs by level", () => {
    const { result } = renderWindowContext();

    const activeTabsByLevel = new Map<number, string>([
      [0, "tab1"],
      [1, "tab2"],
    ]);

    act(() => {
      result.current.setNavigationActiveTabsByLevel("window1", activeTabsByLevel);
    });

    const navState = result.current.getNavigationState("window1");
    expect(navState.activeTabsByLevel).toEqual(activeTabsByLevel);
  });

  it("should set and get navigation initialized state", () => {
    const { result } = renderWindowContext();

    expect(result.current.getNavigationInitialized("window1")).toBe(false);

    act(() => {
      result.current.setNavigationInitialized("window1", true);
    });

    expect(result.current.getNavigationInitialized("window1")).toBe(true);
  });
});

describe("Window management", () => {
  beforeEach(setupTestEnvironment);

  it("should set window as active", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.activeWindow).not.toBeNull();
    expect(result.current.activeWindow?.windowIdentifier).toBe("window1_123");
    expect(result.current.activeWindow?.title).toBe("Test Window");
    expect(result.current.activeWindow?.isActive).toBe(true);
  });

  it("should deactivate other windows when setting one active", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );
    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    const windows = result.current.getAllWindows();
    const window1 = windows.find((w) => w.windowIdentifier === "window1_123");
    const window2 = windows.find((w) => w.windowIdentifier === "window2_456");

    expect(window1?.isActive).toBe(false);
    expect(window2?.isActive).toBe(true);
  });

  it("should set window as inactive", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    act(() => {
      result.current.setWindowInactive("window1_123");
    });

    expect(result.current.activeWindow).toBeNull();
  });

  it("should set all windows as inactive", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );
    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    act(() => {
      result.current.setAllWindowsInactive();
    });

    const windows = result.current.getAllWindows();
    expect(windows.every((w) => !w.isActive)).toBe(true);
    expect(result.current.activeWindow).toBeNull();
  });

  it("should get active window identifier", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.getActiveWindowIdentifier()).toBe("window1_123");
  });

  it("should get all window identifiers", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );
    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    const identifiers = result.current.getAllWindowsIdentifiers();
    expect(identifiers).toContain("window1_123");
    expect(identifiers).toContain("window2_456");
  });

  it("should cleanup window and activate previous window", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );
    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    act(() => {
      result.current.cleanupWindow("window2_456");
    });

    expect(result.current.activeWindow?.windowIdentifier).toBe("window1_123");
    expect(result.current.getAllWindowsIdentifiers()).not.toContain("window2_456");
  });

  it("should cleanup window and activate next window if deleting first", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );
    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    // Set window1 as active
    act(() => {
      result.current.setWindowActive({
        windowIdentifier: "window1_123",
      });
    });

    act(() => {
      result.current.cleanupWindow("window1_123");
    });

    expect(result.current.activeWindow?.windowIdentifier).toBe("window2_456");
  });

  it("should clean all state", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );

    act(() => {
      result.current.cleanState();
    });

    expect(result.current.getAllWindows()).toEqual([]);
    expect(result.current.activeWindow).toBeNull();
  });
});

describe("Form state management", () => {
  beforeEach(setupTestEnvironment);

  it("should return undefined for non-existent tab form state", () => {
    const { result } = renderWindowContext();

    expect(result.current.getTabFormState("window1", "tab1")).toBeUndefined();
  });

  it("should set and get tab form state", () => {
    const { result } = renderWindowContext();

    const formState = createFormState();

    act(() => {
      result.current.setTabFormState("window1", "tab1", formState);
    });

    expect(result.current.getTabFormState("window1", "tab1")).toEqual(formState);
  });

  it("should clear tab form state", () => {
    const { result } = renderWindowContext();

    const formState = createFormState();

    act(() => {
      result.current.setTabFormState("window1", "tab1", formState);
    });

    act(() => {
      result.current.clearTabFormState("window1", "tab1");
    });

    expect(result.current.getTabFormState("window1", "tab1")).toEqual({});
  });

  it("should not error when clearing non-existent form state", () => {
    const { result } = renderWindowContext();

    expect(() => {
      act(() => {
        result.current.clearTabFormState("window1", "tab1");
      });
    }).not.toThrow();
  });
});

describe("Selected record management", () => {
  beforeEach(setupTestEnvironment);

  it("should return undefined for non-existent selected record", () => {
    const { result } = renderWindowContext();

    expect(result.current.getSelectedRecord("window1", "tab1")).toBeUndefined();
  });

  it("should set and get selected record", () => {
    const { result } = renderWindowContext();

    act(() => {
      result.current.setSelectedRecord("window1", "tab1", "record1");
    });

    expect(result.current.getSelectedRecord("window1", "tab1")).toBe("record1");
  });

  it("should clear selected record", () => {
    const { result } = renderWindowContext();

    act(() => {
      result.current.setSelectedRecord("window1", "tab1", "record1");
    });

    act(() => {
      result.current.clearSelectedRecord("window1", "tab1");
    });

    expect(result.current.getSelectedRecord("window1", "tab1")).toBeUndefined();
  });

  it("should handle clearing non-existent selected record", () => {
    const { result } = renderWindowContext();
    const consoleWarnSpy = mockConsole("warn");

    act(() => {
      result.current.clearSelectedRecord("window1", "tab1");
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("should set selected record and clear children", () => {
    const { result } = renderWindowContext();

    // Set up parent and children
    act(() => {
      result.current.setSelectedRecord("window1", "parentTab", "parent1");
      result.current.setSelectedRecord("window1", "childTab1", "child1");
      result.current.setSelectedRecord("window1", "childTab2", "child2");
    });

    act(() => {
      result.current.setSelectedRecordAndClearChildren("window1", "parentTab", "parent2", ["childTab1", "childTab2"]);
    });

    expect(result.current.getSelectedRecord("window1", "parentTab")).toBe("parent2");
    expect(result.current.getSelectedRecord("window1", "childTab1")).toBeUndefined();
    expect(result.current.getSelectedRecord("window1", "childTab2")).toBeUndefined();
  });

  it("should preserve children in FormView when parent selection changes", () => {
    const { result } = renderWindowContext();
    const consoleLogSpy = mockConsole("log");

    // Set up parent and child with form state
    act(() => {
      result.current.setSelectedRecord("window1", "parentTab", "parent1");
      result.current.setSelectedRecord("window1", "childTab", "child1");
      result.current.setTabFormState("window1", "childTab", {
        mode: TAB_MODES.FORM,
        recordId: "child1",
      });
    });

    act(() => {
      result.current.clearChildrenSelections("window1", ["childTab"], false);
    });

    // Child should be preserved because it's in FormView
    expect(result.current.getSelectedRecord("window1", "childTab")).toBe("child1");

    consoleLogSpy.mockRestore();
  });

  it("should force clear children when parent selection is changing", () => {
    const { result } = renderWindowContext();

    // Set up parent and child with form state
    act(() => {
      result.current.setSelectedRecord("window1", "parentTab", "parent1");
      result.current.setSelectedRecord("window1", "childTab", "child1");
      result.current.setTabFormState("window1", "childTab", createFormState({ recordId: "child1" }));
    });

    act(() => {
      result.current.clearChildrenSelections("window1", ["childTab"], true);
    });

    // Child should be cleared even though it's in FormView
    expect(result.current.getSelectedRecord("window1", "childTab")).toBeUndefined();
  });
});

describe("Window property getters", () => {
  beforeEach(setupTestEnvironment);

  it("should return null for empty property name", () => {
    const { result } = renderWindowContext();

    expect(result.current.getActiveWindowProperty("")).toBeNull();
  });

  it("should return null for invalid property name", () => {
    const { result } = renderWindowContext();

    expect(result.current.getActiveWindowProperty("invalidProperty")).toBeNull();
  });

  it("should return null when no active window", () => {
    const { result } = renderWindowContext();

    expect(result.current.getActiveWindowProperty("title")).toBeNull();
  });

  it("should return window title", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.getActiveWindowProperty("title")).toBe("Test Window");
  });

  it("should return isActive property", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.getActiveWindowProperty("isActive")).toBe(true);
  });

  it("should return windowIdentifier property", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.getActiveWindowProperty("windowIdentifier")).toBe("window1_123");
  });

  it("should return tabs property", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.getActiveWindowProperty("tabs")).toEqual({});
  });
});

describe("Recovery state", () => {
  beforeEach(setupTestEnvironment);

  it("should provide recovery loading state", () => {
    const { result } = renderWindowContext();

    expect(result.current.isRecoveryLoading).toBe(false);
  });

  it("should provide recovery error state", () => {
    const { result } = renderWindowContext();

    expect(result.current.recoveryError).toBeNull();
  });
});

describe("Computed values", () => {
  beforeEach(setupTestEnvironment);

  it("should compute isHomeRoute correctly when no active window", () => {
    const { result } = renderWindowContext();

    expect(result.current.isHomeRoute).toBe(true);
  });

  it("should compute isHomeRoute correctly when active window exists", () => {
    const { result } = renderWindowContext();

    actSetWindowActive(result, createWindowData());

    expect(result.current.isHomeRoute).toBe(false);
  });

  it("should update windows array reactively", () => {
    const { result } = renderWindowContext();

    expect(result.current.windows).toEqual([]);

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window1_123", windowData: { title: "Window 1" } })
    );

    expect(result.current.windows.length).toBe(1);

    actSetWindowActive(
      result,
      createWindowData({ windowIdentifier: "window2_456", windowData: { title: "Window 2" } })
    );

    expect(result.current.windows.length).toBe(2);
  });
});
