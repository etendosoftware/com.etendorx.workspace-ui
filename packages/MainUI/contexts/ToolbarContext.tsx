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

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { globalCalloutManager } from "@/services/callouts";

/**
 * Save button state management interface
 */
export interface SaveButtonState {
  isCalloutLoading: boolean; // External dependency
  hasValidationErrors: boolean; // Internal validation
  isSaving: boolean; // Operation progress
  validationErrors: string[]; // User feedback
}

/**
 * Available toolbar actions that can be registered by components.
 * Each action represents a common operation that can be triggered from the toolbar.
 * Components should implement these actions according to their specific needs
 * and register them using the registerActions function from ToolbarContext.
 */
type ToolbarActions = {
  /**
   * Save the current record or form data.
   * @param showModal - Whether to show a confirmation modal after saving
   * @returns Promise that resolves when save operation is complete
   */
  save: (showModal: boolean) => Promise<void>;

  /**
   * Refresh the current view or data.
   * Typically reloads data from the server or resets the current state.
   */
  refresh: () => void;

  /**
   * Create a new record or navigate to create mode.
   * Usually clears the form and sets up for new record creation.
   */
  new: () => void;

  /**
   * Navigate back to the previous view or parent level.
   * Commonly used to return from form view to table view.
   */
  back: () => void;

  /**
   * Open or toggle the filter interface.
   * Allows users to filter data in table views.
   */
  filter: () => void;
  treeView: () => void;

  /**
   * Open or toggle column filters for table views.
   * @param buttonRef - Optional reference to the button element that triggered the action,
   *                   used for positioning dropdown/popover filters
   */
  columnFilters: (buttonRef?: HTMLElement | null) => void;
};

type ToolbarContextType = {
  onSave: (showModal: boolean) => Promise<void>;
  onRefresh: () => void;
  onNew: () => void;
  onBack: () => void;
  onFilter: () => void;
  onToggleTreeView: () => void;
  onColumnFilters: (buttonRef?: HTMLElement | null) => void;
  registerActions: (actions: Partial<ToolbarActions>) => void;
  saveButtonState: SaveButtonState;
  setSaveButtonState: React.Dispatch<React.SetStateAction<SaveButtonState>>;
  formViewRefetch?: () => Promise<void>;
  registerFormViewRefetch?: (refetch: () => Promise<void>) => void;
};

const initialState: ToolbarActions = {
  save: async () => {},
  refresh: () => {},
  new: () => {},
  back: () => {},
  filter: () => {},
  columnFilters: () => {},
  treeView: () => {},
};

const ToolbarContext = createContext<ToolbarContextType>({
  onSave: async () => {},
  onRefresh: () => {},
  onNew: () => {},
  onBack: () => {},
  onFilter: () => {},
  onToggleTreeView: () => {},
  onColumnFilters: () => {},
  registerActions: () => {},
  saveButtonState: {
    isCalloutLoading: false,
    hasValidationErrors: false,
    isSaving: false,
    validationErrors: [],
  },
  setSaveButtonState: () => {},
} as ToolbarContextType);

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [formViewRefetch, setFormViewRefetch] = useState<(() => Promise<void>) | undefined>();

  const registerFormViewRefetch = useCallback((refetch: () => Promise<void>) => {
    setFormViewRefetch(() => refetch);
  }, []);

  const [
    {
      new: onNew,
      refresh: onRefresh,
      treeView: onToggleTreeView,
      save: onSave,
      back: onBack,
      filter: onFilter,
      columnFilters: onColumnFilters,
    },
    setActions,
  ] = useState<ToolbarActions>(initialState);

  // Save button state management
  const [saveButtonState, setSaveButtonState] = useState<SaveButtonState>({
    isCalloutLoading: false,
    hasValidationErrors: false,
    isSaving: false,
    validationErrors: [],
  });

  // Event-based callout monitoring
  useEffect(() => {
    const handleCalloutStart = () => {
      setSaveButtonState((prev) => ({ ...prev, isCalloutLoading: true }));
    };

    const handleCalloutEnd = () => {
      setSaveButtonState((prev) => ({ ...prev, isCalloutLoading: false }));
    };

    // Subscribe to callout events
    globalCalloutManager.on("calloutStart", handleCalloutStart);
    globalCalloutManager.on("calloutEnd", handleCalloutEnd);

    // Set initial state from callout manager
    setSaveButtonState((prev) => ({
      ...prev,
      isCalloutLoading: globalCalloutManager.isCalloutRunning(),
    }));

    return () => {
      // Cleanup event listeners
      globalCalloutManager.off("calloutStart", handleCalloutStart);
      globalCalloutManager.off("calloutEnd", handleCalloutEnd);
    };
  }, []);

  const registerActions = useCallback((newActions: Partial<ToolbarActions>) => {
    setActions((prev) => ({ ...prev, ...newActions }));
  }, []);

  const value = useMemo(
    () => ({
      onSave,
      onRefresh,
      onNew,
      onBack,
      onFilter,
      onColumnFilters,
      onToggleTreeView,
      registerActions,
      saveButtonState,
      setSaveButtonState,
      formViewRefetch,
      registerFormViewRefetch,
    }),
    [
      onSave,
      onRefresh,
      onNew,
      onBack,
      onFilter,
      onColumnFilters,
      onToggleTreeView,
      registerActions,
      saveButtonState,
      formViewRefetch,
      registerFormViewRefetch,
    ]
  );

  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
