import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../../../../ComponentLibrary/src/components';
import { Box, useTheme } from '@mui/material';
import { styles } from './styles';
import Content from './Content';

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const theme = useTheme();
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

  const active = useMemo(
    () => tabs.find(tab => tab.id === activeKey) as Tab,
    [activeKey, tabs],
  );

  const buttonSx = (tab: Tab, activeKey?: string) => ({
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    color:
      tab.id === activeKey
        ? theme.palette.text.primary
        : theme.palette.text.secondary,
    backgroundColor:
      tab.id === activeKey
        ? theme.palette.background.default
        : theme.palette.action.disabled,
  });

  return (
    <Box sx={styles.container}>
      <div>
        {tabs.map(tab => (
          <Button
            key={tab.id}
            onClick={refs.current[tab.id]}
            sx={buttonSx(tab, activeKey)}>
            {tab._identifier}
          </Button>
        ))}
      </div>
      <Content tab={active} />
    </Box>
  );
}
