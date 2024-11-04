import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';
import { useMetadataContext } from './useMetadataContext';

export default function useIsEnabled(tab: Tab) {
  const { selected } = useMetadataContext();

  return useMemo(() => tab.level === 0 || typeof selected[tab.level - 1] !== 'undefined', [selected, tab.level]);
}
