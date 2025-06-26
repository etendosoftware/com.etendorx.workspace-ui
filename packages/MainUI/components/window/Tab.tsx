"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/api-client/src/api/types";
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

  const tabFormState = windowId ? getTabFormState(windowId, tab.id) : undefined;
  const selectedRecordId = windowId ? getSelectedRecord(windowId, tab.id) : undefined;

  const currentMode = tabFormState?.mode || "table";
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (newValue && windowId) {
        const formMode = newValue === "new" ? "new" : "edit";

        if (newValue === "new") {
          setTabFormState(windowId, tab.id, newValue, "form", formMode);
        } else {
          if (selectedRecordId !== newValue) {
            setSelectedRecord(windowId, tab.id, newValue);
            setTimeout(() => {
              setTabFormState(windowId, tab.id, newValue, "form", formMode);
            }, 50);
          } else {
            setTabFormState(windowId, tab.id, newValue, "form", formMode);
          }
        }
      } else if (windowId) {
        clearTabFormState(windowId, tab.id);
      }
    },
    [currentRecordId, windowId, setTabFormState, clearTabFormState, tab.id, setSelectedRecord, selectedRecordId]
  );

  const handleRecordSelection = useCallback(
    (recordId: string) => {
      if (windowId) {
        if (recordId) {
          setSelectedRecord(windowId, tab.id, recordId);
        } else {
          clearSelectedRecord(windowId, tab.id);

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowId, tab, setSelectedRecord, clearSelectedRecord, graph]
  );

  const handleNew = useCallback(() => {
    if (windowId) {
      setTabFormState(windowId, tab.id, "new", "form", "new");
    }
  }, [windowId, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (windowId) {
      clearTabFormState(windowId, tab.id);

      graph.clearSelected(tab);
    }
  }, [windowId, clearTabFormState, tab, graph]);

  const handleClearChildren = useCallback(() => {
    if (!windowId) return;

    const children = graph.getChildren(tab);
    if (children && children.length > 0) {
      for (const child of children) {
        clearSelectedRecord(windowId, child.id);
        clearTabFormState(windowId, child.id);
      }
    }
  }, [windowId, graph, tab, clearSelectedRecord, clearTabFormState]);

  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
    };

    registerActions(actions);
  }, [registerActions, handleNew, handleBack, tab.id]);

  useEffect(() => {
    const handleDeselection = (eventTab: typeof tab) => {
      if (eventTab.id === tab.id) {
        if (windowId) {
          const currentTabState = getTabFormState(windowId, tab.id);
          const isInFormMode = currentTabState?.mode === "form";
          if (!isInFormMode) {
            handleClearChildren();
          }
        }
      }
    };

    graph.addListener("unselected", handleDeselection);

    return () => {
      graph.removeListener("unselected", handleDeselection);
    };
  }, [graph, tab, handleClearChildren, windowId, getTabFormState]);

  const shouldShowForm = currentMode === "form" && !!currentRecordId;
  const formMode = currentFormMode === "new" ? FormMode.NEW : FormMode.EDIT;

  return (
    <div
      className={`bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex  gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
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
