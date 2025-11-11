/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  TAB_MODES,
  TabFormState,
  FORM_MODES,
  NEW_RECORD_ID,
  FormMode,
  TabMode,
} from "@/utils/url/constants";
import {
  TableState,
  NavigationState,
  WindowContextState,
  TabState
} from "@/utils/window/constants";

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

/**
 * Creates a default tab state with initial values for table properties.
 * Used as the foundation when creating new tabs in the window context state.
 * Navigation is now handled at window level, not tab level.
 *
 * @returns A new TabState object with default table configuration
 */
export const createDefaultTabState = (): TabState => ({
  table: {
    filters: [],
    visibility: {},
    sorting: [],
    order: [],
    isImplicitFilterApplied: false,
  },
  form: {},
});

/**
 * Ensures that a window and tab exist in the window context state.
 * Creates the window and/or tab with default values if they don't exist.
 * This function guarantees that subsequent operations on the window/tab will not fail
 * due to missing state structure.
 *
 * @param state - The current window context state
 * @param windowIdentifier - The unique identifier of the window
 * @param tabId - The ID of the tab within the window
 * @returns A new state object with the window and tab guaranteed to exist
 * 
 * @example
 * // Used in window context to ensure state structure before updates
 * const newState = ensureTabExists(prevState, "window_123", "tab1");
 * // Now safely access: newState["window_123"].tabs["tab1"]
 */
export const ensureTabExists = (state: WindowContextState, windowIdentifier: string, tabId: string): WindowContextState => {
  const newState = { ...state };

  if (!newState[windowIdentifier]) {
    const windowId = getWindowIdFromIdentifier(windowIdentifier);
    newState[windowIdentifier] = {
      windowId,
      windowIdentifier,
      isActive: false,
      title: "",
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    };
  }

  if (!newState[windowIdentifier].tabs[tabId]) {
    newState[windowIdentifier].tabs[tabId] = createDefaultTabState();
  }

  return newState;
};

/**
 * Updates a specific property of the table state for a given window and tab.
 * Ensures the window and tab exist before performing the update.
 * Used by table-related setters in the window context.
 *
 * @template T - The type of the table property being updated
 * @param prevState - The current window context state
 * @param windowIdentifier - The unique identifier of the window
 * @param tabId - The ID of the tab within the window
 * @param property - The table property to update (filters, visibility, sorting, order, etc.)
 * @param value - The new value for the table property
 * @returns A new state object with the updated table property
 * 
 * @example
 * // Used in setTableFilters:
 * updateTableProperty(prevState, "window_123", "tab1", "filters", newFilters);
 */
export const updateTableProperty = <T extends keyof TableState>(
  prevState: WindowContextState,
  windowIdentifier: string,
  tabId: string,
  property: T,
  value: TableState[T]
): WindowContextState => {
  const newState = ensureTabExists(prevState, windowIdentifier, tabId);
  newState[windowIdentifier].tabs[tabId].table[property] = value;
  return newState;
};

/**
 * Updates a specific property of the navigation state for a given window.
 * Creates the window if it doesn't exist. Navigation state is now managed
 * at window level, not tab level.
 *
 * @template T - The type of the navigation property being updated
 * @param prevState - The current window context state
 * @param windowIdentifier - The unique identifier of the window
 * @param property - The navigation property to update (activeLevels, activeTabsByLevel)
 * @param value - The new value for the navigation property
 * @returns A new state object with the updated navigation property
 * 
 * @example
 * // Used in setNavigationActiveLevels:
 * updateNavigationProperty(prevState, "window_123", "activeLevels", [0, 1, 2]);
 */
export const updateNavigationProperty = <T extends keyof NavigationState>(
  prevState: WindowContextState,
  windowIdentifier: string,
  property: T,
  value: NavigationState[T]
): WindowContextState => {
  const newState = { ...prevState };

  if (!newState[windowIdentifier]) {
    const windowId = getWindowIdFromIdentifier(windowIdentifier);
    newState[windowIdentifier] = {
      windowId,
      windowIdentifier,
      isActive: false,
      title: "",
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {},
    };
  }

  newState[windowIdentifier].navigation[property] = value;
  return newState;
};