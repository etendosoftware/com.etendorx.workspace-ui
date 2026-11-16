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

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { FocusProvider } from "@/contexts/focus";
import { useRouter, useSearchParams } from "next/navigation";
import type { TabFormState } from "@/utils/url/constants";
import {
  type WindowState,
  type TableState,
  type NavigationState,
  type WindowContextState,
  WINDOW_PROPERTY_NAMES,
  type WindowPropertyName,
} from "@/utils/window/constants";
import { buildWindowsUrlParams } from "@/utils/url/utils";
import {
  applyNavigationStep,
  buildNavigationStep,
  isSameStep,
  planRestore,
  readNavigationEntry,
  resolveHistoryWrite,
  withNavigationEntry,
  wouldDiscardUnsavedForm,
  type NavigationEntry,
  type NavigationStep,
} from "@/utils/window/browserHistory";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";
import { useUnsavedChangesBeforeUnload } from "@/hooks/useUnsavedChangesBeforeUnload";
import UnsavedChangesWindowsModal from "@/components/UnsavedChanges/UnsavedChangesWindowsModal";
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
/** Whether the browser has an entry after the current one (Navigation API; where unavailable, it counts as none). */
const canGoForward = (): boolean =>
  Boolean((window as unknown as { navigation?: { canGoForward?: boolean } }).navigation?.canGoForward);

export default function WindowProvider({ children }: React.PropsWithChildren) {
  const { recoveredWindows, isRecoveryLoading, recoveryError, triggerRecovery } = useGlobalUrlStateRecovery();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Native browser warning while any window holds unsaved changes. A custom modal is
  // impossible on unload, so this is the one exit point that uses the browser dialog.
  useUnsavedChangesBeforeUnload();

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

  // Browser history: the entry the user is on, how many windows there were, and an entry waiting for
  // the router to finish entering /window (the router creates it, so it can only be tagged afterwards).
  const entryRef = useRef<NavigationEntry | null>(null);
  const windowCountRef = useRef(0);
  const pendingEntryRef = useRef<NavigationEntry | null>(null);
  // True while a movement that was cancelled is being undone, so its popstate is not treated as a new one.
  const isRevertingRef = useRef(false);
  // True while the unsaved changes modal waits for an answer to a Back/Forward: the browser is already on
  // the other entry but the windows still show the step being left, so nothing may be written to the history.
  const [isGuardPending, setIsGuardPending] = useState(false);

  /** Writes the entry the user is on (or a new one) tagging it with the step it stands for. */
  const writeHistory = useCallback((mode: "push" | "replace", step: NavigationStep, url?: string) => {
    const previous = entryRef.current;
    if (mode === "push" && previous) {
      // The router drops the marker when it rewrites an entry (e.g. opening a linked record), so the entry
      // being left is tagged again before the new one is added: that is what Back will restore.
      window.history.replaceState(withNavigationEntry(window.history.state, previous), "");
    }
    // After a reload the entry still carries the marker of the previous page session: continue from its
    // position, so the entries before it stay comparable with this one.
    const base = previous ?? readNavigationEntry(window.history.state);
    const index = mode === "push" && previous ? previous.index + 1 : (base?.index ?? 0);
    const entry: NavigationEntry = { ...step, index };
    const state = withNavigationEntry(window.history.state, entry);
    if (mode === "push") {
      window.history.pushState(state, "", url);
    } else {
      window.history.replaceState(state, "", url);
    }
    entryRef.current = entry;
  }, []);

  // Sync window state to URL and browser history
  useEffect(() => {
    if (isRecoveryLoading || isGuardPending) return;

    if (recoveredWindows.length > 0 && windows.length === 0 && !hasAppliedWindowsRef.current) {
      return;
    }

    const isOnWindowRoute = window.location.pathname.endsWith("/window");
    // On /window the address bar is the truth: useSearchParams can lag behind it after a Back/Forward.
    const currentParams = isOnWindowRoute
      ? new URLSearchParams(window.location.search).toString()
      : (searchParams?.toString() ?? "");
    const step = buildNavigationStep(windows);

    // The router has just entered /window for a step it created: tag that entry before deciding anything,
    // so the step is not taken for a new one.
    if (pendingEntryRef.current && isOnWindowRoute) {
      const pending = pendingEntryRef.current;
      pendingEntryRef.current = null;
      window.history.replaceState(withNavigationEntry(window.history.state, pending), "");
      entryRef.current = pending;
    }

    const write = resolveHistoryWrite(entryRef.current, step, windows.length, windowCountRef.current);
    windowCountRef.current = windows.length;

    if (windows.length === 0) {
      if (currentParams) {
        // Stay on the same /window route segment when clearing params, instead
        // of navigating to "/". Both render the same Page component, but they
        // are distinct route segments in App Router — navigating between them
        // triggers an RSC roundtrip and a full unmount/remount of the page
        // subtree (including <Home>), which we want to avoid.
        router.replace("/window");
      } else if (write === "replace") {
        writeHistory("replace", step);
      }
      return;
    }

    const newParams = buildWindowsUrlParams(windows);
    const newUrl = newParams ? `window?${newParams}` : "window";

    if (!isOnWindowRoute) {
      // Entering /window from another route still goes through the router.
      if (newParams !== currentParams) {
        if (write === "push" && entryRef.current) {
          // Tag the entry being left, then let the router add the next one.
          window.history.replaceState(withNavigationEntry(window.history.state, entryRef.current), "");
          pendingEntryRef.current = { ...step, index: entryRef.current.index + 1 };
          router.push(newUrl);
        } else {
          router.replace(newUrl);
        }
      }
      return;
    }

    // Already on /window, the URL only mirrors the window store: the native history API updates
    // useSearchParams without the RSC round trip router.replace makes (two per form Next, one per
    // selection).
    if (write === "push") {
      writeHistory("push", step, newUrl);
    } else if (write === "replace") {
      writeHistory("replace", step, newParams === currentParams ? undefined : newUrl);
    } else if (newParams !== currentParams) {
      // Only the URL changes here, never the marker of an entry that already has one. The router handles a
      // Back/Forward before the listener below does, so this can run while the browser is already on another
      // entry than the one the windows show: that entry keeps its own step and its own URL.
      const marker = readNavigationEntry(window.history.state);
      if (marker && !isSameStep(marker, step)) return;
      window.history.replaceState(
        !marker && entryRef.current
          ? withNavigationEntry(window.history.state, entryRef.current)
          : window.history.state,
        "",
        newUrl
      );
    }
  }, [windows, router, searchParams, isRecoveryLoading, isGuardPending, recoveredWindows.length, writeHistory]);

  // Back / Forward: bring the windows to the step the entry stands for.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const target = readNavigationEntry(event.state);
      const previous = entryRef.current;
      if (!target || !previous) return;

      const entryBefore = previous;
      entryRef.current = target;
      if (isRevertingRef.current) {
        isRevertingRef.current = false;
        setIsGuardPending(false);
        return;
      }

      const delta = target.index - entryBefore.index;
      const state = useWindowStore.getState();
      const plan = planRestore(target, state.windows);
      // Nothing is held back unless this movement asks for it below.
      setIsGuardPending(false);

      if (plan.kind === "skip") {
        // The window of that entry was closed. Keep walking the same way; at the first entry (or going
        // forward with nothing left to show) fall back to where the user was. While walking, the windows
        // still show the step being left, so the URL sync must not write anything.
        if (delta < 0 && target.index > 0) {
          setIsGuardPending(true);
          window.history.go(-1);
        } else if (delta < 0) {
          applyNavigationStep({ activeWindowIdentifier: null, form: null });
        } else if (canGoForward()) {
          setIsGuardPending(true);
          window.history.go(1);
        } else {
          isRevertingRef.current = true;
          setIsGuardPending(true);
          window.history.go(-delta);
        }
        return;
      }

      if (plan.kind === "restore" && wouldDiscardUnsavedForm(plan.step, state.windows, state.dirtyWindows)) {
        // The windows still show the step the user is leaving until the modal is answered: keep it as the
        // current one, otherwise the URL sync would see a "new" step and push an entry of its own.
        entryRef.current = entryBefore;
        setIsGuardPending(true);
        useUnsavedChangesStore.getState().openRequest({
          onProceed: () => {
            entryRef.current = target;
            setIsGuardPending(false);
            const latest = useWindowStore.getState();
            const latestPlan = planRestore(target, latest.windows);
            if (latestPlan.kind === "restore") applyNavigationStep(latestPlan.step);
            else if (latestPlan.kind === "home") applyNavigationStep(target);
          },
          onCancel: () => {
            isRevertingRef.current = true;
            window.history.go(-delta);
          },
        });
        return;
      }

      applyNavigationStep(target);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <FocusProvider data-testid="FocusProvider__77fd99">
      {children}
      <UnsavedChangesWindowsModal data-testid="UnsavedChangesWindowsModal__77fd99" />
    </FocusProvider>
  );
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
