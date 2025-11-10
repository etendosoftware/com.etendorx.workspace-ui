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

import { useMemo, useCallback, useEffect, useState } from "react";
import Tabs from "@/components/window/Tabs";
import AppBreadcrumb from "@/components/Breadcrums";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { useSelected } from "@/hooks/useSelected";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import { shouldShowTab, type TabWithParentInfo } from "@/utils/tabUtils";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import { TabRefreshProvider } from "@/contexts/TabRefreshContext";
import { useWindowContext } from "@/contexts/window";

/**
 * TabsContainer Component
 *
 * Manages the hierarchical display and navigation of tabs within a window, providing:
 * - Dynamic tab grouping by hierarchical levels (0, 1, 2, etc.)
 * - Session restoration from URL state after page refresh
 * - Conditional tab filtering based on parent-child relationships
 * - Navigation state persistence across window switches
 * - Two-level visibility system where any two consecutive levels can be visible
 *
 * The component coordinates multiple systems:
 * - Tab hierarchy management through groupTabsByLevel
 * - Navigation state persistence via useTableStatePersistenceTab
 * - Parent-child relationship validation through shouldShowTab
 * - Session restoration from multiWindowURL state
 *
 * @param windowData - Complete window metadata including tab definitions from Etendo Classic backend
 */
export default function TabsContainer({ windowData }: { windowData: Etendo.WindowMetadata }) {
  /**
   * Flag to track if initial level loading from URL state has completed.
   */
  const [activeLevelsLoaded, setActiveLevelsLoaded] = useState<boolean>(false);

  /**
   * Multi-window navigation hook providing access to current window state.
   */
  const { activeWindow } = useWindowContext();

  /**
   * Window context providing form state management functions.
   */
  const { getTabFormState, getSelectedRecord } = useWindowContext();

  /**
   * Graph-based tab hierarchy management system.
   */
  const { graph } = useSelected();

  /**
   * Navigation state persistence hook for the current window.
   *
   * Manages:
   * - activeLevels: Array of currently visible tab levels [0,1] or [1,2] etc.
   * - activeTabsByLevel: Map of level -> tabId for tracking active tab per level
   * - setActiveLevel: Function to change visible navigation levels
   * - setActiveTabsByLevel: Function to update active tab selection per level
   *
   * Persistence: State survives window switches and page refreshes
   */
  const { activeLevels, activeTabsByLevel, setActiveLevel, setActiveTabsByLevel } = useTableStatePersistenceTab({
    windowIdentifier: activeWindow?.windowIdentifier || "",
    tabId: "",
  });

  /**
   * Memoized tab grouping by hierarchical levels.
   *
   * Purpose: Organizes flat tab array into groups by tabLevel property
   * Structure: Array<Array<Tab>> where each inner array contains tabs of same level
   * Example: [[level0Tabs], [level1Tabs], [level2Tabs]]
   *
   * The grouping enables:
   * - Hierarchical navigation where tabs depend on parent selections
   * - Two-level visibility system (any two consecutive levels can be visible)
   * - Dynamic filtering based on parent-child relationships
   */
  const groupedTabs = useMemo(() => {
    return windowData ? groupTabsByLevel(windowData) : [];
  }, [windowData]);

  /**
   * Determines which tab should be active for a given hierarchical level.
   *
   * Algorithm:
   * 1. Find tab group for the specified level
   * 2. Check if there's a previously selected tab (from activeTabsByLevel mapping)
   * 3. If found and still exists in group, return that tab
   * 4. Otherwise, return first tab in group as default
   *
   * Purpose: Maintains tab selection consistency during navigation and restoration
   * Fallback: Always returns first tab if no specific selection exists
   */
  const getActiveTabForLevel = useCallback(
    (level: number): Tab | null => {
      const tabGroup = groupedTabs.find((group) => group[0]?.tabLevel === level);
      if (!tabGroup || tabGroup.length === 0) return null;

      const activeTabId = activeTabsByLevel.get(level);
      if (activeTabId) {
        const activeTab = tabGroup.find((tab) => tab.id === activeTabId);
        if (activeTab) return activeTab;
      }

      return tabGroup[0];
    },
    [groupedTabs, activeTabsByLevel]
  );

  /**
   * Dynamically filters tabs based on parent-child relationships and API conditions.
   *
   * Filtering Logic:
   * - Level 0 tabs: Always shown (root level)
   * - Higher level tabs: Filtered based on active parent tab selection
   *
   * Process for each tab group:
   * 1. Identify current level and its parent level (currentLevel - 1)
   * 2. Get currently active parent tab for validation
   * 3. Apply shouldShowTab filter which checks:
   *    - parentTabId matches
   *    - parentColumns relationships with parent entity/table
   *    - API-provided conditions (active status, display logic)
   *
   * Purpose: Ensures only relevant child tabs are visible based on parent context
   * Result: Array of filtered tab groups maintaining hierarchy structure
   */
  const filteredGroupedTabs = useMemo(() => {
    return groupedTabs.map((tabGroup) => {
      const currentLevel = tabGroup[0]?.tabLevel;

      if (currentLevel === 0) {
        return tabGroup;
      }

      const parentLevel = currentLevel - 1;
      const activeParentTab = getActiveTabForLevel(parentLevel);

      const filtered = tabGroup.filter((tab) => {
        const shouldShow = shouldShowTab(tab as TabWithParentInfo, activeParentTab);
        return shouldShow;
      });

      return filtered;
    });
  }, [groupedTabs, getActiveTabForLevel]);

  /**
   * Determines the first expanded (visible) tab group index for rendering optimization.
   *
   * Purpose: Identifies which tab group should be treated as the "top group" for:
   * - Visual styling differences (expanded vs collapsed appearance)
   * - Breadcrumb navigation context
   * - Layout calculations
   *
   * Logic: Finds first tab group that has tabs AND is currently active (in activeLevels)
   * Returns: Index of first expanded group, or -1 if none found
   */
  const firstExpandedIndex = filteredGroupedTabs.findIndex(
    (tabs) => tabs.length > 0 && activeLevels.includes(tabs[0].tabLevel)
  );

  /**
   * TODO: move to a more central location
   * Session restoration effect for active tab levels and tab selections.
   *
   * This effect runs once during component initialization to restore navigation state
   * from context-stored form states and selected records. It coordinates with useMultiWindowURL
   * to determine the appropriate tab levels to activate based on previously saved form states.
   *
   * Enhanced Process:
   * 1. Checks if initial loading has already completed (prevents multiple executions)
   * 2. Retrieves selected records from context for the current window
   * 3. Gets form states from window context for all available tabs
   * 4. Calculates navigation depth based on the position of the last form state in selected records
   * 5. Uses expand mode to set levels directly without navigation logic
   * 6. Resets tab-by-level mapping for clean state or restores based on calculated depth
   * 7. Marks loading as complete to prevent interference with user navigation
   *
   * Key improvements:
   * - Uses context-based selected records instead of URL parameters
   * - Maintains activeTabsByLevel state consistency during restoration
   * - Handles edge cases where form states and selected records may be misaligned
   * - Uses context-based form state management
   *
   * This ensures users return to their previous navigation context when:
   * - Refreshing the page
   * - Navigating back to a previously opened window
   * - Restoring from bookmarked URLs
   *
   * Dependencies:
   * - activeWindow: Contains windowId and windowIdentifier for context access
   * - getTabFormState: Provides form state management via context
   * - getSelectedRecord: Retrieves selected records from context
   * - activeLevelsLoaded: Prevents multiple restoration attempts
   * - windowData?.tabs: Available tabs for clearing selections
   * - graph: Tab hierarchy for clearing dependent selections
   * - setActiveLevel: Navigation state control function
   */
  useEffect(() => {
    // Early return: Skip if already loaded or function not available
    if (activeLevelsLoaded || !setActiveLevel || !getTabFormState) return;

    // Extract window identifiers from activeWindow
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;

    if (!windowId || !windowIdentifier) return;

    // Get form states from context for all available tabs
    const tabs = windowData?.tabs || [];
    const formStateTabIds = tabs
      .map(tab => tab.id)
      .filter(tabId => getTabFormState(windowIdentifier, tabId) !== undefined);

    // Handle window with no saved form states - reset to clean state
    if (formStateTabIds.length === 0) {
      console.log("TabsContainer: No form states found, resetting navigation state.");
      setActiveLevel(0);
      setActiveTabsByLevel();
      for (const tab of tabs) {
        graph.clearSelected(tab);
        graph.clearSelectedMultiple(tab);
      }
      setActiveLevelsLoaded(true);
      return;
    }

    // Get selected records from context for all tabs to determine navigation depth
    const selectedRecordTabIds = tabs
      .map(tab => tab.id)
      .filter(tabId => getSelectedRecord(windowIdentifier, tabId) !== undefined);

    // Calculate navigation depth based on form state position in selected records
    const lastFormStateTabId = formStateTabIds.length > 0 ? formStateTabIds[formStateTabIds.length - 1] : null;
    const lastFormStateIndex = lastFormStateTabId ? selectedRecordTabIds.indexOf(lastFormStateTabId) : -1;

    // Handle window with saved form states - restore navigation depth
    if (lastFormStateIndex > 0) {
      console.log("TabsContainer: Restoring navigation state to level", lastFormStateIndex);
      setActiveLevel(lastFormStateIndex, true); // Use expand mode for direct restoration
    }

    // Mark as loaded to prevent subsequent executions
    setActiveLevelsLoaded(true);
  }, [
    activeWindow,
    activeLevelsLoaded,
    windowData?.tabs,
    graph,
    setActiveLevel,
    setActiveTabsByLevel,
    getTabFormState,
    getSelectedRecord
  ]);

  // Loading state: Show skeleton UI while window metadata is being fetched
  if (!windowData) {
    return (
      <div className="p-4 animate-pulse flex-1 flex flex-col gap-4">
        <div className="h-6 w-1/2 bg-(--color-transparent-neutral-10) rounded-md" />
        <div className="h-10 w-full bg-(--color-transparent-neutral-10) rounded-md" />
        <div className="flex-1 bg-(--color-transparent-neutral-10) rounded-md" />
      </div>
    );
  }

  return (
    <TabRefreshProvider data-testid="TabRefreshProvider__895626">
      <AppBreadcrumb allTabs={filteredGroupedTabs} data-testid="AppBreadcrumb__895626" />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {filteredGroupedTabs.map((tabs, index) => {
          if (tabs.length === 0) return null;

          const isTopGroup = index === firstExpandedIndex && firstExpandedIndex !== -1;

          return (
            <Tabs
              key={tabs[0].id}
              tabs={tabs}
              isTopGroup={isTopGroup}
              data-testid="Tabs__895626"
            />
          );
        })}
      </div>
    </TabRefreshProvider>
  );
}
