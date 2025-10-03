/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState, useRef } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES } from "@/utils/url/constants";

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const {
    activeWindow,
    setSelectedRecord,
    clearSelectedRecord,
    setTabFormState,
    clearTabFormState,
    clearTabFormStateAtomic,
    clearTabFormStateAndChildren,
    getTabFormState,
    getSelectedRecord,
    clearChildrenSelections,
  } = useMultiWindowURL();
  const { registerActions } = useToolbarContext();
  const { graph } = useSelected();
  const [toggle, setToggle] = useState(false);
  const lastParentSelectionRef = useRef<string | undefined>(undefined);

  const windowId = activeWindow?.windowId;

  const tabFormState = windowId ? getTabFormState(windowId, tab.id) : undefined;
  const selectedRecordId = windowId ? getSelectedRecord(windowId, tab.id) : undefined;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (newValue && windowId) {
        // For child tabs, check if parent has selection in URL before allowing form view
        const parentTab = graph.getParent(tab);
        if (parentTab) {
          const parentSelectedInURL = getSelectedRecord(windowId, parentTab.id);
          if (!parentSelectedInURL) {
            return; // Don't allow child to open form if parent has no selection
          }
        }

        const formMode = newValue === NEW_RECORD_ID ? FORM_MODES.NEW : FORM_MODES.EDIT;

        if (newValue === NEW_RECORD_ID) {
          setTabFormState(windowId, tab.id, newValue, TAB_MODES.FORM, formMode);
        } else {
          if (selectedRecordId !== newValue) {
            setSelectedRecord(windowId, tab.id, newValue);
            setTimeout(() => {
              setTabFormState(windowId, tab.id, newValue, TAB_MODES.FORM, formMode);
            }, 50);
          } else {
            setTabFormState(windowId, tab.id, newValue, TAB_MODES.FORM, formMode);
          }
        }
      } else if (windowId) {
        clearTabFormState(windowId, tab.id);
      }
    },
    [
      currentRecordId,
      windowId,
      setTabFormState,
      clearTabFormState,
      tab.id,
      setSelectedRecord,
      selectedRecordId,
      getSelectedRecord,
      graph,
      tab,
    ]
  );

  const handleRecordSelection = useCallback(
    (recordId: string) => {
      if (windowId) {
        if (recordId) {
          setSelectedRecord(windowId, tab.id, recordId);
        } else {
          clearSelectedRecord(windowId, tab.id);

          // Clear children tabs when deselecting parent record
          const children = graph.getChildren(tab);
          if (children && children.length > 0) {
            const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
            if (childIds.length > 0) {
              clearChildrenSelections(windowId, childIds);
            }
          }

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowId, tab, setSelectedRecord, clearSelectedRecord, clearChildrenSelections, graph]
  );

  const handleNew = useCallback(() => {
    if (windowId) {
      setTabFormState(windowId, tab.id, NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.NEW);
    }
  }, [windowId, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (windowId) {
      console.log(`[Tab.handleBack] Clearing FormView for tab ${tab.id}, windowId ${windowId}`);

      // Use atomic clear to avoid race conditions with async navigation
      // This only clears this tab's FormView, doesn't touch children
      clearTabFormStateAtomic(windowId, tab.id);

      // Don't clear graph selection - just close the FormView
      // The record should stay selected in table mode
    }
  }, [windowId, clearTabFormStateAtomic, tab]);

  const handleTreeView = useCallback(() => {
    if (windowId) {
      setToggle((prev) => !prev);
    }
  }, [windowId]);

  const handleClearChildren = useCallback(() => {
    if (!windowId) return;

    const children = graph.getChildren(tab);
    if (children && children.length > 0) {
      const childIds = children.map((c) => c.id);
      // Batch clear to avoid multiple navigations
      clearChildrenSelections(windowId, childIds);
    }
  }, [windowId, graph, tab, clearChildrenSelections]);

  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
      treeView: handleTreeView,
    };

    registerActions(actions);
  }, [registerActions, handleNew, handleBack, handleTreeView, tab.id]);

  // NOTE: The "unselected" listener was removed because it caused race conditions
  // with stale closures. Children clearing is now handled directly in useTableSelection
  // via setSelectedRecordAndClearChildren and clearChildrenRecords, which use
  // applyWindowUpdates to avoid stale state issues.

  useEffect(() => {
    if (currentRecordId === NEW_RECORD_ID) {
      graph.clearSelected(tab);
    }
  }, [currentRecordId, graph, tab]);

  // Auto-close child FormView when parent selection changes
  useEffect(() => {
    if (!windowId) return;

    const parentTab = graph.getParent(tab);
    if (!parentTab) return; // Only for child tabs

    const parentSelectedId = getSelectedRecord(windowId, parentTab.id);
    const previousParentId = lastParentSelectionRef.current;

    // Only trigger when parent selection ID actually changes
    if (parentSelectedId !== previousParentId) {
      lastParentSelectionRef.current = parentSelectedId;

      // Close child FormView only if:
      // 1. There was a previous parent selection (not initial render)
      // 2. Parent selection changed to something else (different ID or undefined)
      // 3. Parent is NOT currently in FormView (if parent is in FormView, child should stay open)
      const parentTabState = windowId ? getTabFormState(windowId, parentTab.id) : undefined;
      const parentIsInFormView = parentTabState?.mode === TAB_MODES.FORM;

      if (previousParentId !== undefined && !parentIsInFormView) {
        clearTabFormState(windowId, tab.id);
        graph.clearSelected(tab);
      }
    }
  }, [windowId, graph, tab, getSelectedRecord, clearTabFormState, getTabFormState]);

  // For child tabs, verify parent has selection in URL before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordIdFromURL = parentTab && windowId ? getSelectedRecord(windowId, parentTab.id) : undefined;
  const parentHasSelectionInURL = !parentTab || !!parentSelectedRecordIdFromURL;

  const shouldShowForm = currentMode === TAB_MODES.FORM && !!currentRecordId && parentHasSelectionInURL;
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  return (
    <div
      className={`bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar
        windowId={window?.id || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        data-testid="Toolbar__5893c8"
      />
      {shouldShowForm ? (
        <FormView
          mode={formMode}
          tab={tab}
          window={window}
          recordId={currentRecordId}
          setRecordId={handleSetRecordId}
          data-testid="FormView__5893c8"
        />
      ) : (
        <DynamicTable
          isTreeMode={toggle}
          setRecordId={handleSetRecordId}
          onRecordSelection={handleRecordSelection}
          data-testid="DynamicTable__5893c8"
        />
      )}
    </div>
  );
}

export default Tab;
