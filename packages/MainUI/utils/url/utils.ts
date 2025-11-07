import {
  WINDOW_IDENTIFIER_PREFIX,
  TAB_MODES,
  type WindowState,
} from "@/utils/url/constants";

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
 * Creates a WindowState object from URL parameters for a given window identifier.
 * Reconstructs the complete window state by parsing all relevant URL parameters.
 *
 * @param windowIdentifier - The window identifier to create state for
 * @param searchParams - The URLSearchParams object containing current URL parameters
 * @returns Complete WindowState object with all properties populated from URL parameters
 *
 * @example
 * // URL: w_abc123=active&o_abc123=1&wi_abc123=MainWindow
 * const windowState = createWindowState("abc123", searchParams);
 * // Returns: {
 * //   windowId: "MainWindow",
 * //   isActive: true,
 * //   window_identifier: "abc123"
 * // }
 */
export const createWindowState = (windowIdentifier: string, searchParams: URLSearchParams): WindowState => {
  const windowId = searchParams.get(`${WINDOW_IDENTIFIER_PREFIX}${windowIdentifier}`) || windowIdentifier;

  return {
    windowId,
    // TODO: the isActive is resolved outside this function
    isActive: false,
    // TODO: the title is resolved outside this function
    title: "",
    window_identifier: windowIdentifier,
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
 * // params now contains: w_abc123=active&o_abc123=1&wi_abc123=MainWindow
 */
export const setWindowParameters = (params: URLSearchParams, window: WindowState): void => {
  const {
    windowId,
    window_identifier,
  } = window;

  // Use window_identifier as the URL key instead of windowId
  const urlKey = window_identifier;

  params.set(`${WINDOW_IDENTIFIER_PREFIX}${urlKey}`, windowId);
};
