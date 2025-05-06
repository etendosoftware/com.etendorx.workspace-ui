import { useSelected } from '@/contexts/selected';
import { mapBy } from '@/utils/structures';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_RowSelectionState, MRT_TableInstance } from 'material-react-table';
import { useEffect, useMemo } from 'react';

export default function useTableSelection(
  tab: Tab,
  records: EntityData[],
  rowSelection: MRT_RowSelectionState,
  table: MRT_TableInstance<EntityData>,
) {
  const { selected, select, selectMultiple, clear } = useSelected();
  const selectedRecord = selected[tab.id];
  const selectedId = selectedRecord?.id?.toString();
  const recordsMap = useMemo(() => mapBy(records, 'id'), [records]);

  useEffect(() => {
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
  }, [clear, recordsMap, rowSelection, select, selectMultiple, tab]);

  useEffect(() => {
    if (selectedId) {
      const row = table.getRow(selectedId);
      if (!row.getIsSelected()) {
        row.toggleSelected();
      }
    }
  }, [selectedId, table]);
}
