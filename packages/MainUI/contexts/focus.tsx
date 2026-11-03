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

import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from "react";

interface FocusRegion {
  id: string;
  onBlur?: () => Promise<void> | void;
}

interface FocusContextI {
  activeFocusId: string | null;
  setFocus: (id: string) => void;
  registerRegion: (region: FocusRegion) => void;
  unregisterRegion: (id: string) => void;
  /** Whether a region with this id is mounted, i.e. its tab is rendered. */
  hasRegion: (id: string) => boolean;
}

/** Holds the focused region outside React state, so that only the components it concerns re-render. */
interface ActiveFocusStore {
  get: () => string | null;
  subscribe: (listener: () => void) => () => void;
}

type FocusProviderValue = Omit<FocusContextI, "activeFocusId"> & { store: ActiveFocusStore };

const NOOP_STORE: ActiveFocusStore = { get: () => null, subscribe: () => () => {} };

const FocusContext = createContext<FocusProviderValue>({
  store: NOOP_STORE,
  setFocus: () => {},
  registerRegion: () => {},
  unregisterRegion: () => {},
  hasRegion: () => false,
});

export function FocusProvider({ children }: React.PropsWithChildren) {
  const activeFocusIdRef = useRef<string | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const regionsRef = useRef<Map<string, FocusRegion>>(new Map());

  const store = useMemo<ActiveFocusStore>(
    () => ({
      get: () => activeFocusIdRef.current,
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    []
  );

  const registerRegion = useCallback((region: FocusRegion) => {
    regionsRef.current.set(region.id, region);
  }, []);

  const unregisterRegion = useCallback((id: string) => {
    regionsRef.current.delete(id);
  }, []);

  const hasRegion = useCallback((id: string) => regionsRef.current.has(id), []);

  const setFocus = useCallback((id: string) => {
    const prev = activeFocusIdRef.current;
    if (prev === id) return;

    // Fire onBlur for previous region (async, fire-and-forget — tab navigates immediately)
    const prevRegion = regionsRef.current.get(prev ?? "");
    prevRegion?.onBlur?.();

    activeFocusIdRef.current = id;
    for (const listener of listenersRef.current) listener();
  }, []);

  // Never changes: the focused region is read through the store, so moving the focus does not
  // re-render every component that merely uses the focus actions.
  const value = useMemo(
    () => ({ store, setFocus, registerRegion, unregisterRegion, hasRegion }),
    [store, setFocus, registerRegion, unregisterRegion, hasRegion]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

/**
 * Focus state and actions. With `scope`, `activeFocusId` is only reported while the focus is on one of
 * those regions (otherwise it is `null`), so the caller re-renders only when the focus moves in or out
 * of its own regions. An empty scope never re-renders: for callers that only move the focus.
 * Without `scope` it reports every change.
 */
export function useFocusContext(scope?: readonly string[]): FocusContextI {
  const { store, setFocus, registerRegion, unregisterRegion, hasRegion } = useContext(FocusContext);

  const activeFocusId = useSyncExternalStore(
    store.subscribe,
    () => {
      const focused = store.get();
      return scope && (focused === null || !scope.includes(focused)) ? null : focused;
    },
    () => null
  );

  return useMemo(
    () => ({ activeFocusId, setFocus, registerRegion, unregisterRegion, hasRegion }),
    [activeFocusId, setFocus, registerRegion, unregisterRegion, hasRegion]
  );
}
