"use client";

import { useCallback, useState } from "react";
import type { Tab as TabType } from "@workspaceui/etendohookbinder/src/api/types";
import type { TabsProps } from "@/components/window/types";
import { TabContainer } from "@/components/window/TabContainer";
import { SubTabsSwitch } from "@/components/window/SubTabsSwitch";
import { Tab } from "@/components/window/Tab";
import { useSelected } from "@/hooks/useSelected";
import TabContextProvider from "@/contexts/tab";
import ResizeHandle from "../ResizeHandle";

interface ExtendedTabsProps extends TabsProps {
  isTopGroup?: boolean;
}

export default function Tabs({ tabs, isTopGroup = false }: ExtendedTabsProps) {
  const { activeLevels, setActiveLevel } = useSelected();
  const [current, setCurrent] = useState(tabs[0]);
  const collapsed = !activeLevels.includes(current.tabLevel);
  const [expand, setExpanded] = useState(false);
  const [customHeight, setCustomHeight] = useState(50);

  const handleClick = useCallback(
    (tab: TabType) => {
      setCustomHeight(50);
      setCurrent(tab);
      setActiveLevel(tab.tabLevel);
    },
    [setActiveLevel]
  );

  const handleDoubleClick = useCallback(
    (tab: TabType) => {
      setCurrent(tab);
      const newExpand = !expand;
      setExpanded(newExpand);
      setActiveLevel(tab.tabLevel, newExpand);
    },
    [expand, setActiveLevel]
  );

  const handleHeightChange = useCallback((height: number) => {
    setCustomHeight(height);
  }, []);

  const handleClose = useCallback(() => {
    setActiveLevel(current.tabLevel - 1);
  }, [current.tabLevel, setActiveLevel]);

  const isTopExpanded = !collapsed && isTopGroup;
  const showResizeHandle = !isTopExpanded && !collapsed;

  const renderTabContent = () => {
    if (current.tabLevel === 0) {
      return null;
    }

    const subTabsSwitch = (
      <SubTabsSwitch
        current={current}
        tabs={tabs}
        collapsed={collapsed}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onClose={handleClose}
      />
    );

    if (showResizeHandle) {
      return (
        <ResizeHandle
          initialHeight={customHeight}
          minHeight={9}
          maxOffsetRem={9}
          onClose={handleClose}
          onHeightChange={handleHeightChange}>
          {subTabsSwitch}
        </ResizeHandle>
      );
    }

    return subTabsSwitch;
  };

  return (
    <TabContainer current={current} collapsed={collapsed} isTopExpanded={isTopExpanded} customHeight={customHeight}>
      {renderTabContent()}
      <TabContextProvider tab={current}>
        <Tab tab={current} collapsed={collapsed} />
      </TabContextProvider>
    </TabContainer>
  );
}
