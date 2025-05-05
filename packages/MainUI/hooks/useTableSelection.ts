import { useSelected } from '@/contexts/selected';
import { useTabContext } from '@/contexts/tab';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_RowSelectionState } from 'material-react-table';
import { useEffect } from 'react';

const getRecord = (recordId: string, records: EntityData[]) => {
  return records.find(r => r.id === recordId);
};

export default function useTableSelection(
  rowSelection: MRT_RowSelectionState,
  records: EntityData[],
) {
  const { tab } = useTabContext();
  const { select, selectMultiple, clear } = useSelected();

  useEffect(() => {
    const result = {} as Record<string, EntityData>;
    let last: EntityData | null | undefined;

    Object.keys(rowSelection).forEach(recordId => {
      last = getRecord(recordId, records);

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
