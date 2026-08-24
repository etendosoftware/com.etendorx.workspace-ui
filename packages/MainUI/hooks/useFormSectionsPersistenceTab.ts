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

import { useCallback } from "react";
import { useWindowStore, DEFAULT_EXPANDED_SECTIONS } from "@/stores/windowStore";

interface UseFormSectionsPersistenceTabReturn {
  /** Ids of the sections currently expanded in this tab. */
  expandedSections: string[];
  /** React-style setter, supporting both a direct value and an updater function. */
  setExpandedSections: React.Dispatch<React.SetStateAction<string[]>>;
  /**
   * Applies the metadata defaults, but only when this tab has no stored
   * preference yet. Idempotent, so it can be called from an effect that re-runs.
   */
  initializeExpandedSections: (computeDefaults: () => string[]) => void;
}

/**
 * Persists the collapse/expand preference of the form sections of a tab in the
 * window store, so it survives FormView unmounting (going back to the grid and
 * reopening the form) instead of falling back to the metadata defaults.
 *
 * @param params.windowIdentifier - Identifier of the window instance owning the tab
 * @param params.tabId - Id of the tab whose sections are being persisted
 * @param params.tabLevel - Hierarchical level of the tab, used when the tab entry
 *                          has to be created in the store
 * @returns The persisted expanded sections plus its setter and seeding helper
 */
export const useFormSectionsPersistenceTab = ({
  windowIdentifier,
  tabId,
  tabLevel = 0,
}: {
  windowIdentifier: string;
  tabId: string;
  tabLevel?: number;
}): UseFormSectionsPersistenceTabReturn => {
  const setTabExpandedSections = useWindowStore((s) => s.setTabExpandedSections);

  // Imperative getter: returns undefined while no preference has ever been stored.
  const getStoredExpandedSections = useCallback((wi: string, tid: string) => {
    return useWindowStore.getState().windows[wi]?.tabs[tid]?.expandedSections;
  }, []);

  const expandedSections = useWindowStore(
    (s) => s.windows[windowIdentifier]?.tabs[tabId]?.expandedSections ?? DEFAULT_EXPANDED_SECTIONS
  );

  const setExpandedSections = useCallback(
    (updaterOrValue: string[] | ((prev: string[]) => string[])) => {
      // Read the stored value instead of a render closure so consecutive updates
      // always build on the persisted state.
      const current = getStoredExpandedSections(windowIdentifier, tabId) ?? DEFAULT_EXPANDED_SECTIONS;
      const next = typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
      setTabExpandedSections(windowIdentifier, tabId, next, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, getStoredExpandedSections, setTabExpandedSections]
  );

  const initializeExpandedSections = useCallback(
    (computeDefaults: () => string[]) => {
      // An empty array is a valid preference, so only undefined means "not seeded yet".
      if (getStoredExpandedSections(windowIdentifier, tabId) !== undefined) return;
      setTabExpandedSections(windowIdentifier, tabId, computeDefaults(), tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, getStoredExpandedSections, setTabExpandedSections]
  );

  return { expandedSections, setExpandedSections, initializeExpandedSections };
};
