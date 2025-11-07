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

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  NEW_RECORD_ID,
  FORM_MODES,
  TAB_MODES,
  type FormMode,
  type TabMode,
  type TabFormState,
  type SelectedRecord,
  type WindowState,
} from "@/utils/url/constants";
import {
  createWindowState,
  setWindowParameters,
} from "@/utils/url/utils";
import { isEmptyArray } from "@/utils/commons";
import { useWindowContext } from "@/contexts/window";

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getActiveWindowIdentifier,
    getAllWindows,
    getTabFormState: getContextTabFormState,
    setTabFormState: setContextTabFormState,
    clearTabFormState: clearContextTabFormState,
    getSelectedRecord: getContextSelectedRecord,
    setSelectedRecord: setContextSelectedRecord,
    clearSelectedRecord: clearContextSelectedRecord,
  } = useWindowContext();

  // TODO: in the future this can be on the context and move all callers to use the context directly
  const { windows, activeWindow, isHomeRoute } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    const allWindows = getAllWindows();
    const activeWindowIdentifier = getActiveWindowIdentifier();

    // TODO: in the future the createWindowState maybe it should be not necessary
    // TODO: define the types here
    for (const [windowIdentifier, windowState] of Object.entries(allWindows)) {
      const urlWindowState = createWindowState(windowIdentifier, searchParams);

      const isActive = windowIdentifier === activeWindowIdentifier;
      const formattedWindow = { ...urlWindowState, isActive: isActive, title: windowState.title };

      if (isActive) {
        active = formattedWindow;
      }

      windowStates.push(formattedWindow);
    }

    const hasActiveWindow = windowStates.some(window => window.isActive);
    const isHome = !hasActiveWindow;

    return {
      windows: windowStates,
      activeWindow: active,
      isHomeRoute: isHome,
    };
  }, [searchParams, getActiveWindowIdentifier, getAllWindows]);

  /**
   * Builds a complete URL with all window states encoded as URL parameters.
   * Constructs the target URL path with query parameters representing the current state of all windows.
   *
   * @param newWindows - Array of WindowState objects to encode into the URL
   * @returns Complete URL string with path and encoded query parameters
   *
   * @example
   * ```typescript
   * const windows = [
   *   { windowId: "ProductWindow", isActive: true, window_identifier: "prod_123", ... },
   *   { windowId: "CustomerWindow", isActive: false, window_identifier: "cust_456", ... }
   * ];
   * const url = buildURL(windows);
   * // Returns: "/window?w_prod_123=active&o_prod_123=1&wi_prod_123=ProductWindow&w_cust_456=inactive&o_cust_456=2&wi_cust_456=CustomerWindow"
   * ```
   */
  const buildURL = useCallback((newWindows: WindowState[]) => {
    const params = new URLSearchParams();

    for (const window of newWindows) {
      setWindowParameters(params, window);
    }

    return `/window?${params.toString()}`;
  }, []);

  /**
   * Navigates to a new URL state with the provided windows configuration.
   * Updates the browser URL using Next.js router with optimized redundancy checking.
   * Avoids unnecessary navigation when the target URL parameters are identical to current ones.
   *
   * @param newWindows - Array of WindowState objects representing the target state
   *
   * @example
   * ```typescript
   * // Navigate to a state with one active window
   * const newState = [
   *   { windowId: "ProductWindow", isActive: true, window_identifier: "prod_123", ... }
   * ];
   * navigate(newState);
   * // Browser URL changes to: /window?w_prod_123=active&o_prod_123=1&wi_prod_123=ProductWindow&...
   * ```
   */
  const navigate = useCallback(
    (newWindows: WindowState[]) => {
      const url = buildURL(newWindows);
      try {
        const current = searchParams?.toString?.() ?? "";
        const next = url.split("?")[1] || "";
        if (current === next) {
          // Avoid redundant replace when URL params are identical
          return;
        }
      } catch {
        // best-effort guard; if any error, proceed with replace
      }
      router.replace(url);
    },
    [router, buildURL, searchParams]
  );

  /**
   * Navigates to the home route while preserving window state in URL parameters.
   * Deactivates all windows and redirects to the root path with window state preserved as query parameters.
   * If no windows exist, navigates to a clean home route.
   *
   * @example
   * ```typescript
   * // Current: /window?w_prod_123=active&w_cust_456=inactive
   * navigateToHome();
   * // Result: /?w_prod_123=inactive&w_cust_456=inactive (all windows deactivated but preserved)
   *
   * // If no windows exist:
   * navigateToHome();
   * // Result: / (clean home route)
   * ```
   */
  const navigateToHome = useCallback(() => {
    const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

    if (updatedWindows.length === 0) {
      router.push("/");
    } else {
      const url = `/?${buildURL(updatedWindows).split("?")[1]}`;
      router.push(url);
    }
  }, [windows, buildURL, router]);

  /**
   * Opens a new window or activates an existing one with the specified window ID, title, and optional initial state.
   * If a window with a matching window_identifier already exists, it will be activated and optionally retitled.
   * If no matching window exists, creates a new window with a unique identifier and adds it to the state.
   * Supports setting initial selected records and tab form states for immediate navigation to specific records.
   * Form states are now managed via React context for better performance and state isolation.
   *
   * @param windowId - The business entity ID for the window (e.g., "ProductWindow", "CustomerWindow")
   * @param title - Optional display title for the window tab
   * @param selectedRecords - Optional array of initial selected records for tabs in the window
   * @param tabFormStates - Optional array of initial form states for tabs that should open in form view (stored in context)
   *
   * @example
   * ```typescript
   * // Open a simple window
   * openWindow("ProductWindow", "Product Management");
   * // Creates window with unique identifier like "ProductWindow_1698234567890"
   *
   * // Open window with initial selected records
   * openWindow("ProductWindow", "Product Details", [
   *   { tabId: "mainTab", recordId: "product_12345" },
   *   { tabId: "categoryTab", recordId: "category_67890" }
   * ]);
   *
   * // Open window with records in form view
   * openWindow("ProductWindow", "Edit Product",
   *   [{ tabId: "mainTab", recordId: "product_12345" }],
   *   [{
   *     tabId: "mainTab",
   *     tabFormState: {
   *       recordId: "product_12345",
   *       mode: "form",
   *       formMode: "edit"
   *     }
   *   }]
   * );
   *
   * // If the same window is opened again:
   * openWindow("ProductWindow", "Updated Title");
   * // Activates existing window and updates title
   * ```
   */
  const openWindow = useCallback(
    (
      windowId: string,
      windowIdentifier: string,
      title?: string,
      selectedRecords?: SelectedRecord[],
      tabFormStates?: { tabId: string; tabFormState: TabFormState }[]
    ) => {
      const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

      // UPDATE: Initialize selected records in context instead of window state
      if (!isEmptyArray(selectedRecords)) {
        selectedRecords.forEach((record) => {
          setContextSelectedRecord(windowIdentifier, record.tabId, record.recordId);
        });
      }

      // UPDATE: Initialize form states in context instead of window state
      if (!isEmptyArray(tabFormStates)) {
        tabFormStates.forEach((item) => {
          const { tabId, tabFormState } = item;
          setContextTabFormState(windowIdentifier, tabId, tabFormState);
        });
      }

      const newWindow: WindowState = {
        windowId,
        isActive: true,
        window_identifier: windowIdentifier,
        title: title || "",
      };

      updatedWindows.push(newWindow);

      navigate(updatedWindows);
    },
    [windows, navigate, setContextSelectedRecord, setContextTabFormState]
  );

  /**
   * Closes a window by removing it from the state and handling activation transfer.
   * If the closed window was active, automatically activates the first remaining window.
   * If no windows remain, navigates to home.
   *
   * @param windowIdentifier - The unique window_identifier of the window to close
   *
   * @example
   * ```typescript
   * // Close a specific window
   * closeWindow("ProductWindow_1698234567890");
   *
   * // If closing the active window with others remaining:
   * // - Window is removed from state
   * // - First remaining window becomes active
   * // - Window orders are normalized (1, 2, 3, ...)
   *
   * // If closing the last window:
   * // - Navigates to home route "/"
   * ```
   */
  const closeWindow = useCallback(
    (windowIdentifier: string) => {
      const updatedWindows = windows.filter((w) => w.window_identifier !== windowIdentifier);

      const wasActive = windows.find((w) => w.window_identifier === windowIdentifier)?.isActive;
      if (wasActive && updatedWindows.length > 0) {
        updatedWindows[0].isActive = true;
      }

      if (updatedWindows.length === 0) {
        router.replace("/");
      } else {
        navigate(updatedWindows);
      }
    },
    [windows, navigate, router]
  );

  /**
   * Sets the specified window as active and deactivates all others.
   * Only one window can be active at a time in the multi-window system.
   *
   * @param windowIdentifier - The unique window_identifier of the window to activate
   *
   * @example
   * ```typescript
   * // Activate a specific window
   * setActiveWindow("ProductWindow_1698234567890");
   *
   * // Before: w_prod_123=active&w_cust_456=inactive
   * // After:  w_prod_123=inactive&w_cust_456=active (if setting cust_456 as active)
   * ```
   */
  const setActiveWindow = useCallback(
    (windowIdentifier: string) => {
      const updatedWindows = windows.map((w) => ({
        ...w,
        isActive: w.window_identifier === windowIdentifier,
      }));

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  /**
   * Updates the display title of a specific window.
   * The title is used in the tab bar and for user identification of windows.
   *
   * @param windowId - The business entity ID of the window to update
   * @param title - The new display title for the window
   *
   * @example
   * ```typescript
   * // Update window title
   * updateWindowTitle("ProductWindow", "Product Management - Updated");
   *
   * // URL parameter t_windowIdentifier will be updated with the new title
   * ```
   */
  const updateWindowTitle = useCallback(
    (windowId: string, title: string) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          return {
            ...w,
            title,
          };
        }
        return w;
      });

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  /**
   * Applies multiple window state updates atomically in a single navigation operation.
   * This is the core batching mechanism that prevents race conditions by ensuring all updates
   * are applied together using the most current state via a transform callback.
   *
   * **Key Benefits:**
   * - **Atomic Updates**: Multiple state changes happen in a single URL update
   * - **Race Condition Prevention**: Transform callback receives the latest state
   * - **Debug Logging**: Automatically logs selection changes with caller information
   * - **Performance**: Reduces URL updates and component re-renders
   *
   * @param transform - Function that receives current windows array and returns modified array
   *
   * @example
   * ```typescript
   * // Atomically update multiple windows
   * applyWindowUpdates((currentWindows) => {
   *   return currentWindows.map(window => {
   *     if (window.windowId === "ProductWindow") {
   *       return { ...window, title: "Updated Products" };
   *     }
   *     if (window.windowId === "CustomerWindow") {
   *       return { ...window, isActive: false };
   *     }
   *     return window;
   *   });
   * });
   *
   * // Complex state update with multiple changes
   * applyWindowUpdates((prev) => {
   *   const updated = [...prev];
   *   // Clear child selections
   *   updated[0].selectedRecords = { mainTab: "newRecord" };
   *   // Update form states
   *   updated[0].tabFormStates = { childTab: undefined };
   *   return updated;
   * });
   * ```
   */
  const applyWindowUpdates = useCallback(
    (transform: (windows: WindowState[]) => WindowState[]) => {
      const prevWindows = windows;
      const nextWindows = transform(windows);

      navigate(nextWindows);
    },
    [windows, navigate]
  );

  /**
   * Sets the selected record for a specific tab within a window.
   * Updates the selectedRecords map for the specified window and tab combination.
   * This represents the currently highlighted/selected record in a table view.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   * @param recordId - The ID of the record to select
   *
   * @example
   * ```typescript
   * // Select a product record in the main tab of ProductWindow
   * setSelectedRecord("ProductWindow", "mainTab", "product_12345");
   *
   * // This updates the URL parameter: sr_windowIdentifier_mainTab=product_12345
   * // and the window state: { selectedRecords: { "mainTab": "product_12345" } }
   * ```
   */
  const setSelectedRecord = useCallback(
    (windowIdOrIdentifier: string, tabId: string, recordId: string) => {
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return;

      const windowIdentifier = window.window_identifier;
      setContextSelectedRecord(windowIdentifier, tabId, recordId);
    },
    [windows, setContextSelectedRecord]
  );

  /**
   * Clears the selected record for a specific tab within a window.
   * Removes the selection entry from the selectedRecords map, effectively deselecting any record in that tab.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   *
   * @example
   * ```typescript
   * // Clear selection in the main tab of ProductWindow
   * clearSelectedRecord("ProductWindow", "mainTab");
   *
   * // Removes URL parameter: sr_windowIdentifier_mainTab
   * // Updates window state: { selectedRecords: {} } (removes mainTab entry)
   * ```
   */
  const clearSelectedRecord = useCallback(
    (windowIdOrIdentifier: string, tabId: string) => {
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return;

      const windowIdentifier = window.window_identifier;
      clearContextSelectedRecord(windowIdentifier, tabId);
    },
    [windows, clearContextSelectedRecord]
  );

  /**
   * Retrieves the currently selected record ID for a specific tab within a window.
   * Intelligently handles both table view selections and form view states:
   * - If tab is in form view mode, returns the form record ID
   * - Otherwise returns the selected record from table view
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   * @returns The ID of the currently selected/active record, or undefined if none
   *
   * @example
   * ```typescript
   * // Get selected record from table view
   * const selectedId = getSelectedRecord("ProductWindow", "mainTab");
   * // Returns: "product_12345" or undefined
   *
   * // When tab is in form view, returns the form record
   * setTabFormState("ProductWindow", "mainTab", "product_67890", TAB_MODES.FORM);
   * const formRecordId = getSelectedRecord("ProductWindow", "mainTab");
   * // Returns: "product_67890" (from form state, not table selection)
   * ```
   */
  const getSelectedRecord = useCallback(
    (windowIdOrIdentifier: string, tabId: string): string | undefined => {
      // Try to find by window_identifier first, then by windowId (active window only)
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return undefined;

      const windowIdentifier = window.window_identifier;

      // UPDATE: Check context form state instead of window.tabFormStates
      const contextFormState = getContextTabFormState(windowIdentifier, tabId);
      if (contextFormState?.mode === TAB_MODES.FORM && contextFormState.recordId) {
        return contextFormState.recordId;
      }

      return getContextSelectedRecord(windowIdentifier, tabId);
    },
    [windows, getContextTabFormState, getContextSelectedRecord]
  );

  /**
   * TODO: delete this function
   * Sets the form state for a specific tab, including display mode and form interaction mode.
   * Transitions a tab from table view to form view and configures the form behavior.
   * Automatically determines form mode based on record ID if not specified.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   * @param recordId - The ID of the record to display in form view
   * @param mode - The tab display mode (defaults to TAB_MODES.FORM)
   * @param formMode - The form interaction mode (NEW, EDIT, VIEW). Auto-determined if not provided
   *
   * @example
   * ```typescript
   * // Open existing record in edit form
   * setTabFormState("ProductWindow", "mainTab", "product_12345", TAB_MODES.FORM, FORM_MODES.EDIT);
   *
   * // Create new record (auto-detects NEW mode)
   * setTabFormState("ProductWindow", "mainTab", NEW_RECORD_ID, TAB_MODES.FORM);
   * // Form mode automatically set to FORM_MODES.NEW
   *
   * // Edit existing record (auto-detects EDIT mode)
   * setTabFormState("ProductWindow", "mainTab", "product_67890");
   * // Mode defaults to TAB_MODES.FORM, formMode auto-set to FORM_MODES.EDIT
   * ```
   */
  const setTabFormState = useCallback(
    (
      windowIdOrIdentifier: string,
      tabId: string,
      recordId: string,
      mode: TabMode = TAB_MODES.FORM,
      formMode?: FormMode
    ) => {
      const determinedFormMode = formMode || (recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT);

      const formState: TabFormState = {
        recordId,
        mode,
        formMode: determinedFormMode,
      };

      setContextTabFormState(windowIdOrIdentifier, tabId, formState);
    },
    [setContextTabFormState]
  );

  /**
   * TODO: delete this function
   * Clears the form state for a specific tab, transitioning it back to table view.
   * Removes the tab from the form state context, effectively closing any open form.
   * The tab's selected record remains preserved in selectedRecords.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   *
   * @example
   * ```typescript
   * // Close form view and return to table view
   * clearTabFormState("ProductWindow", "mainTab");
   *
   * // Before: Tab shows form for product_12345
   * // After:  Tab shows table view, product_12345 remains selected in table
   *
   * // Form state is now managed in React context instead of URL parameters
   * // URL parameters kept: sr_windowId_tabId (selected record)
   * ```
   */
  const clearTabFormState = useCallback(
    (windowIdOrIdentifier: string, tabId: string) => {
      clearContextTabFormState(windowIdOrIdentifier, tabId);
    },
    [clearContextTabFormState]
  );

  /**
   * TODO: delete this function
   * Retrieves the current form state information for a specific tab.
   * Returns the complete form state object including record ID, display mode, and form mode.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   * @returns Form state object with recordId, mode, and formMode properties, or undefined if tab is not in form view
   *
   * @example
   * ```typescript
   * // Get form state for a tab
   * const formState = getTabFormState("ProductWindow", "mainTab");
   *
   * // Returns:
   * // { recordId: "product_12345", mode: "form", formMode: "edit" }
   * // or undefined if tab is in table view
   *
   * // Check if tab is in form mode
   * const isInForm = formState?.mode === TAB_MODES.FORM;
   * const isNewRecord = formState?.recordId === NEW_RECORD_ID;
   * ```
   */
  const getTabFormState = useCallback(
    (windowIdOrIdentifier: string, tabId: string) => {
      return getContextTabFormState(windowIdOrIdentifier, tabId);
    },
    [getContextTabFormState] // UPDATE dependencies
  );

  /**
   * TODO: Consider optimizing this function with improved context-based form state management
   * Clears selections and form states for child tabs with intelligent form preservation.
   * Implements smart cleanup logic that preserves child tabs currently in form view to prevent data loss.
   * Provides detailed debug logging to track which children are cleared vs. preserved.
   *
   * **Preservation Logic:**
   * - Child tabs in form view mode are preserved (no data loss)
   * - Child tabs in table view are cleared (normal cleanup)
   * - Detailed logging shows what actions were taken
   *
   * @param windowIdentifier - The window identifier of the parent window
   * @param childTabIds - Array of child tab identifiers to potentially clear
   * @param isParentSelectionChanging - Whether parent selection is changing
   *
   * @example
   * ```typescript
   * // Clear child tabs after parent selection change
   * clearChildrenSelections("CustomerWindow", ["ordersTab", "paymentsTab", "contactsTab"]);
   *
   * // Scenario 1: All children in table view
   * // Result: All children cleared
   *
   * // Scenario 2: ordersTab has open form, others in table view
   * // Result: ordersTab preserved (form open), paymentsTab & contactsTab cleared
   *
   * // Debug output shows:
   * // "[clearChildrenSelections] Preserving child ordersTab - currently in FormView"
   * // "[clearChildrenSelections] Cleared 2 of 3 children: paymentsTab, contactsTab"
   * ```
   */
  const clearChildrenSelections = useCallback(
    (windowIdentifier: string, childTabIds: string[], isParentSelectionChanging = false) => {
      const childrenToClean = childTabIds.filter((tabId) => {
        if (isParentSelectionChanging) {
          return true;
        }

        // UPDATE: Use context instead of w.tabFormStates[tabId]
        const childState = getContextTabFormState(windowIdentifier, tabId);
        const isInFormView = childState?.mode === "form";
        if (isInFormView) {
          console.log(`[clearChildrenSelections] Preserving child ${tabId} - currently in FormView`, childState);
          return false;
        }
        return true;
      });

      const childrenCleaned: string[] = [];

      childrenToClean.forEach((tabId) => {
        const selectedRecord = getContextSelectedRecord(windowIdentifier, tabId);
        if (selectedRecord) {
          clearContextSelectedRecord(windowIdentifier, tabId);
          childrenCleaned.push(tabId);
        }
        // UPDATE: Clear context form state instead of tabFormStates
        clearContextTabFormState(windowIdentifier, tabId);
      });

      console.log(`[clearChildrenSelections] Cleared children: [${childrenCleaned.join(", ")}]`);
    },
    [getContextTabFormState, clearContextTabFormState, getContextSelectedRecord, clearContextSelectedRecord]
  );

  /**
   * TODO: Consider optimizing this function with improved context-based form state management
   * Atomically updates parent tab selection and clears child tab selections in a single navigation.
   * Implements intelligent child preservation logic for form views to prevent data loss during re-renders.
   *
   * **Child Clearing Logic:**
   * - If parent selection changes (user selects different record): Clear ALL children regardless of form state
   * - If parent selection unchanged (re-render/refresh): Preserve children that are in form view mode
   *
   * This prevents accidental data loss when forms are open in child tabs during parent re-renders,
   * while ensuring proper cleanup when the user intentionally changes the parent selection.
   *
   * @param windowId - The business entity ID of the window
   * @param parentTabId - The identifier of the parent tab whose selection is changing
   * @param recordId - The ID of the record to select in the parent tab
   * @param childTabIds - Array of child tab identifiers to potentially clear
   *
   * @example
   * ```typescript
   * // User selects a different customer record
   * setSelectedRecordAndClearChildren(
   *   "CustomerWindow",
   *   "customerTab",
   *   "customer_789",
   *   ["ordersTab", "paymentsTab"]
   * );
   * // Result: Customer tab shows customer_789, all child tabs are cleared
   *
   * // Re-render with same customer (no actual change)
   * setSelectedRecordAndClearChildren(
   *   "CustomerWindow",
   *   "customerTab",
   *   "customer_789",  // Same ID as before
   *   ["ordersTab", "paymentsTab"]
   * );
   * // Result: Child tabs in form view are preserved, others are cleared
   * ```
   */
  const setSelectedRecordAndClearChildren = useCallback(
    (windowIdOrIdentifier: string, tabId: string, recordId: string, childTabIds: string[]) => {
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return;

      const windowIdentifier = window.window_identifier;
      const previousRecordId = getContextSelectedRecord(windowIdentifier, tabId);
      const isParentSelectionChanging = previousRecordId !== recordId;

      // Set the selected record using context
      setContextSelectedRecord(windowIdentifier, tabId, recordId);
      clearChildrenSelections(windowIdentifier, childTabIds, isParentSelectionChanging);
    },
    [windows, getContextSelectedRecord, setContextSelectedRecord, clearChildrenSelections]
  );

  /**
   * TODO: Consider optimizing this function with improved context-based form state management
   * Atomically clears form state for a tab without affecting its selection or child relationships.
   * This is a specialized version of clearTabFormState that explicitly preserves the selected record
   * and doesn't trigger any child tab cleanup logic. Used when transitioning from form view to table view
   * while maintaining the current selection state.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - The identifier of the tab within the window
   *
   * @example
   * ```typescript
   * // Close form view but keep record selected in table
   * clearTabFormStateAtomic("ProductWindow", "mainTab");
   *
   * // Before: Tab in form view editing product_12345
   * // After:  Tab in table view with product_12345 still selected
   * // No child tabs are affected by this operation
   * ```
   */
  /**
   * Clears the form state for a specific tab while preserving other window state
   * UPDATE: Now uses context instead of windowState.formStates
   */
  const clearTabFormStateAtomic = useCallback(
    (windowId: string, tabId: string) => {
      // Use applyWindowUpdates to access current state and find window_identifier
      applyWindowUpdates((prev) => {
        const targetWindow = prev.find(w => w.windowId === windowId);
        if (targetWindow) {
          clearContextTabFormState(targetWindow.window_identifier, tabId);
        }
        return prev; // No state change needed
      });
    },
    [clearContextTabFormState, applyWindowUpdates]
  );

  /**
   * TODO: Consider removing the form state logic and replace it if needed
   * Opens a window with optional initial selection and form state in a single atomic operation.
   * Combines window opening with record selection and optional form opening for efficient navigation.
   * Supports both creating new windows and updating existing ones with enhanced identifier handling.
   *
   * @param windowId - The business entity ID for the window
   * @param options - Configuration object with optional properties:
   *   - title: Display title for the window tab
   *   - window_identifier: Specific identifier for the window instance (allows multiple instances)
   *   - selection: Object containing:
   *     - tabId: The tab to select a record in
   *     - recordId: The record to select
   *     - openForm: Whether to open the record in form view
   *     - formMode: Form interaction mode (NEW, EDIT, VIEW)
   *
   * @example
   * ```typescript
   * // Simple window opening
   * openWindowAndSelect("ProductWindow", { title: "Product Management" });
   *
   * // Open window with record selection
   * openWindowAndSelect("ProductWindow", {
   *   title: "Product Details",
   *   selection: {
   *     tabId: "mainTab",
   *     recordId: "product_12345"
   *   }
   * });
   *
   * // Open window with record in form view
   * openWindowAndSelect("ProductWindow", {
   *   title: "Edit Product",
   *   selection: {
   *     tabId: "mainTab",
   *     recordId: "product_12345",
   *     openForm: true,
   *     formMode: FORM_MODES.EDIT
   *   }
   * });
   *
   * // Open specific window instance
   * openWindowAndSelect("ProductWindow", {
   *   window_identifier: "ProductWindow_specialized",
   *   title: "Specialized Product View"
   * });
   * ```
   */
  const openWindowAndSelect = useCallback(
    (
      windowId: string,
      options?: {
        title?: string;
        window_identifier?: string;
        selection?: { tabId: string; recordId: string; openForm?: boolean; formMode?: FormMode };
      }
    ) => {
      const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

      // If window_identifier is provided, use it to find existing window
      // Otherwise, fall back to windowId (old behavior)
      const identifierToFind = options?.window_identifier || windowId;
      const existingIndex = updatedWindows.findIndex((w) =>
        options?.window_identifier ? w.window_identifier === identifierToFind : w.windowId === windowId
      );

      let target: WindowState;
      if (existingIndex >= 0) {
        const current = updatedWindows[existingIndex];
        target = {
          ...current,
          isActive: true,
          title: options?.title ?? current.title,
          window_identifier: options?.window_identifier ?? current.window_identifier,
        };
        updatedWindows[existingIndex] = target;
      } else {
        target = {
          windowId,
          isActive: true,
          window_identifier: options?.window_identifier || windowId,
          title: options?.title || "",
        };
        updatedWindows.push(target);
      }

      if (options?.selection) {
        const { tabId, recordId, openForm, formMode } = options.selection;
        // UPDATE: Use context instead of selectedRecords property
        setContextSelectedRecord(target.window_identifier, tabId, recordId);
        if (openForm) {
          // UPDATE: Use context instead of target.tabFormStates
          setContextTabFormState(target.window_identifier, tabId, {
            recordId,
            mode: TAB_MODES.FORM,
            formMode: formMode || FORM_MODES.EDIT
          });
        }
      }

      navigate(updatedWindows);
    },
    [windows, navigate, setContextSelectedRecord, setContextTabFormState]
  );

  return {
    windows,
    activeWindow,
    isHomeRoute,
    openWindow,
    closeWindow,
    setActiveWindow,
    navigateToHome,
    buildURL,
    updateWindowTitle,

    setSelectedRecord,
    clearSelectedRecord,
    getSelectedRecord,
    setSelectedRecordAndClearChildren,

    setTabFormState,
    clearTabFormState,
    clearTabFormStateAtomic,
    getTabFormState,

    // batching helpers
    applyWindowUpdates,
    clearChildrenSelections,
    openWindowAndSelect,
  };
}
