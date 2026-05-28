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

import { useEffect, useRef, useCallback, useMemo } from "react";
import { FocusProvider } from "@/contexts/focus";
import { useRouter, useSearchParams } from "next/navigation";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import { type TabFormState } from "@/utils/url/constants";
import {
  type WindowState,
  type TableState,
  type NavigationState,
  type WindowContextState,
  WINDOW_PROPERTY_NAMES,
  type WindowPropertyName,
} from "@/utils/window/constants";
import { buildWindowsUrlParams } from "@/utils/url/utils";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";
import { useWindowStore, DEFAULT_TABLE_STATE, DEFAULT_NAVIGATION_STATE } from "@/stores/windowStore";

// Re-export types consumed by the rest of the codebase
export type { WindowState, TableState, NavigationState, WindowContextState };

// ---------------------------------------------------------------------------
// WindowProvider — bridge component
//
// All window state lives in useWindowStore (Zustand + immer).
// This provider's sole responsibilities are:
//  1. Bridging hook-based values (recovery, router) into the store.
//  2. Running the URL-sync effect (needs useRouter / useSearchParams).
//  3. Running the recovery-initialization effect (needs ref guards).
// ---------------------------------------------------------------------------
export default function WindowProvider({ children }: React.PropsWithChildren) {
  const { recoveredWindows, isRecoveryLoading, recoveryError, triggerRecovery } = useGlobalUrlStateRecovery();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync hook-provided recovery values into the store on every change
  useEffect(() => {
    useWindowStore.getState()._setRecovery(isRecoveryLoading, recoveryError, triggerRecovery);
  }, [isRecoveryLoading, recoveryError, triggerRecovery]);

  // Guard: only apply recovered windows once per recovery cycle
  const hasProcessedRecoveryRef = useRef(false);

  useEffect(() => {
    if (isRecoveryLoading) {
      hasProcessedRecoveryRef.current = false;
    }
  }, [isRecoveryLoading]);

  // Guard: tracks whether windows have ever been set (prevents premature URL clear)
  const hasAppliedWindowsRef = useRef(false);

  // Subscribe to the windows map object — reference only changes when windows actually change
  const windowsObj = useWindowStore((s) => s.windows);
  // Derive array outside the selector to avoid creating new references inside useSyncExternalStore
  const windows = useMemo(() => Object.values(windowsObj), [windowsObj]);

  useEffect(() => {
    if (windows.length > 0) {
      hasAppliedWindowsRef.current = true;
    }
  }, [windows.length]);

  // Initialize state from recovered windows (runs once when recovery completes)
  useEffect(() => {
    if (hasProcessedRecoveryRef.current) return;
    if (!isRecoveryLoading && recoveredWindows.length > 0) {
      hasProcessedRecoveryRef.current = true;
      useWindowStore.getState()._initFromRecoveredWindows(recoveredWindows);
    }
  }, [isRecoveryLoading, recoveredWindows]);

  // Sync window state to URL
  useEffect(() => {
    if (isRecoveryLoading) return;

    if (recoveredWindows.length > 0 && windows.length === 0 && !hasAppliedWindowsRef.current) {
      return;
    }

    const currentParams = searchParams?.toString() ?? "";

    if (windows.length === 0) {
      if (currentParams) {
        router.replace("/");
      }
      return;
    }

    const newParams = buildWindowsUrlParams(windows);
    if (newParams !== currentParams) {
      const newUrl = newParams ? `window?${newParams}` : "window";
      router.replace(newUrl);
    }
  }, [windows, router, searchParams, isRecoveryLoading, recoveredWindows.length]);

  return <FocusProvider data-testid="FocusProvider__77fd99">{children}</FocusProvider>;
}

// ---------------------------------------------------------------------------
// useWindowContext — backward-compatible hook
//
// Returns the same interface shape as before. All values read from the Zustand
// store. Components that want selective subscriptions (fewer re-renders) should
// import useWindowStore directly with a granular selector.
//
// @deprecated All production consumers have been migrated to useWindowStore.
// This hook remains for test backward-compatibility only. New code should
// import from @/stores/windowStore with targeted selectors.
// ---------------------------------------------------------------------------
export const useWindowContext = () => {
  const store = useWindowStore.getState;

  // Subscribe to map reference — only changes when windows actually change (immer preserves refs)
  const windowsObj = useWindowStore((s) => s.windows);
  const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);
  const recoveryError = useWindowStore((s) => s.recoveryError);
  const triggerRecovery = useWindowStore((s) => s.triggerRecovery);

  // Derive arrays/computed values with useMemo — stable references when windowsObj unchanged
  const windows = useMemo(() => Object.values(windowsObj), [windowsObj]);
  const activeWindow = useMemo(() => windows.find((w) => w.isActive) ?? null, [windows]);
  const isHomeRoute = !activeWindow;

  // ---- Getters (non-reactive, read from current state snapshot) -----------
  const getTableState = useCallback(
    (windowIdentifier: string, tabId: string): TableState => {
      const s = store();
      return s.windows[windowIdentifier]?.tabs[tabId]?.table ?? DEFAULT_TABLE_STATE;
    },
    [store]
  );

  const getNavigationState = useCallback(
    (windowIdentifier: string): NavigationState => {
      const s = store();
      return s.windows[windowIdentifier]?.navigation ?? DEFAULT_NAVIGATION_STATE;
    },
    [store]
  );

  const getActiveWindowIdentifier = useCallback((): string | null => {
    const s = store();
    for (const [id, win] of Object.entries(s.windows)) {
      if (win.isActive) return id;
    }
    return null;
  }, [store]);

  const getActiveWindowProperty = useCallback(
    (propertyName: string): string | boolean | object | null => {
      if (!propertyName?.trim()) return null;

      const validProperties = Object.values(WINDOW_PROPERTY_NAMES);
      if (!validProperties.includes(propertyName as WindowPropertyName)) return null;

      const s = store();
      const activeId = Object.keys(s.windows).find((id) => s.windows[id].isActive);
      if (!activeId) return null;

      const win = s.windows[activeId];
      switch (propertyName) {
        case WINDOW_PROPERTY_NAMES.TITLE:
          return win.title;
        case WINDOW_PROPERTY_NAMES.IS_ACTIVE:
          return win.isActive;
        case WINDOW_PROPERTY_NAMES.WINDOW_IDENTIFIER:
          return activeId;
        case WINDOW_PROPERTY_NAMES.TABS:
          return win.tabs;
        default:
          return null;
      }
    },
    [store]
  );

  const getAllWindowsIdentifiers = useCallback((): string[] => {
    return Object.keys(store().windows);
  }, [store]);

  const getAllState = useCallback((): WindowContextState => {
    return store().windows;
  }, [store]);

  const getAllWindows = useCallback((): WindowState[] => {
    return Object.values(store().windows);
  }, [store]);

  const getActiveWindow = useCallback((): WindowState | null => {
    const s = store();
    return Object.values(s.windows).find((w) => w.isActive) ?? null;
  }, [store]);

  const getTabFormState = useCallback(
    (windowIdentifier: string, tabId: string): TabFormState | undefined => {
      return store().windows[windowIdentifier]?.tabs[tabId]?.form;
    },
    [store]
  );

  const getSelectedRecord = useCallback(
    (windowIdentifier: string, tabId: string): string | undefined => {
      return store().windows[windowIdentifier]?.tabs[tabId]?.selectedRecord;
    },
    [store]
  );

  const getNavigationInitialized = useCallback(
    (windowIdentifier: string): boolean => {
      return store().windows[windowIdentifier]?.navigation?.initialized ?? false;
    },
    [store]
  );

  const getTabInitializedWithDirectLink = useCallback(
    (windowIdentifier: string, tabId: string): boolean => {
      return store().windows[windowIdentifier]?.tabs[tabId]?.initializedWithDirectLink ?? false;
    },
    [store]
  );

  // ---- Setters (bound store actions) -------------------------------------
  const {
    setTableFilters,
    setTableVisibility,
    setTableSorting,
    setTableOrder,
    setTableImplicitFilterApplied,
    setTableAdvancedCriteria,
    setNavigationActiveLevels,
    setNavigationActiveTabsByLevel,
    setWindowActive,
    setWindowInactive,
    setAllWindowsInactive,
    setTabFormState,
    clearTabFormState,
    setSelectedRecord,
    clearSelectedRecord,
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,
    setNavigationInitialized,
    setTabInitializedWithDirectLink,
    cleanupWindow,
    cleanState,
  } = useWindowStore.getState();

  return {
    // Reactive computed values
    windows,
    activeWindow,
    isHomeRoute,

    // Getters
    getTableState,
    getNavigationState,
    getActiveWindowIdentifier,
    getActiveWindowProperty,
    getAllWindowsIdentifiers,
    getAllWindows,
    getActiveWindow,
    getAllState,

    // Setters
    setTableFilters,
    setTableVisibility,
    setTableSorting,
    setTableOrder,
    setTableImplicitFilterApplied,
    setTableAdvancedCriteria,
    setNavigationActiveLevels,
    setNavigationActiveTabsByLevel,
    setWindowActive,
    setWindowInactive,
    setAllWindowsInactive,
    getTabFormState,
    setTabFormState,
    clearTabFormState,

    getSelectedRecord,
    setSelectedRecord,
    clearSelectedRecord,
    clearChildrenSelections,
    setSelectedRecordAndClearChildren,

    isRecoveryLoading,
    recoveryError,
    triggerRecovery,

    getNavigationInitialized,
    setNavigationInitialized,

    getTabInitializedWithDirectLink,
    setTabInitializedWithDirectLink,

    cleanupWindow,
    cleanState,
  };
};
