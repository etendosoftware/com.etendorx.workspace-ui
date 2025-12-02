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

export const useGlobalUrlStateRecovery = () => {
  const searchParams = useSearchParams();
  const { loadWindowData } = useMetadataStore();

  const [recoveredWindows, setRecoveredWindows] = useState<WindowState[]>([]);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(true);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const hasRun = useRef(false);

  useEffect(() => {
    if (!searchParams || hasRun.current) return;
    hasRun.current = true;

    const recoverAllWindows = async () => {
      setIsRecoveryLoading(true);
      try {
        const recoveryDataList = parseWindowRecoveryData(searchParams);

        if (recoveryDataList.length === 0) {
          setIsRecoveryLoading(false);
          return;
        }

        // Parallel recovery of all windows
        const windowPromises = recoveryDataList.map(async (info, index) => {
          const windowId = getWindowIdFromIdentifier(info.windowIdentifier);

          // Fetch Metadata
          const metadata = await loadWindowData(windowId);

          // Reconstruct State
          let windowState: WindowState;

          if (info.hasRecoveryData) {
            // Complex recovery
            const urlState = await parseUrlState(info, metadata);
            const hierarchy = await calculateHierarchy(urlState, metadata);
            const reconstructed = await reconstructState(hierarchy, metadata);

            windowState = {
              ...createRecoveryWindowState(info),
              title: urlState.tabTitle,
              initialized: true,
              tabs: reconstructed.tabs,
              navigation: reconstructed.navigation,
              isActive: index === recoveryDataList.length - 1, // Last one is active
            };
          } else {
            // Simple recovery (just window ID)
            windowState = {
              ...createRecoveryWindowState(info),
              title: getWindowName(metadata),
              initialized: true,
              isActive: index === recoveryDataList.length - 1,
            };
          }
          return windowState;
        });

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
   * This allows the recovery system to re-execute when new windows are added to the URL.
   */
  const triggerRecovery = useCallback(() => {
    hasRun.current = false;
  }, []);

  return { recoveredWindows, isRecoveryLoading, recoveryError, triggerRecovery };
};
