import { URL_PREFIXS } from "@/utils/url/constants";
import type { WindowState, WindowRecoveryInfo } from "@/utils/window/constants";

/**
 * Builds URL parameters for multiple windows based on their current state.
 * Generates URL parameters with indexed format for each window, including the deepest tab
 * that has both a selected record and tab identifier.
 *
 * @param windows - Array of WindowState objects to encode into URL parameters
 * @returns URL parameter string with indexed window, tab, and record identifiers
 *
 * @example
 * // With 2 windows: first has no records, second has deepest tab at level 1
 * const windows = [
 *   { windowIdentifier: "143", tabs: {} },
 *   { windowIdentifier: "144", tabs: {
 *     "tab1": { level: 0, selectedRecord: "rec1" },
 *     "tab2": { level: 1, selectedRecord: "rec2" }
 *   }}
 * ];
 * const params = buildWindowsUrlParams(windows);
 * // Returns: "wi_0=143&wi_1=144&ti_1=tab2&ri_1=rec2"
 */
export const buildWindowsUrlParams = (windows: WindowState[]): string => {
  const params = new URLSearchParams();

  windows.forEach((window, index) => {
    // Always add window identifier
    params.set(`${URL_PREFIXS.WINDOW_IDENTIFIER}_${index}`, window.windowIdentifier);

    // Find the tab with highest level that has both tabId and selectedRecord
    const tabEntries = Object.entries(window.tabs);
    const tabsWithRecordsForms = tabEntries.filter(
      ([_, tabState]) => tabState.selectedRecord && tabState.form.recordId
    );

    if (tabsWithRecordsForms.length > 0) {
      // Find the tab with the highest level (deepest)
      const deepestTab = tabsWithRecordsForms.reduce((prev, current) => {
        const [_prevTabId, prevTabState] = prev;
        const [_currentTabId, currentTabState] = current;

        return currentTabState.level > prevTabState.level ? current : prev;
      });

      const [deepestTabId, deepestTabState] = deepestTab;

      // Add tab and record to URL
      params.set(`${URL_PREFIXS.TAB_IDENTIFIER}_${index}`, deepestTabId);
      params.set(`${URL_PREFIXS.RECORD_IDENTIFIER}_${index}`, deepestTabState.selectedRecord || "");
    }
  });

  return params.toString();
};

/**
 * Extracts recovery information for all windows from URL parameters
 */
export const parseWindowRecoveryData = (searchParams: URLSearchParams): WindowRecoveryInfo[] => {
  const recoveryData: WindowRecoveryInfo[] = [];

  // Extract window identifiers
  searchParams.forEach((value, key) => {
    if (key.startsWith(URL_PREFIXS.WINDOW_IDENTIFIER)) {
      const index = key.split("_")[1];
      const tabId = searchParams.get(`${URL_PREFIXS.TAB_IDENTIFIER}_${index}`);
      const recordId = searchParams.get(`${URL_PREFIXS.RECORD_IDENTIFIER}_${index}`);

      recoveryData.push({
        windowIdentifier: value,
        tabId: tabId || undefined,
        recordId: recordId || undefined,
        hasRecoveryData: !!(tabId && recordId),
      });
    }
  });

  return recoveryData;
};

/**
 * Validates URL parameter consistency for recovery
 */
export const validateRecoveryParameters = (recoveryInfo: WindowRecoveryInfo): boolean => {
  // Both tabId and recordId must be present together, or neither
  return (!recoveryInfo.tabId && !recoveryInfo.recordId) || (!!recoveryInfo.tabId && !!recoveryInfo.recordId);
};

/**
 * Cleans invalid recovery parameters from URL
 */
export const cleanInvalidRecoveryParams = (searchParams: URLSearchParams): URLSearchParams => {
  const cleanParams = new URLSearchParams(searchParams);
  const recoveryData = parseWindowRecoveryData(searchParams);

  recoveryData.forEach((info, index) => {
    if (!validateRecoveryParameters(info)) {
      // Remove inconsistent parameters
      cleanParams.delete(`${URL_PREFIXS.TAB_IDENTIFIER}_${index}`);
      cleanParams.delete(`${URL_PREFIXS.RECORD_IDENTIFIER}_${index}`);
    }
  });

  return cleanParams;
};

/**
 * Removes all recovery parameters from URL
 */
export const removeRecoveryParameters = (searchParams: URLSearchParams): URLSearchParams => {
  const cleanParams = new URLSearchParams();

  searchParams.forEach((value, key) => {
    const isRecoveryParam =
      key.startsWith(URL_PREFIXS.WINDOW_IDENTIFIER) ||
      key.startsWith(URL_PREFIXS.TAB_IDENTIFIER) ||
      key.startsWith(URL_PREFIXS.RECORD_IDENTIFIER);

    if (!isRecoveryParam) {
      cleanParams.set(key, value);
    }
  });

  return cleanParams;
};

/**
 * Removes parameters for specific window index
 */
export const removeWindowParameters = (searchParams: URLSearchParams, windowIndex: number): URLSearchParams => {
  const cleanParams = new URLSearchParams(searchParams);

  cleanParams.delete(`${URL_PREFIXS.WINDOW_IDENTIFIER}_${windowIndex}`);
  cleanParams.delete(`${URL_PREFIXS.TAB_IDENTIFIER}_${windowIndex}`);
  cleanParams.delete(`${URL_PREFIXS.RECORD_IDENTIFIER}_${windowIndex}`);

  return cleanParams;
};

/**
 * Appends a new window to existing URL parameters.
 *
 * Reads current URL parameters and adds a new window at the next available index.
 * The WindowProvider's useEffect will later reconstruct the complete URL from state,
 * ensuring all windows are properly synchronized.
 *
 * @param currentParams - Current URLSearchParams from the browser
 * @param newWindow - Object containing the new window's information
 * @returns Complete URL parameter string with new window appended
 *
 * @example
 * const currentParams = new URLSearchParams("wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001");
 * const newWindow = {
 *   windowIdentifier: "144_2000",
 *   tabId: "LocationTab",
 *   recordId: "2000015"
 * };
 * const params = appendWindowToUrl(currentParams, newWindow);
 * // Returns: "wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001&wi_1=144_2000&ti_1=LocationTab&ri_1=2000015"
 */
export const appendWindowToUrl = (
  currentParams: URLSearchParams,
  newWindow: {
    windowIdentifier: string;
    tabId: string;
    recordId: string;
  }
): string => {
  // Clone current parameters to avoid mutation
  const params = new URLSearchParams(currentParams);

  // Find the next available index by counting existing window identifiers
  let nextIndex = 0;
  while (params.has(`${URL_PREFIXS.WINDOW_IDENTIFIER}_${nextIndex}`)) {
    nextIndex++;
  }

  // Add new window at the next index
  params.set(`${URL_PREFIXS.WINDOW_IDENTIFIER}_${nextIndex}`, newWindow.windowIdentifier);
  params.set(`${URL_PREFIXS.TAB_IDENTIFIER}_${nextIndex}`, newWindow.tabId);
  params.set(`${URL_PREFIXS.RECORD_IDENTIFIER}_${nextIndex}`, newWindow.recordId);

  return params.toString();
};
