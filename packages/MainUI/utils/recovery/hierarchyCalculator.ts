import type { ParsedUrlState } from "./urlStateParser";
import type { WindowMetadata, Tab } from "@workspaceui/api-client/src/api/types";

/**
 * Represents a node in the tab hierarchy tree.
 * Used during URL state recovery to reconstruct parent-child relationships.
 */
export interface TabHierarchyNode {
  tabId: string;
  tab: Tab;
  level: number;
  /** Record ID for this tab (only populated for target tab initially) */
  recordId?: string;
  /** The KEY from the child tab's fields object that links to parent record (e.g., "cBpartnerId") */
  parentKeyField?: string;
  children: TabHierarchyNode[];
}

export interface CalculatedHierarchy {
  targetTab: TabHierarchyNode;
  parentTabs: TabHierarchyNode[];
  rootTab: TabHierarchyNode;
}

/**
 * Calculates the complete tab hierarchy from the target tab upward to the root.
 *
 * **Purpose:**
 * Builds a tree structure representing the parent-child relationships between tabs,
 * starting from the deepest tab (target) and walking up to the root tab.
 *
 * **Algorithm:**
 * 1. Finds the target tab in window metadata using tabId from URL
 * 2. Creates target node with recordId from URL state
 * 3. If target is root (level 0), returns immediately
 * 4. Otherwise, walks upward through parent tabs:
 *    - Finds parent key field in child tab (field with isParentRecordProperty: true)
 *    - Gets the FIELD KEY (not field value) to use for data access later
 *    - Finds parent tab using parentTabId
 *    - Creates parent node with the field key stored
 * 5. Links all nodes in parent-child relationships
 *
 * **Important:**
 * - Only the target node has recordId set (from URL)
 * - Parent recordIds are calculated later in reconstructState (bottom-up)
 * - parentKeyField stores the KEY from fields object, not a field property value
 *
 * @param urlState - Parsed URL state containing tabId, recordId, and window info
 * @param windowMetadata - Complete window metadata from backend with tab definitions
 * @returns Calculated hierarchy with targetTab, parentTabs array, and rootTab
 * @throws Error if target tab not found, parent key field missing, or parent tab not found
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
    recordId: urlState.recordId,
    children: [],
  };

  // If target tab is at level 0, no parents to calculate
  if (targetTab.tabLevel === 0) {
    return {
      targetTab: targetNode,
      parentTabs: [],
      rootTab: targetNode,
    };
  }

  // Calculate parent tabs recursively
  const parentTabs: TabHierarchyNode[] = [];
  let currentLevel = targetTab.tabLevel - 1;
  let childTab = targetTab;

  while (currentLevel >= 0) {
    // Find the parent key field in the child tab
    const fieldEntries = Object.entries(childTab.fields || {});
    const parentKeyFieldEntry = fieldEntries.find(([_, field]) => field.isParentRecordProperty);
    const parentTabId = childTab.parentTabId;

    if (!parentKeyFieldEntry) {
      const availableFields = Object.keys(childTab.fields || {}).join(", ");
      throw new Error(
        `Parent key field not found in tab ${childTab.id} (${childTab.name}) at level ${childTab.tabLevel}. Available fields: [${availableFields}]. Please check window metadata configuration.`
      );
    }

    const [parentKeyFieldName] = parentKeyFieldEntry;

    // Find parent tab using parentTabId
    const parentTab = windowMetadata.tabs.find((tab) => tab.id === parentTabId);

    if (!parentTab) {
      throw new Error(
        `Parent tab ${parentTabId} not found in window metadata for field "${parentKeyFieldName}" in tab ${childTab.name}`
      );
    }

    const parentNode: TabHierarchyNode = {
      tabId: parentTab.id,
      tab: parentTab,
      level: parentTab.tabLevel,
      parentKeyField: parentKeyFieldName,
      children: [],
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
    rootTab: parentTabs[0] || targetNode,
  };
};
