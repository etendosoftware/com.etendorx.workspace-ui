"use client";

import { useCallback, useState } from "react";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";
import type { TabsProps } from "@/components/window/types";
import { TabContainer } from "@/components/window/TabContainer";
import { SubTabsSwitch } from "@/components/window/SubTabsSwitch";
import { Tab } from "@/components/window/Tab";
import { TabButton } from "@/components/window/TabButton";
import { useSelected } from "@/hooks/useSelected";
import TabContextProvider from "@/contexts/tab";

export default function Tabs({ tabs }: TabsProps) {
  const { activeLevels, setActiveLevel } = useSelected();
  const [current, setCurrent] = useState(tabs[0]);
  const collapsed = !activeLevels.includes(current.tabLevel);
  const [expand, setExpanded] = useState(false);

  const handleClick = useCallback(
    (tab: TabType) => {
      setCurrent(tab);
      setActiveLevel(tab.tabLevel);
    },
    [setActiveLevel],
  );

  const handleDoubleClick = useCallback(
    (tab: TabType) => {
      setCurrent(tab);
      const newExpand = !expand;
      setExpanded(newExpand);
      setActiveLevel(tab.tabLevel, newExpand);
    },
    [expand, setActiveLevel],
  );

  const handleClose = useCallback(() => {
    setActiveLevel(current.tabLevel - 1);
  }, [current.tabLevel, setActiveLevel]);

  return (
    <TabContainer current={current} collapsed={collapsed}>
      {current.tabLevel === 0 ? (
        <TabButton tab={current} onClick={handleClick} onDoubleClick={handleDoubleClick} active />
      ) : (
        <SubTabsSwitch
          current={current}
          tabs={tabs}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onClose={handleClose}
        />
      )}
      <TabContextProvider tab={current}>
        <Tab tab={current} collapsed={collapsed} />
      </TabContextProvider>
    </TabContainer>
  );
}
