'use client';

import { useCallback, useState } from 'react';
import type { Tab as TabType } from '@workspaceui/etendohookbinder/src/api/types';
import type { TabsProps } from '@/components/window/types';
import { TabContainer } from '@/components/window/TabContainer';
import { SubTabsSwitch } from '@/components/window/SubTabsSwitch';
import { Tab } from '@/components/window/Tab';
import { TabButton } from '@/components/window/TabButton';
import { useSelected } from '@/hooks/useSelected';

export default function Tabs({ tabs }: TabsProps) {
  const { activeLevels, setActiveLevel } = useSelected();
  const [current, setCurrent] = useState(tabs[0]);
  const collapsed = !activeLevels.includes(current.level);

  const handleClick = useCallback(
    (tab: TabType) => {
      setCurrent(tab);
      setActiveLevel(tab.level);
    },
    [setActiveLevel],
  );

  const handleClose = useCallback(() => {
    setActiveLevel(current.level - 1);
  }, [current.level, setActiveLevel]);

  return (
    <TabContainer current={current} collapsed={collapsed}>
      {current.level === 0 ? (
        <TabButton tab={current} onClick={handleClick} active />
      ) : (
        <SubTabsSwitch current={current} tabs={tabs} onClick={handleClick} onClose={handleClose} />
      )}
      <Tab tab={current} collapsed={collapsed} />
    </TabContainer>
  );
}
