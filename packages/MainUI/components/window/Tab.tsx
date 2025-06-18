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
  const {
    activeWindow,
    setSelectedRecord,
    clearSelectedRecord,
    setTabFormState,
    clearTabFormState,
    getTabFormState,
    getSelectedRecord,
  } = useMultiWindowURL();
  const { registerActions } = useToolbarContext();
  const { graph } = useSelected();

  const windowId = activeWindow?.windowId;

  // ✅ URL es la fuente de verdad - obtener estado específico del tab
  const tabFormState = windowId ? getTabFormState(windowId, tab.id) : undefined;
  const selectedRecordId = windowId ? getSelectedRecord(windowId, tab.id) : undefined;

  // ✅ Estados derivados del tab específico
  const currentMode = tabFormState?.mode || "table";
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  console.log(`[Tab ${tab.id}] Complete state from URL:`, {
    windowId,
    selectedRecordId,
    currentMode,
    currentRecordId,
    currentFormMode,
    tabFormState,
  });

  // ✅ Función para cambiar recordId (formulario) - SIMPLIFICADA
  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      console.log(`[Tab ${tab.id}] handleSetRecordId: ${currentRecordId} -> ${newValue}`);

      if (newValue && windowId) {
        const formMode = newValue === "new" ? "new" : "edit";
        console.log(`[Tab ${tab.id}] Setting complete form state in URL (mode: ${formMode})`);

        // ✅ SIMPLIFICADO: Una sola operación que incluye tanto form como selection
        if (newValue === "new") {
          // Para NEW: Solo form state, sin selección
          setTabFormState(windowId, tab.id, newValue, "form", formMode);
        } else {
          // Para EDIT: Primero asegurar selección, luego form state
          if (selectedRecordId !== newValue) {
            setSelectedRecord(windowId, tab.id, newValue);
            // Delay para asegurar que la selección se establezca antes del form state
            setTimeout(() => {
              setTabFormState(windowId, tab.id, newValue, "form", formMode);
            }, 50);
          } else {
            // Ya está seleccionado, solo establecer form state
            setTabFormState(windowId, tab.id, newValue, "form", formMode);
          }
        }
      } else if (windowId) {
        console.log(`[Tab ${tab.id}] Clearing form state from URL`);
        clearTabFormState(windowId, tab.id);
      }
    },
    [currentRecordId, windowId, setTabFormState, clearTabFormState, tab.id, setSelectedRecord, selectedRecordId]
  );

  // ✅ Función para manejar selección de registros (tabla)
  const handleRecordSelection = useCallback(
    (recordId: string) => {
      console.log(`[Tab ${tab.id}] Record selection callback: ${recordId}`);

      if (windowId) {
        if (recordId) {
          console.log(`[Tab ${tab.id}] Setting selected record in URL: ${recordId}`);
          setSelectedRecord(windowId, tab.id, recordId);

          // ✅ IMPORTANTE: Actualizar el graph para compatibilidad con otros sistemas
          setTimeout(() => {
            graph.setSelected(tab, { id: recordId } as any);
          }, 0);
        } else {
          console.log(`[Tab ${tab.id}] Clearing selected record from URL`);
          clearSelectedRecord(windowId, tab.id);

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowId, tab, setSelectedRecord, clearSelectedRecord, graph]
  );

  // ✅ ACCIONES DE TOOLBAR ACTUALIZADAS PARA URL
  const handleNew = useCallback(() => {
    console.log(`[Tab ${tab.id}] NEW action triggered - setting form state`);

    if (windowId) {
      // ✅ IMPORTANTE: Establecer estado de formulario para NEW
      console.log(`[Tab ${tab.id}] Setting NEW form state: tf_${windowId}_${tab.id}=new`);
      setTabFormState(windowId, tab.id, "new", "form", "new");

      // ✅ NO limpiar selección inmediatamente - puede interferir
      // La selección se limpiará naturalmente al cambiar a formulario

      // ✅ Limpiar graph para compatibilidad (async para evitar interferencia)
      setTimeout(() => {
        console.log(`[Tab ${tab.id}] Clearing graph selection for NEW`);
        graph.clearSelected(tab);
      }, 100);
    } else {
      console.error(`[Tab ${tab.id}] No windowId available for NEW action`);
    }
  }, [windowId, tab, setTabFormState, graph]);

  const handleBack = useCallback(() => {
    console.log(`[Tab ${tab.id}] BACK action triggered`);

    if (windowId) {
      // ✅ Limpiar formulario y volver a tabla
      clearTabFormState(windowId, tab.id);

      // ✅ OPCIONAL: Mantener o limpiar la selección según el comportamiento deseado
      // Para UX mejor, podemos mantener la selección cuando volvemos de formulario

      // ✅ Limpiar también del graph para compatibilidad
      setTimeout(() => {
        graph.clearSelected(tab);
      }, 0);
    }
  }, [windowId, clearTabFormState, tab, graph]);

  // ✅ NUEVO: Función para limpiar children cuando este tab pierde selección (MEJORADA)
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

  // ✅ Registrar acciones BÁSICAS (new, back)
  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
    };

    console.log(`[Tab ${tab.id}] Registering basic actions`);
    registerActions(actions);
  }, [registerActions, handleNew, handleBack, tab.id]);

  // ✅ MODIFICADO: Escuchar cuando se deselecciona este tab para limpiar hijos (MEJORADO)
  useEffect(() => {
    const handleDeselection = (eventTab: typeof tab) => {
      if (eventTab.id === tab.id) {
        console.log(`[Tab ${tab.id}] Was deselected, checking if should clear children`);

        // ✅ CRÍTICO: Solo limpiar children si NO estamos en modo formulario
        // Si estamos en modo formulario, es porque estamos creando/editando un registro
        const currentTabState = getTabFormState(windowId!, tab.id);
        const isInFormMode = currentTabState?.mode === "form";

        if (!isInFormMode) {
          console.log(`[Tab ${tab.id}] Not in form mode, clearing children`);
          handleClearChildren();
        } else {
          console.log(`[Tab ${tab.id}] In form mode, NOT clearing children`);
        }
      }
    };

    graph.addListener("unselected", handleDeselection);

    return () => {
      graph.removeListener("unselected", handleDeselection);
    };
  }, [graph, tab, handleClearChildren, windowId, getTabFormState]);

  // ✅ SINCRONIZACIÓN: Si hay un recordId seleccionado en URL pero no form state,
  // y hacemos doble click, debe ir a formulario de edición
  useEffect(() => {
    // Este efecto se ejecuta cuando cambia selectedRecordId desde la URL
    if (selectedRecordId && !tabFormState && windowId) {
      console.log(`[Tab ${tab.id}] Record ${selectedRecordId} selected in URL, updating graph`);

      // Asegurar que el graph esté sincronizado
      setTimeout(() => {
        graph.setSelected(tab, { id: selectedRecordId } as any);
      }, 0);
    }
  }, [selectedRecordId, tabFormState, windowId, graph, tab]);

  // ✅ Determinar qué mostrar
  const shouldShowForm = currentMode === "form" && currentRecordId;
  const formMode = currentFormMode === "new" ? FormMode.NEW : FormMode.EDIT;

  console.log(`[Tab ${tab.id}] Render decision:`, {
    shouldShowForm,
    currentMode,
    currentRecordId,
    formMode: currentFormMode,
    selectedRecordId,
    hasTabFormState: !!tabFormState,
    tabFormStateRaw: tabFormState,
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
