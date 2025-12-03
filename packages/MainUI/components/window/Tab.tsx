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
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES, type TabFormState } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { getNewTabFormState, isFormView } from "@/utils/window/utils";
import { useWindowContext } from "@/contexts/window";

/**
 * Validates if a child tab can open FormView based on parent selection in context
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

  const parentSelectedInContext = getSelectedRecord(windowId, parentTab.id);
  return !!parentSelectedInContext;
};

/**
 * Handles setting tab form state for new record
 */
const handleNewRecordFormState = (
  windowId: string,
  tabId: string,
  recordId: string,
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const newTabFormState = getNewTabFormState(recordId, TAB_MODES.FORM, FORM_MODES.NEW);
  setTabFormState(windowId, tabId, newTabFormState);
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
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const formMode = FORM_MODES.EDIT;
  const newTabFormState = getNewTabFormState(newValue, TAB_MODES.FORM, formMode);

  if (selectedRecordId !== newValue) {
    // Record selection changed - update selection first, then form state
    setSelectedRecord(windowId, tabId, newValue);
    setTimeout(() => {
      setTabFormState(windowId, tabId, newTabFormState);
    }, 50);
  } else {
    // Same record - just open form
    setTabFormState(windowId, tabId, newTabFormState);
  }
};

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const {
    activeWindow,
    clearSelectedRecord,
    getTabFormState,
    setSelectedRecord,
    getSelectedRecord,
    clearTabFormState,
    setTabFormState,
    clearChildrenSelections,
  } = useWindowContext();
  const { registerActions, onRefresh } = useToolbarContext();
  const { graph } = useSelected();
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const [toggle, setToggle] = useState(false);
  const lastParentSelectionRef = useRef<Map<string, string | undefined>>(new Map());

  const windowIdentifier = activeWindow?.windowIdentifier;

  const tabFormState = windowIdentifier ? getTabFormState(windowIdentifier, tab.id) : undefined;
  const selectedRecordId = windowIdentifier ? getSelectedRecord(windowIdentifier, tab.id) : undefined;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  // For child tabs, verify parent has selection before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordId =
    parentTab && windowIdentifier ? getSelectedRecord(windowIdentifier, parentTab.id) : undefined;
  const parentHasSelection = !parentTab || !!parentSelectedRecordId;

  const hasFormViewState = !!tabFormState && tabFormState.mode === TAB_MODES.FORM;
  const shouldShowForm =
    hasFormViewState || isFormView({ currentMode, recordId: currentRecordId, hasParentSelection: parentHasSelection });
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (!windowIdentifier) {
        return;
      }

      // Handle clearing form state (empty value)
      if (!newValue) {
        clearTabFormState(windowIdentifier, tab.id);
        return;
      }

      // Validate parent selection for child tabs
      if (!validateParentSelectionForFormView(tab, graph, windowIdentifier, getSelectedRecord)) {
        return; // Don't allow child to open form if parent has no selection
      }

      // Handle new record
      if (newValue === NEW_RECORD_ID) {
        handleNewRecordFormState(windowIdentifier, tab.id, newValue, setTabFormState);
        return;
      }

      // Handle editing existing record
      handleEditRecordFormState(
        windowIdentifier,
        tab.id,
        newValue,
        selectedRecordId,
        setSelectedRecord,
        setTabFormState
      );
    },
    [
      currentRecordId,
      windowIdentifier,
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
      if (windowIdentifier) {
        if (recordId) {
          setSelectedRecord(windowIdentifier, tab.id, recordId);
        } else {
          clearSelectedRecord(windowIdentifier, tab.id);

          // Clear children tabs when deselecting parent record
          const children = graph.getChildren(tab);
          if (children && children.length > 0) {
            const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
            if (childIds.length > 0) {
              clearChildrenSelections(windowIdentifier, childIds);
            }
          }

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowIdentifier, tab, setSelectedRecord, clearSelectedRecord, clearChildrenSelections, graph]
  );

  const handleNew = useCallback(() => {
    if (windowIdentifier) {
      const newTabFormState = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.NEW);
      setTabFormState(windowIdentifier, tab.id, newTabFormState);
    }
  }, [windowIdentifier, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (windowIdentifier) {
      const currentFormState = getTabFormState(windowIdentifier, tab.id);
      const isInFormView = currentFormState?.mode === TAB_MODES.FORM;

      if (isInFormView) {
        clearTabFormState(windowIdentifier, tab.id);
      } else {
        clearSelectedRecord(windowIdentifier, tab.id);

        // Also clear children if this tab has any
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
          if (childIds.length > 0) {
            clearChildrenSelections(windowIdentifier, childIds);
          }
        }

        // Clear graph selection
        graph.clearSelected(tab);
      }
    }
  }, [windowIdentifier, clearTabFormState, tab, getTabFormState, clearSelectedRecord, clearChildrenSelections, graph]);

  const handleTreeView = useCallback(() => {
    if (windowIdentifier) {
      setToggle((prev) => !prev);
    }
  }, [windowIdentifier]);

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
    if (!windowIdentifier) {
      return;
    }

    const parentTab = graph.getParent(tab);
    if (!parentTab) {
      return; // Only for child tabs
    }

    const parentSelectedId = getSelectedRecord(windowIdentifier, parentTab.id);
    const previousParentId = lastParentSelectionRef.current.get(windowIdentifier);

    // Only process if parent selection ID actually changed
    if (parentSelectedId === previousParentId) {
      return; // No change, skip processing
    }

    // Update ref BEFORE any early returns
    lastParentSelectionRef.current.set(windowIdentifier, parentSelectedId);

    // Skip closing if this is a NEW -> real ID transition (save operation)
    const isParentSaveTransition =
      previousParentId === NEW_RECORD_ID && parentSelectedId && parentSelectedId !== NEW_RECORD_ID;

    // Close child FormView only if:
    // 1. There was a previous parent selection (not initial render)
    // 2. Parent selection changed to something else (different ID or undefined)
    // 3. This is NOT a save transition (NEW -> real ID)
    // Note: We now close child FormView even if parent is in FormView (navigation between parent records should reset children)
    if (previousParentId !== undefined && !isParentSaveTransition) {
      clearTabFormState(windowIdentifier, tab.id);
      graph.clearSelected(tab);
    }
  }, [
    windowIdentifier,
    graph,
    tab,
    getSelectedRecord,
    clearTabFormState,
    getTabFormState,
    currentMode,
    tabFormState?.mode,
  ]);



  return (
    <div
      className={`relative bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar
        windowId={windowIdentifier || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        data-testid="Toolbar__5893c8"
      />
      {shouldShowForm && (
        <div className="flex-1 h-full min-h-0 relative z-10">
          <FormView
            mode={formMode}
            tab={tab}
            window={window}
            recordId={currentRecordId}
            setRecordId={handleSetRecordId}
            data-testid="FormView__5893c8"
          />
        </div>
      )}
      <div
        className={
          !shouldShowForm
            ? "flex-1 h-full min-h-0"
            : "absolute top-0 left-0 w-full h-full invisible opacity-0 z-[-1] pointer-events-none"
        }>
        <AttachmentProvider data-testid="AttachmentProvider__5893c8">
          <DynamicTable
            isTreeMode={toggle}
            setRecordId={handleSetRecordId}
            onRecordSelection={handleRecordSelection}
            isVisible={!shouldShowForm}
            data-testid="DynamicTable__5893c8"
          />
        </AttachmentProvider>
      </div>
    </div>
  );
}

export default Tab;
