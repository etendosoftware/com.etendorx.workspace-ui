import { getNewTabFormState, createDefaultTabState } from "@/utils/window/utils";
import { TAB_MODES, FORM_MODES } from "@/utils/url/constants";
import type { CalculatedHierarchy, TabHierarchyNode } from "./hierarchyCalculator";
import type { WindowMetadata, EntityData } from "@workspaceui/api-client/src/api/types";
import type { TabState, NavigationState } from "@/utils/window/constants";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

export interface ReconstructedState {
  tabs: { [tabId: string]: TabState };
  navigation: NavigationState;
}

/**
 * Reconstructs the complete window state from the calculated hierarchy.
 *
 * **Purpose:**
 * Transforms the tab hierarchy tree into a complete window state with proper tab selections,
 * form states, and navigation configuration. This enables the window to display exactly
 * as it was before the page reload.
 *
 * **Algorithm (Bottom-Up Iteration):**
 * 1. Build tab chain from target to root (reversed order for bottom-up processing)
 * 2. Start with target tab's recordId (from URL, stored in hierarchy)
 * 3. For each tab moving upward (target → parents → root):
 *    - Create default tab state
 *    - If target tab: set form state with recordId from URL
 *    - If parent tab: query child record to calculate parent's recordId
 *    - Store selected record and update navigation state
 * 4. Return complete tabs object and navigation configuration
 *
 * **Critical Design Decision:**
 * We MUST iterate target → root (bottom-up) because:
 * - We only know the target tab's recordId from the URL
 * - Parent recordIds must be calculated by querying each child record
 * - Going root → target would be impossible (we'd need parent data we don't have)
 *
 * **Example:**
 * URL has: LocationTab, recordId="2000015"
 * 1. Process LocationTab (level 1): recordId="2000015" (from URL)
 * 2. Query Location record "2000015" → extract cBpartnerId="1000001"
 * 3. Process BPartnerTab (level 0): recordId="1000001" (calculated)
 * Result: Both tabs have correct selections
 *
 * @param hierarchy - Calculated hierarchy with target, parent, and root nodes
 * @param windowMetadata - Complete window metadata for datasource queries
 * @returns Reconstructed state with tabs object and navigation configuration
 * @throws Error if target recordId missing, parent calculation fails, or datasource errors
 */
export const reconstructState = async (
  hierarchy: CalculatedHierarchy,
  windowMetadata: WindowMetadata
): Promise<ReconstructedState> => {
  const tabs: { [tabId: string]: TabState } = {};
  const activeTabsByLevel = new Map<number, string>();

  // Build tab chain from target to root (reversed order for bottom-up iteration)
  const tabChain: TabHierarchyNode[] = [];

  // Add target tab first
  tabChain.push(hierarchy.targetTab);

  // Add parent tabs in reverse order (deepest to shallowest)
  for (let i = hierarchy.parentTabs.length - 1; i >= 0; i--) {
    tabChain.push(hierarchy.parentTabs[i]);
  }

  // Start with recordId from URL (stored in target node during hierarchy calculation)
  let currentRecordId = hierarchy.targetTab.recordId;

  if (!currentRecordId) {
    throw new Error(
      `Target tab ${hierarchy.targetTab.tabId} is missing recordId. This should have been set during hierarchy calculation from URL state.`
    );
  }

  // Iterate target → root: query each child to find its parent
  for (const tabNode of tabChain) {
    const isTargetTab = tabNode.tabId === hierarchy.targetTab.tabId;

    // Create basic tab state
    const basicTabState = createDefaultTabState(tabNode.level);

    tabs[tabNode.tabId] = { ...basicTabState, table: { ...basicTabState.table, isImplicitFilterApplied: true } };

    // Add to active tabs by level map
    activeTabsByLevel.set(tabNode.level, tabNode.tabId);

    if (isTargetTab) {
      // For target tab: set form state (user was viewing this record in form mode)
      tabs[tabNode.tabId].selectedRecord = currentRecordId;
      tabs[tabNode.tabId].form = getNewTabFormState(currentRecordId, TAB_MODES.FORM, FORM_MODES.EDIT);
    } else {
      const parentKeyField = tabNode.parentKeyField;
      const windowId = windowMetadata.id;

      if (!parentKeyField) {
        throw new Error(
          `Parent key field missing for tab ${tabNode.tabId} (${tabNode.tab.name}). This should have been set during hierarchy calculation. Cannot calculate parent record ID.`
        );
      }

      // For parent tabs: calculate the parent's recordId by querying the child FIRST
      // Then assign the calculated recordId to this parent tab
      currentRecordId = await calculateParentRecordId(tabNode, currentRecordId, parentKeyField, windowId);

      // Set selected record for parent tab
      tabs[tabNode.tabId].selectedRecord = currentRecordId;

      // Parent tabs stay in table mode with selection (no form state)
      tabs[tabNode.tabId].form = {};
    }
  }

  return {
    tabs,
    navigation: {
      activeLevels: [hierarchy.targetTab.level],
      activeTabsByLevel,
      initialized: true,
    },
  };
};

/**
 * Calculates the parent tab's recordId by querying the child record.
 *
 * **Purpose:**
 * Given a child record ID, fetches the child record from the datasource and extracts
 * the parent record ID using the parent key field stored in the hierarchy node.
 *
 * **Algorithm:**
 * 1. Validate that current tab has children (otherwise no parent to calculate)
 * 2. Get child tab metadata from window metadata
 * 3. Build datasource query for the child record
 * 4. Execute query to fetch child record data
 * 5. Extract parent recordId using the parentKeyField (field KEY from hierarchy)
 * 6. Return parent recordId as string
 *
 * **Important:**
 * - currentTabNode is the CURRENT tab we're processing (which will become the parent)
 * - We query its CHILD to find what parent record ID the child points to
 * - The parentKeyField in currentTabNode is the KEY to access parent ID from child data
 *
 * **Example:**
 * Processing BPartnerTab (level 0), child is LocationTab (level 1)
 * - childRecordId: "2000015" (Location record)
 * - parentKeyField: "cBpartnerId" (KEY from Location's fields)
 * - Query: GET /Location?_recordId=2000015
 * - Response: { id: "2000015", cBpartnerId: "1000001", ... }
 * - Extract: childRecord["cBpartnerId"] = "1000001"
 * - Return: "1000001" (BPartner record ID)
 *
 * @param currentTabNode - The tab node we're calculating the recordId for (parent)
 * @param childRecordId - The known recordId of the child tab
 * @param windowMetadata - Window metadata for datasource queries
 * @returns The parent tab's recordId as a string
 * @throws Error if no children, child tab not found, datasource fails, or parent field missing
 */
const calculateParentRecordId = async (
  currentTabNode: TabHierarchyNode,
  childRecordId: string,
  parentKeyField: string,
  windowId: string
): Promise<string> => {
  // Find the parent tab node (the one we need to calculate recordId for)
  if (!currentTabNode.children || currentTabNode.children.length === 0) {
    throw new Error(
      `Cannot calculate parent recordId for tab ${currentTabNode.tabId} (${currentTabNode.tab.name}): no children found. This indicates a hierarchy calculation error.`
    );
  }

  const childTabNode = currentTabNode.children[0];
  const childTab = childTabNode.tab;

  // Find the field KEY in child tab that links to current (parent) tab
  const fieldEntries = Object.entries(childTab.fields || {});
  const parentKeyFieldEntry = fieldEntries.find(([_, field]) => field.isParentRecordProperty);

  if (!parentKeyFieldEntry) {
    const availableFields = Object.keys(childTab.fields || {}).join(", ");
    throw new Error(
      `Parent key field not found in child tab ${childTab.id} (${childTab.name}). Available fields: [${availableFields}]. Cannot determine parent record ID.`
    );
  }

  const [parentKeyFieldName] = parentKeyFieldEntry;

  try {
    // Query datasource to get child record data

    // Basic datasource params
    const params = {
      targetRecordId: childRecordId,
      filterByParentProperty: parentKeyField,
      windowId: windowId,
      tabId: childTab.id,
      isImplicitFilterApplied: "true",
      criteria: [],
      pageSize: "100",
      noActiveFilter: "true",
      startRow: "0",
      endRow: "99",
    };

    const { ok, data } = (await datasource.get(childTab.entityName, params)) as any;

    if (!ok || !data?.response?.data?.[0]) {
      throw new Error(`Failed to fetch child record data for recordId: ${childRecordId} in tab ${childTab.name}.`);
    }

    const childRecord: EntityData = data.response.data[0];
    const parentRecordId = childRecord[parentKeyFieldName];

    if (!parentRecordId) {
      const availableRecordFields = Object.keys(childRecord).join(", ");
      throw new Error(
        `Parent record ID not found in field "${parentKeyFieldName}" of child record ${childRecordId}. Available record fields: [${availableRecordFields}].`
      );
    }

    return String(parentRecordId);
  } catch (error) {
    console.error(`Error calculating parent recordId for tab ${currentTabNode.tabId}:`, error);
    throw new Error(`Failed to calculate parent record: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
