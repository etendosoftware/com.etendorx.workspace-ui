'use client';

import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useMemo, useState } from 'react';
import { Button, SxProps, Theme } from '@mui/material';
import { TabLevel } from '../../../components/TabLevel';
import { useStyle } from './styles';
import { useSelected } from '@/contexts/selected';
import Container from '@/components/window/container';
import { useMetadataContext } from '@/hooks/useMetadataContext';

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

export default function Tabs({ tabs }: { tabs: Tab[]; level?: number }) {
  const { graph } = useSelected();
  const parentTab = graph.getParent(tabs[0]);
  const parentRecord = parentTab ? graph.getSelected(parentTab) : undefined;
  const [current, handleClick] = useState(tabs[0]);

  if (tabs[0].level > 0 && !parentRecord) {
    return null;
  }

  return (
    <Container>
      <TabsSwitch tabs={tabs} current={current} onClick={handleClick} />
      <TabLevel tab={current} />
    </Container>
  );
}
