import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { WindowRecoveryInfo } from "@/utils/window/constants";
import type { WindowMetadata } from "@workspaceui/api-client/src/api/types";

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
export const parseUrlState = async (
  recoveryInfo: WindowRecoveryInfo,
  windowData: WindowMetadata
): Promise<ParsedUrlState> => {
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

    const targetTab = windowData.tabs.find((tab) => tab.id === recoveryTabId);

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
 * Gets the window name from window metadata.
 *
 * @param windowData - Window metadata from backend
 * @returns The window name as a string
 * @throws Error if window name cannot be retrieved
 */
export const getWindowName = (windowData: WindowMetadata): string => {
  try {
    return windowData.name;
  } catch (error) {
    console.error("Error getting window name:", error);
    throw new Error(`Failed to get window name: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
