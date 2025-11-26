"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWindowContext } from "@/contexts/window";
import { parseWindowRecoveryData } from "@/utils/url/utils";
import { parseUrlState } from "@/utils/recovery/urlStateParser";
import { calculateHierarchy } from "@/utils/recovery/hierarchyCalculator";
import { reconstructState } from "@/utils/recovery/stateReconstructor";
import { handleRecoveryError } from "@/utils/recovery/errorHandler";
import type { WindowRecoveryInfo, RecoveryState } from "@/utils/window/constants";
import type { WindowMetadata } from "@workspaceui/api-client/src/api/types";

/**
 * Parameters for the URL state recovery hook.
 *
 * @property windowIdentifier - Unique identifier for the window instance (e.g., "143_123456")
 * @property windowData - Complete window metadata from the backend (required for complex recovery)
 * @property enabled - Controls when recovery should be attempted (typically when window is uninitialized and metadata is loaded)
 */
interface UseUrlStateRecoveryParams {
  windowIdentifier: string;
  windowData: WindowMetadata | undefined;
  enabled: boolean;
}

/**
 * Return values from the URL state recovery hook.
 *
 * @property isRecovering - Indicates if recovery is currently in progress (used to show loading states)
 * @property recoveryError - User-friendly error message if recovery failed, null otherwise
 * @property recoveryState - Current state of the recovery process: "not_started" | "in_progress" | "completed" | "failed"
 */
interface UseUrlStateRecoveryReturn {
  isRecovering: boolean;
  recoveryError: string | null;
  recoveryState: RecoveryState;
}

/**
 * Hook for recovering window state from URL parameters after page reload or direct navigation.
 *
 * **Purpose:**
 * Hydrates "phantom windows" (created by WindowProvider from URL params) with their complete state,
 * enabling deep-linking to specific records within hierarchical tab structures.
 *
 * **How it works:**
 * 1. Detects if current window has recovery data in URL (windowIdentifier, tabId, recordId)
 * 2. **Simple recovery**: If only windowIdentifier exists, marks window as initialized with default state
 * 3. **Complex recovery**: If tabId and recordId exist:
 *    - Calls backend to get window/tab/record information (parseUrlState)
 *    - Calculates complete tab hierarchy from root to target tab (calculateHierarchy)
 *    - Reconstructs full navigation state including parent selections (reconstructState)
 *    - Updates phantom window with recovered tabs and navigation state
 * 4. **Error handling**: On failure, gracefully degrades to default state and cleans URL parameters
 *
 * @param params - Configuration object with windowIdentifier, windowData, and enabled flag
 * @returns Recovery state with isRecovering flag, error message, and current recovery state
 */
export const useUrlStateRecovery = ({
  windowIdentifier,
  windowData,
  enabled,
}: UseUrlStateRecoveryParams): UseUrlStateRecoveryReturn => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("not_started");

  const searchParams = useSearchParams();
  const { setWindowActive } = useWindowContext();

  /**
   * Performs the actual recovery operation for a window.
   *
   * **Recovery Scenarios:**
   * - **No recovery data** (hasRecoveryData=false): Only windowIdentifier in URL → Initialize with default state
   * - **Full recovery data** (hasRecoveryData=true): windowIdentifier + tabId + recordId → Reconstruct complete state
   *
   * **Process:**
   * 1. Sets recovery flags (isRecovering, state=in_progress)
   * 2. For simple case: marks window as initialized
   * 3. For complex case:
   *    - Fetches window action data from backend
   *    - Calculates tab hierarchy (root → parents → target)
   *    - Reconstructs state with proper tab selections and navigation
   *    - Updates phantom window with recovered data
   * 4. On error: logs, cleans URL, marks window as initialized with default state (graceful degradation)
   *
   * @param recoveryInfo - Window recovery information extracted from URL parameters
   */
  const performRecovery = useCallback(
    async (recoveryInfo: WindowRecoveryInfo) => {
      try {
        console.log("Starting individual window recovery for:", windowIdentifier);
        setIsRecovering(true);
        setRecoveryState("in_progress");
        setRecoveryError(null);

        // Window already exists as phantom - just update it
        if (!recoveryInfo.hasRecoveryData) {
          // Simple case: just mark as initialized
          setWindowActive({
            windowIdentifier,
            windowData: { initialized: true },
          });
          setRecoveryState("completed");
          setIsRecovering(false);
          return;
        }

        if (!windowData) {
          throw new Error("Window metadata is required for URL state recovery.");
        }

        // Complex case: perform full recovery
        const urlState = await parseUrlState(recoveryInfo);
        const hierarchy = await calculateHierarchy(urlState, windowData);
        const reconstructedState = await reconstructState(hierarchy, windowData);

        // Update existing phantom window with recovered state
        setWindowActive({
          windowIdentifier,
          windowData: {
            title: urlState.tabTitle,
            initialized: true,
            tabs: reconstructedState.tabs,
            navigation: reconstructedState.navigation,
          },
        });

        setRecoveryState("completed");
        setIsRecovering(false);
      } catch (error) {
        console.log("Error during URL state recovery:", error);
        const errorMessage = await handleRecoveryError(error, recoveryInfo);
        setRecoveryError(errorMessage);
        setRecoveryState("failed");
        setIsRecovering(false);

        // Fallback: mark phantom window as initialized with default state
        setWindowActive({
          windowIdentifier,
          windowData: { initialized: true },
        });
      }
    },
    [windowIdentifier, windowData, setWindowActive]
  );

  /**
   * Main effect that triggers recovery when conditions are met.
   *
   * **Execution conditions:**
   * - `enabled` is true (controlled by parent component, typically when window is uninitialized)
   * - `searchParams` are available (Next.js router has loaded URL parameters)
   * - `windowData` is loaded (window metadata fetched from backend)
   *
   * **Flow:**
   * 1. Parses all window recovery data from URL search parameters
   * 2. Finds recovery info for current windowIdentifier
   * 3. If found → triggers performRecovery
   * 4. If not found → marks window as initialized with default state (no URL recovery needed)
   *
   * **Re-execution control:**
   * Effect only re-runs if dependencies change. In practice, this typically runs once per window
   * when it first mounts in an uninitialized state with URL parameters present.
   */
  useEffect(() => {
    if (!enabled || !searchParams || !windowData) return;

    const recoveryData = parseWindowRecoveryData(searchParams);
    const currentWindowRecovery = recoveryData.find((info) => info.windowIdentifier === windowIdentifier);

    if (currentWindowRecovery) {
      performRecovery(currentWindowRecovery);
    } else {
      // No recovery needed - just mark as initialized
      setWindowActive({
        windowIdentifier,
        windowData: { initialized: true },
      });
    }
  }, [enabled, searchParams, windowData, windowIdentifier, performRecovery, setWindowActive]);

  return {
    isRecovering,
    recoveryError,
    recoveryState,
  };
};
