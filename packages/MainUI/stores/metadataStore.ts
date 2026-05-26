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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type Etendo, Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

const loadingPromises = new Map<string, Promise<Etendo.WindowMetadata>>();

export interface MetadataStoreState {
  windowsData: Record<string, Etendo.WindowMetadata>;
  loadingWindows: Record<string, boolean>;
  errors: Record<string, Error | undefined>;

  loadWindowData: (windowId: string) => Promise<Etendo.WindowMetadata>;
  prefetchWindowData: (windowId: string) => Promise<void>;
  getWindowMetadata: (windowId: string) => Etendo.WindowMetadata | undefined;
  isWindowLoading: (windowId: string) => boolean;
  getWindowError: (windowId: string) => Error | undefined;
  resetForRole: () => void;
}

export const useMetadataZustandStore = create<MetadataStoreState>()(
  devtools(
    (set, get) => ({
      windowsData: {},
      loadingWindows: {},
      errors: {},

      loadWindowData: (windowId: string): Promise<Etendo.WindowMetadata> => {
        const { windowsData } = get();

        // If already loaded, return cached
        if (windowsData[windowId]) {
          return Promise.resolve(windowsData[windowId]);
        }

        // If already fetching, return the in-flight promise
        const existing = loadingPromises.get(windowId);
        if (existing) {
          return existing;
        }

        const promise = (async () => {
          try {
            set(
              (state) => ({
                loadingWindows: { ...state.loadingWindows, [windowId]: true },
                errors: { ...state.errors, [windowId]: undefined },
              }),
              false,
              "metadata/loadWindowData:start"
            );

            logger.info(`[MetadataStore] Loading metadata for window ${windowId}`);

            Metadata.clearWindowCache(windowId);
            const newWindowData = await Metadata.forceWindowReload(windowId);

            set(
              (state) => ({
                windowsData: { ...state.windowsData, [windowId]: newWindowData },
                loadingWindows: { ...state.loadingWindows, [windowId]: false },
              }),
              false,
              "metadata/loadWindowData:success"
            );

            return newWindowData;
          } catch (err) {
            const error = err as Error;
            logger.warn(`[MetadataStore] Error loading window ${windowId}:`, error);

            set(
              (state) => ({
                errors: { ...state.errors, [windowId]: error },
                loadingWindows: { ...state.loadingWindows, [windowId]: false },
              }),
              false,
              "metadata/loadWindowData:error"
            );

            throw error;
          } finally {
            loadingPromises.delete(windowId);
          }
        })();

        loadingPromises.set(windowId, promise);
        return promise;
      },

      prefetchWindowData: async (windowId: string): Promise<void> => {
        const { windowsData, loadingWindows } = get();

        // Skip if already loaded or currently loading
        if (windowsData[windowId] || loadingWindows[windowId]) {
          return;
        }

        try {
          // Use getWindow (checks localStorage cache first, non-destructive)
          const data = await Metadata.getWindow(windowId);

          set(
            (state) => ({
              windowsData: { ...state.windowsData, [windowId]: data },
            }),
            false,
            "metadata/prefetchWindowData:success"
          );
        } catch {
          // Silently swallow — prefetch failure should not affect UX
        }
      },

      getWindowMetadata: (windowId: string) => {
        return get().windowsData[windowId];
      },

      isWindowLoading: (windowId: string) => {
        return get().loadingWindows[windowId] || false;
      },

      getWindowError: (windowId: string) => {
        return get().errors[windowId];
      },

      resetForRole: () => {
        loadingPromises.clear();
        set({ windowsData: {}, loadingWindows: {}, errors: {} }, false, "metadata/resetForRole");
      },
    }),
    { name: "MetadataStore" }
  )
);
