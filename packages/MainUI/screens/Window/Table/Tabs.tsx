'use client';

import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { TabLevel } from '../../../components/TabLevel';
import { useStyle } from './styles';
import { useSelected } from '@/contexts/selected';

export default function Tabs({ tabs }: { tabs: Tab[]; level?: number }) {
  const graph = useSelected();
  const parentTab = graph.getParent(tabs[0].id);
  const parentRecord = graph.getSelected(parentTab?.id);
  const [activeKey, setActiveKey] = useState(tabs[0].id);
  const { sx } = useStyle();

  const refs = useRef(
    tabs.reduce(
      (acum, current) => {
        acum[current.id] = () => setActiveKey(current.id);
        return acum;
      },
      {} as Record<string, () => void>,
    ),
  );

  const active = useMemo(() => tabs.find(tab => tab.id === activeKey) as Tab, [activeKey, tabs]);

  if (tabs.length === 1) {
    return <TabLevel tab={tabs[0]} />;
  }

  if (!parentRecord) {
    return null;
  }

  return (
    <div className="bg-gray-200 p-2">
      {tabs.map(tab => (
        <Button
          key={tab.id}
          onClick={refs.current[tab.id]}
          title={tab.title}
          aria-label={tab.title}
          sx={sx.button(tab, activeKey)}>
          {tab.name}
        </Button>
      ))}
      <TabLevel tab={active} />
    </div>
  );
}
