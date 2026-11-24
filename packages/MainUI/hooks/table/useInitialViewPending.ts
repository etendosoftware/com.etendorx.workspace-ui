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

import { useEffect } from "react";
import { getInitialViewKey, markInitialViewResolved, useInitialViewStore } from "@/stores/initialViewStore";

/**
 * Longest wait for the initial view of a tab. The views are requested when the window opens, so they are
 * normally there before the grid mounts; this only keeps a request that never answers from blocking the grid,
 * which then loads without the view (a view arriving later is still applied, and its load replaces this one).
 */
export const INITIAL_VIEW_WAIT_MS = 2000;

/**
 * Whether the grid of a tab still waits for its initial view (default saved view or stored column
 * configuration) before its first load.
 */
export function useInitialViewPending(windowIdentifier: string, tabId: string): boolean {
  const isPending = useInitialViewStore((state) => !state.resolved[getInitialViewKey(windowIdentifier, tabId)]);

  useEffect(() => {
    if (!isPending) return;
    const timer = setTimeout(() => markInitialViewResolved(windowIdentifier, tabId), INITIAL_VIEW_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isPending, windowIdentifier, tabId]);

  return isPending;
}
