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
import { useCallback } from "react";
import {
  type TabFormState,
  type SelectedRecord,
} from "@/utils/url/constants";
import { WindowState } from "@/utils/window/constants";
import {
  setWindowParameters,
} from "@/utils/url/utils";
import { isEmptyArray } from "@/utils/commons";
import { useWindowContext } from "@/contexts/window";

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    windows,
    getTabFormState,
    setTabFormState,
    clearTabFormState,
    getSelectedRecord,
    setSelectedRecord,
    clearSelectedRecord,
  } = useWindowContext();

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
   *   { windowId: "ProductWindow", isActive: true, windowIdentifier: "prod_123", ... },
   *   { windowId: "CustomerWindow", isActive: false, windowIdentifier: "cust_456", ... }
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
   *   { windowId: "ProductWindow", isActive: true, windowIdentifier: "prod_123", ... }
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
   * If a window with a matching windowIdentifier already exists, it will be activated and optionally retitled.
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
          setSelectedRecord(windowIdentifier, record.tabId, record.recordId);
        });
      }

      // UPDATE: Initialize form states in context instead of window state
      if (!isEmptyArray(tabFormStates)) {
        tabFormStates.forEach((item) => {
          const { tabId, tabFormState } = item;
          setTabFormState(windowIdentifier, tabId, tabFormState);
        });
      }

      const newWindow: WindowState = {
        windowId,
        isActive: true,
        windowIdentifier: windowIdentifier,
        title: title || "",
        navigation: {
          activeLevels: [],
          activeTabsByLevel: new Map<number, string>(),
          initialized: false,
        },
        tabs: {}
      };

      updatedWindows.push(newWindow);

      navigate(updatedWindows);
    },
    [windows, navigate, setSelectedRecord, setTabFormState]
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
        const childState = getTabFormState(windowIdentifier, tabId);
        const isInFormView = childState?.mode === "form";
        if (isInFormView) {
          console.log(`[clearChildrenSelections] Preserving child ${tabId} - currently in FormView`, childState);
          return false;
        }
        return true;
      });

      const childrenCleaned: string[] = [];

      childrenToClean.forEach((tabId) => {
        const selectedRecord = getSelectedRecord(windowIdentifier, tabId);
        if (selectedRecord) {
          clearSelectedRecord(windowIdentifier, tabId);
          childrenCleaned.push(tabId);
        }
        // UPDATE: Clear context form state instead of tabFormStates
        clearTabFormState(windowIdentifier, tabId);
      });

      console.log(`[clearChildrenSelections] Cleared children: [${childrenCleaned.join(", ")}]`);
    },
    [getTabFormState, clearTabFormState, getSelectedRecord, clearSelectedRecord]
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
        (w) => w.windowIdentifier === windowIdOrIdentifier || (w.windowId === windowIdOrIdentifier && w.isActive)
      );
      if (!window) return;

      const windowIdentifier = window.windowIdentifier;
      const previousRecordId = getSelectedRecord(windowIdentifier, tabId);
      const isParentSelectionChanging = previousRecordId !== recordId;

      // Set the selected record using context
      setSelectedRecord(windowIdentifier, tabId, recordId);
      clearChildrenSelections(windowIdentifier, childTabIds, isParentSelectionChanging);
    },
    [windows, getSelectedRecord, setSelectedRecord, clearChildrenSelections]
  );

  return {
    openWindow,
    navigateToHome,
    buildURL,

    setSelectedRecordAndClearChildren,

    // batching helpers
    clearChildrenSelections,
  };
}
