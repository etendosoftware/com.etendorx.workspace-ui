import { mapBy } from '@/utils/structures';
import type { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import type { MRT_RowSelectionState } from 'material-react-table';
import { useEffect } from 'react';
import { useSelected } from '@/contexts/selected';

export default function useTableSelection(tab: Tab, records: EntityData[], rowSelection: MRT_RowSelectionState) {
  const { graph } = useSelected();

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
      graph.setSelected(tab, last);
    } else if (graph.getSelected(tab)) {
      graph.clearSelected(tab);
    }

    if (result.length) {
      graph.setSelectedMultiple(tab, result);
    } else {
      graph.clearSelectedMultiple(tab);
    }
  }, [graph, records, rowSelection, tab]);
}
