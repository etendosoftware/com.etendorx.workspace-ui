'use client';

import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useMemo, useState } from 'react';
import { Button, SxProps, Theme } from '@mui/material';
import { TabLevel } from '../../../components/TabLevel';
import { useStyle } from './styles';
import Container from '@/components/window/container';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useSelected } from '@/contexts/selected';

const TabButton = ({ tab, onClick, sx }: { tab: Tab; onClick: (tab: Tab) => void; sx: SxProps<Theme> }) => {
  const { window } = useMetadataContext();

  const title = useMemo(() => (tab.level === 0 ? window?.name : tab.name), [tab.level, tab.name, window?.name]);

  const handleClick = useCallback(() => {
    onClick(tab);
  }, [onClick, tab]);

  return (
    <Button onClick={handleClick} title={title} aria-label={tab.title} sx={sx}>
      {title}
    </Button>
  );
};

const TabsSwitch = ({ tabs, current, onClick }: { tabs: Tab[]; current: Tab; onClick: (tab: Tab) => void }) => {
  const { sx } = useStyle();

  return (
    <div>
      {tabs.map(tab => (
        <TabButton key={tab.id} tab={tab} onClick={onClick} sx={sx.button(current.id === tab.id)} />
      ))}
    </div>
  );
};

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const { activeLevels } = useSelected();
  const [current, setCurrent] = useState(tabs[0]);

  return (
    <Container>
      <TabsSwitch tabs={tabs} current={current} onClick={setCurrent} />
      <TabLevel tab={current} collapsed={!activeLevels.includes(current.level)} />
    </Container>
  );
}
