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

// @data-testid-ignore
"use client";

import { useCallback, useState, useTransition, useEffect } from "react";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";
import type { TabsProps } from "@/components/window/types";
import { TabContainer } from "@/components/window/TabContainer";
import { SubTabsSwitch } from "@/components/window/SubTabsSwitch";
import { Tab } from "@/components/window/Tab";
import { useWindowContext } from "@/contexts/window";
import TabContextProvider from "@/contexts/tab";
import ResizeHandle from "@workspaceui/componentlibrary/src/components/ResizeHandle";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";

interface ExtendedTabsProps extends TabsProps {
  isTopGroup?: boolean;
  windowIdentifier: string;
}

export default function TabsComponent({
  tabs,
  isTopGroup = false,
  initialActiveTab,
  windowIdentifier,
}: ExtendedTabsProps) {
  const initialTab = initialActiveTab && tabs.some((t) => t.id === initialActiveTab.id) ? initialActiveTab : tabs[0];

  const [current, setCurrent] = useState(initialTab);
  // Visual active tab id updates immediately for instant feedback
  const [activeTabId, setActiveTabId] = useState(initialTab.id);
  const [expand, setExpanded] = useState(false);
  const [customHeight, setCustomHeight] = useState(50);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialActiveTab) {
      // Only reset if the initialActiveTab is actually different and valid
      if (initialActiveTab.id !== current.id && tabs.some((t) => t.id === initialActiveTab.id)) {
        setCurrent(initialActiveTab);
        setActiveTabId(initialActiveTab.id);
      } else if (!tabs.some((t) => t.id === current.id)) {
        // If current tab is no longer in the list (e.g. filtered out), fall back to first
        const fallback = tabs[0];
        setCurrent(fallback);
        setActiveTabId(fallback.id);
      }
    } else {
      // Logic for when no initial active tab is provided but list changed
      if (!tabs.some((t) => t.id === current.id)) {
        setCurrent(tabs[0]);
        setActiveTabId(tabs[0].id);
      }
    }
  }, [initialActiveTab, tabs]); // dependency on tabs ensures re-eval when filter changes

  const { activeLevels, setActiveLevel, setActiveTabsByLevel } = useTableStatePersistenceTab({
    windowIdentifier: windowIdentifier,
    tabId: "",
  });

  const collapsed = !activeLevels.includes(current.tabLevel);
  const isTopExpanded = !collapsed && isTopGroup;
  const showResizeHandle = !isTopExpanded && !collapsed;

  const handleClick = useCallback(
    (tab: TabType) => {
      // Immediate visual feedback
      setActiveTabId(tab.id);
      // Defer heavy content update so the UI responds instantly
      startTransition(() => {
        setCustomHeight(50);
        setCurrent(tab);
        setActiveLevel(tab.tabLevel);

        // Update the active tab mapping for this level so child tab filtering works correctly
        setActiveTabsByLevel(tab);
      });
    },
    [setActiveLevel, startTransition, setActiveTabsByLevel]
  );

  const handleDoubleClick = useCallback(
    (tab: TabType) => {
      setActiveTabId(tab.id);
      const newExpand = !expand;
      // Defer deeper updates to avoid blocking click feedback
      startTransition(() => {
        setCurrent(tab);
        setExpanded(newExpand);
        setActiveLevel(tab.tabLevel, newExpand);

        // Update the active tab mapping for this level
        setActiveTabsByLevel(tab);
      });
    },
    [expand, setActiveLevel, startTransition, setActiveTabsByLevel]
  );

  const handleHeightChange = useCallback((height: number) => {
    setCustomHeight(height);
  }, []);

  const handleClose = useCallback(() => {
    setActiveLevel(current.tabLevel - 1);
  }, [current.tabLevel, setActiveLevel]);

  const renderTabContent = () => {
    if (current.tabLevel === 0) {
      return null;
    }

    const subTabsSwitch = (
      <SubTabsSwitch
        current={current}
        activeTabId={activeTabId}
        tabs={tabs}
        collapsed={collapsed}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onClose={handleClose}
        data-testid={`SubTabsSwitch__${current?.id ?? activeTabId ?? "6fa401"}`}
      />
    );

    if (showResizeHandle) {
      return (
        <ResizeHandle
          initialHeight={customHeight}
          minHeight={9}
          maxOffsetRem={9}
          onHeightChange={handleHeightChange}
          data-testid={`ResizeHandle__${current?.id ?? activeTabId ?? "6fa401"}`}>
          {subTabsSwitch}
        </ResizeHandle>
      );
    }

    return subTabsSwitch;
  };

  return (
    <TabContainer
      current={current}
      collapsed={collapsed}
      isTopExpanded={isTopExpanded}
      customHeight={customHeight}
      data-testid="TabContainer__6fa401">
      {renderTabContent()}
      <div className="flex-1 min-h-0 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 flex-col ${tab.id === current.id ? "flex" : "hidden"}`}
            data-testid={`TabWrapper__${tab.id}`}>
            <TabContextProvider tab={tab} data-testid={`TabContextProvider__${tab.id}`}>
              <Tab tab={tab} collapsed={collapsed} windowIdentifier={windowIdentifier} data-testid={`Tab__${tab.id}`} />
            </TabContextProvider>
          </div>
        ))}
      </div>
    </TabContainer>
  );
}
