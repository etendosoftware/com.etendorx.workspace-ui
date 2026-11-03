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

import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useFormPersonalizationStore } from "@/stores/formPersonalizationStore";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useWindowStore } from "@/stores/windowStore";
import { prefetchStore } from "@/utils/prefetchStore";

type SessionReset = () => void;

interface ResettableStore {
  getInitialState: () => unknown;
  setState: (state: never, replace: true) => void;
}

const sessionResets = new Set<SessionReset>();

/** Stores with no session-independent state: they go back to their initial state on logout. */
const STORES_RESET_TO_INITIAL_STATE: ResettableStore[] = [
  useLiveTabValuesStore,
  useUnsavedChangesStore,
  useToolbarStore,
  useDashboardStore,
];

/** Registers a cleanup to run on every logout. Registering the same function twice runs it once. */
export function registerSessionReset(reset: SessionReset): void {
  sessionResets.add(reset);
}

function resetToInitialState(store: ResettableStore): void {
  store.setState(store.getInitialState() as never, true);
}

/** Drops the windows kept in the URL (`wi_N`, `ti_N`, `ri_N`), so the next login does not recover them. */
function clearWindowUrlState(): void {
  if (typeof window === "undefined" || !window.location.search) {
    return;
  }
  window.history.replaceState(null, "", window.location.pathname);
}

/**
 * Clears every client state tied to the session of the user who is logging out, so the next login in
 * the same browser tab starts clean, as in Classic: no windows, records, form state or cached data of
 * the previous user.
 *
 * Module-level caches living in heavy modules (hooks, contexts) register their own cleanup with
 * {@link registerSessionReset} instead of being imported here, which keeps this module free of
 * circular imports with the user context that calls it.
 */
export function resetSessionState(): void {
  useWindowStore.getState().cleanState();
  useFormPersonalizationStore.getState().reset();
  useProcessMonitorStore.getState().reset();
  for (const store of STORES_RESET_TO_INITIAL_STATE) {
    resetToInitialState(store);
  }
  datasource.clearCache();
  prefetchStore.clear();
  for (const reset of sessionResets) {
    reset();
  }
  clearWindowUrlState();
}
