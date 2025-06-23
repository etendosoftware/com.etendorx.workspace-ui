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
  const previousSelectionRef = useRef<string | number>("");

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window;

  const isCorrectWindow = windowId === currentWindowId;

  useEffect(() => {
    if (!isCorrectWindow) {
      return;
    }

    const recordsMap = mapBy(records, "id");
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const result: EntityData[] = [];
    let lastSelected: EntityData | null = null;

    for (const recordId of selectedIds) {
      const record = recordsMap[recordId];
      if (record) {
        result.push(record);
        lastSelected = record;
      }
    }

    const currentSelectionId = lastSelected?.id ? String(lastSelected.id) : "";

    if (currentSelectionId !== String(previousSelectionRef.current)) {
      previousSelectionRef.current = currentSelectionId;

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
      } else if (graph.getSelected(tab)) {
        graph.clearSelected(tab);

        if (onSelectionChange) {
          onSelectionChange("");
        }
      }

      if (result.length > 0) {
        graph.setSelectedMultiple(tab, result);
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
