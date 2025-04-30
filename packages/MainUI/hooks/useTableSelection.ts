import { useSelected } from '@/contexts/selected';
import { useTabContext } from '@/contexts/tab';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_RowSelectionState, MRT_TableInstance } from 'material-react-table';
import { useEffect } from 'react';

export default function useTableSelection(table: MRT_TableInstance<EntityData>, rowSelection: MRT_RowSelectionState) {
  const { tab } = useTabContext();
  const { select, selectMultiple, clear } = useSelected();

  useEffect(() => {
    const result = {} as Record<string, EntityData>;
    let last: EntityData | null = null;

    Object.keys(rowSelection).forEach(rowId => {
      last = table.getRow(rowId).original;
      result[rowId] = last;
    });

    if (last) {
      select(last, tab);
    } else {
      clear(tab);
    }

    selectMultiple(result, tab);
  }, [selectMultiple, tab, table, rowSelection, select, clear]);
}
