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

import { create } from "zustand";

/** Record count of each child tab's grid, shown as a badge on the tab strip. Key: `${windowIdentifier}:${tabId}`. */
interface TabCountsStore {
  counts: Record<string, number>;
  setCount: (key: string, count: number) => void;
  /** Removes the badge, e.g. while several parent records are selected and no children are shown. */
  clearCount: (key: string) => void;
}

export const getTabCountKey = (windowIdentifier: string, tabId: string) => `${windowIdentifier}:${tabId}`;

export const useTabCountsStore = create<TabCountsStore>((set) => ({
  counts: {},
  setCount: (key, count) =>
    set((state) => (state.counts[key] === count ? state : { counts: { ...state.counts, [key]: count } })),
  clearCount: (key) =>
    set((state) => {
      if (!(key in state.counts)) return state;
      const { [key]: _removed, ...rest } = state.counts;
      return { counts: rest };
    }),
}));
