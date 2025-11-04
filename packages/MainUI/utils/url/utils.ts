import {
  ORDER_PREFIX,
  WINDOW_IDENTIFIER_PREFIX,
  FORM_RECORD_ID_PREFIX,
  FORM_MODE_PREFIX,
  TITLE_PREFIX,
  SELECTED_RECORD_PREFIX,
  TAB_FORM_RECORD_ID_PREFIX,
  TAB_MODE_PREFIX,
  TAB_FORM_MODE_PREFIX,
  FORM_MODES,
  TAB_MODES,
  type FormMode,
  type TabMode,
  type TabFormState,
  type SelectedRecord,
  type WindowState,
} from "@/utils/url/constants";

/**
 * Determines if a tab should be displayed in form view mode based on its state and parent context.
 * A tab is considered to be in form view when all three conditions are met:
 * - Current mode is explicitly set to FORM
 * - A valid record ID is present
 * - Parent tab has a selection in the URL (establishing context)
 *
 * @param params - Configuration object containing:
 *   - currentMode: The current display mode of the tab
 *   - recordId: The ID of the record being displayed
 *   - parentHasSelectionInURL: Whether the parent tab has a selection in URL parameters
 * @returns True if the tab should be displayed in form view, false otherwise
 */
export const isFormView = ({
  currentMode,
  recordId,
  parentHasSelectionInURL,
}: { currentMode: string; recordId: string; parentHasSelectionInURL: boolean }) => {
  return currentMode === TAB_MODES.FORM && !!recordId && parentHasSelectionInURL;
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
 * Converts a single tab form state configuration into a Record mapping format.
 * Creates a key-value pair where the tab ID becomes the key and the TabFormState becomes the value.
 * Applies default values for mode (FORM) and formMode (EDIT) when not explicitly provided.
 * Returns empty object if either tabId or recordId is missing, ensuring data integrity.
 *
 * @param config - Object containing:
 *   - tabId: The identifier of the tab
 *   - tabFormState: The form state configuration (recordId, mode, formMode)
 * @returns Record mapping tabId to TabFormState, or empty object if inputs are invalid
 */
export const generateTabFormState = ({
  tabId,
  tabFormState,
}: { tabId: string; tabFormState: TabFormState }): Record<string, TabFormState> => {
  const { recordId, mode, formMode } = tabFormState;
  if (!tabId || !recordId) return {};
  const defaultMode = mode ?? TAB_MODES.FORM;
  const defaultFormMode = formMode ?? FORM_MODES?.EDIT;
  return {
    [tabId]: {
      recordId,
      mode: defaultMode as TabMode,
      formMode: defaultFormMode as FormMode,
    },
  };
};

/**
 * Converts an array of tab form state configurations into a unified Record mapping.
 * Processes multiple tab form states and combines them into a single object
 * where each key is a tab ID and each value is the corresponding TabFormState.
 * Automatically filters out invalid configurations (those that return empty objects from generateTabFormState).
 *
 * @param tabFormStates - Array of objects containing tabId and tabFormState configurations
 * @returns Record object mapping tab IDs to TabFormState objects for all valid configurations
 */
export const generateTabFormStates = (
  tabFormStates: { tabId: string; tabFormState: TabFormState }[]
): Record<string, TabFormState> => {
  const result: Record<string, TabFormState> = {};

  for (const { tabId, tabFormState } of tabFormStates) {
    Object.assign(result, generateTabFormState({ tabId, tabFormState }));
  }

  return result;
};

/**
 * Processes tab-related URL parameters for a specific window to extract selections and form states.
 * Parses URL parameters that contain tab selections, form record IDs, modes, and form modes.
 *
 * @param searchParams - The URLSearchParams object containing current URL parameters
 * @param windowId - The window identifier to process tab parameters for
 * @returns Object containing:
 *   - selectedRecords: Map of tabId to selected recordId
 *   - tabFormStates: Map of tabId to form state information (recordId, mode, formMode)
 *
 * @example
 * // URL contains: sr_win1_tab1=rec123&tfr_win1_tab1=rec123&tm_win1_tab1=form
 * const { selectedRecords, tabFormStates } = processTabParameters(searchParams, "win1");
 * // Returns: {
 * //   selectedRecords: { "tab1": "rec123" },
 * //   tabFormStates: { "tab1": { recordId: "rec123", mode: "form" } }
 * // }
 */
export const processTabParameters = (
  searchParams: URLSearchParams,
  windowIdentifier: string
): {
  selectedRecords: Record<string, string>;
  tabFormStates: Record<string, { recordId?: string; mode?: TabMode; formMode?: FormMode }>;
} => {
  const selectedRecords: Record<string, string> = {};
  const tabFormStates: Record<string, { recordId?: string; mode?: TabMode; formMode?: FormMode }> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!value) continue;

    const processTabParameter = (prefix: string, processor: (tabId: string, value: string) => void) => {
      if (key.startsWith(prefix)) {
        const tabId = key.slice(prefix.length);
        processor(tabId, value);
      }
    };

    processTabParameter(`${SELECTED_RECORD_PREFIX}${windowIdentifier}_`, (tabId, value) => {
      selectedRecords[tabId] = value;
    });

    processTabParameter(`${TAB_FORM_RECORD_ID_PREFIX}${windowIdentifier}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], recordId: value };
    });

    processTabParameter(`${TAB_MODE_PREFIX}${windowIdentifier}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], mode: value as TabMode };
    });

    processTabParameter(`${TAB_FORM_MODE_PREFIX}${windowIdentifier}_`, (tabId, value) => {
      tabFormStates[tabId] = { ...tabFormStates[tabId], formMode: value as FormMode };
    });
  }

  return { selectedRecords, tabFormStates };
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
 * // URL: w_abc123=active&o_abc123=1&wi_abc123=MainWindow&fr_abc123=rec456
 * const windowState = createWindowState("abc123", searchParams);
 * // Returns: {
 * //   windowId: "MainWindow",
 * //   isActive: true,
 * //   window_identifier: "abc123",
 * //   formRecordId: "rec456",
 * //   selectedRecords: {},
 * //   tabFormStates: {}
 * // }
 */
export const createWindowState = (windowIdentifier: string, searchParams: URLSearchParams): WindowState => {
  const formRecordId = searchParams.get(`${FORM_RECORD_ID_PREFIX}${windowIdentifier}`) || undefined;
  const formMode = (searchParams.get(`${FORM_MODE_PREFIX}${windowIdentifier}`) as FormMode) || undefined;
  const windowId = searchParams.get(`${WINDOW_IDENTIFIER_PREFIX}${windowIdentifier}`) || windowIdentifier;
  const title = searchParams.get(`${TITLE_PREFIX}${windowIdentifier}`) || undefined;

  const { selectedRecords, tabFormStates } = processTabParameters(searchParams, windowIdentifier);

  return {
    windowId,
    // TODO: the isActive is resolved outside this function
    isActive: false,
    window_identifier: windowIdentifier,
    formRecordId,
    formMode,
    selectedRecords,
    tabFormStates,
    title,
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
    formRecordId,
    formMode,
    selectedRecords,
    tabFormStates,
    title,
  } = window;

  // Use window_identifier as the URL key instead of windowId
  const urlKey = window_identifier;

  params.set(`${WINDOW_IDENTIFIER_PREFIX}${urlKey}`, windowId);

  if (formRecordId) {
    params.set(`${FORM_RECORD_ID_PREFIX}${urlKey}`, formRecordId);
  }
  if (formMode) {
    params.set(`${FORM_MODE_PREFIX}${urlKey}`, formMode);
  }
  if (title) {
    params.set(`${TITLE_PREFIX}${urlKey}`, title);
  }

  for (const [tabId, selectedRecordId] of Object.entries(selectedRecords)) {
    if (selectedRecordId) {
      params.set(`${SELECTED_RECORD_PREFIX}${urlKey}_${tabId}`, selectedRecordId);
    }
  }

  for (const [tabId, tabState] of Object.entries(tabFormStates)) {
    if (tabState.recordId) {
      params.set(`${TAB_FORM_RECORD_ID_PREFIX}${urlKey}_${tabId}`, tabState.recordId);
    }
    if (tabState.mode && tabState.mode !== TAB_MODES.TABLE) {
      params.set(`${TAB_MODE_PREFIX}${urlKey}_${tabId}`, tabState.mode);
    }
    if (tabState.formMode) {
      params.set(`${TAB_FORM_MODE_PREFIX}${urlKey}_${tabId}`, tabState.formMode);
    }
  }
};
