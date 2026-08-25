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

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SPLIT_PANES, getOtherSplitPane, resolvePaneFocusTarget, type SplitPane } from "@/utils/window/splitView";

/** Moves the keyboard focus to the next pane — the platform-wide convention. */
const NEXT_PANE_SHORTCUT = "F6";

interface UseSplitPaneFocusParams {
  /** Grid and form share the screen, so the keyboard belongs to one of them. */
  isDualPane: boolean;
  /**
   * The form pane is mounted. It lags one render behind `isDualPane` when the
   * split is opened from the grid, since the record has to reach the store first.
   */
  shouldShowForm: boolean;
  /** This tab owns the window focus. */
  isTabFocused: boolean;
}

interface UseSplitPaneFocusResult {
  focusedPane: SplitPane;
  gridPaneRef: RefObject<HTMLDivElement | null>;
  formPaneRef: RefObject<HTMLDivElement | null>;
  handleGridPaneFocus: () => void;
  handleFormPaneFocus: () => void;
}

/**
 * Tracks which pane owns the keyboard while grid and form share the screen.
 *
 * The DOM focus is the single source of truth: `focusedPane` is derived from it
 * through focusin on the pane containers, and only drives the focus indicator.
 * Tab therefore always walks the pane the indicator points at, without any key
 * being intercepted.
 *
 * The one moment the DOM focus can be wrong is when the second pane appears: the
 * grid still holds the focus it took on the row click, and since it precedes the
 * form in the DOM, Tab would walk the grid. So the form pane claims the focus
 * there, which is exactly what QA asked for.
 *
 * Deliberately independent of the tab-level focus region: a pane change must
 * never reach `setFocus`, whose `onBlur` saves pending form changes.
 */
export function useSplitPaneFocus({
  isDualPane,
  shouldShowForm,
  isTabFocused,
}: UseSplitPaneFocusParams): UseSplitPaneFocusResult {
  const gridPaneRef = useRef<HTMLDivElement | null>(null);
  const formPaneRef = useRef<HTMLDivElement | null>(null);

  const [focusedPane, setFocusedPane] = useState<SplitPane>(SPLIT_PANES.FORM);
  // Mirrors the state so a focusin that does not change panes costs no render:
  // the form fires one per field the user tabs through, and the grid is heavy.
  const focusedPaneRef = useRef<SplitPane>(SPLIT_PANES.FORM);

  const focusPane = useCallback((pane: SplitPane) => {
    if (focusedPaneRef.current === pane) return;
    focusedPaneRef.current = pane;
    setFocusedPane(pane);
  }, []);

  const handleGridPaneFocus = useCallback(() => focusPane(SPLIT_PANES.GRID), [focusPane]);
  const handleFormPaneFocus = useCallback(() => focusPane(SPLIT_PANES.FORM), [focusPane]);

  const getPaneElement = useCallback((pane: SplitPane): HTMLElement | null => {
    if (pane === SPLIT_PANES.GRID) {
      return gridPaneRef.current;
    }
    return formPaneRef.current;
  }, []);

  const moveFocusToPane = useCallback(
    (pane: SplitPane) => {
      const paneElement = getPaneElement(pane);
      if (!paneElement) return;
      focusPane(pane);
      resolvePaneFocusTarget(paneElement).focus({ preventScroll: true });
    },
    [getPaneElement, focusPane]
  );

  // Edge-triggered on both panes becoming visible, mirroring the
  // `previousIsVisibleRef` pattern the grid uses for its own focus restore.
  // Only the transition matters: refocusing the tab later must not steal focus.
  const wasDualPaneVisibleRef = useRef(false);
  useEffect(() => {
    const isDualPaneVisible = isDualPane && shouldShowForm;
    const wasVisible = wasDualPaneVisibleRef.current;
    wasDualPaneVisibleRef.current = isDualPaneVisible;

    if (wasVisible || !isDualPaneVisible || !isTabFocused) return;
    // Never pull the caret out of a field the user is already in: the split can
    // be opened with ctrl+m from the maximized form, and blurring a field fires
    // its callout.
    if (formPaneRef.current?.contains(document.activeElement)) return;
    moveFocusToPane(SPLIT_PANES.FORM);
  }, [isDualPane, shouldShowForm, isTabFocused, moveFocusToPane]);

  const handleNextPane = useCallback(() => {
    moveFocusToPane(getOtherSplitPane(focusedPaneRef.current));
  }, [moveFocusToPane]);

  useKeyboardShortcuts(
    { [NEXT_PANE_SHORTCUT]: { handler: handleNextPane, allowInInputs: true } },
    isTabFocused && isDualPane
  );

  return { focusedPane, gridPaneRef, formPaneRef, handleGridPaneFocus, handleFormPaneFocus };
}
