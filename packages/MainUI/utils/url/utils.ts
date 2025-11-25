import { URL_PREFIXS } from "@/utils/url/constants";
import type { WindowState, WindowRecoveryInfo } from "@/utils/window/constants";

/**
 * TODO: this func will be usefull to set all window params in URL
 * Sets all URL parameters for a window based on its WindowState.
 * Encodes the complete window state into URL parameters using the established parameter naming conventions.
 *
 * @param params - The URLSearchParams object to modify
 * @param window - The WindowState object containing the state to encode
 *
 * @example
 * const params = new URLSearchParams();
 * const windowState = { windowId: "MainWindow", isActive: true, ... };
 * setWindowParameters(params, windowState);
 * // params now contains: w_abc123=active&o_abc123=1&wi_abc123=MainWindow
 */
export const setWindowParameters = (params: URLSearchParams, window: WindowState): void => {
  const { windowIdentifier } = window;

  params.set(`${URL_PREFIXS.WINDOW_IDENTIFIER}`, windowIdentifier);
};

/**
 * Determines if navigation should be skipped because URL parameters are identical.
 * Safely compares current search parameters with target URL parameters.
 *
 * @param targetUrl - The URL we want to navigate to
 * @returns true if navigation should be skipped, false otherwise
 */
export const shouldSkipNavigation = (targetUrl: string, searchParams: URLSearchParams): boolean => {
  try {
    const currentParams = searchParams?.toString?.() ?? "";
    const targetParams = targetUrl.split("?")[1] || "";

    return currentParams === targetParams;
  } catch {
    // If comparison fails for any reason, proceed with navigation
    return false;
  }
};

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
      params.set(`${URL_PREFIXS.RECORD_IDENTIFIER}_${index}`, deepestTabState.selectedRecord!);
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
