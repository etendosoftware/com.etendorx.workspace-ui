import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useSelected } from '@/contexts/selected';

export default function useSelectedParentRecord(tab?: Tab) {
  const { selected } = useSelected();

  return tab?.parentTabId ? selected[tab.parentTabId] : null;
}
