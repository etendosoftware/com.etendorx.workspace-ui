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

import { useEffect, useRef } from "react";
import { logger } from "@/utils/logger";
import { loadTabColumnConfiguration, toColumnTableState } from "@/utils/savedViews/gridConfiguration";
import { loadTabDefaultView } from "@/utils/savedViews/defaultViews";
import { toAppliedViewState } from "@/utils/savedViews/transform";
import type { AppliedViewState } from "@/utils/savedViews/types";
import type { TableState } from "@/utils/window/constants";
import { markInitialViewResolved } from "@/stores/initialViewStore";
import { useUserStore } from "@/stores/userStore";
import { useWindowStore } from "@/stores/windowStore";
import { registerSessionReset } from "@/utils/session/resetSessionState";

interface UseAutoApplyDefaultViewParams {
  tabId: string;
  windowIdentifier: string;
  onApplyView: (state: AppliedViewState) => void;
  /**
   * Applies the column configuration the user stored for the tab (visibility, order, width and
   * pinning). Only used when the tab has no default view, which takes precedence as in classic.
   */
  onApplyColumnConfiguration?: (state: Partial<TableState>) => void;
}

/**
 * Tabs whose stored column configuration was already restored. Module-level so a tab remounting
 * while its window stays open (e.g. a child tab after the parent record changes) keeps the
 * columns of the session instead of reloading the stored ones.
 */
const restoredColumnConfigurations = new Set<string>();
registerSessionReset(() => restoredColumnConfigurations.clear());

/**
 * Fetches the default saved view for a tab and applies it automatically,
 * once per window open session (keyed by windowIdentifier + tabId).
 * When the tab has no default view, the column configuration the user stored is restored instead.
 * Once either is applied, or known to be absent, the tab is marked as resolved so its grid makes its
 * first load (the grid waits for it, see `useInitialViewPending`).
 */
export function useAutoApplyDefaultView({
  tabId,
  windowIdentifier,
  onApplyView,
  onApplyColumnConfiguration,
}: UseAutoApplyDefaultViewParams): void {
  const token = useUserStore((s) => s.token);
  const appliedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tabId || !windowIdentifier || !token) {
      // Nothing can be applied: the grid must not wait for it
      markInitialViewResolved(windowIdentifier, tabId);
      return;
    }

    const key = `${windowIdentifier}_${tabId}`;
    if (appliedRef.current.has(key)) return;

    let cancelled = false;

    async function restoreColumnConfiguration() {
      if (!onApplyColumnConfiguration || restoredColumnConfigurations.has(key)) return;

      const configuration = await loadTabColumnConfiguration(windowIdentifier, tabId);
      if (cancelled || !configuration || restoredColumnConfigurations.has(key)) return;

      restoredColumnConfigurations.add(key);
      onApplyColumnConfiguration(toColumnTableState(configuration));
    }

    async function fetchAndApply() {
      try {
        const config = await loadTabDefaultView(windowIdentifier, tabId);

        if (cancelled) return;

        // A linked-item navigation may have reconstructed this tab's selection (hard
        // filter to one record) between mount and this fetch resolving. The default
        // view is a per-tab preference, not tied to a specific record, so it must not
        // clobber that reconstructed filter — otherwise the ancestor grid silently
        // reverts to showing every record instead of the one the user navigated to.
        const isDirectLink =
          useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.initializedWithDirectLink ?? false;

        if (config && !isDirectLink) {
          appliedRef.current.add(key);
          restoredColumnConfigurations.add(key);
          onApplyView(toAppliedViewState(config));
          return;
        }

        // No default view to apply: restore the columns the user left (they never filter
        // records, so they are safe on a direct link too).
        await restoreColumnConfiguration();
      } catch (err) {
        logger.error("[useAutoApplyDefaultView] Failed to fetch default view:", err);
      } finally {
        // Applied, absent or unreadable: the grid loads now, with whatever was applied
        if (!cancelled) {
          markInitialViewResolved(windowIdentifier, tabId);
        }
      }
    }

    fetchAndApply();

    return () => {
      cancelled = true;
    };
  }, [tabId, windowIdentifier, token, onApplyView, onApplyColumnConfiguration]);
}
