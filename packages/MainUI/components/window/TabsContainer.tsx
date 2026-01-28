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

import { useMemo, useCallback } from "react";
import Tabs from "@/components/window/Tabs";
import AppBreadcrumb from "@/components/Breadcrums";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import { shouldShowTab, type TabWithParentInfo } from "@/utils/tabUtils";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import { TabRefreshProvider } from "@/contexts/TabRefreshContext";
import { useWindowContext } from "@/contexts/window";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useUserContext } from "@/hooks/useUserContext";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { logger } from "@/utils/logger";
import { createSmartContext } from "@/utils/expressions";

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
/**
 * Component responsible for rendering a group of tabs and filtering them based on Display Logic.
 * This component is necessary to use hooks (useSelectedRecord, useUserContext)
 * needed for evaluating logic against the parent record.
 */
const TabsGroupRenderer = ({
  tabs,
  activeParentTab,
  isTopGroup,
  getActiveTabForLevel,
}: {
  tabs: Tab[];
  activeParentTab: Tab | null;
  isTopGroup: boolean;
  getActiveTabForLevel: (level: number) => Tab | null;
}) => {
  const { session } = useUserContext();
  // Fetch the record of the parent tab to evaluate THIS level's tabs
  const parentRecord = useSelectedRecord(activeParentTab || undefined);

  // FETCH GRANDPARENT CONTEXT to verify PARENT'S visibility (Cascading Hide)
  // If the parent tab itself is hidden (by its own display logc), we must hide these children
  // (even if there is a "ghost" selection in the parent).
  const currentLevel = tabs[0].tabLevel;
  const grandParentLevel = currentLevel - 2;
  const grandParentTab = currentLevel > 1 ? getActiveTabForLevel(grandParentLevel) : null;
  // Verify Parent Visibility against Grandparent Record
  const grandParentRecord = useSelectedRecord(grandParentTab || undefined);

  console.log(
    "[TabsGroupRenderer] Rendering group:",
    tabs.map((t) => t.name),
    "ActiveParent:",
    activeParentTab?.name
  );

  const isParentVisible = useMemo(() => {
    console.log("[TabsGroupRenderer] Checking parent visibility:", activeParentTab?.name);
    if (!activeParentTab) return true;
    const expression = activeParentTab.displayLogicExpression || activeParentTab.displayLogic;
    if (!expression) return true;

    // Use createSmartContext for robust evaluation
    const context = createSmartContext({
      values: grandParentRecord || undefined,
      fields: grandParentTab?.fields, // Use grandparent fields for mapping if available
      context: { ...(grandParentTab || {}), ...session },
    });

    try {
      const compiledExpr = compileExpression(expression);
      // We assume global session variables are handled by session arg
      const result = compiledExpr(context, context);
      return result;
    } catch (error) {
      console.error("[TabsGroupRenderer] Error checking parent visibility", error);
      return true;
    }
  }, [activeParentTab, grandParentRecord, grandParentTab, session]);

  const filteredTabs = useMemo(() => {
    // 1. Cascade Check: If Parent is hidden, Children are hidden.
    if (!isParentVisible) {
      console.log("[TabsGroupRenderer] Parent hidden, hiding all children");
      return [];
    }

    // 2. Standard Check: If Parent Record is missing (and required), default hide?
    // (Optional: if (!parentRecord?.id && currentLevel > 0) return []; )

    // 3. Filter current tabs
    // Use createEvaluationContext for robust evaluation (Flat Object with Normalized Values)
    const context = createSmartContext({
      values: parentRecord || undefined,
      fields: activeParentTab?.fields,
      context: { ...(activeParentTab || {}), ...session }, // Include tab metadata in context if needed
    });

    return tabs.filter((tab) => {
      const expression = tab.displayLogicExpression || tab.displayLogic;

      if (!expression) {
        return true;
      }

      try {
        const compiledExpr = compileExpression(expression);
        const result = compiledExpr(context, context);
        return result;
      } catch (error) {
        logger.error(`Error evaluating display logic for tab ${tab.name}:`, error);
        return false; // Hide on error
      }
    }); // removed specific dependency on isParentVisible which is handled by early return, but kept logically
  }, [tabs, parentRecord, session, activeParentTab, isParentVisible]);

  if (filteredTabs.length === 0) {
    console.log("[TabsGroupRenderer] No visible tabs in group");
    return null;
  }

  const initialActiveTab = getActiveTabForLevel(tabs[0].tabLevel);

  return (
    <Tabs
      key={filteredTabs[0].id}
      tabs={filteredTabs}
      isTopGroup={isTopGroup}
      initialActiveTab={initialActiveTab ?? undefined}
      data-testid="Tabs__895626"
    />
  );
};

export default function TabsContainer({ windowData }: { windowData: Etendo.WindowMetadata }) {
  /**
   * Multi-window navigation hook providing access to current window state.
   */
  const { activeWindow } = useWindowContext();

  /**
   * Graph-based tab hierarchy management system with navigation state.
   *
   * Manages:
   * - activeLevels: Array of currently visible tab levels [0,1] or [1,2] etc.
   * - activeTabsByLevel: Map of level -> tabId for tracking active tab per level
   * - setActiveLevel: Function to change visible navigation levels
   * - setActiveTabsByLevel: Function to update active tab selection per level
   * - graph: Hierarchical tab structure
   */
  const { activeLevels, activeTabsByLevel } = useTableStatePersistenceTab({
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
    const groups = windowData ? groupTabsByLevel(windowData) : [];
    return groups.filter((group) => group && group.length > 0);
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
    return groupedTabs.map((tabGroup, index) => {
      const currentLevel = tabGroup[0]?.tabLevel;

      if (index === 0) {
        return tabGroup;
      }

      const parentLevel = groupedTabs[index - 1][0].tabLevel;
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
          const currentLevel = tabs[0].tabLevel;

          // Determine the active parent tab
          // For level 0, there is no parent (null)
          // For level > 0, get the active tab of the PREVIOUS GROUP's level
          let activeParentTab = null;
          if (index > 0) {
            const parentLevel = groupedTabs[index - 1][0].tabLevel;
            activeParentTab = getActiveTabForLevel(parentLevel);
          }

          return (
            <TabsGroupRenderer
              key={tabs[0].id}
              tabs={tabs}
              activeParentTab={activeParentTab}
              isTopGroup={isTopGroup}
              getActiveTabForLevel={getActiveTabForLevel}
              data-testid="TabsGroupRenderer__895626"
            />
          );
        })}
      </div>
    </TabRefreshProvider>
  );
}
