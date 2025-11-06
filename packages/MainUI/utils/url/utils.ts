import {
  WINDOW_IDENTIFIER_PREFIX,
  SELECTED_RECORD_PREFIX,
  TAB_MODES,
  type SelectedRecord,
  type WindowState,
  type TabProcessingResults,
  type TabParameterConfig,
} from "@/utils/url/constants";


/**
 * Extracts tab ID from a parameter key given a prefix.
 * 
 * @param key - The parameter key
 * @param prefix - The prefix to remove
 * @returns The tab ID or null if the key doesn't start with the prefix
 */
const extractTabId = (key: string, prefix: string): string | null => {
  if (!key.startsWith(prefix)) return null;
  return key.slice(prefix.length);
};

/**
 * Processes a selected record parameter.
 */
const processSelectedRecord = (tabId: string, value: string, results: TabProcessingResults): void => {
  results.selectedRecords[tabId] = value;
};

/**
 * Creates tab parameter processing configuration.
 * 
 * @param windowIdentifier - The window identifier to create prefixes for
 * @returns Array of tab parameter configurations
 */
const createTabParameterConfigs = (windowIdentifier: string): TabParameterConfig[] => [
  {
    prefix: `${SELECTED_RECORD_PREFIX}${windowIdentifier}_`,
    processor: processSelectedRecord,
  },
];

/**
 * Processes a single URL parameter for tab-related data.
 * 
 * @param key - The parameter key
 * @param value - The parameter value
 * @param configs - Array of processing configurations
 * @param results - The results object to populate
 */
const processUrlParameter = (
  key: string,
  value: string,
  configs: TabParameterConfig[],
  results: TabProcessingResults
): void => {
  for (const config of configs) {
    const tabId = extractTabId(key, config.prefix);
    if (tabId) {
      config.processor(tabId, value, results);
      break; // Found matching prefix, no need to check others
    }
  }
};


/**
 * Determines if a tab should be displayed in form view mode based on its state and parent context.
 * A tab is considered to be in form view when all three conditions are met:
 * - Current mode is explicitly set to FORM
 * - A valid record ID is present
 * - Parent tab has a selection (establishing context)
 *
 * @param params - Configuration object containing:
 *   - currentMode: The current display mode of the tab
 *   - recordId: The ID of the record being displayed
 *   - hasParentSelection: Whether the parent tab has a selection
 * @returns True if the tab should be displayed in form view, false otherwise
 */
export const isFormView = ({
  currentMode,
  recordId,
  hasParentSelection,
}: { currentMode: string; recordId: string; hasParentSelection: boolean }) => {
  return currentMode === TAB_MODES.FORM && !!recordId && hasParentSelection;
};

/**
 * Generates a unique window identifier by appending a timestamp to the window ID.
 * This allows multiple instances of the same window type to exist simultaneously
 * in the multi-window navigation system. The timestamp ensures uniqueness across
 * browser sessions and prevents identifier collisions.
 *
 * @param windowId - The base window ID (business entity identifier)
 * @returns A unique window identifier in the format "windowId_timestamp"
 */
export const getNewWindowIdentifier = (windowId: string) => {
  return `${windowId}_${Date.now()}`;
};

/**
 * Converts a single SelectedRecord object into a Record mapping format.
 * Creates a key-value pair where the tab ID becomes the key and record ID becomes the value.
 * Returns undefined if either tabId or recordId is missing, ensuring data integrity.
 *
 * @param selectedRecord - Object containing tabId and recordId for a single selection
 * @returns Record mapping tabId to recordId, or undefined if inputs are invalid
 */
export const generateSelectedRecord = ({ recordId, tabId }: SelectedRecord): Record<string, string> | undefined => {
  if (!tabId || !recordId) return;
  return {
    [tabId]: recordId,
  };
};

/**
 * Converts an array of SelectedRecord objects into a unified Record mapping.
 * Processes multiple tab selections and combines them into a single object
 * where each key is a tab ID and each value is the corresponding record ID.
 * Automatically filters out invalid records (those that return undefined from generateSelectedRecord).
 *
 * @param records - Array of SelectedRecord objects to process
 * @returns Record object mapping tab IDs to record IDs for all valid selections
 */
export const generateSelectedRecords = (records: SelectedRecord[]): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const record of records) {
    Object.assign(result, generateSelectedRecord(record));
  }
  return result;
};

/**
 * Processes tab-related URL parameters for a specific window to extract selections.
 * Parses URL parameters that contain tab selections.
 *
 * @param searchParams - The URLSearchParams object containing current URL parameters
 * @param windowIdentifier - The window identifier to process tab parameters for
 * @returns Object containing:
 *   - selectedRecords: Map of tabId to selected recordId
 *
 * @example
 * // URL contains: s_win1_tab1=rec123
 * const { selectedRecords } = processTabParameters(searchParams, "win1");
 * // Returns: {
 * //   selectedRecords: { "tab1": "rec123" }
 * // }
 */
export const processTabParameters = (
  searchParams: URLSearchParams,
  windowIdentifier: string
): {
  selectedRecords: Record<string, string>;
} => {
  const results: TabProcessingResults = {
    selectedRecords: {},
  };

  const configs = createTabParameterConfigs(windowIdentifier);

  for (const [key, value] of searchParams.entries()) {
    if (!value) continue;
    processUrlParameter(key, value, configs, results);
  }

  return {
    selectedRecords: results.selectedRecords,
  };
};

/**
 * Creates a WindowState object from URL parameters for a given window identifier.
 * Reconstructs the complete window state by parsing all relevant URL parameters.
 *
 * @param windowIdentifier - The window identifier to create state for
 * @param searchParams - The URLSearchParams object containing current URL parameters
 * @returns Complete WindowState object with all properties populated from URL parameters
 *
 * @example
 * // URL: w_abc123=active&o_abc123=1&wi_abc123=MainWindow&s_abc123_tab1=rec456
 * const windowState = createWindowState("abc123", searchParams);
 * // Returns: {
 * //   windowId: "MainWindow",
 * //   isActive: true,
 * //   window_identifier: "abc123",
 * //   selectedRecords: { "tab1": "rec456" }
 * // }
 */
export const createWindowState = (windowIdentifier: string, searchParams: URLSearchParams): WindowState => {
  const windowId = searchParams.get(`${WINDOW_IDENTIFIER_PREFIX}${windowIdentifier}`) || windowIdentifier;

  const { selectedRecords } = processTabParameters(searchParams, windowIdentifier);

  return {
    windowId,
    // TODO: the isActive is resolved outside this function
    isActive: false,
    // TODO: the title is resolved outside this function
    title: "",
    window_identifier: windowIdentifier,
    selectedRecords,
  };
};

/**
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
 * // params now contains: w_abc123=active&o_abc123=1&wi_abc123=MainWindow&...
 */
export const setWindowParameters = (params: URLSearchParams, window: WindowState): void => {
  const {
    windowId,
    window_identifier,
    selectedRecords,
  } = window;

  // Use window_identifier as the URL key instead of windowId
  const urlKey = window_identifier;

  params.set(`${WINDOW_IDENTIFIER_PREFIX}${urlKey}`, windowId);

  for (const [tabId, selectedRecordId] of Object.entries(selectedRecords)) {
    if (selectedRecordId) {
      params.set(`${SELECTED_RECORD_PREFIX}${urlKey}_${tabId}`, selectedRecordId);
    }
  }
};
