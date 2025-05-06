import { useSelected } from '@/contexts/selected';
import { mapBy } from '@/utils/structures';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_RowSelectionState } from 'material-react-table';
import { useEffect } from 'react';

export default function useTableSelection(
  tab: Tab,
  records: EntityData[],
  rowSelection: MRT_RowSelectionState,
) {
  const { select, selectMultiple, clear } = useSelected();

  useEffect(() => {
    const recordsMap = mapBy(records, "id");
    const result = {} as Record<string, EntityData>;
    let last: EntityData | null | undefined;

    Object.keys(rowSelection).forEach(recordId => {
      last = recordsMap[recordId];

      if (last) {
        result[recordId] = last;
      }
    });

    if (last) {
      select(last, tab);
    } else {
      clear(tab);
    }

    selectMultiple(result, tab);
  }, [clear, records, rowSelection, select, selectMultiple, tab]);
}
