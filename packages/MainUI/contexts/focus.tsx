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

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

interface FocusRegion {
  id: string;
  onBlur?: () => Promise<void> | void;
}

interface FocusContextI {
  activeFocusId: string | null;
  setFocus: (id: string) => void;
  registerRegion: (region: FocusRegion) => void;
  unregisterRegion: (id: string) => void;
}

const FocusContext = createContext<FocusContextI>({} as FocusContextI);

export function FocusProvider({ children }: React.PropsWithChildren) {
  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  // Ref tracks latest activeFocusId synchronously to avoid stale closure in setFocus
  const activeFocusIdRef = useRef<string | null>(null);
  const regionsRef = useRef<Map<string, FocusRegion>>(new Map());

  const registerRegion = useCallback((region: FocusRegion) => {
    regionsRef.current.set(region.id, region);
  }, []);

  const unregisterRegion = useCallback((id: string) => {
    regionsRef.current.delete(id);
  }, []);

  const setFocus = useCallback((id: string) => {
    const prev = activeFocusIdRef.current;
    if (prev === id) return;

    // Fire onBlur for previous region (async, fire-and-forget — tab navigates immediately)
    const prevRegion = regionsRef.current.get(prev ?? "");
    prevRegion?.onBlur?.();

    activeFocusIdRef.current = id;
    setActiveFocusId(id);
  }, []);

  const value = useMemo(
    () => ({ activeFocusId, setFocus, registerRegion, unregisterRegion }),
    [activeFocusId, setFocus, registerRegion, unregisterRegion]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusContext() {
  return useContext(FocusContext);
}
