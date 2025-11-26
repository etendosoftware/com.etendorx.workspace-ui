import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { WindowRecoveryInfo } from "@/utils/window/constants";

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
 */
export const parseUrlState = async (recoveryInfo: WindowRecoveryInfo): Promise<ParsedUrlState> => {
  if (!recoveryInfo.tabId || !recoveryInfo.recordId) {
    throw new Error("Missing tabId or recordId for URL state parsing");
  }

  const params = new URLSearchParams({
    tabId: recoveryInfo.tabId,
    recordId: recoveryInfo.recordId,
    _action: "org.openbravo.client.application.ComputeWindowActionHandler",
  });

  try {
    const { ok, data } = await Metadata.kernelClient.request(`?${params.toString()}`);

    if (!ok || !data) {
      throw new Error("Failed to fetch window action handler data");
    }

    // Get window metadata to determine tab level
    const windowMetadata = await Metadata.getWindow(data.windowId);
    const targetTab = windowMetadata.tabs.find((tab) => tab.id === recoveryInfo.tabId);

    if (!targetTab) {
      throw new Error(`Tab ${recoveryInfo.tabId} not found in window metadata`);
    }

    return {
      windowIdentifier: recoveryInfo.windowIdentifier,
      tabId: recoveryInfo.tabId,
      recordId: recoveryInfo.recordId,
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
