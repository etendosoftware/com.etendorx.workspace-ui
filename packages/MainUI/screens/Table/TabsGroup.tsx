import { Tab } from '@workspaceui/etendohookbinder/api/types';
import Tabs from './Tabs';
import { useMemo } from 'react';

export default function TabsGroup(value: Tab[]) {
  const key = useMemo(() => value.reduce((prev, current) => prev + current.id, ''), [value]);

  return <Tabs key={key} tabs={value} />;
}
