"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { type Etendo, Metadata } from "@workspaceui/etendohookbinder/src/api/metadata";
import { groupTabsByLevel } from "@workspaceui/etendohookbinder/src/utils/metadata";
import type { IMetadataContext } from "./types";
import { useDatasourceContext } from "./datasourceContext";
import { mapBy } from "@/utils/structures";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { logger } from "@/utils/logger";

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const [windowsData, setWindowsData] = useState<Record<string, Etendo.WindowMetadata>>({});
  const [loadingWindows, setLoadingWindows] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error | undefined>>({});

  const { activeWindow } = useMultiWindowURL();
  const { removeRecordFromDatasource } = useDatasourceContext();

  const currentWindowId = activeWindow?.windowId;
  const currentWindow = currentWindowId ? windowsData[currentWindowId] : undefined;
  const currentLoading = currentWindowId ? loadingWindows[currentWindowId] || false : false;
  const currentError = currentWindowId ? errors[currentWindowId] : undefined;

  const currentGroupedTabs = useMemo(() => {
    return currentWindow ? groupTabsByLevel(currentWindow) : [];
  }, [currentWindow]);

  const currentTabs = useMemo(() => {
    return currentWindow?.tabs ? mapBy(currentWindow.tabs, "id") : {};
  }, [currentWindow?.tabs]);

  const loadWindowData = useCallback(
    async (windowId: string): Promise<Etendo.WindowMetadata> => {
      if (windowsData[windowId]) {
        return windowsData[windowId];
      }

      try {
        setLoadingWindows((prev) => ({ ...prev, [windowId]: true }));
        setErrors((prev) => ({ ...prev, [windowId]: undefined }));

        logger.info(`Loading metadata for window ${windowId}`);

        Metadata.clearWindowCache(windowId);
        const newWindowData = await Metadata.forceWindowReload(windowId);

        setWindowsData((prev) => ({ ...prev, [windowId]: newWindowData }));

        return newWindowData;
      } catch (err) {
        const error = err as Error;
        logger.warn(`Error loading window ${windowId}:`, error);

        setErrors((prev) => ({ ...prev, [windowId]: error }));
        throw error;
      } finally {
        setLoadingWindows((prev) => ({ ...prev, [windowId]: false }));
      }
    },
    [windowsData]
  );

  const getWindowMetadata = useCallback(
    (windowId: string) => {
      return windowsData[windowId];
    },
    [windowsData]
  );

  const getWindowTitle = useCallback(
    (windowId: string) => {
      const windowData = windowsData[windowId];
      return windowData?.name || windowData?.window$_identifier || `Window ${windowId}`;
    },
    [windowsData]
  );

  const isWindowLoading = useCallback(
    (windowId: string) => {
      return loadingWindows[windowId] || false;
    },
    [loadingWindows]
  );

  const getWindowError = useCallback(
    (windowId: string) => {
      return errors[windowId];
    },
    [errors]
  );

  useEffect(() => {
    if (activeWindow?.windowId && !windowsData[activeWindow.windowId] && !loadingWindows[activeWindow.windowId]) {
      loadWindowData(activeWindow.windowId).catch(() => {
        // Error handled in load
      });
    }
  }, [activeWindow?.windowId, windowsData, loadingWindows, loadWindowData]);

  const removeRecord = useCallback(
    (tabId: string, recordId: string) => {
      removeRecordFromDatasource(tabId, recordId);
    },
    [removeRecordFromDatasource]
  );

  const emptyWindowDataName = useCallback(() => {
    if (!currentWindowId) return;

    setWindowsData((prevWindowsData) => ({
      ...prevWindowsData,
      [currentWindowId]: {
        ...prevWindowsData[currentWindowId],
        name: "",
        window$_identifier: "",
      } as Etendo.WindowMetadata,
    }));
  }, [currentWindowId]);

  const refetchCurrentWindow = useCallback(() => {
    if (currentWindowId) {
      setWindowsData((prev) => {
        const { [currentWindowId]: _, ...rest } = prev;
        return rest;
      });

      return loadWindowData(currentWindowId);
    }
    return Promise.resolve({} as Etendo.WindowMetadata);
  }, [currentWindowId, loadWindowData]);

  const value = useMemo<IMetadataContext>(
    () => ({
      windowId: currentWindowId,
      window: currentWindow,
      loading: currentLoading,
      error: currentError,
      groupedTabs: currentGroupedTabs,
      tabs: currentTabs,
      refetch: refetchCurrentWindow,
      removeRecord,
      emptyWindowDataName,

      loadWindowData,
      getWindowMetadata,
      getWindowTitle,
      isWindowLoading,
      getWindowError,
      windowsData,
      loadingWindows,
      errors,
    }),
    [
      currentWindowId,
      currentWindow,
      currentLoading,
      currentError,
      currentGroupedTabs,
      currentTabs,
      refetchCurrentWindow,
      removeRecord,
      emptyWindowDataName,
      loadWindowData,
      getWindowMetadata,
      getWindowTitle,
      isWindowLoading,
      getWindowError,
      windowsData,
      loadingWindows,
      errors,
    ]
  );

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
