import { Tab } from '@workspaceui/etendohookbinder/api/types';
import { useMemo, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import DynamicTable from '../../components/Table';
import { useStyle } from './styles';

export default function Tabs({ tabs }: { tabs: Tab[] }) {
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
      <DynamicTable tab={active} />
    </Box>
  );
}
