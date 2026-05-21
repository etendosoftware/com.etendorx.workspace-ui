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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SaveButtonState, SaveOptions } from "@/contexts/ToolbarContext";

/**
 * Raw toolbar actions registered by consumer components (FormView, Table, Tab, etc.).
 * Consumers call `registerActions({ save: myImpl, refresh: myImpl, ... })` to register.
 */
export type ToolbarActions = {
  save: (options: SaveOptions) => Promise<boolean>;
  refresh: () => Promise<void>;
  new: () => void;
  back: () => void;
  filter: () => void;
  treeView: () => void;
  exportCSV: () => Promise<void>;
  columnFilters: (buttonRef?: HTMLElement | null) => void;
  printDocument: () => Promise<void>;
  printRecord: () => Promise<void>;
  advancedFilters: (anchorEl?: HTMLElement) => void;
};

export const defaultActions: ToolbarActions = {
  save: async () => false,
  refresh: async () => {},
  new: () => {},
  back: () => {},
  filter: () => {},
  treeView: () => {},
  exportCSV: async () => {},
  columnFilters: () => {},
  printDocument: async () => {},
  printRecord: async () => {},
  advancedFilters: () => {},
};

export const defaultSaveButtonState: SaveButtonState = {
  isCalloutLoading: false,
  hasValidationErrors: false,
  isSaving: false,
  validationErrors: [],
};

/**
 * Per-tab toolbar state.
 *
 * Each tab mounts its own ToolbarProvider which initializes a slot in this
 * store. The store is keyed by `tab.id` to prevent cross-tab interference —
 * without this keying, all open tabs would share the same Zustand singleton.
 */
export interface ToolbarTabState {
  /** Raw actions registered by consumers (e.g. FormView, Table). */
  registeredActions: ToolbarActions;
  /**
   * Wrapped save function created by ToolbarProvider.
   * Wraps `registeredActions.save` with parent-tab refresh logic.
   * Set by ToolbarProvider via `setWrappedSave`; read by `useToolbarContext`.
   */
  wrappedSave: (options: SaveOptions) => Promise<boolean>;
  saveButtonState: SaveButtonState;
  isImplicitFilterApplied: boolean;
  isAdvancedFilterApplied: boolean;
  shouldOpenAttachmentModal: boolean;
  formViewRefetch?: () => Promise<void>;
  attachmentAction?: () => void;
}

const defaultTabState = (): ToolbarTabState => ({
  registeredActions: defaultActions,
  wrappedSave: async () => false,
  saveButtonState: defaultSaveButtonState,
  isImplicitFilterApplied: false,
  isAdvancedFilterApplied: false,
  shouldOpenAttachmentModal: false,
});

interface ToolbarStore {
  byTabId: Record<string, ToolbarTabState>;

  /** Called by ToolbarProvider on mount. */
  initTab: (tabId: string) => void;
  /** Called by ToolbarProvider on unmount. */
  destroyTab: (tabId: string) => void;

  /**
   * Called by consumer components to register their toolbar action implementations.
   * Only updates `registeredActions`, NOT `wrappedSave` — the wrapped version is
   * maintained by ToolbarProvider.
   */
  registerRawActions: (tabId: string, actions: Partial<ToolbarActions>) => void;

  /**
   * Called by ToolbarProvider to update the wrapped save function.
   * The wrapped version adds parent-tab refresh logic on top of `registeredActions.save`.
   */
  setWrappedSave: (tabId: string, fn: (options: SaveOptions) => Promise<boolean>) => void;

  setSaveButtonState: (
    tabId: string,
    updater: SaveButtonState | ((prev: SaveButtonState) => SaveButtonState)
  ) => void;

  setIsImplicitFilterApplied: (tabId: string, value: boolean) => void;
  setIsAdvancedFilterApplied: (tabId: string, value: boolean) => void;
  setShouldOpenAttachmentModal: (tabId: string, value: boolean) => void;
  registerFormViewRefetch: (tabId: string, refetch?: () => Promise<void>) => void;
  registerAttachmentAction: (tabId: string, action?: () => void) => void;
}

export const useToolbarStore = create<ToolbarStore>()(
  devtools(
    (set) => ({
      byTabId: {},

      initTab: (tabId) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: state.byTabId[tabId] ?? defaultTabState(),
            },
          }),
          false,
          "toolbar/initTab"
        ),

      destroyTab: (tabId) =>
        set(
          (state) => {
            const next = { ...state.byTabId };
            delete next[tabId];
            return { byTabId: next };
          },
          false,
          "toolbar/destroyTab"
        ),

      registerRawActions: (tabId, actions) =>
        set(
          (state) => {
            const current = state.byTabId[tabId] ?? defaultTabState();
            return {
              byTabId: {
                ...state.byTabId,
                [tabId]: {
                  ...current,
                  registeredActions: { ...current.registeredActions, ...actions },
                },
              },
            };
          },
          false,
          "toolbar/registerRawActions"
        ),

      setWrappedSave: (tabId, fn) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                wrappedSave: fn,
              },
            },
          }),
          false,
          "toolbar/setWrappedSave"
        ),

      setSaveButtonState: (tabId, updater) =>
        set(
          (state) => {
            const current = state.byTabId[tabId] ?? defaultTabState();
            const next = typeof updater === "function" ? updater(current.saveButtonState) : updater;
            return {
              byTabId: {
                ...state.byTabId,
                [tabId]: { ...current, saveButtonState: next },
              },
            };
          },
          false,
          "toolbar/setSaveButtonState"
        ),

      setIsImplicitFilterApplied: (tabId, value) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                isImplicitFilterApplied: value,
              },
            },
          }),
          false,
          "toolbar/setIsImplicitFilterApplied"
        ),

      setIsAdvancedFilterApplied: (tabId, value) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                isAdvancedFilterApplied: value,
              },
            },
          }),
          false,
          "toolbar/setIsAdvancedFilterApplied"
        ),

      setShouldOpenAttachmentModal: (tabId, value) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                shouldOpenAttachmentModal: value,
              },
            },
          }),
          false,
          "toolbar/setShouldOpenAttachmentModal"
        ),

      registerFormViewRefetch: (tabId, refetch) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                formViewRefetch: refetch,
              },
            },
          }),
          false,
          "toolbar/registerFormViewRefetch"
        ),

      registerAttachmentAction: (tabId, action) =>
        set(
          (state) => ({
            byTabId: {
              ...state.byTabId,
              [tabId]: {
                ...(state.byTabId[tabId] ?? defaultTabState()),
                attachmentAction: action,
              },
            },
          }),
          false,
          "toolbar/registerAttachmentAction"
        ),
    }),
    { name: "ToolbarStore" }
  )
);
