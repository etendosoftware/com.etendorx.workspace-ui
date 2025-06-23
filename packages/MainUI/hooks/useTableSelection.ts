import { useSelected } from "@/hooks/useSelected";
import { mapBy } from "@/utils/structures";
import type { EntityData, Tab } from "@workspaceui/etendohookbinder/src/api/types";
import type { MRT_RowSelectionState } from "material-react-table";
import { useEffect, useRef } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export default function useTableSelection(
  tab: Tab,
  records: EntityData[],
  rowSelection: MRT_RowSelectionState,
  onSelectionChange?: (recordId: string) => void
) {
  const { graph } = useSelected();
  const { activeWindow, clearSelectedRecord } = useMultiWindowURL();
  const previousSelectionRef = useRef<string[]>([]);

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window;

  const isCorrectWindow = windowId === currentWindowId;

  useEffect(() => {
    if (!isCorrectWindow) {
      return;
    }

    const recordsMap = mapBy(records, "id");
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const selectedRecords: EntityData[] = [];
    let lastSelected: EntityData | null = null;

    for (const recordId of selectedIds) {
      const record = recordsMap[recordId];
      if (record) {
        selectedRecords.push(record);
        lastSelected = record;
      }
    }

    const currentSelectionIds = selectedRecords.map((r) => String(r.id)).sort();
    const previousSelectionIds = previousSelectionRef.current.sort();

    if (JSON.stringify(currentSelectionIds) !== JSON.stringify(previousSelectionIds)) {
      previousSelectionRef.current = currentSelectionIds;

      if (windowId) {
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          for (const child of children) {
            if (child.window === currentWindowId) {
              clearSelectedRecord(windowId, child.id);
            }
          }
        }
      }

      if (lastSelected && lastSelected.id != null) {
        graph.setSelected(tab, lastSelected);

        if (onSelectionChange) {
          onSelectionChange(String(lastSelected.id));
        }
      } else {
        if (graph.getSelected(tab)) {
          graph.clearSelected(tab);
        }

        if (onSelectionChange) {
          onSelectionChange("");
        }
      }

      if (selectedRecords.length > 0) {
        graph.setSelectedMultiple(tab, selectedRecords);
      } else {
        graph.clearSelectedMultiple(tab);
      }
    }
  }, [
    graph,
    records,
    rowSelection,
    tab,
    onSelectionChange,
    windowId,
    clearSelectedRecord,
    isCorrectWindow,
    currentWindowId,
  ]);
}
