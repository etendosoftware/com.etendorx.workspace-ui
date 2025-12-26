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
import type { RefreshType } from "@/utils/toolbar/constants";

/**
 * Interface for the TabRefreshContext functionality
 */
interface TabRefreshContextType {
  /**
   * Register a refresh callback for a specific tab level and type.
   * Multiple types can coexist for the same level.
   * @param level - The tab level (0, 1, 2, ...)
   * @param type - The type of refresh ('table' | 'form')
   * @param refreshFn - The refresh function to call
   */
  registerRefresh: (level: number, type: RefreshType, refreshFn: () => Promise<void>) => void;

  /**
   * Unregister all refresh callbacks for a specific tab level.
   * Clears all types registered for that level.
   * @param level - The tab level to unregister
   */
  unregisterRefresh: (level: number) => void;

  /**
   * Trigger refresh for all parent tabs of the given level.
   * Executes all registered refresh types for each parent level sequentially from level-1 down to 0.
   * @param currentLevel - The level that was saved
   */
  triggerParentRefreshes: (currentLevel: number) => Promise<void>;

  /**
   * Trigger all refresh types for the current tab level.
   * @param currentLevel - The level to refresh
   */
  triggerCurrentRefresh: (currentLevel: number) => Promise<void>;

  /**
   * Trigger a specific refresh type for a given level.
   * Used to refresh table data after save operations in FormView.
   * @param level - The tab level to refresh
   * @param type - The specific refresh type to trigger
   */
  triggerRefresh: (level: number, type: RefreshType) => Promise<void>;
}

const TabRefreshContext = createContext<TabRefreshContextType>({
  registerRefresh: () => {},
  unregisterRefresh: () => {},
  triggerParentRefreshes: async () => {},
  triggerCurrentRefresh: async () => {},
  triggerRefresh: async () => {},
});

export const useTabRefreshContext = () => {
  const context = useContext(TabRefreshContext);

  if (!context) {
    throw new Error("useTabRefreshContext must be used within a TabRefreshProvider");
  }

  return context;
};

export const TabRefreshProvider = ({ children }: React.PropsWithChildren) => {
  // Use ref to maintain callbacks across renders without causing re-renders
  // Structure: Map<level, Map<type, refreshFn>>
  const refreshCallbacksRef = useRef<Map<number, Map<RefreshType, () => Promise<void>>>>(new Map());

  const registerRefresh = useCallback((level: number, type: RefreshType, refreshFn: () => Promise<void>) => {
    let levelMap = refreshCallbacksRef.current.get(level);

    if (!levelMap) {
      levelMap = new Map<RefreshType, () => Promise<void>>();
      refreshCallbacksRef.current.set(level, levelMap);
    }

    levelMap.set(type, refreshFn);
    logger.debug(`TabRefreshContext: Registered ${type} refresh for level ${level}`);
  }, []);

  const unregisterRefresh = useCallback((level: number) => {
    refreshCallbacksRef.current.delete(level);
    logger.debug(`TabRefreshContext: Unregistered all refreshes for level ${level}`);
  }, []);

  /**
   * Helper function to execute all refresh callbacks for a given level
   */
  const executeAllRefreshesForLevel = useCallback(async (level: number): Promise<void> => {
    const levelMap = refreshCallbacksRef.current.get(level);

    if (!levelMap || levelMap.size === 0) {
      logger.debug(`TabRefreshContext: No refresh callbacks found for level ${level}`);
      return;
    }

    for (const [type, refreshCallback] of levelMap.entries()) {
      try {
        logger.debug(`TabRefreshContext: Executing ${type} refresh for level ${level}`);
        await refreshCallback();
        logger.debug(`TabRefreshContext: Successfully executed ${type} refresh for level ${level}`);
      } catch (error) {
        logger.warn(`TabRefreshContext: Failed to execute ${type} refresh at level ${level}:`, error);
        // Continue with next type even if this one fails
      }
    }
  }, []);

  const triggerParentRefreshes = useCallback(
    async (currentLevel: number) => {
      if (currentLevel <= 0) {
        logger.debug("TabRefreshContext: No parent levels to refresh");
        return;
      }

      logger.debug(`TabRefreshContext: Starting parent refreshes for level ${currentLevel}`);

      // Refresh parents sequentially from direct parent (currentLevel - 1) up to level 0
      for (let level = currentLevel - 1; level >= 0; level--) {
        await executeAllRefreshesForLevel(level);
      }

      logger.debug(`TabRefreshContext: Completed parent refreshes for level ${currentLevel}`);
    },
    [executeAllRefreshesForLevel]
  );

  const triggerCurrentRefresh = useCallback(
    async (currentLevel: number) => {
      logger.debug(`TabRefreshContext: Triggering all refreshes for current level ${currentLevel}`);
      await executeAllRefreshesForLevel(currentLevel);
    },
    [executeAllRefreshesForLevel]
  );

  const triggerRefresh = useCallback(async (level: number, type: RefreshType) => {
    const levelMap = refreshCallbacksRef.current.get(level);
    const refreshCallback = levelMap?.get(type);

    if (refreshCallback) {
      try {
        logger.debug(`TabRefreshContext: Triggering ${type} refresh for level ${level}`);
        await refreshCallback();
        logger.debug(`TabRefreshContext: Successfully triggered ${type} refresh for level ${level}`);
      } catch (error) {
        logger.warn(`TabRefreshContext: Failed to trigger ${type} refresh at level ${level}:`, error);
      }
    } else {
      logger.debug(`TabRefreshContext: No ${type} refresh callback found for level ${level}`);
    }
  }, []);

  const value = useMemo(
    () => ({
      registerRefresh,
      unregisterRefresh,
      triggerParentRefreshes,
      triggerCurrentRefresh,
      triggerRefresh,
    }),
    [registerRefresh, unregisterRefresh, triggerParentRefreshes, triggerCurrentRefresh, triggerRefresh]
  );

  return <TabRefreshContext.Provider value={value}>{children}</TabRefreshContext.Provider>;
};
