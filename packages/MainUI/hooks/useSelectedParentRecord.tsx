import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useSelected } from '@/contexts/selected';

export default function useSelectedParentRecord(tab?: Tab) {
  const { selected } = useSelected();
  const parentTabId = tab?.parentTabId;

  return parentTabId ? selected[parentTabId] : undefined;
}
