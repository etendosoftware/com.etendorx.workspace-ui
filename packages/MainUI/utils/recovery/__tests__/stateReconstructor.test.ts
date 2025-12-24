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
 * @fileoverview Unit tests for state reconstructor utilities
 *
 * Tests the state reconstruction implementation:
 * - reconstructState function for building window state from hierarchy
 * - Bottom-up iteration from target to root
 * - Parent record ID calculation via datasource queries
 * - Tab state creation with form/table modes
 * - Navigation state configuration
 * - Error handling for missing data and failed queries
 */

import { reconstructState } from "../stateReconstructor";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import * as windowUtils from "@/utils/window/utils";
import { TAB_MODES, FORM_MODES } from "@/utils/url/constants";
import type { CalculatedHierarchy, TabHierarchyNode } from "../hierarchyCalculator";
import type { WindowMetadata, Tab, EntityData } from "@workspaceui/api-client/src/api/types";
import type { TabState } from "@/utils/window/constants";

// Mock dependencies
jest.mock("@workspaceui/api-client/src/api/datasource");
jest.mock("@/utils/window/utils");

const mockDatasource = datasource as jest.Mocked<typeof datasource>;
const mockWindowUtils = windowUtils as jest.Mocked<typeof windowUtils>;

// Mock data helpers
const createMockTab = (
  id: string,
  level: number,
  entityName: string,
  hasParentField = false,
  parentTabId?: string
): Tab => ({
  id,
  name: `Tab ${id}`,
  title: `Tab ${id}`,
  window: "TestWindow",
  tabLevel: level,
  parentTabId,
  uIPattern: "STD",
  table: `test_table_${id}`,
  entityName,
  fields: hasParentField
    ? {
        parentField: {
          id: "parentField",
          name: "Parent Field",
          columnName: "parentField",
          property: "parentField",
          isParentRecordProperty: true,
          referencedTabId: parentTabId,
          entity: "ParentEntity",
          propertyPath: "parentField",
        } as any,
        otherField: {
          id: "otherField",
          name: "Other Field",
          columnName: "otherField",
          property: "otherField",
          isParentRecordProperty: false,
          entity: "TestEntity",
          propertyPath: "otherField",
        } as any,
      }
    : {
        normalField: {
          id: "normalField",
          name: "Normal Field",
          columnName: "normalField",
          property: "normalField",
          isParentRecordProperty: false,
          entity: "TestEntity",
          propertyPath: "normalField",
        } as any,
      },
  parentColumns: [],
  _identifier: "test_identifier",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "test_module",
});

const createMockTabNode = (
  tabId: string,
  tab: Tab,
  level: number,
  options: {
    recordId?: string;
    parentKeyField?: string;
    children?: TabHierarchyNode[];
  } = {}
): TabHierarchyNode => ({
  tabId,
  tab,
  level,
  recordId: options.recordId,
  parentKeyField: options.parentKeyField,
  children: options.children || [],
});

const createMockHierarchy = (
  targetNode: TabHierarchyNode,
  parentNodes: TabHierarchyNode[] = []
): CalculatedHierarchy => ({
  targetTab: targetNode,
  parentTabs: parentNodes,
  rootTab: parentNodes[0] || targetNode,
});

const mockDatasourceSuccess = (data: EntityData[]) => {
  mockDatasource.get.mockResolvedValue({
    ok: true,
    data: {
      response: {
        data,
      },
    },
  } as any);
};

const createConsoleErrorSpy = () => {
  return jest.spyOn(console, "error").mockImplementation(() => {});
};

const createMockWindowMetadata = (tabs: Tab[]): WindowMetadata => ({
  id: "143",
  name: "Test Window",
  tabs,
  properties: {
    windowId: "143",
    multiDocumentEnabled: false,
    viewProperties: {
      fields: [],
      tabTitle: "Test Tab",
      entity: "TestEntity",
      statusBarFields: [],
      iconToolbarButtons: [],
      actionToolbarButtons: [],
      isDeleteableTable: true,
      tabId: "tab1",
      moduleId: "test_module",
      showCloneButton: false,
      askToCloneChildren: false,
      standardProperties: {} as any,
      showParentButtons: false,
      buttonsHaveSessionLogic: false,
      initialPropertyToColumns: [],
    },
  },
  window$_identifier: "window_identifier",
});

const createMockTabState = (level: number): TabState => ({
  selectedRecord: undefined,
  form: {},
  table: {
    columnFilters: {},
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    globalFilter: "",
    isImplicitFilterApplied: false,
  },
  navigation: {
    parentRecordId: undefined,
    childSelections: {},
  },
});

/**
 * Test setup helpers
 */
interface TwoLevelHierarchySetup {
  rootTab: Tab;
  childTab: Tab;
  rootNode: TabHierarchyNode;
  childNode: TabHierarchyNode;
  hierarchy: CalculatedHierarchy;
  windowMetadata: WindowMetadata;
}

const setupTwoLevelHierarchy = (
  rootId = "tab1",
  childId = "tab2",
  childRecordId = "child123"
): TwoLevelHierarchySetup => {
  const rootTab = createMockTab(rootId, 0, "ParentEntity", false);
  const childTab = createMockTab(childId, 1, "ChildEntity", true, rootId);

  const childNode = createMockTabNode(childId, childTab, 1, {
    recordId: childRecordId,
    parentKeyField: "parentField",
  });
  const rootNode = createMockTabNode(rootId, rootTab, 0, {
    parentKeyField: "parentField",
    children: [childNode],
  });

  const hierarchy = createMockHierarchy(childNode, [rootNode]);
  const windowMetadata = createMockWindowMetadata([rootTab, childTab]);

  return { rootTab, childTab, rootNode, childNode, hierarchy, windowMetadata };
};

interface ThreeLevelHierarchySetup {
  rootTab: Tab;
  middleTab: Tab;
  leafTab: Tab;
  rootNode: TabHierarchyNode;
  middleNode: TabHierarchyNode;
  leafNode: TabHierarchyNode;
  hierarchy: CalculatedHierarchy;
  windowMetadata: WindowMetadata;
}

const setupThreeLevelHierarchy = (
  rootId = "tab1",
  middleId = "tab2",
  leafId = "tab3",
  leafRecordId = "leaf789"
): ThreeLevelHierarchySetup => {
  const rootTab = createMockTab(rootId, 0, "RootEntity", false);
  const middleTab = createMockTab(middleId, 1, "MiddleEntity", true, rootId);
  const leafTab = createMockTab(leafId, 2, "LeafEntity", true, middleId);

  const leafNode = createMockTabNode(leafId, leafTab, 2, { recordId: leafRecordId });
  const middleNode = createMockTabNode(middleId, middleTab, 1, {
    parentKeyField: "parentField",
    children: [leafNode],
  });
  const rootNode = createMockTabNode(rootId, rootTab, 0, {
    parentKeyField: "parentField",
    children: [middleNode],
  });

  const hierarchy = createMockHierarchy(leafNode, [rootNode, middleNode]);
  const windowMetadata = createMockWindowMetadata([rootTab, middleTab, leafTab]);

  return { rootTab, middleTab, leafTab, rootNode, middleNode, leafNode, hierarchy, windowMetadata };
};

/**
 * Assertion helpers
 */
const expectTabState = (
  result: any,
  tabId: string,
  expectations: {
    selectedRecord?: string;
    formRecordId?: string;
    formMode?: string;
    formEmpty?: boolean;
  }
) => {
  expect(result.tabs[tabId]).toBeDefined();
  if (expectations.selectedRecord !== undefined) {
    expect(result.tabs[tabId].selectedRecord).toBe(expectations.selectedRecord);
  }
  if (expectations.formRecordId !== undefined) {
    expect(result.tabs[tabId].form.recordId).toBe(expectations.formRecordId);
  }
  if (expectations.formMode !== undefined) {
    expect(result.tabs[tabId].form.mode).toBe(expectations.formMode);
  }
  if (expectations.formEmpty) {
    expect(result.tabs[tabId].form).toEqual({});
  }
};

const expectNavigationState = (
  result: any,
  expectations: {
    activeLevels: number[];
    activeTabsByLevel: Map<number, string>;
    initialized?: boolean;
  }
) => {
  expect(result.navigation.activeLevels).toEqual(expectations.activeLevels);
  expectations.activeTabsByLevel.forEach((tabId, level) => {
    expect(result.navigation.activeTabsByLevel.get(level)).toBe(tabId);
  });
  if (expectations.initialized !== undefined) {
    expect(result.navigation.initialized).toBe(expectations.initialized);
  }
};

describe("reconstructState", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getNewTabFormState
    mockWindowUtils.getNewTabFormState.mockImplementation((recordId, tabMode, formMode) => ({
      recordId,
      mode: formMode,
      isLoading: false,
    }));

    // Mock createDefaultTabState
    mockWindowUtils.createDefaultTabState.mockImplementation((level) => createMockTabState(level));
  });

  describe("Single tab (target is root)", () => {
    it("should reconstruct state for single root tab", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity", false);
      const targetNode = createMockTabNode("tab1", rootTab, 0, { recordId: "root123" });
      const hierarchy = createMockHierarchy(targetNode);
      const windowMetadata = createMockWindowMetadata([rootTab]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.tabs["tab1"]).toBeDefined();
      expect(result.tabs["tab1"].selectedRecord).toBe("root123");
      expect(result.tabs["tab1"].form).toEqual({
        recordId: "root123",
        mode: FORM_MODES.EDIT,
        isLoading: false,
      });
      expect(result.tabs["tab1"].table.isImplicitFilterApplied).toBe(false);

      expect(result.navigation.activeLevels).toEqual([0]);
      expect(result.navigation.activeTabsByLevel.get(0)).toBe("tab1");
      expect(result.navigation.initialized).toBe(true);

      expect(mockWindowUtils.getNewTabFormState).toHaveBeenCalledWith("root123", TAB_MODES.FORM, FORM_MODES.EDIT);
    });

    it("should throw error when target recordId is missing", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity", false);
      const targetNode = createMockTabNode("tab1", rootTab, 0, { recordId: undefined });
      const hierarchy = createMockHierarchy(targetNode);
      const windowMetadata = createMockWindowMetadata([rootTab]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Target tab tab1 is missing recordId");
    });
  });

  describe("Two-level hierarchy", () => {
    it("should reconstruct state with parent-child relationship", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", parentField: "parent456", otherField: "value" } as EntityData]);

      const result = await reconstructState(hierarchy, windowMetadata);

      // Check child tab (target)
      expect(result.tabs["tab2"].selectedRecord).toBe("child123");
      expect(result.tabs["tab2"].form.recordId).toBe("child123");
      expect(result.tabs["tab2"].form.mode).toBe(FORM_MODES.EDIT);

      // Check parent tab
      expect(result.tabs["tab1"].selectedRecord).toBe("parent456");
      expect(result.tabs["tab1"].form).toEqual({});

      // Check navigation
      expect(result.navigation.activeLevels).toEqual([1]);
      expect(result.navigation.activeTabsByLevel.get(0)).toBe("tab1");
      expect(result.navigation.activeTabsByLevel.get(1)).toBe("tab2");

      // Verify datasource call
      expect(mockDatasource.get).toHaveBeenCalledWith("ChildEntity", {
        targetRecordId: "child123",
        filterByParentProperty: "parentField",
        windowId: "143",
        tabId: "tab2",
        isImplicitFilterApplied: "true",
        criteria: [],
        pageSize: "100",
        noActiveFilter: "true",
        startRow: "0",
        endRow: "99",
      });
    });

    it("should throw error when parent key field is missing", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity", false);
      const childTab = createMockTab("tab2", 1, "ChildEntity", true, "tab1");

      const childNode = createMockTabNode("tab2", childTab, 1, {
        recordId: "child123",
        parentKeyField: "parentField",
      });
      const rootNode = createMockTabNode("tab1", rootTab, 0, { children: [childNode] });

      const hierarchy = createMockHierarchy(childNode, [rootNode]);
      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow(
        "Parent key field missing for tab tab1"
      );
    });

    it("should throw error when datasource query fails", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasource.get.mockResolvedValue({ ok: false, data: null } as any);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Failed to fetch child record data");
    });

    it("should throw error when datasource returns no data", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Failed to fetch child record data");
    });

    it("should throw error when parent record ID field is missing in child data", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", otherField: "value" } as EntityData]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow(
        'Parent record ID not found in field "parentField"'
      );
    });
  });

  describe("Three-level hierarchy", () => {
    it("should reconstruct state with multiple parent levels", async () => {
      const { hierarchy, windowMetadata } = setupThreeLevelHierarchy();

      mockDatasource.get
        .mockResolvedValueOnce({
          ok: true,
          data: { response: { data: [{ id: "leaf789", parentField: "middle456" } as EntityData] } },
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          data: { response: { data: [{ id: "middle456", parentField: "root123" } as EntityData] } },
        } as any);

      const result = await reconstructState(hierarchy, windowMetadata);

      // Check all three tabs
      expect(result.tabs["tab3"].selectedRecord).toBe("leaf789");
      expect(result.tabs["tab3"].form.recordId).toBe("leaf789");

      expect(result.tabs["tab2"].selectedRecord).toBe("middle456");
      expect(result.tabs["tab2"].form).toEqual({});

      expect(result.tabs["tab1"].selectedRecord).toBe("root123");
      expect(result.tabs["tab1"].form).toEqual({});

      // Check navigation
      expect(result.navigation.activeLevels).toEqual([2]);
      expect(result.navigation.activeTabsByLevel.get(0)).toBe("tab1");
      expect(result.navigation.activeTabsByLevel.get(1)).toBe("tab2");
      expect(result.navigation.activeTabsByLevel.get(2)).toBe("tab3");

      // Verify datasource was called twice
      expect(mockDatasource.get).toHaveBeenCalledTimes(2);
    });

    it("should handle datasource error in middle of hierarchy", async () => {
      const consoleErrorSpy = createConsoleErrorSpy();

      const { hierarchy, windowMetadata } = setupThreeLevelHierarchy();

      mockDatasource.get
        .mockResolvedValueOnce({
          ok: true,
          data: { response: { data: [{ id: "leaf789", parentField: "middle456" } as EntityData] } },
        } as any)
        .mockResolvedValueOnce({ ok: false, data: null } as any);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Failed to calculate parent record");

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge cases", () => {
    it("should handle tab node without children when calculating parent", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity", false);
      const childTab = createMockTab("tab2", 1, "ChildEntity", true, "tab1");

      const rootNode = createMockTabNode("tab1", rootTab, 0, { parentKeyField: "parentField" });
      const childNode = createMockTabNode("tab2", childTab, 1, {
        recordId: "child123",
        parentKeyField: "parentField",
      });

      const hierarchy = createMockHierarchy(childNode, [rootNode]);
      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow(
        "Cannot calculate parent recordId for tab tab1"
      );
    });

    it("should handle child tab without parent key field", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity", false);
      const childTab = createMockTab("tab2", 1, "ChildEntity", false);

      const childNode = createMockTabNode("tab2", childTab, 1, {
        recordId: "child123",
        parentKeyField: "parentField",
      });
      const rootNode = createMockTabNode("tab1", rootTab, 0, {
        parentKeyField: "parentField",
        children: [childNode],
      });

      const hierarchy = createMockHierarchy(childNode, [rootNode]);
      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow(
        "Parent key field not found in child tab"
      );
    });

    it("should handle datasource network error", async () => {
      const consoleErrorSpy = createConsoleErrorSpy();

      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasource.get.mockRejectedValue(new Error("Network error"));

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Network error");

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle non-Error thrown values", async () => {
      const consoleErrorSpy = createConsoleErrorSpy();

      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasource.get.mockRejectedValue("String error");

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Unknown error");

      consoleErrorSpy.mockRestore();
    });

    it("should create tab states with implicit filter applied", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity", false);
      const targetNode = createMockTabNode("tab1", rootTab, 0, { recordId: "root123" });
      const hierarchy = createMockHierarchy(targetNode);
      const windowMetadata = createMockWindowMetadata([rootTab]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.tabs["tab1"].table.isImplicitFilterApplied).toBe(false);
    });

    it("should handle empty string recordId", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity", false);
      const targetNode = createMockTabNode("tab1", rootTab, 0, { recordId: "" });
      const hierarchy = createMockHierarchy(targetNode);
      const windowMetadata = createMockWindowMetadata([rootTab]);

      await expect(reconstructState(hierarchy, windowMetadata)).rejects.toThrow("Target tab tab1 is missing recordId");
    });

    it("should convert parent recordId to string", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", parentField: 12345 } as any]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.tabs["tab1"].selectedRecord).toBe("12345");
      expect(typeof result.tabs["tab1"].selectedRecord).toBe("string");
    });
  });

  describe("Navigation state", () => {
    it("should set correct activeLevels for target tab", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", parentField: "parent456" } as EntityData]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.navigation.activeLevels).toEqual([1]);
    });

    it("should populate activeTabsByLevel map correctly", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", parentField: "parent456" } as EntityData]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.navigation.activeTabsByLevel.size).toBe(2);
      expect(result.navigation.activeTabsByLevel.get(0)).toBe("tab1");
      expect(result.navigation.activeTabsByLevel.get(1)).toBe("tab2");
    });

    it("should mark navigation as initialized", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity", false);
      const targetNode = createMockTabNode("tab1", rootTab, 0, { recordId: "root123" });
      const hierarchy = createMockHierarchy(targetNode);
      const windowMetadata = createMockWindowMetadata([rootTab]);

      const result = await reconstructState(hierarchy, windowMetadata);

      expect(result.navigation.initialized).toBe(true);
    });
  });

  describe("Datasource query parameters", () => {
    it("should pass correct parameters to datasource.get", async () => {
      const { hierarchy, windowMetadata } = setupTwoLevelHierarchy();

      mockDatasourceSuccess([{ id: "child123", parentField: "parent456" } as EntityData]);

      await reconstructState(hierarchy, windowMetadata);

      expect(mockDatasource.get).toHaveBeenCalledWith("ChildEntity", {
        targetRecordId: "child123",
        filterByParentProperty: "parentField",
        windowId: "143",
        tabId: "tab2",
        isImplicitFilterApplied: "true",
        criteria: [],
        pageSize: "100",
        noActiveFilter: "true",
        startRow: "0",
        endRow: "99",
      });
    });
  });
});
