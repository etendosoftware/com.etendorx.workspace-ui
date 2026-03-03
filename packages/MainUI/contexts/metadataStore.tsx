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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Etendo, Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import { useUserContext } from "@/hooks/useUserContext";

// Define Interface
export interface IMetadataStoreContext {
  windowsData: Record<string, Etendo.WindowMetadata>;
  loadingWindows: Record<string, boolean>;
  errors: Record<string, Error | undefined>;
  loadWindowData: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getWindowMetadata: (windowId: string) => Etendo.WindowMetadata | undefined;
  isWindowLoading: (windowId: string) => boolean;
  getWindowError: (windowId: string) => Error | undefined;
}

const MetadataStoreContext = createContext<IMetadataStoreContext>({} as IMetadataStoreContext);

export function MetadataStoreProvider({ children }: React.PropsWithChildren) {
  const { currentRole } = useUserContext();
  const [windowsData, setWindowsData] = useState<Record<string, Etendo.WindowMetadata>>({});
  const [loadingWindows, setLoadingWindows] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error | undefined>>({});

  // Reset store when role changes to avoid stale metadata in memory.
  // Roles may have different window configurations, so we must ensure the UI re-fetches the correct metadata for the new role context.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset store when role changes to avoid stale metadata in memory.
  useEffect(() => {
    setWindowsData({});
    setLoadingWindows({});
    setErrors({});
  }, [currentRole?.id]);

  const loadWindowData = useCallback(
    async (windowId: string): Promise<Etendo.WindowMetadata> => {
      // If already loaded, return it
      if (windowsData[windowId]) {
        return windowsData[windowId];
      }

      try {
        setLoadingWindows((prev) => ({ ...prev, [windowId]: true }));
        setErrors((prev) => ({ ...prev, [windowId]: undefined }));

        logger.info(`[MetadataStore] Loading metadata for window ${windowId}`);

        // Clear cache and force reload as per original implementation
        Metadata.clearWindowCache(windowId);
        const newWindowData = await Metadata.forceWindowReload(windowId);

        setWindowsData((prev) => ({ ...prev, [windowId]: newWindowData }));

        return newWindowData;
      } catch (err) {
        const error = err as Error;
        logger.warn(`[MetadataStore] Error loading window ${windowId}:`, error);

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

  const value = useMemo(
    () => ({
      windowsData,
      loadingWindows,
      errors,
      loadWindowData,
      getWindowMetadata,
      isWindowLoading,
      getWindowError,
    }),
    [windowsData, loadingWindows, errors, loadWindowData, getWindowMetadata, isWindowLoading, getWindowError]
  );

  return <MetadataStoreContext.Provider value={value}>{children}</MetadataStoreContext.Provider>;
}

export const useMetadataStore = () => {
  const context = useContext(MetadataStoreContext);
  if (!context) {
    throw new Error("useMetadataStore must be used within a MetadataStoreProvider");
  }
  return context;
};
