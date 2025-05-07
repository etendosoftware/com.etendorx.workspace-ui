import { mapBy } from '@/utils/structures';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_RowSelectionState } from 'material-react-table';
import { useEffect } from 'react';
import { useSelected } from '@/contexts/selected';

export default function useTableSelection(tab: Tab, records: EntityData[], rowSelection: MRT_RowSelectionState) {
  const graph = useSelected();

  useEffect(() => {
    const recordsMap = mapBy(records, 'id');
    const result: EntityData[] = [];
    let last: EntityData | null | undefined;

    Object.keys(rowSelection).forEach(recordId => {
      last = recordsMap[recordId];

      if (last) {
        result.push(last);
      }
    });

    if (last) {
      graph.setSelected(tab.id, last);
    } else {
      graph.clearSelected(tab.id);
    }

    graph.setSelectedMultiple(tab.id, result);
  }, [graph, records, rowSelection, tab.id]);
}
