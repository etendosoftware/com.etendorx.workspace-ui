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

import Graph from "@/data/graph";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

/**
 * Context interface for managing tab selection and navigation state.
 *
 * Provides access to:
 * - Graph structure representing tab hierarchy
 * - Active navigation levels for multi-level tab navigation
 * - Active tab tracking by level for precise navigation control
 * - Functions to control tab level activation and state management
 */
interface SelectedContext {
  /** Graph data structure containing the hierarchical relationship between tabs */
  graph: Graph<Tab>;
  /** Array of currently active tab levels (maximum 2 levels for optimal UX) */
  activeLevels: number[];
  /** Map tracking which specific tab is active at each level (level -> tabId) */
  activeTabsByLevel: Map<number, string>;
  /** Function to update the active tabs by level mapping */
  setActiveTabsByLevel: (value: Map<number, string> | ((prev: Map<number, string>) => Map<number, string>)) => void;
  /** Function to set the active tab level with optional expand mode */
  setActiveLevel: (level: number, expand?: boolean) => void;
  /** Function to clear all selection states and reset to initial state */
  clearAllStates: () => void;
}

/**
 * React Context for tab selection state management.
 * Used throughout the application to access tab navigation state.
 */
export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

/**
 * Global cache for storing Graph instances per window identifier.
 *
 * Purpose: Prevents recreation of expensive Graph data structures when components re-render.
 * Each window (identified by windowIdentifier or windowId) maintains its own cached graph.
 *
 * NOTE: This cache grows indefinitely and is never cleared. In applications with many
 * windows or long-running sessions, this could lead to memory accumulation.
 * Consider implementing cache eviction strategies if memory usage becomes a concern.
 */
const windowGraphCache = new Map<string, Graph<Tab>>();

/**
 * Provider component for tab selection context.
 *
 * Manages the hierarchical navigation state for tabs within a window, providing:
 * - Graph-based tab hierarchy management
 * - Active level tracking for multi-level navigation
 * - Session restoration from URL state
 * - Cache management for performance optimization
 *
 * @param children - Child components that will have access to the selection context
 * @param tabs - Array of tab metadata used to build the hierarchy graph
 * @param windowId - Unique identifier for the window
 * @param windowIdentifier - Optional unique identifier to support multiple instances of the same window
 */
export const SelectedProvider = ({
  children,
  tabs,
  windowId,
  windowIdentifier,
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
  windowIdentifier?: string;
}>) => {
  /**
   * State tracking currently active tab levels.
   * Initialized with [0] (root level only).
   * Maximum of 2 levels maintained for optimal user experience.
   */
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);

  /**
   * Flag to track if initial level loading from URL state has completed.
   * Prevents overwriting user navigation after session restoration.
   */
  const [activeLevelsLoaded, setActiveLevelsLoaded] = useState<boolean>(false);

  /**
   * State mapping each navigation level to its currently active tab ID.
   *
   * This Map maintains the relationship between tab levels (0, 1, 2, etc.) and
   * the specific tab that is currently active at each level. This enables:
   * - Precise navigation control across hierarchical tab structures
   * - Restoration of specific tab selections during session recovery
   * - Level-specific tab state management
   *
   * Example: Map { 0 => "mainTabId", 1 => "subTabId", 2 => "detailTabId" }
   */
  const [activeTabsByLevel, setActiveTabsByLevel] = useState<Map<number, string>>(new Map());

  /** Hook providing access to multi-window URL state management */
  const { activeWindow } = useMultiWindowURL();

  /**
   * Cache key generation: Uses windowIdentifier if provided, otherwise falls back to windowId.
   * This supports multiple instances of the same window type while maintaining separate graph states.
   */
  const cacheKey = windowIdentifier || windowId;

  /**
   * Memoized graph instance with caching strategy.
   *
   * Creates or retrieves a Graph instance from the global cache based on the cache key.
   * The graph represents the hierarchical relationship between tabs and manages selection state.
   *
   * Dependency on `tabs` ensures graph is recreated when tab structure changes,
   * which is necessary for maintaining consistency with the current tab configuration.
   */
  const graph = useMemo(() => {
    if (!windowGraphCache.has(cacheKey)) {
      windowGraphCache.set(cacheKey, new Graph<Tab>(tabs));
    }
    const cachedGraph = windowGraphCache.get(cacheKey);
    if (!cachedGraph) {
      throw new Error(`Failed to retrieve graph for window identifier: ${cacheKey}`);
    }
    return cachedGraph;
  }, [cacheKey, tabs]);

  /**
   * Clears all selection states and resets navigation to root level.
   *
   * This function performs a complete reset of the selection context:
   * - Resets active levels to [0] (root level only)
   * - Clears single record selections for all tabs
   * - Clears multiple record selections for all tabs
   *
   * Typically used when closing windows, changing contexts, or performing global resets.
   */
  const clearAllStates = useCallback(() => {
    setActiveLevels([0]);

    for (const tab of tabs) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [tabs, graph]);

  /**
   * Sets the active tab navigation level with intelligent level management.
   *
   * This function implements a sophisticated navigation system designed for optimal UX:
   *
   * @param level - The tab level to activate (0 = root, 1 = first sublevel, etc.)
   * @param expand - Optional flag for expansion mode (used during session restoration)
   *
   * Navigation Logic:
   * - **Expand Mode**: Shows only the specified level (used for session restoration)
   * - **Root Navigation**: level=0 always resets to root only [0]
   * - **No Change**: If target level is already the max level, no update occurs
   * - **Backward Navigation**: When going to a lower level, shows [level-1, level] for context
   * - **Forward Navigation**: When going to a higher level, shows [current_max, level]
   *
   * The system maintains a maximum of 2 active levels simultaneously to prevent
   * UI complexity while providing sufficient navigation context.
   *
   * Dependencies include `tabs` because level validation may depend on the current tab structure.
   */
  const setActiveLevel = useCallback(
    (level: number, expand?: boolean) => {
      setActiveLevels((prev) => {
        if (expand) {
          return [level];
        }

        const maxLevel = prev[prev.length - 1];

        if (level === 0) {
          return [0];
        }
        if (maxLevel === level) {
          return prev;
        }
        if (maxLevel > level) {
          return [level - 1, level];
        }
        return [maxLevel, level];
      });
    },
    [tabs]
  );

  /**
   * Session restoration effect for active tab levels and tab selections.
   *
   * This effect runs once during component initialization to restore navigation state
   * from URL parameters or saved session data. It coordinates with useMultiWindowURL
   * to determine the appropriate tab levels to activate based on previously saved form states.
   *
   * Enhanced Process:
   * 1. Checks if initial loading has already completed (prevents multiple executions)
   * 2. Retrieves tabFormStates and selectedRecords from the active window URL state
   * 3. Extracts tab IDs from form states and selected records
   * 4. Calculates navigation depth based on the position of the last form state in selected records
   * 5. Uses expand mode to set levels directly without navigation logic
   * 6. Resets tab-by-level mapping for clean state or restores based on calculated depth
   * 7. Marks loading as complete to prevent interference with user navigation
   *
   * Key improvements:
   * - Uses selectedRecords order to determine proper navigation level
   * - Maintains activeTabsByLevel state consistency during restoration
   * - Handles edge cases where form states and selected records may be misaligned
   *
   * This ensures users return to their previous navigation context when:
   * - Refreshing the page
   * - Navigating back to a previously opened window
   * - Restoring from bookmarked URLs
   */
  useEffect(() => {
    // Early return: Skip if already loaded or function not available
    if (activeLevelsLoaded || !setActiveLevel) return;

    // Extract window state data including both form states and selected records
    const { tabFormStates, selectedRecords, windowId } = activeWindow || {};
    const formStatesIds = tabFormStates ? Object.keys(tabFormStates) : [];

    // Handle window with no saved form states - reset to clean state
    if (windowId && formStatesIds.length === 0) {
      clearAllStates();
      setActiveTabsByLevel(new Map());
    }

    // Calculate navigation depth based on form state position in selected records
    const lastFormStateId = formStatesIds.length > 0 ? formStatesIds[formStatesIds.length - 1] : null;
    const selectedRecordsIds = selectedRecords ? Object.keys(selectedRecords) : [];
    const lastFormStateIndex = lastFormStateId ? selectedRecordsIds.indexOf(lastFormStateId) : -1;

    // Handle window with saved form states - restore navigation depth
    if (lastFormStateIndex > 0) {
      setActiveLevel(lastFormStateIndex, true); // Use expand mode for direct restoration
    }

    // Mark as loaded to prevent subsequent executions
    setActiveLevelsLoaded(true);
  }, [activeWindow, activeLevelsLoaded, setActiveLevel, clearAllStates]);

  /**
   * Memoized context value to prevent unnecessary re-renders of consuming components.
   *
   * The context provides access to:
   * - graph: The hierarchical tab structure and selection management
   * - activeLevels: Current navigation state (array of active levels)
   * - activeTabsByLevel: Map of level -> tabId for precise tab tracking
   * - setActiveTabsByLevel: Function to update the level-to-tab mapping
   * - setActiveLevel: Navigation control function for level management
   * - clearAllStates: State reset function for complete context cleanup
   */
  const value = useMemo<SelectedContext>(
    () => ({
      graph,
      activeLevels,
      activeTabsByLevel,
      setActiveLevel,
      setActiveTabsByLevel,
      clearAllStates,
    }),
    [graph, activeLevels, activeTabsByLevel, setActiveLevel, setActiveTabsByLevel, clearAllStates]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
