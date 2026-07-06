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

import { createContext, useContext, useMemo } from "react";

interface CurrentWindowContextValue {
  windowIdentifier: string;
  windowId: string;
}

// Scopes windowIdentifier and windowId to the Window subtree that owns them,
// independent of which window is globally active. This allows all windows
// to be mounted simultaneously while each reads its own identifiers.
const CurrentWindowContext = createContext<CurrentWindowContextValue>({
  windowIdentifier: "",
  windowId: "",
});

export function CurrentWindowProvider({
  windowIdentifier,
  windowId,
  children,
}: {
  windowIdentifier: string;
  windowId: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ windowIdentifier, windowId }), [windowIdentifier, windowId]);
  return <CurrentWindowContext.Provider value={value}>{children}</CurrentWindowContext.Provider>;
}

export function useCurrentWindowIdentifier(): string {
  return useContext(CurrentWindowContext).windowIdentifier;
}

export function useCurrentWindowId(): string {
  return useContext(CurrentWindowContext).windowId;
}
