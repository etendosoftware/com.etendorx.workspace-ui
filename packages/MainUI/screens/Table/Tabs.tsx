'use client';

import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { TabLevel } from '../../components/TabLevel';
import { useStyle } from './styles';

export default function Tabs({ tabs, level = 0 }: { tabs: Tab[]; level?: number }) {
  const [activeKey, setActiveKey] = useState(tabs[0].id);
  const { sx } = useStyle();

  const refs = useRef(
    tabs.reduce((acum, current) => {
      acum[current.id] = () => setActiveKey(current.id);
      return acum;
    }, {} as Record<string, () => void>),
  );

  const active = useMemo(() => tabs.find(tab => tab.id === activeKey) as Tab, [activeKey, tabs]);

  return (
    <Box sx={sx.container}>
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
      <TabLevel tab={active} level={level} />
    </Box>
  );
}
