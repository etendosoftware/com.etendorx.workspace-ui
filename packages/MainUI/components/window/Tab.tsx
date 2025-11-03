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
import { AttachmentProvider } from "@/contexts/AttachmentContext";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState, useRef } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import {
  NEW_RECORD_ID,
  FORM_MODES,
  TAB_MODES,
  type FormMode as URLFormMode,
  type TabMode,
} from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { isFormView } from "@/utils/url/utils";

/**
 * Validates if a child tab can open FormView based on parent selection in URL
 */
const validateParentSelectionForFormView = (
  tab: TabLevelProps["tab"],
  graph: ReturnType<typeof useSelected>["graph"],
  windowId: string,
  getSelectedRecord: (windowId: string, tabId: string) => string | undefined
): boolean => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return true; // No parent, validation passes
  }

  const parentSelectedInURL = getSelectedRecord(windowId, parentTab.id);
  return !!parentSelectedInURL;
};

/**
 * Handles setting tab form state for new record
 */
const handleNewRecordFormState = (
  windowId: string,
  tabId: string,
  recordId: string,
  setTabFormState: (windowId: string, tabId: string, recordId: string, mode?: TabMode, formMode?: URLFormMode) => void
): void => {
  setTabFormState(windowId, tabId, recordId, TAB_MODES.FORM, FORM_MODES.NEW);
};

/**
 * Handles setting tab form state for editing existing record
 */
const handleEditRecordFormState = (
  windowId: string,
  tabId: string,
  newValue: string,
  selectedRecordId: string | undefined,
  setSelectedRecord: (windowId: string, tabId: string, recordId: string) => void,
  setTabFormState: (windowId: string, tabId: string, recordId: string, mode?: TabMode, formMode?: URLFormMode) => void
): void => {
  const formMode = FORM_MODES.EDIT;

  if (selectedRecordId !== newValue) {
    // Record selection changed - update selection first, then form state
    setSelectedRecord(windowId, tabId, newValue);
    setTimeout(() => {
      setTabFormState(windowId, tabId, newValue, TAB_MODES.FORM, formMode);
    }, 50);
  } else {
    // Same record - just open form
    setTabFormState(windowId, tabId, newValue, TAB_MODES.FORM, formMode);
  }
};

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const {
    activeWindow,
    setSelectedRecord,
    clearSelectedRecord,
    setTabFormState,
    clearTabFormState,
    clearTabFormStateAtomic,
    getTabFormState,
    getSelectedRecord,
    clearChildrenSelections,
  } = useMultiWindowURL();
  const { registerActions, onRefresh } = useToolbarContext();
  const { graph } = useSelected();
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const [toggle, setToggle] = useState(false);
  const lastParentSelectionRef = useRef<string | undefined>(undefined);

  const windowId = activeWindow?.windowId;

  const tabFormState = windowId ? getTabFormState(windowId, tab.id) : undefined;
  const selectedRecordId = windowId ? getSelectedRecord(windowId, tab.id) : undefined;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  // For child tabs, verify parent has selection in URL before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordIdFromURL = parentTab && windowId ? getSelectedRecord(windowId, parentTab.id) : undefined;
  const parentHasSelectionInURL = !parentTab || !!parentSelectedRecordIdFromURL;

  const hasFormViewState = !!tabFormState && tabFormState.mode === TAB_MODES.FORM;
  const shouldShowForm =
    hasFormViewState || isFormView({ currentMode, recordId: currentRecordId, parentHasSelectionInURL });
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (!windowId) {
        return;
      }

      // Handle clearing form state (empty value)
      if (!newValue) {
        clearTabFormState(windowId, tab.id);
        return;
      }

      // Validate parent selection for child tabs
      if (!validateParentSelectionForFormView(tab, graph, windowId, getSelectedRecord)) {
        return; // Don't allow child to open form if parent has no selection
      }

      // Handle new record
      if (newValue === NEW_RECORD_ID) {
        handleNewRecordFormState(windowId, tab.id, newValue, setTabFormState);
        return;
      }

      // Handle editing existing record
      handleEditRecordFormState(windowId, tab.id, newValue, selectedRecordId, setSelectedRecord, setTabFormState);
    },
    [
      currentRecordId,
      windowId,
      setTabFormState,
      clearTabFormState,
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
      const currentFormState = getTabFormState(windowId, tab.id);
      const isInFormView = currentFormState?.mode === TAB_MODES.FORM;

      if (isInFormView) {
        clearTabFormStateAtomic(windowId, tab.id);
      } else {
        clearSelectedRecord(windowId, tab.id);

        // Also clear children if this tab has any
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
          if (childIds.length > 0) {
            clearChildrenSelections(windowId, childIds);
          }
        }

        // Clear graph selection
        graph.clearSelected(tab);
      }
    }
  }, [windowId, clearTabFormStateAtomic, tab, getTabFormState, clearSelectedRecord, clearChildrenSelections, graph]);

  const handleTreeView = useCallback(() => {
    if (windowId) {
      setToggle((prev) => !prev);
    }
  }, [windowId]);

  useEffect(() => {
    // Register this tab's refresh callback
    registerRefresh(tab.tabLevel, onRefresh);

    return () => {
      // Cleanup on unmount
      unregisterRefresh(tab.tabLevel);
    };
  }, [tab.tabLevel, onRefresh, registerRefresh, unregisterRefresh]);

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

  /**
   * Clear selection when creating a new record
   * This prevents issues when creating a new record from a selected record in the table
   * which could lead to inconsistent state.
   */
  useEffect(() => {
    if (currentRecordId === NEW_RECORD_ID) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [currentRecordId, graph, tab]);

  // Auto-close child FormView when parent selection changes
  useEffect(() => {
    if (!windowId) {
      return;
    }

    const parentTab = graph.getParent(tab);
    if (!parentTab) {
      return; // Only for child tabs
    }

    const parentSelectedId = getSelectedRecord(windowId, parentTab.id);
    const previousParentId = lastParentSelectionRef.current;

    // Only process if parent selection ID actually changed
    if (parentSelectedId === previousParentId) {
      return; // No change, skip processing
    }

    // Update ref BEFORE any early returns
    lastParentSelectionRef.current = parentSelectedId;

    // Skip closing if this is a NEW -> real ID transition (save operation)
    const isParentSaveTransition =
      previousParentId === NEW_RECORD_ID && parentSelectedId && parentSelectedId !== NEW_RECORD_ID;

    // Close child FormView only if:
    // 1. There was a previous parent selection (not initial render)
    // 2. Parent selection changed to something else (different ID or undefined)
    // 3. This is NOT a save transition (NEW -> real ID)
    // Note: We now close child FormView even if parent is in FormView (navigation between parent records should reset children)
    if (previousParentId !== undefined && !isParentSaveTransition) {
      clearTabFormState(windowId, tab.id);
      graph.clearSelected(tab);
    }
  }, [windowId, graph, tab, getSelectedRecord, clearTabFormState, getTabFormState, currentMode, tabFormState?.mode]);

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
        <AttachmentProvider data-testid="AttachmentProvider__5893c8">
          <DynamicTable
            isTreeMode={toggle}
            setRecordId={handleSetRecordId}
            onRecordSelection={handleRecordSelection}
            data-testid="DynamicTable__5893c8"
          />
        </AttachmentProvider>
      )}
    </div>
  );
}

export default Tab;
