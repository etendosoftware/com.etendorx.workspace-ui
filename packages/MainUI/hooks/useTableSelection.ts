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
  const previousSelectionRef = useRef<string>("");

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window; // ✅ WindowId del tab

  // ✅ VALIDACIÓN: Solo procesar si estamos en la ventana correcta
  const isCorrectWindow = windowId === currentWindowId;

  useEffect(() => {
    // ✅ No procesar si no es la ventana correcta
    if (!isCorrectWindow) {
      console.log(`[useTableSelection ${tab.id}] Skipping - wrong window: ${windowId} !== ${currentWindowId}`);
      return;
    }

    const recordsMap = mapBy(records, "id");
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const result: EntityData[] = [];
    let lastSelected: EntityData | null = null;

    // ✅ Obtener registros seleccionados
    for (const recordId of selectedIds) {
      const record = recordsMap[recordId];
      if (record) {
        result.push(record);
        lastSelected = record;
      }
    }

    const currentSelectionId = lastSelected?.id || "";

    // ✅ Solo actualizar si realmente cambió la selección
    if (currentSelectionId !== previousSelectionRef.current) {
      console.log(
        `[useTableSelection ${tab.id}] Selection changed: ${previousSelectionRef.current} -> ${currentSelectionId} (window: ${currentWindowId})`
      );

      previousSelectionRef.current = currentSelectionId;

      // ✅ CRÍTICO: Limpiar selections de tabs hijos ANTES de establecer nueva selección
      if (windowId) {
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          console.log(
            `[useTableSelection ${tab.id}] Clearing ${children.length} children selections (window: ${currentWindowId})`
          );
          children.forEach((child) => {
            // ✅ VALIDACIÓN: Solo limpiar hijos de la misma ventana
            if (child.window === currentWindowId) {
              clearSelectedRecord(windowId, child.id);
            }
          });
        }
      }

      // ✅ Actualizar graph para el tab específico
      if (lastSelected) {
        graph.setSelected(tab, lastSelected);

        // ✅ Notificar callback si existe
        if (onSelectionChange) {
          console.log(
            `[useTableSelection ${tab.id}] Notifying selection: ${lastSelected.id} (window: ${currentWindowId})`
          );
          onSelectionChange(lastSelected.id);
        }
      } else if (graph.getSelected(tab)) {
        console.log(`[useTableSelection ${tab.id}] Clearing selection (window: ${currentWindowId})`);
        graph.clearSelected(tab);

        if (onSelectionChange) {
          onSelectionChange("");
        }
      }

      // ✅ Actualizar selección múltiple
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
