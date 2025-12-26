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
 * @fileoverview Unit tests for window utility functions
 *
 * Tests utility functions for window state management:
 * - Tab form state generation
 * - Window identifier extraction and generation
 * - Default tab state creation
 * - State structure ensuring and updating
 * - Table and navigation property updates
 * - Recovery and initialization helpers
 */

import {
  getNewTabFormState,
  getWindowIdFromIdentifier,
  getNewWindowIdentifier,
  createDefaultTabState,
  ensureTabExists,
  updateTableProperty,
  updateNavigationProperty,
  isFormView,
  createRecoveryWindowState,
  markWindowAsInitialized,
  isWindowReady,
} from "../utils";
import { TAB_MODES, FORM_MODES, NEW_RECORD_ID } from "@/utils/url/constants";
import type { WindowContextState, WindowRecoveryInfo, WindowState } from "@/utils/window/constants";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";

describe("getNewTabFormState", () => {
  it("should create form state with provided mode and formMode", () => {
    const result = getNewTabFormState("record123", TAB_MODES.FORM, FORM_MODES.EDIT);

    expect(result).toEqual({
      recordId: "record123",
      mode: TAB_MODES.FORM,
      formMode: FORM_MODES.EDIT,
    });
  });

  it("should auto-determine EDIT mode for non-new records", () => {
    const result = getNewTabFormState("record123", TAB_MODES.FORM);

    expect(result).toEqual({
      recordId: "record123",
      mode: TAB_MODES.FORM,
      formMode: FORM_MODES.EDIT,
    });
  });

  it("should auto-determine NEW mode for new record ID", () => {
    const result = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM);

    expect(result).toEqual({
      recordId: NEW_RECORD_ID,
      mode: TAB_MODES.FORM,
      formMode: FORM_MODES.NEW,
    });
  });

  it("should default to FORM mode when mode not provided", () => {
    const result = getNewTabFormState("record123");

    expect(result.mode).toBe(TAB_MODES.FORM);
    expect(result.formMode).toBe(FORM_MODES.EDIT);
  });

  it("should respect explicit formMode over auto-determination", () => {
    const result = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.VIEW);

    expect(result.formMode).toBe(FORM_MODES.VIEW);
  });

  it("should handle VIEW mode correctly", () => {
    const result = getNewTabFormState("record123", TAB_MODES.FORM, FORM_MODES.VIEW);

    expect(result).toEqual({
      recordId: "record123",
      mode: TAB_MODES.FORM,
      formMode: FORM_MODES.VIEW,
    });
  });
});

describe("getWindowIdFromIdentifier", () => {
  it("should extract window ID from identifier with underscore", () => {
    const result = getWindowIdFromIdentifier("143_1234567890");

    expect(result).toBe("143");
  });

  it("should extract window ID from identifier with multiple underscores", () => {
    const result = getWindowIdFromIdentifier("143_1234567890_extra");

    expect(result).toBe("143");
  });

  it("should return full identifier when no underscore present", () => {
    const result = getWindowIdFromIdentifier("143");

    expect(result).toBe("143");
  });

  it("should handle empty string", () => {
    const result = getWindowIdFromIdentifier("");

    expect(result).toBe("");
  });

  it("should handle identifier starting with underscore", () => {
    const result = getWindowIdFromIdentifier("_143_1234567890");

    expect(result).toBe("");
  });

  it("should handle complex window IDs", () => {
    const result = getWindowIdFromIdentifier("ABC123DEF_9876543210");

    expect(result).toBe("ABC123DEF");
  });
});

describe("getNewWindowIdentifier", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should generate identifier with timestamp", () => {
    const result = getNewWindowIdentifier("143");

    expect(result).toBe("143_1234567890");
  });

  it("should generate unique identifiers for same window ID", () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(1111111111).mockReturnValueOnce(2222222222);

    const result1 = getNewWindowIdentifier("143");
    const result2 = getNewWindowIdentifier("143");

    expect(result1).toBe("143_1111111111");
    expect(result2).toBe("143_2222222222");
    expect(result1).not.toBe(result2);
  });

  it("should handle empty window ID", () => {
    const result = getNewWindowIdentifier("");

    expect(result).toBe("_1234567890");
  });

  it("should handle complex window IDs", () => {
    const result = getNewWindowIdentifier("WINDOW_ABC_123");

    expect(result).toBe("WINDOW_ABC_123_1234567890");
  });
});

describe("createDefaultTabState", () => {
  it("should create default tab state with level 0", () => {
    const result = createDefaultTabState();

    expect(result).toEqual({
      table: {
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        isImplicitFilterApplied: false,
      },
      form: {},
      level: 0,
    });
  });

  it("should create default tab state with specified level", () => {
    const result = createDefaultTabState(2);

    expect(result).toEqual({
      table: {
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        isImplicitFilterApplied: false,
      },
      form: {},
      level: 2,
    });
  });

  it("should create independent instances", () => {
    const state1 = createDefaultTabState(0);
    const state2 = createDefaultTabState(0);

    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2);
    expect(state1.table).not.toBe(state2.table);
  });
});

describe("ensureTabExists", () => {
  it("should create window and tab when window does not exist", () => {
    const state: WindowContextState = {};

    const result = ensureTabExists(state, "143_123456", "tab1", 0);

    expect(result).toHaveProperty("143_123456");
    expect(result["143_123456"].windowId).toBe("143");
    expect(result["143_123456"].windowIdentifier).toBe("143_123456");
    expect(result["143_123456"].tabs).toHaveProperty("tab1");
    expect(result["143_123456"].tabs.tab1.level).toBe(0);
  });

  it("should create tab when window exists but tab does not", () => {
    const state: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Test Window",
        navigation: {
          activeLevels: [0],
          activeTabsByLevel: new Map(),
          initialized: true,
        },
        tabs: {
          existingTab: createDefaultTabState(0),
        },
      },
    };

    const result = ensureTabExists(state, "143_123456", "tab1", 1);

    expect(result["143_123456"].tabs).toHaveProperty("existingTab");
    expect(result["143_123456"].tabs).toHaveProperty("tab1");
    expect(result["143_123456"].tabs.tab1.level).toBe(1);
  });

  it("should return state unchanged when window and tab exist", () => {
    const state: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Test Window",
        navigation: {
          activeLevels: [0],
          activeTabsByLevel: new Map(),
          initialized: true,
        },
        tabs: {
          tab1: createDefaultTabState(0),
        },
      },
    };

    const result = ensureTabExists(state, "143_123456", "tab1", 0);

    expect(result).toEqual(state);
  });

  it("should preserve existing window properties when adding tab", () => {
    const state: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Important Window",
        navigation: {
          activeLevels: [0, 1],
          activeTabsByLevel: new Map([[0, "tab1"]]),
          initialized: true,
        },
        tabs: {},
      },
    };

    const result = ensureTabExists(state, "143_123456", "tab2", 1);

    expect(result["143_123456"].title).toBe("Important Window");
    expect(result["143_123456"].isActive).toBe(true);
    expect(result["143_123456"].navigation.activeLevels).toEqual([0, 1]);
  });

  it("should maintain immutability", () => {
    const state: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Test Window",
        navigation: {
          activeLevels: [0],
          activeTabsByLevel: new Map(),
          initialized: true,
        },
        tabs: {
          existingTab: createDefaultTabState(0),
        },
      },
    };

    const result = ensureTabExists(state, "143_123456", "newTab", 1);

    expect(result).not.toBe(state);
    expect(result["143_123456"]).not.toBe(state["143_123456"]);
    expect(result["143_123456"].tabs).not.toBe(state["143_123456"].tabs);
    expect(state["143_123456"].tabs).not.toHaveProperty("newTab");
  });

  it("should handle multiple levels correctly", () => {
    const state: WindowContextState = {};

    const result = ensureTabExists(state, "143_123456", "tab5", 5);

    expect(result["143_123456"].tabs.tab5.level).toBe(5);
  });
});

describe("updateTableProperty", () => {
  const initialState: WindowContextState = {
    "143_123456": {
      windowId: "143",
      windowIdentifier: "143_123456",
      isActive: true,
      initialized: true,
      title: "Test Window",
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: true,
      },
      tabs: {
        tab1: createDefaultTabState(0),
      },
    },
  };

  it("should update filters property", () => {
    const newFilters: MRT_ColumnFiltersState = [{ id: "column1", value: "test" }];

    const result = updateTableProperty(initialState, "143_123456", "tab1", "filters", newFilters, 0);

    expect(result["143_123456"].tabs.tab1.table.filters).toEqual(newFilters);
  });

  it("should update visibility property", () => {
    const newVisibility: MRT_VisibilityState = { column1: false, column2: true };

    const result = updateTableProperty(initialState, "143_123456", "tab1", "visibility", newVisibility, 0);

    expect(result["143_123456"].tabs.tab1.table.visibility).toEqual(newVisibility);
  });

  it("should update sorting property", () => {
    const newSorting: MRT_SortingState = [{ id: "column1", desc: true }];

    const result = updateTableProperty(initialState, "143_123456", "tab1", "sorting", newSorting, 0);

    expect(result["143_123456"].tabs.tab1.table.sorting).toEqual(newSorting);
  });

  it("should update order property", () => {
    const newOrder = ["column1", "column2", "column3"];

    const result = updateTableProperty(initialState, "143_123456", "tab1", "order", newOrder, 0);

    expect(result["143_123456"].tabs.tab1.table.order).toEqual(newOrder);
  });

  it("should update isImplicitFilterApplied property", () => {
    const result = updateTableProperty(initialState, "143_123456", "tab1", "isImplicitFilterApplied", true, 0);

    expect(result["143_123456"].tabs.tab1.table.isImplicitFilterApplied).toBe(true);
  });

  it("should create window and tab if they do not exist", () => {
    const emptyState: WindowContextState = {};
    const newFilters: MRT_ColumnFiltersState = [{ id: "column1", value: "test" }];

    const result = updateTableProperty(emptyState, "143_123456", "tab1", "filters", newFilters, 0);

    expect(result).toHaveProperty("143_123456");
    expect(result["143_123456"].tabs).toHaveProperty("tab1");
    expect(result["143_123456"].tabs.tab1.table.filters).toEqual(newFilters);
  });

  it("should maintain immutability", () => {
    const newFilters: MRT_ColumnFiltersState = [{ id: "column1", value: "test" }];

    const result = updateTableProperty(initialState, "143_123456", "tab1", "filters", newFilters, 0);

    expect(result).not.toBe(initialState);
    expect(result["143_123456"]).not.toBe(initialState["143_123456"]);
    expect(result["143_123456"].tabs).not.toBe(initialState["143_123456"].tabs);
    expect(result["143_123456"].tabs.tab1).not.toBe(initialState["143_123456"].tabs.tab1);
    expect(result["143_123456"].tabs.tab1.table).not.toBe(initialState["143_123456"].tabs.tab1.table);
  });

  it("should not modify original state", () => {
    const newFilters: MRT_ColumnFiltersState = [{ id: "column1", value: "test" }];

    updateTableProperty(initialState, "143_123456", "tab1", "filters", newFilters, 0);

    expect(initialState["143_123456"].tabs.tab1.table.filters).toEqual([]);
  });

  it("should preserve other table properties when updating one", () => {
    const stateWithData: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Test Window",
        navigation: {
          activeLevels: [0],
          activeTabsByLevel: new Map(),
          initialized: true,
        },
        tabs: {
          tab1: {
            ...createDefaultTabState(0),
            table: {
              filters: [{ id: "existing", value: "value" }],
              visibility: { col1: true },
              sorting: [{ id: "col1", desc: false }],
              order: ["col1", "col2"],
              isImplicitFilterApplied: true,
            },
          },
        },
      },
    };

    const newFilters: MRT_ColumnFiltersState = [{ id: "new", value: "newValue" }];
    const result = updateTableProperty(stateWithData, "143_123456", "tab1", "filters", newFilters, 0);

    expect(result["143_123456"].tabs.tab1.table.filters).toEqual(newFilters);
    expect(result["143_123456"].tabs.tab1.table.visibility).toEqual({ col1: true });
    expect(result["143_123456"].tabs.tab1.table.sorting).toEqual([{ id: "col1", desc: false }]);
    expect(result["143_123456"].tabs.tab1.table.order).toEqual(["col1", "col2"]);
    expect(result["143_123456"].tabs.tab1.table.isImplicitFilterApplied).toBe(true);
  });
});

describe("updateNavigationProperty", () => {
  const initialState: WindowContextState = {
    "143_123456": {
      windowId: "143",
      windowIdentifier: "143_123456",
      isActive: true,
      initialized: true,
      title: "Test Window",
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    },
  };

  it("should update activeLevels property", () => {
    const newActiveLevels = [0, 1, 2];

    const result = updateNavigationProperty(initialState, "143_123456", "activeLevels", newActiveLevels);

    expect(result["143_123456"].navigation.activeLevels).toEqual(newActiveLevels);
  });

  it("should update activeTabsByLevel property", () => {
    const newActiveTabsByLevel = new Map([
      [0, "tab1"],
      [1, "tab2"],
    ]);

    const result = updateNavigationProperty(initialState, "143_123456", "activeTabsByLevel", newActiveTabsByLevel);

    expect(result["143_123456"].navigation.activeTabsByLevel).toEqual(newActiveTabsByLevel);
  });

  it("should update initialized property", () => {
    const result = updateNavigationProperty(initialState, "143_123456", "initialized", true);

    expect(result["143_123456"].navigation.initialized).toBe(true);
  });

  it("should create window if it does not exist", () => {
    const emptyState: WindowContextState = {};
    const newActiveLevels = [0, 1];

    const result = updateNavigationProperty(emptyState, "143_123456", "activeLevels", newActiveLevels);

    expect(result).toHaveProperty("143_123456");
    expect(result["143_123456"].windowId).toBe("143");
    expect(result["143_123456"].navigation.activeLevels).toEqual(newActiveLevels);
  });

  it("should maintain immutability", () => {
    const newActiveLevels = [0, 1, 2];

    const result = updateNavigationProperty(initialState, "143_123456", "activeLevels", newActiveLevels);

    expect(result).not.toBe(initialState);
    expect(result["143_123456"]).not.toBe(initialState["143_123456"]);
    expect(result["143_123456"].navigation).not.toBe(initialState["143_123456"].navigation);
  });

  it("should preserve other navigation properties when updating one", () => {
    const stateWithData: WindowContextState = {
      "143_123456": {
        windowId: "143",
        windowIdentifier: "143_123456",
        isActive: true,
        initialized: true,
        title: "Test Window",
        navigation: {
          activeLevels: [0, 1],
          activeTabsByLevel: new Map([[0, "tab1"]]),
          initialized: true,
        },
        tabs: {},
      },
    };

    const newActiveLevels = [0, 1, 2, 3];
    const result = updateNavigationProperty(stateWithData, "143_123456", "activeLevels", newActiveLevels);

    expect(result["143_123456"].navigation.activeLevels).toEqual(newActiveLevels);
    expect(result["143_123456"].navigation.activeTabsByLevel).toEqual(new Map([[0, "tab1"]]));
    expect(result["143_123456"].navigation.initialized).toBe(true);
  });

  it("should preserve other window properties when updating navigation", () => {
    const newActiveLevels = [0, 1];

    const result = updateNavigationProperty(initialState, "143_123456", "activeLevels", newActiveLevels);

    expect(result["143_123456"].windowId).toBe("143");
    expect(result["143_123456"].title).toBe("Test Window");
    expect(result["143_123456"].isActive).toBe(true);
  });
});

describe("isFormView", () => {
  it("should return true when all conditions are met", () => {
    const result = isFormView({
      currentMode: TAB_MODES.FORM,
      recordId: "record123",
      hasParentSelection: true,
    });

    expect(result).toBe(true);
  });

  it("should return false when mode is not FORM", () => {
    const result = isFormView({
      currentMode: TAB_MODES.TABLE,
      recordId: "record123",
      hasParentSelection: true,
    });

    expect(result).toBe(false);
  });

  it("should return false when recordId is empty", () => {
    const result = isFormView({
      currentMode: TAB_MODES.FORM,
      recordId: "",
      hasParentSelection: true,
    });

    expect(result).toBe(false);
  });

  it("should return false when hasParentSelection is false", () => {
    const result = isFormView({
      currentMode: TAB_MODES.FORM,
      recordId: "record123",
      hasParentSelection: false,
    });

    expect(result).toBe(false);
  });

  it("should return false when multiple conditions are not met", () => {
    const result = isFormView({
      currentMode: TAB_MODES.TABLE,
      recordId: "",
      hasParentSelection: false,
    });

    expect(result).toBe(false);
  });

  it("should handle undefined-like values correctly", () => {
    const result = isFormView({
      currentMode: TAB_MODES.FORM,
      recordId: "record123",
      hasParentSelection: false,
    });

    expect(result).toBe(false);
  });
});

describe("createRecoveryWindowState", () => {
  it("should create recovery window state with all parameters", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      tabId: "tab1",
      recordId: "record123",
      hasRecoveryData: true,
    };

    const result = createRecoveryWindowState(recoveryInfo, "143", "Sales Order");

    expect(result).toEqual({
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: false,
      initialized: false,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    });
  });

  it("should extract window ID from identifier when not provided", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "144_789012",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo);

    expect(result.windowId).toBe("144");
    expect(result.windowIdentifier).toBe("144_789012");
  });

  it("should use empty title when not provided", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo, "143");

    expect(result.title).toBe("");
  });

  it("should create window with uninitialized state", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo);

    expect(result.initialized).toBe(false);
    expect(result.navigation.initialized).toBe(false);
  });

  it("should create window with empty tabs object", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo);

    expect(result.tabs).toEqual({});
  });

  it("should create window with default navigation state", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo);

    expect(result.navigation.activeLevels).toEqual([0]);
    expect(result.navigation.activeTabsByLevel).toEqual(new Map());
  });

  it("should set isActive to false", () => {
    const recoveryInfo: WindowRecoveryInfo = {
      windowIdentifier: "143_123456",
      hasRecoveryData: false,
    };

    const result = createRecoveryWindowState(recoveryInfo);

    expect(result.isActive).toBe(false);
  });
});

describe("markWindowAsInitialized", () => {
  it("should mark window as initialized", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: false,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    };

    const result = markWindowAsInitialized(windowState);

    expect(result.initialized).toBe(true);
    expect(result.navigation.initialized).toBe(true);
  });

  it("should preserve all other window properties", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: false,
      navigation: {
        activeLevels: [0, 1, 2],
        activeTabsByLevel: new Map([
          [0, "tab1"],
          [1, "tab2"],
        ]),
        initialized: false,
      },
      tabs: {
        tab1: createDefaultTabState(0),
        tab2: createDefaultTabState(1),
      },
    };

    const result = markWindowAsInitialized(windowState);

    expect(result.windowId).toBe("143");
    expect(result.windowIdentifier).toBe("143_123456");
    expect(result.title).toBe("Sales Order");
    expect(result.isActive).toBe(true);
    expect(result.navigation.activeLevels).toEqual([0, 1, 2]);
    expect(result.navigation.activeTabsByLevel).toEqual(
      new Map([
        [0, "tab1"],
        [1, "tab2"],
      ])
    );
    expect(result.tabs).toEqual(windowState.tabs);
  });

  it("should maintain immutability", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: false,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    };

    const result = markWindowAsInitialized(windowState);

    expect(result).not.toBe(windowState);
    expect(result.navigation).not.toBe(windowState.navigation);
    expect(windowState.initialized).toBe(false);
    expect(windowState.navigation.initialized).toBe(false);
  });

  it("should work with already initialized window", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: true,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: true,
      },
      tabs: {},
    };

    const result = markWindowAsInitialized(windowState);

    expect(result.initialized).toBe(true);
    expect(result.navigation.initialized).toBe(true);
  });
});

describe("isWindowReady", () => {
  it("should return true when window is initialized", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: true,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: true,
      },
      tabs: {},
    };

    const result = isWindowReady(windowState);

    expect(result).toBe(true);
  });

  it("should return false when window is not initialized", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "Sales Order",
      isActive: true,
      initialized: false,
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    };

    const result = isWindowReady(windowState);

    expect(result).toBe(false);
  });

  it("should only check initialized property", () => {
    const windowState: WindowState = {
      windowId: "143",
      windowIdentifier: "143_123456",
      title: "",
      isActive: false,
      initialized: true,
      navigation: {
        activeLevels: [],
        activeTabsByLevel: new Map(),
        initialized: false, // Navigation not initialized but window is
      },
      tabs: {},
    };

    const result = isWindowReady(windowState);

    expect(result).toBe(true);
  });
});
