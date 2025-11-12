import {
  WINDOW_IDENTIFIER_PREFIX,
} from "@/utils/url/constants";
import { WindowState } from "@/utils/window/constants";

/**
 * TODO: this func will be usefull to reconstruct the window state from URL params
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
 * //   windowIdentifier: "abc123"
 * // }
 */
export const createWindowState = (windowIdentifier: string, searchParams: URLSearchParams): WindowState => {
  const windowId = searchParams.get(`${WINDOW_IDENTIFIER_PREFIX}${windowIdentifier}`) || windowIdentifier;

  return {
    windowId,
    windowIdentifier: windowIdentifier,
    // TODO: the isActive is resolved outside this function
    isActive: false,
    // TODO: the title is resolved outside this function
    title: "",
    navigation: {
      activeLevels: [],
      activeTabsByLevel: new Map<number, string>(),
      initialized: false,
    },
    tabs: {}
  };
};

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
  const {
    windowId,
    windowIdentifier,
  } = window;

  // Use windowIdentifier as the URL key instead of windowId
  const urlKey = windowIdentifier;

  params.set(`${WINDOW_IDENTIFIER_PREFIX}${urlKey}`, windowId);
};