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
  generateSelectedRecords,
  generateTabFormStates,
  extractWindowIds,
  createWindowState,
  setWindowParameters,
  getNextOrder,
  normalizeWindowOrders
} from "@/utils/url/utils";
import { isEmptyArray } from "@/utils/commons";
import { useWindowContext } from "@/contexts/window";

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // TODO: delete this on the future and move all to the context
  const { getActiveWindow } = useWindowContext();

  const { windows, activeWindow, isHomeRoute } = useMemo(() => {
    const windowStates: WindowState[] = [];
    let active: WindowState | undefined;

    const windowIdentifiers = extractWindowIds(searchParams);
    const activeWindowIdentifier = getActiveWindow();

    for (const windowIdentifier of windowIdentifiers) {
      const windowState = createWindowState(windowIdentifier, searchParams);

      if (windowIdentifier === activeWindowIdentifier) {
        active = windowState;
        windowState.isActive = true;
      } else {
        windowState.isActive = false;
      }

      windowStates.push(windowState);
    }

    // TODO: use ORDER_PREFIX to order
    // NOTE: in the new login we assume that the order is given by the order of appearance in the URL
    const orderedStates = [...windowStates].sort((a, b) => a.order - b.order);

    const hasActiveWindow = windowStates.some(window => window.isActive);
    const isHome = !hasActiveWindow;

    return {
      windows: orderedStates,
      activeWindow: active,
      isHomeRoute: isHome,
    };
  }, [searchParams, getActiveWindow]);

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
   *   { windowId: "ProductWindow", isActive: true, order: 1, window_identifier: "prod_123", ... },
   *   { windowId: "CustomerWindow", isActive: false, order: 2, window_identifier: "cust_456", ... }
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
   *   { windowId: "ProductWindow", isActive: true, order: 1, window_identifier: "prod_123", ... }
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
   *
   * @param windowId - The business entity ID for the window (e.g., "ProductWindow", "CustomerWindow")
   * @param title - Optional display title for the window tab
   * @param selectedRecords - Optional array of initial selected records for tabs in the window
   * @param tabFormStates - Optional array of initial form states for tabs that should open in form view
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

      const nextOrder = getNextOrder(updatedWindows);

      const selectedRecordsRes = isEmptyArray(selectedRecords) ? {} : generateSelectedRecords(selectedRecords);
      const tabFormStatesRes = isEmptyArray(tabFormStates) ? {} : generateTabFormStates(tabFormStates);

      const newWindow: WindowState = {
        windowId,
        isActive: true,
        order: nextOrder,
        window_identifier: windowIdentifier,
        title,
        selectedRecords: selectedRecordsRes,
        tabFormStates: tabFormStatesRes,
      };

      updatedWindows.push(newWindow);

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  /**
   * Closes a window by removing it from the state and handling activation transfer.
   * If the closed window was active, automatically activates the first remaining window.
   * Normalizes window order numbers after removal. If no windows remain, navigates to home.
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

      const normalizedWindows = normalizeWindowOrders(updatedWindows);

      if (normalizedWindows.length === 0) {
        router.replace("/");
      } else {
        navigate(normalizedWindows);
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
      const stack = new Error().stack;
      const caller = stack?.split("\n")[2]?.trim() || "unknown";

      const prevWindows = windows;
      const nextWindows = transform(windows);

      // Log changes in selectedRecords for debugging
      prevWindows.forEach((prevWin, idx) => {
        const nextWin = nextWindows[idx];
        if (nextWin && prevWin.windowId === nextWin.windowId) {
          const prevSelected = prevWin.selectedRecords;
          const nextSelected = nextWin.selectedRecords;

          // Check for removed selections
          for (const tabId of Object.keys(prevSelected)) {
            if (prevSelected[tabId] && !nextSelected[tabId]) {
              console.log(
                `[applyWindowUpdates] REMOVED selection for tab ${tabId}: ${prevSelected[tabId]} -> undefined`
              );
              console.log(`[applyWindowUpdates] Caller: ${caller}`);
            }
          }
        }
      });

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
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          // Check if parameter is windowId or window_identifier
          // For windowId, only update the active window to avoid affecting multiple instances
          const shouldUpdate =
            w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive);

          if (shouldUpdate) {
            return {
              ...w,
              selectedRecords: {
                ...w.selectedRecords,
                [tabId]: recordId,
              },
            };
          }
          return w;
        });
      });
    },
    [applyWindowUpdates]
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
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          // Check if parameter is windowId or window_identifier
          // For windowId, only update the active window to avoid affecting multiple instances
          const shouldUpdate =
            w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive);

          if (shouldUpdate) {
            const newSelectedRecords = { ...w.selectedRecords };
            delete newSelectedRecords[tabId];

            return {
              ...w,
              selectedRecords: newSelectedRecords,
            };
          }
          return w;
        });
      });
    },
    [applyWindowUpdates]
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
      // Always read from current windows state, not searchParams
      // searchParams can be stale during intermediate renders

      // Try to find by window_identifier first, then by windowId (active window only)
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return undefined;

      // If tab is in FormView, get recordId from tabFormStates
      // Otherwise get it from selectedRecords
      const tabFormState = window.tabFormStates[tabId];
      if (tabFormState?.mode === TAB_MODES.FORM && tabFormState.recordId) {
        return tabFormState.recordId;
      }

      return window.selectedRecords[tabId];
    },
    [windows]
  );

  /**
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
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          // Check if parameter is windowId or window_identifier
          // For windowId, only update the active window to avoid affecting multiple instances
          const shouldUpdate =
            w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive);

          if (shouldUpdate) {
            const currentTabState = w.tabFormStates[tabId] || {};

            return {
              ...w,
              selectedRecords: {
                ...w.selectedRecords,
                [tabId]: recordId,
              },
              tabFormStates: {
                ...w.tabFormStates,
                [tabId]: {
                  ...currentTabState,
                  recordId,
                  mode,
                  formMode: formMode || (recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT),
                },
              },
            };
          }
          return w;
        });
      });
    },
    [applyWindowUpdates]
  );

  /**
   * Clears the form state for a specific tab, transitioning it back to table view.
   * Removes the tab from the tabFormStates map, effectively closing any open form.
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
   * // URL parameters removed: tfr_windowId_tabId, tm_windowId_tabId, tfm_windowId_tabId
   * // URL parameters kept: sr_windowId_tabId (selected record)
   * ```
   */
  const clearTabFormState = useCallback(
    (windowIdOrIdentifier: string, tabId: string) => {
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          // Check if parameter is windowId or window_identifier
          // For windowId, only update the active window to avoid affecting multiple instances
          const shouldUpdate =
            w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive);

          if (shouldUpdate) {
            const newTabFormStates = { ...w.tabFormStates };
            delete newTabFormStates[tabId];

            return {
              ...w,
              tabFormStates: newTabFormStates,
            };
          }
          return w;
        });
      });
    },
    [applyWindowUpdates]
  );

  /**
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
      // Try to find by window_identifier first, then by windowId (active window only)
      const window = windows.find(
        (w) => w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      return window?.tabFormStates[tabId];
    },
    [windows]
  );

  /**
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
    (windowIdentifier: string, childTabIds: string[]) => {
      // Log who called this function with stack trace
      const stack = new Error().stack;
      const caller = stack?.split("\n")[2]?.trim() || "unknown";
      console.log(`[clearChildrenSelections] Called with ${childTabIds.length} children: ${childTabIds.join(", ")}`);
      console.log(`[clearChildrenSelections] Caller: ${caller}`);

      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          if (w.window_identifier !== windowIdentifier) return w;

          // Filter out children that are currently in FormView - don't clear them
          const childrenToClean = childTabIds.filter((tabId) => {
            const childState = w.tabFormStates[tabId];
            const isInFormView = childState?.mode === "form";
            if (isInFormView) {
              console.log(`[clearChildrenSelections] Preserving child ${tabId} - currently in FormView`, childState);
              return false; // Don't clear this child
            }
            return true; // Clear this child
          });

          if (childrenToClean.length === 0) {
            console.log("[clearChildrenSelections] All children preserved, no changes");
            return w; // No children to clean, return unchanged
          }

          const newSelected = { ...w.selectedRecords };
          const newTabStates = { ...w.tabFormStates } as Record<
            string,
            { recordId?: string; mode?: TabMode; formMode?: FormMode }
          >;

          for (const tabId of childrenToClean) {
            delete newSelected[tabId];
            delete newTabStates[tabId];
          }

          console.log(
            `[clearChildrenSelections] Cleared ${childrenToClean.length} of ${childTabIds.length} children: ${childrenToClean.join(", ")}`
          );
          return { ...w, selectedRecords: newSelected, tabFormStates: newTabStates };
        });
      });
    },
    [applyWindowUpdates]
  );

  /**
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
    (windowIdOrIdentifier: string, parentTabId: string, recordId: string, childTabIds: string[]) => {
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          // Check if parameter is windowId or window_identifier
          // For windowId, only update the active window to avoid affecting multiple instances
          const shouldUpdate =
            w.window_identifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive);

          if (!shouldUpdate) return w;

          const previousParentSelection = w.selectedRecords[parentTabId];
          const isParentSelectionChanging = previousParentSelection !== recordId;

          const newSelected = { ...w.selectedRecords, [parentTabId]: recordId };
          const newTabStates = { ...w.tabFormStates } as Record<
            string,
            { recordId?: string; mode?: TabMode; formMode?: FormMode }
          >;

          // Only preserve children in FormView if parent selection is NOT changing
          // If parent selection IS changing (user clicked a different record), clear all children
          const childrenToClean = childTabIds.filter((tabId) => {
            if (isParentSelectionChanging) {
              // Parent changed to a different record - clear all children regardless of FormView
              return true;
            }

            // Parent selection unchanged (refresh/re-render) - preserve children in FormView
            const childState = w.tabFormStates[tabId];
            const isInFormView = childState?.mode === "form";
            if (isInFormView) {
              console.log(
                `[setSelectedRecordAndClearChildren] Preserving child ${tabId} - parent selection unchanged and child in FormView`
              );
              return false; // Don't clear this child
            }
            return true; // Clear this child
          });

          // Clear only children that should be cleared
          for (const tabId of childrenToClean) {
            delete newSelected[tabId];
            delete newTabStates[tabId];
          }

          if (!isParentSelectionChanging && childrenToClean.length < childTabIds.length) {
            console.log(
              `[setSelectedRecordAndClearChildren] Parent unchanged - cleared ${childrenToClean.length} of ${childTabIds.length} children (${childTabIds.length - childrenToClean.length} preserved in FormView)`
            );
          } else if (isParentSelectionChanging) {
            console.log(
              `[setSelectedRecordAndClearChildren] Parent changed from ${previousParentSelection} to ${recordId} - cleared all ${childTabIds.length} children`
            );
          }

          const result = { ...w, selectedRecords: newSelected, tabFormStates: newTabStates };
          console.log("[setSelectedRecordAndClearChildren] Result tabFormStates:", result.tabFormStates);
          return result;
        });
      });
    },
    [applyWindowUpdates]
  );

  /**
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
  const clearTabFormStateAtomic = useCallback(
    (windowId: string, tabId: string) => {
      applyWindowUpdates((prev) => {
        return prev.map((w) => {
          if (w.windowId !== windowId) return w;

          const newTabStates = { ...w.tabFormStates };
          delete newTabStates[tabId]; // Only delete FormView state, keep selection

          return {
            ...w,
            tabFormStates: newTabStates,
            // Explicitly preserve selectedRecords to ensure selection is not lost
            selectedRecords: { ...w.selectedRecords },
          };
        });
      });
    },
    [applyWindowUpdates]
  );

  /**
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
      applyWindowUpdates((prev) => {
        const updated = prev.map((w) => ({ ...w, isActive: false }));

        // If window_identifier is provided, use it to find existing window
        // Otherwise, fall back to windowId (old behavior)
        const identifierToFind = options?.window_identifier || windowId;
        const existingIndex = updated.findIndex((w) =>
          options?.window_identifier ? w.window_identifier === identifierToFind : w.windowId === windowId
        );

        let target: WindowState;
        if (existingIndex >= 0) {
          const current = updated[existingIndex];
          target = {
            ...current,
            isActive: true,
            title: options?.title ?? current.title,
            window_identifier: options?.window_identifier ?? current.window_identifier,
          };
          updated[existingIndex] = target;
        } else {
          const nextOrder = getNextOrder(updated);
          target = {
            windowId,
            isActive: true,
            order: nextOrder,
            window_identifier: options?.window_identifier || windowId,
            title: options?.title,
            selectedRecords: {},
            tabFormStates: {},
          };
          updated.push(target);
        }

        if (options?.selection) {
          const { tabId, recordId, openForm, formMode } = options.selection;
          target.selectedRecords = { ...target.selectedRecords, [tabId]: recordId };
          if (openForm) {
            target.tabFormStates = {
              ...target.tabFormStates,
              [tabId]: { recordId, mode: TAB_MODES.FORM, formMode: formMode || FORM_MODES.EDIT },
            };
          }
        }
        return updated;
      });
    },
    [applyWindowUpdates]
  );

  /**
   * Sets a record for editing at either the window level or a specific tab level.
   * Provides a unified interface for setting form records regardless of the target scope.
   * Automatically determines the appropriate form mode based on the record ID.
   *
   * @param windowId - The business entity ID of the window
   * @param recordId - The ID of the record to set for editing
   * @param tabId - Optional tab identifier. If provided, sets record at tab level; otherwise at window level
   *
   * @example
   * ```typescript
   * // Set record at window level (main window form)
   * setRecord("ProductWindow", "product_12345");
   * // Sets: formRecordId and formMode at window level
   *
   * // Set record at tab level (tab form)
   * setRecord("ProductWindow", "product_67890", "mainTab");
   * // Delegates to: setTabFormState(windowId, tabId, recordId, FORM, EDIT)
   *
   * // Create new record
   * setRecord("ProductWindow", NEW_RECORD_ID, "mainTab");
   * // Automatically sets formMode to FORM_MODES.NEW
   * ```
   */
  const setRecord = useCallback(
    (windowId: string, recordId: string, tabId?: string) => {
      if (tabId) {
        const formMode: FormMode = recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT;
        setTabFormState(windowId, tabId, recordId, TAB_MODES.FORM, formMode);
      } else {
        applyWindowUpdates((prev) => {
          return prev.map((w) => {
            if (w.windowId === windowId) {
              return {
                ...w,
                formRecordId: recordId,
                formMode: recordId === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT,
              };
            }
            return w;
          });
        });
      }
    },
    [applyWindowUpdates, setTabFormState]
  );

  /**
   * Clears a record from either the window level or a specific tab level.
   * Provides a unified interface for clearing form records regardless of the target scope.
   *
   * @param windowId - The business entity ID of the window
   * @param tabId - Optional tab identifier. If provided, clears record at tab level; otherwise at window level
   *
   * @example
   * ```typescript
   * // Clear record at window level (close main window form)
   * clearRecord("ProductWindow");
   * // Removes: formRecordId and formMode from window state
   *
   * // Clear record at tab level (close tab form)
   * clearRecord("ProductWindow", "mainTab");
   * // Delegates to: clearTabFormState(windowId, tabId)
   * // Tab returns to table view, selected record preserved
   * ```
   */
  const clearRecord = useCallback(
    (windowId: string, tabId?: string) => {
      if (tabId) {
        clearTabFormState(windowId, tabId);
      } else {
        applyWindowUpdates((prev) => {
          return prev.map((w) => {
            if (w.windowId === windowId) {
              const { formMode, formRecordId, ...rest } = w;
              return rest;
            }
            return w;
          });
        });
      }
    },
    [applyWindowUpdates, clearTabFormState]
  );

  /**
   * Changes the display order of a specific window in the tab bar.
   * Updates the window's order number and automatically normalizes all window orders
   * to ensure sequential numbering (1, 2, 3, etc.) without gaps.
   *
   * @param windowId - The business entity ID of the window to reorder
   * @param newOrder - The new order position for the window
   *
   * @example
   * ```typescript
   * // Move ProductWindow to position 3
   * reorderWindows("ProductWindow", 3);
   *
   * // Before: [CustomerWindow(1), ProductWindow(2), OrderWindow(3)]
   * // After:  [CustomerWindow(1), OrderWindow(2), ProductWindow(3)]
   * // Note: Orders are normalized to maintain sequential numbering
   *
   * // Move window to first position
   * reorderWindows("OrderWindow", 1);
   * // Result: OrderWindow becomes first, others shift right
   * ```
   */
  const reorderWindows = useCallback(
    (windowId: string, newOrder: number) => {
      const updatedWindows = windows.map((w) => {
        if (w.windowId === windowId) {
          return { ...w, order: newOrder };
        }
        return w;
      });

      const normalizedWindows = normalizeWindowOrders(updatedWindows);
      navigate(normalizedWindows);
    },
    [windows, navigate]
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

    setRecord,
    clearRecord,

    reorderWindows,
    getNextOrder,

    // batching helpers
    applyWindowUpdates,
    clearChildrenSelections,
    openWindowAndSelect,
  };
}
