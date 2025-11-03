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

import { useCallback, useState, useEffect, useTransition } from "react";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";
import type { TabsProps } from "@/components/window/types";
import { TabContainer } from "@/components/window/TabContainer";
import { SubTabsSwitch } from "@/components/window/SubTabsSwitch";
import { Tab } from "@/components/window/Tab";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import TabContextProvider from "@/contexts/tab";
import ResizeHandle from "@workspaceui/componentlibrary/src/components/ResizeHandle";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";

interface ExtendedTabsProps extends TabsProps {
  isTopGroup?: boolean;
  onTabChange?: (tab: TabType) => void;
}

export default function TabsComponent({ tabs, isTopGroup = false, onTabChange }: ExtendedTabsProps) {
  const [current, setCurrent] = useState(tabs[0]);
  // Visual active tab id updates immediately for instant feedback
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [expand, setExpanded] = useState(false);
  const [customHeight, setCustomHeight] = useState(50);
  const [isPending, startTransition] = useTransition();

  const { activeWindow } = useMultiWindowURL();
  const { activeLevels, setActiveLevel } = useTableStatePersistenceTab({
    windowIdentifier: activeWindow?.window_identifier || "",
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
      });
    },
    [setActiveLevel, startTransition]
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
      });
    },
    [expand, setActiveLevel, startTransition]
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

  useEffect(() => {
    if (onTabChange && current) {
      onTabChange(current);
    }
  }, [current, onTabChange]);

  return (
    <TabContainer
      current={current}
      collapsed={collapsed}
      isTopExpanded={isTopExpanded}
      customHeight={customHeight}
      data-testid="TabContainer__6fa401">
      {renderTabContent()}
      {isPending ? (
        <div className="p-4 animate-pulse flex-1 flex flex-col gap-4">
          <div className="h-10 w-full bg-(--color-transparent-neutral-10) rounded-md" />
          <div className="h-8 w-3/4 bg-(--color-transparent-neutral-10) rounded-md" />
          <div className="flex-1 bg-(--color-transparent-neutral-10) rounded-md" />
        </div>
      ) : (
        <TabContextProvider tab={current} data-testid={`TabContextProvider__${current?.id ?? activeTabId ?? "6fa401"}`}>
          <Tab tab={current} collapsed={collapsed} data-testid={`Tab__${current?.id ?? activeTabId ?? "6fa401"}`} />
        </TabContextProvider>
      )}
    </TabContainer>
  );
}
