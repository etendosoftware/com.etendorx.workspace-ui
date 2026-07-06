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

import { useEffect, useMemo } from "react";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import type { IMetadataContext } from "./types";
import { useDatasourceContext } from "./datasourceContext";
import { mapBy } from "@/utils/structures";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataStore } from "./metadataStore";

export const MetadataSynchronizer = () => {
  const windowsObj = useWindowStore((s) => s.windows);
  const windows = useMemo(() => Object.values(windowsObj), [windowsObj]);
  const cleanupWindow = useWindowStore((s) => s.cleanupWindow);
  const { loadWindowData, isWindowLoading, windowsData } = useMetadataStore();

  useEffect(() => {
    for (const win of windows) {
      if (win.windowId && !windowsData[win.windowId] && !isWindowLoading(win.windowId)) {
        loadWindowData(win.windowId).catch((error) => {
          if (error.message?.toLowerCase().includes("not found")) {
            cleanupWindow(win.windowIdentifier);
          } else {
            console.error(error);
          }
        });
      }
    }
  }, [windows, windowsData, isWindowLoading, loadWindowData, cleanupWindow]);

  return null;
};

export const useMetadataContext = (): IMetadataContext => {
  const windowsObj = useWindowStore((s) => s.windows);
  const activeWindow = useMemo(() => {
    const wins = Object.values(windowsObj);
    return wins.find((w) => w.isActive) ?? null;
  }, [windowsObj]);
  const { getWindowMetadata, isWindowLoading, getWindowError, loadWindowData, windowsData, loadingWindows, errors } =
    useMetadataStore();
  const { removeRecordFromDatasource } = useDatasourceContext();

  const currentWindowId = activeWindow?.windowId;
  const currentWindowIdentifier = activeWindow?.windowIdentifier;
  const currentWindow = currentWindowId ? getWindowMetadata(currentWindowId) : undefined;

  const currentGroupedTabs = useMemo(() => (currentWindow ? groupTabsByLevel(currentWindow) : []), [currentWindow]);
  const currentTabs = useMemo(() => (currentWindow?.tabs ? mapBy(currentWindow.tabs, "id") : {}), [currentWindow]);

  return {
    windowId: currentWindowId,
    windowIdentifier: currentWindowIdentifier,
    window: currentWindow,
    loading: currentWindowId ? isWindowLoading(currentWindowId) : false,
    error: currentWindowId ? getWindowError(currentWindowId) : undefined,
    groupedTabs: currentGroupedTabs,
    tabs: currentTabs,
    removeRecord: (tabId, recordId) => removeRecordFromDatasource(tabId, recordId), // Proxy to datasource
    loadWindowData,
    getWindowMetadata,
    isWindowLoading,
    getWindowError,
    windowsData,
    loadingWindows,
    errors,
  };
};
