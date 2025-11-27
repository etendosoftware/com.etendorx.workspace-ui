import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { WindowRecoveryInfo } from "@/utils/window/constants";
import { getWindowIdFromIdentifier } from "@/utils/window/utils";

export interface ParsedUrlState {
  windowIdentifier: string;
  tabId: string;
  recordId: string;
  windowId: string;
  tabTitle: string;
  tabLevel: number;
  keyParameter: string;
}

/**
 * Calls ComputeWindowActionHandler endpoint to get basic window information
 * from recovery information in URL parameters.
 * @param recoveryInfo - Window recovery information extracted from URL parameters
 * @returns Parsed URL state containing window and tab details
 * @throws Error if parsing fails or required data is missing
 */
export const parseUrlState = async (recoveryInfo: WindowRecoveryInfo): Promise<ParsedUrlState> => {
  const { tabId: recoveryTabId, recordId: recoveryRecordId } = recoveryInfo;

  if (!recoveryTabId || !recoveryRecordId) {
    throw new Error("Missing tabId or recordId for URL state parsing");
  }

  const params = new URLSearchParams({
    tabId: recoveryTabId,
    recordId: recoveryRecordId,
    _action: "org.openbravo.client.application.ComputeWindowActionHandler",
  });

  try {
    const { ok, data } = await Metadata.kernelClient.request(`?${params.toString()}`);

    if (!ok || !data) {
      throw new Error("Failed to fetch window action handler data");
    }

    // Get window metadata to determine tab level
    const windowMetadata = await Metadata.getWindow(data.windowId);
    const targetTab = windowMetadata.tabs.find((tab) => tab.id === recoveryTabId);

    if (!targetTab) {
      throw new Error(`Tab ${recoveryTabId} not found in window metadata`);
    }

    return {
      windowIdentifier: recoveryInfo.windowIdentifier,
      tabId: recoveryTabId,
      recordId: recoveryRecordId,
      windowId: data.windowId,
      tabTitle: data.tabTitle,
      tabLevel: targetTab.tabLevel,
      keyParameter: data.keyParameter,
    };
  } catch (error) {
    console.error("Error parsing URL state:", error);
    throw new Error(`Failed to parse URL state: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Gets window name from recovery information
 * @param recoveryInfo - Window recovery information extracted from URL parameters
 * @returns Window name
 * @throws Error if fetching window name fails
 */
export const getWindowName = async (recoveryInfo: WindowRecoveryInfo): Promise<string> => {
  try {
    const { windowIdentifier: recoveryWindowIdentifier } = recoveryInfo;
    const recoveryWindowId = getWindowIdFromIdentifier(recoveryWindowIdentifier);
    const windowMetadata = await Metadata.getWindow(recoveryWindowId);
    return windowMetadata.name;
  } catch (error) {
    console.error("Error getting window name:", error);
    throw new Error(`Failed to get window name: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
