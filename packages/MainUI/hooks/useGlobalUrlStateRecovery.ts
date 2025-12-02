"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useMetadataStore } from "@/contexts/metadataStore";
import { parseWindowRecoveryData } from "@/utils/url/utils";
import { parseUrlState, getWindowName } from "@/utils/recovery/urlStateParser";
import { calculateHierarchy } from "@/utils/recovery/hierarchyCalculator";
import { reconstructState } from "@/utils/recovery/stateReconstructor";
import { createRecoveryWindowState, getWindowIdFromIdentifier } from "@/utils/window/utils";
import type { WindowState } from "@/utils/window/constants";

/**
 * Global URL state recovery hook for Etendo WorkspaceUI.
 *
 * This hook orchestrates the recovery of multiple window instances from URL parameters,
 * enabling features like:
 * - Page refresh with state preservation
 * - Browser back/forward navigation
 * - Direct URL sharing with full context
 * - Opening new windows from linked items
 *
 * URL Parameter Format:
 * ```
 * /window?wi_0={windowId}_{timestamp}&ti_0={tabId}&ri_0={recordId}&wi_1=...
 * ```
 *
 * Recovery Process:
 * 1. Parse all window parameters from URL (wi_N, ti_N, ri_N)
 * 2. For each window, fetch metadata and reconstruct state in parallel
 * 3. Calculate tab hierarchy (bottom-up from deepest tab)
 * 4. Query parent records to reconstruct complete selections
 * 5. Create WindowState objects with all tabs properly configured
 * 6. Set last window (highest index) as active
 *
 * Performance: Parallel recovery using Promise.all() for multiple windows
 *
 * @returns {Object} Recovery state and control
 * @returns {WindowState[]} recoveredWindows - Array of fully reconstructed window states
 * @returns {boolean} isRecoveryLoading - Loading indicator for UI
 * @returns {string | null} recoveryError - Error message if recovery fails
 * @returns {Function} triggerRecovery - Function to reset guard and allow re-execution
 *
 * @example
 * const { recoveredWindows, isRecoveryLoading, triggerRecovery } = useGlobalUrlStateRecovery();
 *
 * // In WindowProvider
 * useEffect(() => {
 *   if (recoveredWindows.length > 0) {
 *     setWindows(recoveredWindows);
 *   }
 * }, [recoveredWindows]);
 */
export const useGlobalUrlStateRecovery = () => {
  const searchParams = useSearchParams();
  const { loadWindowData } = useMetadataStore();

  const [recoveredWindows, setRecoveredWindows] = useState<WindowState[]>([]);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(true);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Guard to prevent duplicate recovery on mount or re-renders
  // Reset via triggerRecovery() when programmatically adding windows
  const hasRun = useRef(false);

  useEffect(() => {
    // Skip if no URL params or recovery already completed
    if (!searchParams || hasRun.current) return;
    hasRun.current = true;

    const recoverAllWindows = async () => {
      setIsRecoveryLoading(true);
      try {
        // Extract all window identifiers from URL (wi_0, wi_1, wi_2, ...)
        const recoveryDataList = parseWindowRecoveryData(searchParams);

        // No windows to recover - common on initial app load
        if (recoveryDataList.length === 0) {
          setIsRecoveryLoading(false);
          return;
        }

        // Parallel recovery of all windows for better performance
        // Each window recovery is independent and can run concurrently
        const windowPromises = recoveryDataList.map(async (info, index) => {
          const windowId = getWindowIdFromIdentifier(info.windowIdentifier);

          try {
            // Fetch window metadata (cached if previously loaded)
            const metadata = await loadWindowData(windowId);

            let windowState: WindowState;

            if (info.hasRecoveryData) {
              // Complex recovery: URL contains tab and record information
              // This triggers full hierarchy calculation and state reconstruction

              // Step 1: Parse URL state - extract tab and record from URL params
              const urlState = await parseUrlState(info, metadata);

              // Step 2: Calculate hierarchy - build parent chain from deepest tab upward
              const hierarchy = await calculateHierarchy(urlState, metadata);

              // Step 3: Reconstruct state - query parent records bottom-up
              const reconstructed = await reconstructState(hierarchy, metadata);

              // Build complete window state with all tabs configured
              windowState = {
                ...createRecoveryWindowState(info),
                title: urlState.tabTitle,
                initialized: true,
                tabs: reconstructed.tabs,
                navigation: reconstructed.navigation,
                isActive: index === recoveryDataList.length - 1, // Last window is active
              };
            } else {
              // Simple recovery: URL only contains window identifier
              // Create empty window ready for user interaction
              windowState = {
                ...createRecoveryWindowState(info),
                title: getWindowName(metadata),
                initialized: true,
                isActive: index === recoveryDataList.length - 1,
              };
            }
            return windowState;
          } catch (error) {
            console.warn(
              `[Recovery] Failed to recover window ${info.windowIdentifier}, falling back to minimal state.`,
              error
            );

            // Fallback to minimal state
            return {
              ...createRecoveryWindowState(info),
              title: "",
              initialized: true,
              isActive: index === recoveryDataList.length - 1,
            };
          }
        });

        // Wait for all windows to complete recovery
        const windows = await Promise.all(windowPromises);

        setRecoveredWindows(windows);
        setIsRecoveryLoading(false);
      } catch (error) {
        console.error("Global recovery failed", error);
        setRecoveryError("Failed to recover windows");
        setIsRecoveryLoading(false);
      }
    };

    recoverAllWindows();
  }, [searchParams, loadWindowData]);

  /**
   * Triggers recovery to run again by resetting the hasRun guard.
   *
   * Use Case: Opening new windows from linked items
   * When a user clicks a linked item, the application:
   * 1. Calls triggerRecovery() to reset the guard
   * 2. Updates the URL with new window parameters
   * 3. Recovery system detects URL change and re-executes
   * 4. New window is reconstructed with full state
   *
   * This approach leverages the existing recovery system instead of
   * duplicating complex hierarchy calculation and state reconstruction logic.
   *
   * @example
   * // In LinkedItemsSection
   * const { triggerRecovery } = useWindowContext();
   *
   * const handleItemClick = (item) => {
   *   triggerRecovery(); // Reset guard
   *   router.replace(`window?${newUrlParams}`); // Update URL
   *   // Recovery system automatically handles the rest
   * };
   */
  const triggerRecovery = useCallback(() => {
    hasRun.current = false;
  }, []);

  return { recoveredWindows, isRecoveryLoading, recoveryError, triggerRecovery };
};
