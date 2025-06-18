"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/etendohookbinder/src/api/types";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const { activeWindow, setSelectedRecord, clearSelectedRecord, setTabFormState, clearTabFormState, getTabFormState } =
    useMultiWindowURL();
  const { registerActions } = useToolbarContext();
  const { graph } = useSelected();

  const windowId = activeWindow?.windowId;

  // ✅ URL es la fuente de verdad - obtener estado específico del tab
  const tabFormState = windowId ? getTabFormState(windowId, tab.id) : undefined;

  // ✅ Estados derivados del tab específico
  const currentMode = tabFormState?.mode || "table";
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  console.log(`[Tab ${tab.id}] State from URL:`, {
    windowId,
    currentMode,
    currentRecordId,
    currentFormMode,
    tabFormState,
  });

  // ✅ Función para cambiar recordId (formulario)
  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      console.log(`[Tab ${tab.id}] handleSetRecordId: ${currentRecordId} -> ${newValue}`);

      if (newValue && windowId) {
        const formMode = newValue === "new" ? "new" : "edit";
        console.log(`[Tab ${tab.id}] Setting form state in URL`);
        setTabFormState(windowId, tab.id, newValue, "form", formMode);
      } else if (windowId) {
        console.log(`[Tab ${tab.id}] Clearing form state from URL`);
        clearTabFormState(windowId, tab.id);
      }
    },
    [currentRecordId, windowId, setTabFormState, clearTabFormState, tab.id]
  );

  // ✅ Función para manejar selección de registros (tabla)
  const handleRecordSelection = useCallback(
    (recordId: string) => {
      console.log(`[Tab ${tab.id}] Record selected: ${recordId}`);

      if (windowId) {
        if (recordId) {
          console.log(`[Tab ${tab.id}] Setting selected record in URL: ${recordId}`);
          setSelectedRecord(windowId, tab.id, recordId);

          // ✅ IMPORTANTE: Actualizar el graph para compatibilidad con otros sistemas
          // Esto debe hacerse DESPUÉS de actualizar la URL para evitar loops
          setTimeout(() => {
            graph.setSelected(tab, { id: recordId } as any);
          }, 0);
        } else {
          console.log(`[Tab ${tab.id}] Clearing selected record from URL`);
          clearSelectedRecord(windowId, tab.id);

          // ✅ Limpiar también del graph
          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowId, tab, setSelectedRecord, clearSelectedRecord, graph]
  );

  // ✅ Función para "back"
  const handleBack = useCallback(() => {
    console.log(`[Tab ${tab.id}] Back action triggered`);

    if (windowId) {
      clearTabFormState(windowId, tab.id);
    }

    // Limpiar también del graph para compatibilidad
    graph.clearSelected(tab);
  }, [windowId, clearTabFormState, tab, graph]);

  // ✅ Función para "new"
  const handleNew = useCallback(() => {
    console.log(`[Tab ${tab.id}] New action triggered`);
    handleSetRecordId("new");

    // ✅ Al crear nuevo, limpiar selección previa
    graph.clearSelected(tab);
  }, [handleSetRecordId, graph, tab]);

  // ✅ NUEVO: Función para limpiar children cuando este tab pierde selección
  const handleClearChildren = useCallback(() => {
    if (!windowId) return;

    const children = graph.getChildren(tab);
    if (children && children.length > 0) {
      console.log(`[Tab ${tab.id}] Clearing ${children.length} children due to deselection`);
      children.forEach((child) => {
        clearSelectedRecord(windowId, child.id);
        clearTabFormState(windowId, child.id);
      });
    }
  }, [windowId, graph, tab, clearSelectedRecord, clearTabFormState]);

  // ✅ Registrar acciones
  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
      clearChildren: handleClearChildren, // ✅ Nuevo action
    };

    console.log(`[Tab ${tab.id}] Registering actions`);
    registerActions(actions);
  }, [registerActions, handleNew, handleBack, handleClearChildren, tab.id]);

  // ✅ NUEVO: Escuchar cuando se deselecciona este tab para limpiar hijos
  useEffect(() => {
    const handleDeselection = (eventTab: typeof tab) => {
      if (eventTab.id === tab.id) {
        console.log(`[Tab ${tab.id}] Was deselected, clearing children`);
        handleClearChildren();
      }
    };

    graph.addListener("unselected", handleDeselection);

    return () => {
      graph.removeListener("unselected", handleDeselection);
    };
  }, [graph, tab, handleClearChildren]);

  // ✅ Determinar qué mostrar
  const shouldShowForm = currentMode === "form" && currentRecordId;
  const formMode = currentFormMode === "new" ? FormMode.NEW : FormMode.EDIT;

  console.log(`[Tab ${tab.id}] Render decision:`, {
    shouldShowForm,
    currentMode,
    currentRecordId,
    formMode: currentFormMode,
  });

  return (
    <div
      className={`bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) border-t border-t-(--color-transparent-neutral-10) flex p-2  gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar windowId={window?.id || tab.window} tabId={tab.id} isFormView={shouldShowForm} />

      {shouldShowForm ? (
        <FormView
          mode={formMode}
          tab={tab}
          window={window}
          recordId={currentRecordId}
          setRecordId={handleSetRecordId}
        />
      ) : (
        <DynamicTable setRecordId={handleSetRecordId} onRecordSelection={handleRecordSelection} />
      )}
    </div>
  );
}

export default Tab;
