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
 * @fileoverview Unit tests for hierarchy calculator utilities
 *
 * Tests the hierarchy calculation implementation:
 * - calculateHierarchy function for building tab hierarchy trees
 * - Target tab identification from URL state
 * - Parent-child relationship construction
 * - Recursive parent tab traversal
 * - Parent key field extraction and storage
 * - Error handling for missing tabs and invalid metadata
 */

import { calculateHierarchy } from "../hierarchyCalculator";
import type { ParsedUrlState } from "../urlStateParser";
import type { WindowMetadata, Tab } from "@workspaceui/api-client/src/api/types";

// Mock data helpers
const createMockTab = (
  id: string,
  level: number,
  entityName: string,
  parentFieldConfig?: { fieldKey: string; referencedTabId: string }
): Tab => {
  const fields: any = {
    normalField: {
      id: "normalField",
      name: "Normal Field",
      columnName: "normalField",
      property: "normalField",
      isParentRecordProperty: false,
      entity: entityName,
      propertyPath: "normalField",
    },
  };

  if (parentFieldConfig) {
    fields[parentFieldConfig.fieldKey] = {
      id: parentFieldConfig.fieldKey,
      name: "Parent Field",
      columnName: parentFieldConfig.fieldKey,
      property: parentFieldConfig.fieldKey,
      isParentRecordProperty: true,
      referencedTabId: parentFieldConfig.referencedTabId,
      entity: "ParentEntity",
      propertyPath: parentFieldConfig.fieldKey,
    };
  }

  return {
    id,
    name: `Tab ${id}`,
    title: `Tab ${id}`,
    window: "TestWindow",
    tabLevel: level,
    parentTabId: parentFieldConfig?.referencedTabId,
    uIPattern: "STD",
    table: `test_table_${id}`,
    entityName,
    fields,
    parentColumns: [],
    _identifier: "test_identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test_module",
  };
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

const createParsedUrlState = (
  windowIdentifier: string,
  tabId: string,
  recordId: string,
  windowId = "143",
  tabLevel = 0
): ParsedUrlState => ({
  windowIdentifier,
  tabId,
  recordId,
  windowId,
  tabTitle: "Test Tab",
  tabLevel,
  keyParameter: "testKey",
});

// Test execution helpers
const expectHierarchyError = async (
  urlState: ParsedUrlState,
  windowMetadata: WindowMetadata,
  expectedErrorMessage: string
) => {
  await expect(calculateHierarchy(urlState, windowMetadata)).rejects.toThrow(expectedErrorMessage);
};

const expectTargetTab = (result: any, expectedTabId: string, expectedLevel: number, expectedRecordId: string) => {
  expect(result.targetTab.tabId).toBe(expectedTabId);
  expect(result.targetTab.level).toBe(expectedLevel);
  expect(result.targetTab.recordId).toBe(expectedRecordId);
};

const expectParentTab = (
  parentTab: any,
  expectedTabId: string,
  expectedLevel: number,
  expectedParentKeyField?: string
) => {
  expect(parentTab.tabId).toBe(expectedTabId);
  expect(parentTab.level).toBe(expectedLevel);
  if (expectedParentKeyField !== undefined) {
    expect(parentTab.parentKeyField).toBe(expectedParentKeyField);
  }
};

const expectParentChildLink = (parent: any, child: any) => {
  expect(parent.children).toHaveLength(1);
  expect(parent.children[0]).toBe(child);
};

const testInvalidFieldsScenario = async (
  fieldsValue: any,
  expectedError = "Parent key field not found in tab tab2"
) => {
  const rootTab = createMockTab("tab1", 0, "RootEntity");
  const childTab = createMockTab("tab2", 1, "ChildEntity");
  childTab.fields = fieldsValue;

  const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
  const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

  await expectHierarchyError(urlState, windowMetadata, expectedError);
};

const expectErrorMessageContains = async (
  windowMetadata: WindowMetadata,
  urlState: ParsedUrlState,
  ...expectedSubstrings: string[]
) => {
  try {
    await calculateHierarchy(urlState, windowMetadata);
    fail("Should have thrown error");
  } catch (error: any) {
    expectedSubstrings.forEach((substring) => {
      expect(error.message).toContain(substring);
    });
  }
};

describe("calculateHierarchy", () => {
  describe("Single level (root tab)", () => {
    it("should calculate hierarchy for root tab at level 0", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const windowMetadata = createMockWindowMetadata([rootTab]);
      const urlState = createParsedUrlState("143_123", "tab1", "record123", "143", 0);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "tab1", 0, "record123");
      expect(result.targetTab.children).toEqual([]);
      expect(result.targetTab.parentKeyField).toBeUndefined();
      expect(result.parentTabs).toEqual([]);
      expect(result.rootTab).toBe(result.targetTab);
    });

    it("should throw error when target tab is not found", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const windowMetadata = createMockWindowMetadata([rootTab]);
      const urlState = createParsedUrlState("143_123", "nonexistent", "record123");

      await expectHierarchyError(urlState, windowMetadata, "Target tab nonexistent not found in window metadata");
    });

    it("should handle root tab with multiple fields", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      rootTab.fields = {
        field1: {
          id: "field1",
          name: "Field 1",
          isParentRecordProperty: false,
        } as any,
        field2: {
          id: "field2",
          name: "Field 2",
          isParentRecordProperty: false,
        } as any,
        field3: {
          id: "field3",
          name: "Field 3",
          isParentRecordProperty: false,
        } as any,
      };

      const windowMetadata = createMockWindowMetadata([rootTab]);
      const urlState = createParsedUrlState("143_123", "tab1", "record123", "143", 0);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "tab1", 0, "record123");
      expect(result.parentTabs).toEqual([]);
    });
  });

  describe("Two-level hierarchy", () => {
    it("should calculate hierarchy for child tab at level 1", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "parentFieldKey",
        referencedTabId: "tab1",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "tab2", 1, "childRecord123");
      expect(result.targetTab.tab.entityName).toBe("ChildEntity");

      expect(result.parentTabs).toHaveLength(1);
      expectParentTab(result.parentTabs[0], "tab1", 0, "parentFieldKey");
      expect(result.parentTabs[0].recordId).toBeUndefined();

      expect(result.rootTab).toBe(result.parentTabs[0]);
      expectParentChildLink(result.parentTabs[0], result.targetTab);
    });

    it("should throw error when parent key field is missing", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity"); // No parent field

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      await expect(calculateHierarchy(urlState, windowMetadata)).rejects.toThrow(
        "Parent key field not found in tab tab2"
      );
    });

    it("should throw error when parent tab is not found via referencedTabId", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "parentFieldKey",
        referencedTabId: "nonexistentTab",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      await expectHierarchyError(
        urlState,
        windowMetadata,
        'Parent tab nonexistentTab not found in window metadata for field "parentFieldKey"'
      );
    });

    it("should extract correct parent key field name", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "customParentField",
        referencedTabId: "tab1",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.parentTabs[0].parentKeyField).toBe("customParentField");
    });

    it("should handle child tab with multiple fields including parent field", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "parentFieldKey",
        referencedTabId: "tab1",
      });

      childTab.fields = {
        normalField1: {
          id: "normalField1",
          isParentRecordProperty: false,
        } as any,
        parentFieldKey: {
          id: "parentFieldKey",
          isParentRecordProperty: true,
          referencedTabId: "tab1",
        } as any,
        normalField2: {
          id: "normalField2",
          isParentRecordProperty: false,
        } as any,
      };

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.parentTabs[0].parentKeyField).toBe("parentFieldKey");
    });
  });

  describe("Three-level hierarchy", () => {
    it("should calculate hierarchy for deep tab at level 2", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const middleTab = createMockTab("tab2", 1, "MiddleEntity", {
        fieldKey: "rootParentField",
        referencedTabId: "tab1",
      });
      const leafTab = createMockTab("tab3", 2, "LeafEntity", {
        fieldKey: "middleParentField",
        referencedTabId: "tab2",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, middleTab, leafTab]);
      const urlState = createParsedUrlState("143_123", "tab3", "leafRecord123", "143", 2);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "tab3", 2, "leafRecord123");

      expect(result.parentTabs).toHaveLength(2);
      expectParentTab(result.parentTabs[0], "tab1", 0, "rootParentField");
      expectParentTab(result.parentTabs[1], "tab2", 1, "middleParentField");

      expect(result.rootTab).toBe(result.parentTabs[0]);

      expectParentChildLink(result.parentTabs[0], result.parentTabs[1]);
      expectParentChildLink(result.parentTabs[1], result.targetTab);
      expect(result.targetTab.children).toHaveLength(0);
    });

    it("should throw error when middle tab parent field is missing", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const middleTab = createMockTab("tab2", 1, "MiddleEntity"); // Missing parent field
      const leafTab = createMockTab("tab3", 2, "LeafEntity", {
        fieldKey: "middleParentField",
        referencedTabId: "tab2",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, middleTab, leafTab]);
      const urlState = createParsedUrlState("143_123", "tab3", "leafRecord123", "143", 2);

      await expectHierarchyError(urlState, windowMetadata, "Parent key field not found in tab tab2");
    });

    it("should handle hierarchy with different parent field names at each level", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const middleTab = createMockTab("tab2", 1, "MiddleEntity", {
        fieldKey: "cRootId",
        referencedTabId: "tab1",
      });
      const leafTab = createMockTab("tab3", 2, "LeafEntity", {
        fieldKey: "cMiddleId",
        referencedTabId: "tab2",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, middleTab, leafTab]);
      const urlState = createParsedUrlState("143_123", "tab3", "leafRecord123", "143", 2);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.parentTabs[0].parentKeyField).toBe("cRootId");
      expect(result.parentTabs[1].parentKeyField).toBe("cMiddleId");
    });
  });

  describe("Four-level hierarchy", () => {
    it("should calculate hierarchy for very deep tab at level 3", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const level1Tab = createMockTab("tab2", 1, "Level1Entity", {
        fieldKey: "rootField",
        referencedTabId: "tab1",
      });
      const level2Tab = createMockTab("tab3", 2, "Level2Entity", {
        fieldKey: "level1Field",
        referencedTabId: "tab2",
      });
      const level3Tab = createMockTab("tab4", 3, "Level3Entity", {
        fieldKey: "level2Field",
        referencedTabId: "tab3",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, level1Tab, level2Tab, level3Tab]);
      const urlState = createParsedUrlState("143_123", "tab4", "deepRecord123", "143", 3);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "tab4", 3, "deepRecord123");

      expect(result.parentTabs).toHaveLength(3);
      expect(result.parentTabs[0].tabId).toBe("tab1");
      expect(result.parentTabs[1].tabId).toBe("tab2");
      expect(result.parentTabs[2].tabId).toBe("tab3");
      expect(result.rootTab.tabId).toBe("tab1");

      expect(result.parentTabs[0].children[0].tabId).toBe("tab2");
      expect(result.parentTabs[1].children[0].tabId).toBe("tab3");
      expect(result.parentTabs[2].children[0].tabId).toBe("tab4");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty fields object", async () => {
      await testInvalidFieldsScenario({});
    });

    it("should handle null fields object", async () => {
      await testInvalidFieldsScenario(null as any);
    });

    it("should handle undefined fields object", async () => {
      await testInvalidFieldsScenario(undefined as any);
    });

    it("should preserve tab metadata properties", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "parentFieldKey",
        referencedTabId: "tab1",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.targetTab.tab).toBe(childTab);
      expect(result.targetTab.tab.name).toBe("Tab tab2");
      expect(result.targetTab.tab.entityName).toBe("ChildEntity");

      expect(result.parentTabs[0].tab).toBe(rootTab);
      expect(result.parentTabs[0].tab.name).toBe("Tab tab1");
      expect(result.parentTabs[0].tab.entityName).toBe("ParentEntity");
    });

    it("should handle recordId with special characters", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const windowMetadata = createMockWindowMetadata([rootTab]);
      const urlState = createParsedUrlState("143_123", "tab1", "record-123-ABC_456", "143", 0);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.targetTab.recordId).toBe("record-123-ABC_456");
    });

    it("should handle very long recordId", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const windowMetadata = createMockWindowMetadata([rootTab]);
      const longRecordId = "A".repeat(1000);
      const urlState = createParsedUrlState("143_123", "tab1", longRecordId, "143", 0);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.targetTab.recordId).toBe(longRecordId);
      expect(result.targetTab.recordId?.length).toBe(1000);
    });

    it("should handle tabs array with many tabs", async () => {
      const tabs: Tab[] = [];
      for (let i = 0; i < 50; i++) {
        tabs.push(createMockTab(`tab${i}`, 0, `Entity${i}`));
      }

      const targetTab = createMockTab("targetTab", 0, "TargetEntity");
      tabs.push(targetTab);

      const windowMetadata = createMockWindowMetadata(tabs);
      const urlState = createParsedUrlState("143_123", "targetTab", "record123", "143", 0);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expectTargetTab(result, "targetTab", 0, "record123");
    });

    it("should maintain parent-child references correctly", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const middleTab = createMockTab("tab2", 1, "MiddleEntity", {
        fieldKey: "rootField",
        referencedTabId: "tab1",
      });
      const leafTab = createMockTab("tab3", 2, "LeafEntity", {
        fieldKey: "middleField",
        referencedTabId: "tab2",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, middleTab, leafTab]);
      const urlState = createParsedUrlState("143_123", "tab3", "leafRecord123", "143", 2);

      const result = await calculateHierarchy(urlState, windowMetadata);

      // Verify bidirectional references are correct
      const root = result.parentTabs[0];
      const middle = result.parentTabs[1];
      const leaf = result.targetTab;

      expectParentChildLink(root, middle);
      expectParentChildLink(middle, leaf);
      expect(leaf.children).toEqual([]);
    });

    it("should handle tab with multiple parent fields (should find first)", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity");

      childTab.fields = {
        normalField: {
          id: "normalField",
          isParentRecordProperty: false,
        } as any,
        firstParentField: {
          id: "firstParentField",
          isParentRecordProperty: true,
          referencedTabId: "tab1",
        } as any,
        secondParentField: {
          id: "secondParentField",
          isParentRecordProperty: true,
          referencedTabId: "tab1",
        } as any,
      };

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      const result = await calculateHierarchy(urlState, windowMetadata);

      // Should use the first parent field found
      expect(result.parentTabs[0].parentKeyField).toBeTruthy();
      expect(["firstParentField", "secondParentField"]).toContain(result.parentTabs[0].parentKeyField);
    });
  });

  describe("Error messages", () => {
    it("should include available fields in error message when parent field not found", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity");
      childTab.fields = {
        field1: { id: "field1", isParentRecordProperty: false } as any,
        field2: { id: "field2", isParentRecordProperty: false } as any,
        field3: { id: "field3", isParentRecordProperty: false } as any,
      };

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      await expectErrorMessageContains(windowMetadata, urlState, "Available fields:", "field1", "field2", "field3");
    });

    it("should include tab name and level in error message", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity");
      childTab.name = "Custom Child Tab Name";
      childTab.fields = {};

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      await expectErrorMessageContains(windowMetadata, urlState, "Custom Child Tab Name", "at level 1");
    });

    it("should include field name in parent tab not found error", async () => {
      const rootTab = createMockTab("tab1", 0, "ParentEntity");
      const childTab = createMockTab("tab2", 1, "ChildEntity", {
        fieldKey: "customParentField",
        referencedTabId: "nonexistentTab",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, childTab]);
      const urlState = createParsedUrlState("143_123", "tab2", "childRecord123", "143", 1);

      await expectErrorMessageContains(windowMetadata, urlState, 'field "customParentField"', "Tab tab2");
    });
  });

  describe("Tab ordering", () => {
    it("should order parent tabs from root to deepest", async () => {
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const level1Tab = createMockTab("tab2", 1, "Level1Entity", {
        fieldKey: "rootField",
        referencedTabId: "tab1",
      });
      const level2Tab = createMockTab("tab3", 2, "Level2Entity", {
        fieldKey: "level1Field",
        referencedTabId: "tab2",
      });

      const windowMetadata = createMockWindowMetadata([rootTab, level1Tab, level2Tab]);
      const urlState = createParsedUrlState("143_123", "tab3", "record123", "143", 2);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.parentTabs[0].level).toBeLessThan(result.parentTabs[1].level);
      expect(result.parentTabs[0].tabId).toBe("tab1");
      expect(result.parentTabs[1].tabId).toBe("tab2");
    });

    it("should maintain correct order with tabs added in random order", async () => {
      const level2Tab = createMockTab("tab3", 2, "Level2Entity", {
        fieldKey: "level1Field",
        referencedTabId: "tab2",
      });
      const rootTab = createMockTab("tab1", 0, "RootEntity");
      const level1Tab = createMockTab("tab2", 1, "Level1Entity", {
        fieldKey: "rootField",
        referencedTabId: "tab1",
      });

      // Add in non-sequential order
      const windowMetadata = createMockWindowMetadata([level2Tab, rootTab, level1Tab]);
      const urlState = createParsedUrlState("143_123", "tab3", "record123", "143", 2);

      const result = await calculateHierarchy(urlState, windowMetadata);

      expect(result.parentTabs).toHaveLength(2);
      expect(result.parentTabs[0].level).toBe(0);
      expect(result.parentTabs[1].level).toBe(1);
    });
  });
});
