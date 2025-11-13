import {
  FORM_MODES,
  TAB_MODES,
  type FormMode,
  type TabMode,
  type TabFormState,
  type SelectedRecord,
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
