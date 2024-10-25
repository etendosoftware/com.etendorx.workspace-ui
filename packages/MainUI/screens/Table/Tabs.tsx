import { Tab } from '@workspaceui/etendohookbinder/api/types';
import { useMemo, useRef, useState } from 'react';
import { theme } from '../../../ComponentLibrary/src/components';
import { Box, Button } from '@mui/material';
import { styles } from './styles';
import DynamicTable from '../../components/Table';

const buttonSx = (tab: Tab, activeKey?: string) => ({
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  color: tab.id === activeKey ? theme.palette.text.primary : theme.palette.text.secondary,
  backgroundColor: tab.id === activeKey ? theme.palette.background.default : theme.palette.action.disabled,
});

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0].id);

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
    <Box sx={styles.container}>
      {tabs.map(tab => (
        <Button
          key={tab.id}
          onClick={refs.current[tab.id]}
          title={tab.title}
          aria-label={tab.title}
          sx={buttonSx(tab, activeKey)}>
          {tab.name}
        </Button>
      ))}
      <DynamicTable tab={active} />
    </Box>
  );
}
