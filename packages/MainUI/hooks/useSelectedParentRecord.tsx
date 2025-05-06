import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useSelected } from '@/contexts/selected';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import { useTab } from './useTab';
import { useQueryParams } from './useQueryParams';
import { useEffect, useState } from 'react';

export default function useSelectedParentRecord(tab?: Tab) {
  const { selected, select } = useSelected();
  const params = useQueryParams();
  const { data: parentTab } = useTab(tab?.parentTabId);
  const parentId = params['selected_' + tab?.parentTabId]?.toString();
  const [selectedParentRecord] = useState(tab?.parentTabId ? selected[tab.parentTabId] : undefined);
  const { record: parentRecord } = useSingleDatasource(
    parentTab?.entityName,
    parentId,
    selectedParentRecord,
    !!selectedParentRecord,
  );

  useEffect(() => {
    if (parentTab && parentRecord && !selectedParentRecord) {
      select(parentRecord, parentTab);
    }
  }, [parentRecord, parentTab, select, selectedParentRecord]);

  return parentRecord;
}
