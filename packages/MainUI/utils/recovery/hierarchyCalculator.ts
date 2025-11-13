import type { ParsedUrlState } from "./urlStateParser";
import type { WindowMetadata, Tab } from "@workspaceui/api-client/src/api/types";

export interface TabHierarchyNode {
  tabId: string;
  tab: Tab;
  level: number;
  parentKeyField?: string;
  children: TabHierarchyNode[];
}

export interface CalculatedHierarchy {
  targetTab: TabHierarchyNode;
  parentTabs: TabHierarchyNode[];
  rootTab: TabHierarchyNode;
}

/**
 * Calculates the complete tab hierarchy from the deepest tab upward
 */
export const calculateHierarchy = async (
  urlState: ParsedUrlState,
  windowMetadata: WindowMetadata
): Promise<CalculatedHierarchy> => {

  // Find the target tab (deepest tab from URL)
  const targetTab = windowMetadata.tabs.find((tab) => tab.id === urlState.tabId);
  if (!targetTab) {
    throw new Error(`Target tab ${urlState.tabId} not found in window metadata`);
  }

  const targetNode: TabHierarchyNode = {
    tabId: targetTab.id,
    tab: targetTab,
    level: targetTab.tabLevel,
    children: []
  };

  // If target tab is at level 0, no parents to calculate
  if (targetTab.tabLevel === 0) {
    return {
      targetTab: targetNode,
      parentTabs: [],
      rootTab: targetNode
    };
  }

  // Calculate parent tabs recursively
  const parentTabs: TabHierarchyNode[] = [];
  let currentLevel = targetTab.tabLevel - 1;
  let childTab = targetTab;

  while (currentLevel >= 0) {
    // Find parent key field in child tab (fields is a Record, not an array)
    const fieldValues = Object.values(childTab.fields || {});
    const parentKeyField = fieldValues.find((field) => field.isParentRecordProperty);
    if (!parentKeyField) {
      throw new Error(`Parent key field not found in tab ${childTab.id} at level ${childTab.tabLevel}`);
    }

    // Find parent tab using referencedTabId
    const parentTab = windowMetadata.tabs.find((tab) => tab.id === parentKeyField.referencedTabId);
    if (!parentTab) {
      throw new Error(`Parent tab ${parentKeyField.referencedTabId} not found in window metadata`);
    }

    const parentNode: TabHierarchyNode = {
      tabId: parentTab.id,
      tab: parentTab,
      level: parentTab.tabLevel,
      parentKeyField: parentKeyField.name,
      children: []
    };

    parentTabs.unshift(parentNode); // Add to beginning to maintain order
    childTab = parentTab;
    currentLevel--;
  }

  // Link parent-child relationships
  for (let i = 0; i < parentTabs.length - 1; i++) {
    parentTabs[i].children.push(parentTabs[i + 1]);
  }

  if (parentTabs.length > 0) {
    parentTabs[parentTabs.length - 1].children.push(targetNode);
  }

  return {
    targetTab: targetNode,
    parentTabs,
    rootTab: parentTabs[0] || targetNode
  };
};