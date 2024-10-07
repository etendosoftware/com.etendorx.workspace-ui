import { Tab } from '@workspaceui/etendohookbinder/api/types';
import { useMetadataContext } from '@workspaceui/etendohookbinder/hooks/useMetadataContext';
import { useMemo } from 'react';

export default function useIsEnabled(tab: Tab) {
  const { selected } = useMetadataContext();

  return useMemo(
    () => tab.level === 0 || typeof selected[tab.level - 1] !== 'undefined',
    [selected, tab.level],
  );
}
