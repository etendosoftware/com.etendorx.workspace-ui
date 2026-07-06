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

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { globalCalloutManager } from "@/services/callouts";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { useTabContext } from "@/contexts/tab";
import { useToolbarStore, defaultActions, defaultSaveButtonState } from "@/stores/toolbarStore";
import type { ToolbarActions } from "@/stores/toolbarStore";

/**
 * Options for save operations.
 * Using an options object instead of positional parameters for better extensibility.
 */
export interface SaveOptions {
  /** Whether to show a success modal after saving. Default: false */
  showModal?: boolean;
  /** When true, prevents form state updates after save (mode, recordId). Used when closing form after save. Default: false */
  skipFormStateUpdate?: boolean;
}

/**
 * Save button state management interface
 */
export interface SaveButtonState {
  isCalloutLoading: boolean; // External dependency
  hasValidationErrors: boolean; // Internal validation
  isSaving: boolean; // Operation progress
  validationErrors: string[]; // User feedback
  isDocumentProcessing: boolean; // IP state — document locked while processing
}

// Re-export ToolbarActions for consumers that import it from this file
export type { ToolbarActions };

/**
 * ToolbarProvider — per-tab bridge between React hooks and the Zustand toolbar store.
 *
 * This provider is mounted once per tab inside TabContextProvider (see contexts/tab.tsx).
 * It is responsible for:
 *  1. Initializing and cleaning up the per-tab store slot.
 *  2. Creating `wrappedOnSave` (which needs React hooks for parent-tab refresh logic)
 *     and registering it in the store whenever its dependencies change.
 *  3. Bridging globalCalloutManager events into store state updates.
 *
 * No React Context value is provided — all state lives in useToolbarStore keyed by tab.id.
 */
export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const { tab } = useTabContext();
  const { triggerParentRefreshes } = useTabRefreshContext();
  // Use empty string as fallback so effects always run (avoids stale listener state).
  // Tests that render ToolbarProvider without a real tab will use "" as the store key.
  const tabId = tab?.id ?? "";

  // Lifecycle: init/destroy the per-tab store slot
  useEffect(() => {
    useToolbarStore.getState().initTab(tabId);
    return () => {
      useToolbarStore.getState().destroyTab(tabId);
    };
  }, [tabId]);

  // Read raw save from store — re-creates wrappedSave whenever the registered impl changes
  const rawSave = useToolbarStore((s) => s.byTabId[tabId]?.registeredActions.save ?? defaultActions.save);

  // wrappedOnSave adds parent-tab refresh logic on top of whatever save impl is registered
  const wrappedOnSave = useCallback(
    async (options: SaveOptions): Promise<boolean> => {
      const succeeded = await rawSave(options);
      if (succeeded && tab?.tabLevel && tab.tabLevel > 0) {
        await triggerParentRefreshes(tab.tabLevel);
      }
      return succeeded;
    },
    [rawSave, tab?.tabLevel, triggerParentRefreshes]
  );

  // Register wrappedOnSave into the store whenever it changes
  useEffect(() => {
    useToolbarStore.getState().setWrappedSave(tabId, wrappedOnSave);
  }, [tabId, wrappedOnSave]);

  // Bridge globalCalloutManager events into store saveButtonState
  useEffect(() => {
    const handleCalloutStart = () => {
      useToolbarStore.getState().setSaveButtonState(tabId, (prev) => ({ ...prev, isCalloutLoading: true }));
    };

    const handleCalloutEnd = () => {
      useToolbarStore.getState().setSaveButtonState(tabId, (prev) => ({ ...prev, isCalloutLoading: false }));
    };

    globalCalloutManager.on("calloutStart", handleCalloutStart);
    globalCalloutManager.on("calloutEnd", handleCalloutEnd);

    // Sync initial callout state
    useToolbarStore.getState().setSaveButtonState(tabId, (prev) => ({
      ...prev,
      isCalloutLoading: globalCalloutManager.isCalloutRunning(),
    }));

    return () => {
      globalCalloutManager.off("calloutStart", handleCalloutStart);
      globalCalloutManager.off("calloutEnd", handleCalloutEnd);
    };
  }, [tabId]);

  return <>{children}</>;
};

/**
 * Backward-compatible hook that reads from the Zustand toolbar store for the current tab.
 *
 * All consumers of this hook work unchanged — it returns the same shape as the old
 * React Context. Components that want selective subscriptions (fewer re-renders) should
 * import `useToolbarStore` directly with a granular selector.
 *
 * Must be called inside a TabContextProvider (i.e. inside a tab tree).
 */
export const useToolbarContext = () => {
  const { tab } = useTabContext();
  const tabId = tab?.id ?? "";

  const state = useToolbarStore(useShallow((s) => s.byTabId[tabId] ?? null));

  return {
    onSave: state?.wrappedSave ?? defaultActions.save,
    onRefresh: state?.registeredActions.refresh ?? defaultActions.refresh,
    onNew: state?.registeredActions.new ?? defaultActions.new,
    onBack: state?.registeredActions.back ?? defaultActions.back,
    onFilter: state?.registeredActions.filter ?? defaultActions.filter,
    onExportCSV: state?.registeredActions.exportCSV ?? defaultActions.exportCSV,
    onToggleTreeView: state?.registeredActions.treeView ?? defaultActions.treeView,
    onAdvancedFilters: state?.registeredActions.advancedFilters ?? defaultActions.advancedFilters,
    onColumnFilters: state?.registeredActions.columnFilters ?? defaultActions.columnFilters,
    onPrintDocument: state?.registeredActions.printDocument ?? defaultActions.printDocument,
    onPrintRecord: state?.registeredActions.printRecord ?? defaultActions.printRecord,

    registerActions: useCallback(
      (actions: Partial<ToolbarActions>) => useToolbarStore.getState().registerRawActions(tabId, actions),
      [tabId]
    ),

    saveButtonState: state?.saveButtonState ?? defaultSaveButtonState,
    setSaveButtonState: useCallback(
      (updater: SaveButtonState | ((prev: SaveButtonState) => SaveButtonState)) =>
        useToolbarStore.getState().setSaveButtonState(tabId, updater),
      [tabId]
    ),

    formViewRefetch: state?.formViewRefetch,
    registerFormViewRefetch: useCallback(
      (refetch?: () => Promise<void>) => useToolbarStore.getState().registerFormViewRefetch(tabId, refetch),
      [tabId]
    ),

    attachmentAction: state?.attachmentAction,
    registerAttachmentAction: useCallback(
      (action?: () => void) => useToolbarStore.getState().registerAttachmentAction(tabId, action),
      [tabId]
    ),

    shouldOpenAttachmentModal: state?.shouldOpenAttachmentModal ?? false,
    setShouldOpenAttachmentModal: useCallback(
      (open: boolean) => useToolbarStore.getState().setShouldOpenAttachmentModal(tabId, open),
      [tabId]
    ),

    isImplicitFilterApplied: state?.isImplicitFilterApplied ?? false,
    setIsImplicitFilterApplied: useCallback(
      (value: boolean) => useToolbarStore.getState().setIsImplicitFilterApplied(tabId, value),
      [tabId]
    ),

    isAdvancedFilterApplied: state?.isAdvancedFilterApplied ?? false,
    setIsAdvancedFilterApplied: useCallback(
      (value: boolean) => useToolbarStore.getState().setIsAdvancedFilterApplied(tabId, value),
      [tabId]
    ),
  };
};
