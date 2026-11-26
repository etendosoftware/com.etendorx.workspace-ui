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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { create } from "zustand";
import { registerSessionReset } from "@/utils/session/resetSessionState";

/**
 * Tabs whose initial view (the default saved view, or else the stored column configuration) is already
 * applied, or known not to exist. The grid of a tab waits for it before its first load, as classic loads
 * the window settings before the grid, so it loads once and already with the view.
 * Key: `${windowIdentifier}_${tabId}`; the window identifier is unique per opened window.
 */
interface InitialViewStore {
  resolved: Record<string, true>;
  markResolved: (windowIdentifier: string, tabId: string) => void;
}

export const getInitialViewKey = (windowIdentifier: string, tabId: string) => `${windowIdentifier}_${tabId}`;

export const useInitialViewStore = create<InitialViewStore>((set) => ({
  resolved: {},
  markResolved: (windowIdentifier, tabId) =>
    set((state) => {
      const key = getInitialViewKey(windowIdentifier, tabId);
      if (state.resolved[key]) return state;
      return { resolved: { ...state.resolved, [key]: true } };
    }),
}));

/** Marks the initial view of a tab as applied (or absent), so its grid can load. Usable outside React. */
export const markInitialViewResolved = (windowIdentifier: string, tabId: string): void =>
  useInitialViewStore.getState().markResolved(windowIdentifier, tabId);

registerSessionReset(() => useInitialViewStore.setState({ resolved: {} }));
