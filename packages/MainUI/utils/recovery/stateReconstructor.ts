import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { buildQueryString } from "@/utils";
import { getNewTabFormState, createDefaultTabState } from "@/utils/window/utils";
import { TAB_MODES, FORM_MODES } from "@/utils/url/constants";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import type { CalculatedHierarchy, TabHierarchyNode } from "./hierarchyCalculator";
import type { WindowMetadata, EntityData } from "@workspaceui/api-client/src/api/types";
import type { TabState, NavigationState } from "@/utils/window/constants";

export interface ReconstructedState {
  tabs: { [tabId: string]: TabState };
  navigation: NavigationState;
}

/**
 * Reconstructs the complete window state from calculated hierarchy
 */
export const reconstructState = async (
  hierarchy: CalculatedHierarchy,
  windowMetadata: WindowMetadata
): Promise<ReconstructedState> => {
  const tabs: { [tabId: string]: TabState } = {};
  const activeLevels: number[] = [];
  const activeTabsByLevel = new Map<number, string>();

  // Start from root tab and work down
  let currentRecordId: string | undefined;
  const allTabs = [hierarchy.rootTab, ...hierarchy.parentTabs.slice(1), hierarchy.targetTab].filter(
    (tab, index, arr) => arr.findIndex((t) => t.tabId === tab.tabId) === index
  ); // Remove duplicates

  for (const tabNode of allTabs) {
    const isTargetTab = tabNode.tabId === hierarchy.targetTab.tabId;

    // Create basic tab state
    tabs[tabNode.tabId] = createDefaultTabState(tabNode.level);

    // Add to active levels and tabs
    activeLevels.push(tabNode.level);
    activeTabsByLevel.set(tabNode.level, tabNode.tabId);

    if (isTargetTab) {
      // For target tab, we already have the recordId from URL state
      currentRecordId = hierarchy.targetTab.tabId; // This should be the recordId from URL state
      tabs[tabNode.tabId].selectedRecord = currentRecordId;
      tabs[tabNode.tabId].form = getNewTabFormState(currentRecordId, TAB_MODES.FORM, FORM_MODES.EDIT);
    } else {
      // For parent tabs, calculate the selected record
      const selectedRecord = await calculateParentSelectedRecord(tabNode, currentRecordId!, windowMetadata);

      currentRecordId = selectedRecord;
      tabs[tabNode.tabId].selectedRecord = selectedRecord;

      // Parent tabs typically stay in table mode with selection
      tabs[tabNode.tabId].form = {};
    }
  }

  return {
    tabs,
    navigation: {
      activeLevels: Array.from(new Set(activeLevels)).sort(),
      activeTabsByLevel,
      initialized: true,
    },
  };
};

/**
 * Calculates the selected record for a parent tab based on child selection
 */
const calculateParentSelectedRecord = async (
  parentTabNode: TabHierarchyNode,
  childRecordId: string,
  windowMetadata: WindowMetadata
): Promise<string> => {
  if (!parentTabNode.parentKeyField) {
    throw new Error(`Parent key field not found for tab ${parentTabNode.tabId}`);
  }

  try {
    // Find child tab to get the entity name
    const childTabId = parentTabNode.children[0]?.tabId;
    const childTab = windowMetadata.tabs.find((tab) => tab.id === childTabId);

    if (!childTab) {
      throw new Error(`Child tab not found for parent ${parentTabNode.tabId}`);
    }

    // Query datasource to get child record data
    const queryParams = buildQueryString({
      mode: FormMode.EDIT, // Use EDIT mode for querying existing record
      windowMetadata,
      tab: childTab,
    });

    const url = `${childTab.entityName}?${queryParams}&_recordId=${childRecordId}`;
    const { ok, data } = await Metadata.datasourceServletClient.request(url);

    if (!ok || !data?.response?.data?.[0]) {
      throw new Error(`Failed to fetch child record data for ${childRecordId}`);
    }

    const childRecord: EntityData = data.response.data[0];
    const parentRecordId = childRecord[parentTabNode.parentKeyField];

    if (!parentRecordId) {
      throw new Error(`Parent record ID not found in field ${parentTabNode.parentKeyField}`);
    }

    return String(parentRecordId);
  } catch (error) {
    console.error(`Error calculating parent selected record:`, error);
    throw new Error(`Failed to calculate parent record: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
