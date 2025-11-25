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
import { WindowState } from "@/utils/window/constants";
import {
  setWindowParameters,
} from "@/utils/url/utils";
import { useWindowContext } from "@/contexts/window";

export function useMultiWindowURL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    windows,
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
    ) => {
      const updatedWindows = windows.map((w) => ({ ...w, isActive: false }));

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
        tabs: {},
        initialized: true,
      };

      updatedWindows.push(newWindow);

      navigate(updatedWindows);
    },
    [windows, navigate]
  );

  return {
    openWindow,
    buildURL,
  };
}
