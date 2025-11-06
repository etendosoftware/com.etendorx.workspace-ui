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
import { createContext, useCallback, useMemo, useState } from "react";
import { getNewActiveLevels, getNewActiveTabsByLevel } from "@/utils/table/utils";

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
  /** Array of currently active tab levels */
  activeLevels: number[];
  /** Function to set active level for tab navigation */
  setActiveLevel: (level: number, expand?: boolean) => void;
  /** Map of active tab by level */
  activeTabsByLevel: Map<number, string>;
  /** Function to set active tab by level */
  setActiveTabsByLevel: (tab?: Tab) => void;
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
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
  windowIdentifier?: string;
}>) => {
  /**
   * Active navigation levels state.
   * Tracks which tab levels are currently visible in the hierarchy.
   */
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);

  /**
   * Active tabs by level state.
   * Tracks which tab is active at each level for proper child tab filtering.
   */
  const [activeTabsByLevel, setActiveTabsByLevelState] = useState<Map<number, string>>(new Map());

  /**
   * Memoized graph instance with caching strategy.
   *
   * Creates or retrieves a Graph instance from the global cache based on windowId.
   * The graph represents the hierarchical relationship between tabs and manages selection state.
   *
   * Dependency on `tabs` ensures graph is recreated when tab structure changes,
   * which is necessary for maintaining consistency with the current tab configuration.
   */
  const graph = useMemo(() => {
    if (!windowGraphCache.has(windowId)) {
      windowGraphCache.set(windowId, new Graph<Tab>(tabs));
    }
    const cachedGraph = windowGraphCache.get(windowId);
    if (!cachedGraph) {
      throw new Error(`Failed to retrieve graph for window id: ${windowId}`);
    }
    return cachedGraph;
  }, [windowId, tabs]);

  /**
   * Updates active navigation levels based on user interaction.
   *
   * Algorithm:
   * 1. If expand is true, set only the current level (collapse all others)
   * 2. Otherwise, calculate new levels based on current maxLevel and new level
   * 3. Keep two consecutive levels visible (e.g., [0,1] or [1,2])
   */
  const setActiveLevel = useCallback(
    (level: number, expand?: boolean) => {
      setActiveLevels((prev) => getNewActiveLevels(prev, level, expand));
    },
    []
  );

  /**
   * Updates active tab by level.
   * Stores which tab is selected at each hierarchy level.
   */
  const setActiveTabsByLevel = useCallback(
    (tab?: Tab) => {
      if (!tab) {
        setActiveTabsByLevelState(new Map());
        return;
      }
      setActiveTabsByLevelState((prev) => getNewActiveTabsByLevel(prev, tab.tabLevel, tab.id));
    },
    []
  );

  /**
   * Memoized context value to prevent unnecessary re-renders of consuming components.
   *
   * The context provides access to:
   * - graph: The hierarchical tab structure and selection management
   * - activeLevels: Current navigation state (array of active levels)
   * - setActiveLevel: Navigation control function for level management
   * - activeTabsByLevel: Map of active tab ID by hierarchy level
   * - setActiveTabsByLevel: Function to update active tab by level
   */
  const value = useMemo<SelectedContext>(
    () => ({
      graph,
      activeLevels,
      setActiveLevel,
      activeTabsByLevel,
      setActiveTabsByLevel,
    }),
    [graph, activeLevels, setActiveLevel, activeTabsByLevel, setActiveTabsByLevel]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
