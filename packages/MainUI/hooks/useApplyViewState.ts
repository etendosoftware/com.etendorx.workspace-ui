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

import { useCallback, useMemo } from "react";
import { DEFAULT_NAVIGATION_STATE, useWindowStore } from "@/stores/windowStore";
import { clearGridConfiguration } from "@/utils/savedViews/gridConfiguration";
import { captureWindowLayout, getLayoutSplitHeights, resolveActiveLevels } from "@/utils/savedViews/layout";
import type { AppliedViewState, WindowLayout } from "@/utils/savedViews/types";
import { DEFAULT_COLUMN_PINNING } from "@/utils/table/columnState";
import type { TableState } from "@/utils/window/constants";

interface UseApplyViewStateParams {
  windowIdentifier: string;
  tabId: string;
}

export interface UseApplyViewStateReturn {
  /** Current window layout, to store with a saved view. */
  currentLayout: WindowLayout;
  /** Applies a view the user picked (or the standard view): grid state and the whole window layout. */
  handleApplyView: (state: AppliedViewState) => void;
  /**
   * Applies the default view when the tab opens. It never moves the active tab levels (that would
   * change the navigation the user or the URL set up) and keeps the heights when the view has no layout.
   */
  handleAutoApplyView: (state: AppliedViewState) => void;
  /** Applies the column configuration the user stored for the tab. */
  handleApplyColumnConfiguration: (state: Partial<TableState>) => void;
  /** Clears the stored column configuration of the tab (back to the standard view). */
  handleResetToStandard: () => void;
}

/** Maps the state of a view to the table fields it replaces. */
const toTableState = (state: AppliedViewState): Partial<TableState> => ({
  filters: state.filters,
  visibility: state.visibility,
  sorting: state.sorting,
  order: state.order,
  isImplicitFilterApplied: state.implicitFilterApplied,
  grouping: state.grouping ?? [],
  sizing: state.sizing ?? {},
  pinning: state.pinning ?? DEFAULT_COLUMN_PINNING,
  summaries: state.summaries ?? {},
});

/**
 * Applies saved views, the standard view and the stored column configuration of a tab to the
 * window store, and captures the window layout to store with a view.
 */
export const useApplyViewState = ({ windowIdentifier, tabId }: UseApplyViewStateParams): UseApplyViewStateReturn => {
  const applyTableViewState = useWindowStore((s) => s.applyTableViewState);
  const setNavigationSplitHeights = useWindowStore((s) => s.setNavigationSplitHeights);
  const setNavigationActiveLevels = useWindowStore((s) => s.setNavigationActiveLevels);
  const navigation = useWindowStore((s) => s.windows[windowIdentifier]?.navigation ?? DEFAULT_NAVIGATION_STATE);

  const currentLayout = useMemo(() => captureWindowLayout(navigation), [navigation]);

  const applyViewState = useCallback(
    (state: AppliedViewState, isAutoApply: boolean) => {
      if (!windowIdentifier || !tabId) return;
      applyTableViewState(windowIdentifier, tabId, toTableState(state));

      if (isAutoApply && !state.layout) return;
      setNavigationSplitHeights(windowIdentifier, getLayoutSplitHeights(state.layout));

      if (isAutoApply) return;
      const activeLevels = useWindowStore.getState().windows[windowIdentifier]?.navigation.activeLevels ?? [0];
      const nextActiveLevels = resolveActiveLevels(activeLevels, state.layout);
      if (nextActiveLevels) {
        setNavigationActiveLevels(windowIdentifier, nextActiveLevels);
      }
    },
    [windowIdentifier, tabId, applyTableViewState, setNavigationSplitHeights, setNavigationActiveLevels]
  );

  const handleApplyView = useCallback((state: AppliedViewState) => applyViewState(state, false), [applyViewState]);

  const handleAutoApplyView = useCallback((state: AppliedViewState) => applyViewState(state, true), [applyViewState]);

  const handleApplyColumnConfiguration = useCallback(
    (state: Partial<TableState>) => {
      if (!windowIdentifier || !tabId) return;
      applyTableViewState(windowIdentifier, tabId, state);
    },
    [windowIdentifier, tabId, applyTableViewState]
  );

  const handleResetToStandard = useCallback(() => {
    if (!windowIdentifier || !tabId) return;
    clearGridConfiguration(windowIdentifier, tabId);
  }, [windowIdentifier, tabId]);

  return {
    currentLayout,
    handleApplyView,
    handleAutoApplyView,
    handleApplyColumnConfiguration,
    handleResetToStandard,
  };
};
