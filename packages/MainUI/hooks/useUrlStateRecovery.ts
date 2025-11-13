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

interface UseUrlStateRecoveryParams {
  windowId: string;
  windowIdentifier: string;
  windowData: WindowMetadata | null;
  enabled: boolean;
}

interface UseUrlStateRecoveryReturn {
  isRecovering: boolean;
  recoveryError: string | null;
  recoveryState: RecoveryState;
}

export const useUrlStateRecovery = ({
  windowId,
  windowIdentifier,
  windowData,
  enabled
}: UseUrlStateRecoveryParams): UseUrlStateRecoveryReturn => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("not_started");

  const searchParams = useSearchParams();
  const windowContext = useWindowContext();

  const performRecovery = useCallback(async (recoveryInfo: WindowRecoveryInfo) => {
    try {
      console.log("Starting individual window recovery for:", windowIdentifier);
      setIsRecovering(true);
      setRecoveryState("in_progress");
      setRecoveryError(null);

      // Window already exists as phantom - just update it
      if (!recoveryInfo.hasRecoveryData) {
        // Simple case: just mark as initialized
        windowContext.setWindowActive({
          windowIdentifier,
          windowData: { initialized: true }
        });
        setRecoveryState("completed");
        setIsRecovering(false);
        return;
      }

      // Complex case: perform full recovery
      const urlState = await parseUrlState(recoveryInfo);
      const hierarchy = await calculateHierarchy(urlState, windowData!);
      const reconstructedState = await reconstructState(hierarchy, windowData!);

      // Update existing phantom window with recovered state
      windowContext.setWindowActive({
        windowIdentifier,
        windowData: {
          initialized: true,
          tabs: reconstructedState.tabs,
          navigation: reconstructedState.navigation
        }
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
      windowContext.setWindowActive({
        windowIdentifier,
        windowData: { initialized: true }
      });
    }
  }, [windowIdentifier, windowData, windowContext]);

  useEffect(() => {
    if (!enabled || !searchParams || !windowData) return;

    const recoveryData = parseWindowRecoveryData(searchParams);
    const currentWindowRecovery = recoveryData.find(
      info => info.windowIdentifier === windowIdentifier
    );

    if (currentWindowRecovery) {
      performRecovery(currentWindowRecovery);
    } else {
      // No recovery needed - just mark as initialized
      windowContext.setWindowActive({
        windowIdentifier,
        windowData: { initialized: true }
      });
    }
  }, [enabled, searchParams, windowData, windowIdentifier, performRecovery, windowContext]);

  return {
    isRecovering,
    recoveryError,
    recoveryState
  };
};