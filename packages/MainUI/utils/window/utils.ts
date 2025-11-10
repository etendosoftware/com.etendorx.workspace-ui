import {
  TAB_MODES,
  TabFormState,
  FORM_MODES,
  NEW_RECORD_ID,
  FormMode,
  TabMode,
} from "@/utils/url/constants";

/**
 * Generates a new tab form state for a specific record and mode.
 *
 * @param recordId - The ID of the record to display in the form
 * @param mode - The tab display mode (defaults to TAB_MODES.FORM)
 * @param formMode - The form interaction mode (NEW, EDIT, VIEW). Auto-determined if not provided
 * @returns A new TabFormState object
 */
export const getNewTabFormState = (
  recordId: string,
  mode: TabMode = TAB_MODES.FORM,
  formMode?: FormMode
): TabFormState => {
  const determinedFormMode = formMode || (recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT);

  return {
    recordId,
    mode,
    formMode: determinedFormMode,
  };
};

/**
 * Extracts the window ID from a window identifier.
 * @param windowIdentifier - The window identifier to extract the ID from
 * @returns The extracted window ID
 * 
 * @example
 * const windowId = getWindowIdFromIdentifier("12345_67890");
 * // Returns: "12345"
 */
export const getWindowIdFromIdentifier = (windowIdentifier: string): string => {
  const underscoreIndex = windowIdentifier.indexOf("_");
  if (underscoreIndex === -1) {
    return windowIdentifier;
  }
  return windowIdentifier.substring(0, underscoreIndex);
}

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