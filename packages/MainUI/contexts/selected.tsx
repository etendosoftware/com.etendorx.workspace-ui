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
import { createContext, useMemo } from "react";

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
  // biome-ignore lint/correctness/noUnusedVariables: Keep windowId for potential metadata operations
  windowId,
  windowIdentifier,
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
  windowIdentifier: string;
}>) => {
  /**
   * Cache key generation: Uses windowIdentifier if provided, otherwise falls back to windowId.
   * This supports multiple instances of the same window type while maintaining separate graph states.
   */
  const cacheKey = windowIdentifier;

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
    }),
    [graph]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
