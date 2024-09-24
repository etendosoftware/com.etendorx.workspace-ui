import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { useMemo } from 'react';

export default function useIsEnabled(tab: Tab) {
  const { selectedTab } = useMetadataContext();

  return useMemo(
    () => tab.level === 0 || typeof selectedTab[tab.level - 1] !== 'undefined',
    [selectedTab, tab.level],
  );
}
