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

import { createContext, useContext, useCallback, useRef, useMemo } from "react";
import { logger } from "@/utils/logger";

/**
 * Interface for the TabRefreshContext functionality
 */
interface TabRefreshContextType {
  /**
   * Register a refresh callback for a specific tab level
   * @param level - The tab level (0, 1, 2, ...)
   * @param refreshFn - The refresh function to call
   */
  registerRefresh: (level: number, refreshFn: () => Promise<void>) => void;

  /**
   * Unregister a refresh callback for a specific tab level
   * @param level - The tab level to unregister
   */
  unregisterRefresh: (level: number) => void;

  /**
   * Trigger refresh for all parent tabs of the given level
   * Executes refreshes sequentially from level-1 down to 0
   * @param currentLevel - The level that was saved
   */
  triggerParentRefreshes: (currentLevel: number) => Promise<void>;
}

const TabRefreshContext = createContext<TabRefreshContextType>({
  registerRefresh: () => {},
  unregisterRefresh: () => {},
  triggerParentRefreshes: async () => {},
});

export const useTabRefreshContext = () => useContext(TabRefreshContext);

export const TabRefreshProvider = ({ children }: React.PropsWithChildren) => {
  // Use ref to maintain callbacks across renders without causing re-renders
  const refreshCallbacksRef = useRef<Map<number, () => Promise<void>>>(new Map());

  const registerRefresh = useCallback((level: number, refreshFn: () => Promise<void>) => {
    refreshCallbacksRef.current.set(level, refreshFn);
    logger.debug(`TabRefreshContext: Registered refresh for level ${level}`);
  }, []);

  const unregisterRefresh = useCallback((level: number) => {
    refreshCallbacksRef.current.delete(level);
    logger.debug(`TabRefreshContext: Unregistered refresh for level ${level}`);
  }, []);

  const triggerParentRefreshes = useCallback(async (currentLevel: number) => {
    if (currentLevel <= 0) {
      logger.debug("TabRefreshContext: No parent levels to refresh");
      return;
    }

    logger.debug(`TabRefreshContext: Starting parent refreshes for level ${currentLevel}`);

    // Refresh parents sequentially from direct parent (currentLevel - 1) up to level 0
    for (let level = currentLevel - 1; level >= 0; level--) {
      const refreshCallback = refreshCallbacksRef.current.get(level);

      if (refreshCallback) {
        try {
          logger.debug(`TabRefreshContext: Refreshing parent level ${level}`);
          await refreshCallback();
          logger.debug(`TabRefreshContext: Successfully refreshed parent level ${level}`);
        } catch (error) {
          logger.warn(`TabRefreshContext: Failed to refresh parent tab at level ${level}:`, error);
          // Continue with next parent level even if this one fails
        }
      } else {
        logger.debug(`TabRefreshContext: No refresh callback found for level ${level}`);
      }
    }

    logger.debug(`TabRefreshContext: Completed parent refreshes for level ${currentLevel}`);
  }, []);

  const value = useMemo(
    () => ({
      registerRefresh,
      unregisterRefresh,
      triggerParentRefreshes,
    }),
    [registerRefresh, unregisterRefresh, triggerParentRefreshes]
  );

  return <TabRefreshContext.Provider value={value}>{children}</TabRefreshContext.Provider>;
};
