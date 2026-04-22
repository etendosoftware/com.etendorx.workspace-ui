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

import { useCallback, useEffect, useRef } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_TableInstance } from "material-react-table";

export const NAVIGATION_DIRECTION = { UP: -1, DOWN: 1 } as const;
export type NavigationStep = (typeof NAVIGATION_DIRECTION)[keyof typeof NAVIGATION_DIRECTION];

export const NAVIGATION_SOURCE = { KEYBOARD: "keyboard", INTERACTION: "interaction" } as const;
export type NavigationSource = (typeof NAVIGATION_SOURCE)[keyof typeof NAVIGATION_SOURCE];

const KEYBOARD_SOURCE_RESET_DELAY_MS = 250;

/**
 * Computes the next row index for keyboard navigation without wrapping.
 * Returns `null` when the step would cross a boundary (first/last record).
 */
export const computeNextIndex = (currentIndex: number, step: NavigationStep, total: number): number | null => {
  if (total <= 0) return null;
  const next = currentIndex + step;
  if (next < 0) return null;
  if (next > total - 1) return null;
  return next;
};

interface UseRowKeyboardNavigationArgs {
  table: MRT_TableInstance<EntityData>;
  effectiveRecords: EntityData[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  editingRowsCount: number;
}

interface UseRowKeyboardNavigationResult {
  handleArrowUp: (event: KeyboardEvent) => void;
  handleArrowDown: (event: KeyboardEvent) => void;
  /**
   * Stable callback that tells consumers (e.g. useTableSelection) whether the current
   * selection change originated from keyboard navigation. Used to gate expensive side
   * effects behind a debounce only for keyboard-driven selection.
   */
  isKeyboardNavigationSource: () => boolean;
}

export const useRowKeyboardNavigation = ({
  table,
  effectiveRecords,
  containerRef,
  editingRowsCount,
}: UseRowKeyboardNavigationArgs): UseRowKeyboardNavigationResult => {
  const pendingIndexRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const navigationSourceRef = useRef<NavigationSource>(NAVIGATION_SOURCE.INTERACTION);
  const sourceResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveRecordsRef = useRef(effectiveRecords);
  effectiveRecordsRef.current = effectiveRecords;
  const editingRowsCountRef = useRef(editingRowsCount);
  editingRowsCountRef.current = editingRowsCount;
  const tableRef = useRef(table);
  tableRef.current = table;

  const clearSourceResetTimer = useCallback(() => {
    if (sourceResetTimerRef.current) {
      clearTimeout(sourceResetTimerRef.current);
      sourceResetTimerRef.current = null;
    }
  }, []);

  const markKeyboardSource = useCallback(() => {
    navigationSourceRef.current = NAVIGATION_SOURCE.KEYBOARD;
    clearSourceResetTimer();
    sourceResetTimerRef.current = setTimeout(() => {
      navigationSourceRef.current = NAVIGATION_SOURCE.INTERACTION;
      sourceResetTimerRef.current = null;
    }, KEYBOARD_SOURCE_RESET_DELAY_MS);
  }, [clearSourceResetTimer]);

  const flushPendingSelection = useCallback(() => {
    rafIdRef.current = null;
    const nextIndex = pendingIndexRef.current;
    pendingIndexRef.current = null;
    if (nextIndex === null) return;

    const records = effectiveRecordsRef.current;
    const target = records[nextIndex];
    if (!target) return;

    markKeyboardSource();
    tableRef.current.setRowSelection({ [String(target.id)]: true });
  }, [markKeyboardSource]);

  const scheduleSelection = useCallback(
    (nextIndex: number) => {
      pendingIndexRef.current = nextIndex;
      if (rafIdRef.current !== null) return;

      if (typeof requestAnimationFrame === "undefined") {
        flushPendingSelection();
        return;
      }
      rafIdRef.current = requestAnimationFrame(flushPendingSelection);
    },
    [flushPendingSelection]
  );

  const navigate = useCallback(
    (step: NavigationStep, event: KeyboardEvent) => {
      if (editingRowsCountRef.current > 0) return;
      const container = containerRef.current;
      if (!container || !container.contains(event.target as Node)) return;

      const currentSelection = tableRef.current.getState().rowSelection;
      const selectedIds = Object.keys(currentSelection).filter((id) => currentSelection[id]);
      if (selectedIds.length !== 1) return;

      const records = effectiveRecordsRef.current;
      // When a navigation is pending inside this frame, compute the next index from the
      // pending target instead of the currently-rendered selection. This lets repeated
      // key events within the same frame advance multiple steps instead of collapsing
      // to a single step.
      const baseIndex =
        pendingIndexRef.current !== null
          ? pendingIndexRef.current
          : records.findIndex((r) => String(r.id) === selectedIds[0]);
      if (baseIndex === -1) return;

      const nextIndex = computeNextIndex(baseIndex, step, records.length);
      if (nextIndex === null) return;

      event.preventDefault();
      scheduleSelection(nextIndex);
    },
    [containerRef, scheduleSelection]
  );

  const handleArrowUp = useCallback(
    (event: KeyboardEvent) => navigate(NAVIGATION_DIRECTION.UP, event),
    [navigate]
  );
  const handleArrowDown = useCallback(
    (event: KeyboardEvent) => navigate(NAVIGATION_DIRECTION.DOWN, event),
    [navigate]
  );

  const isKeyboardNavigationSource = useCallback(() => navigationSourceRef.current === NAVIGATION_SOURCE.KEYBOARD, []);

  // Reset the source flag on keyup so a subsequent click is never mistakenly debounced.
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      clearSourceResetTimer();
      navigationSourceRef.current = NAVIGATION_SOURCE.INTERACTION;
    };
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [clearSourceResetTimer]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = null;
      pendingIndexRef.current = null;
      clearSourceResetTimer();
    };
  }, [clearSourceResetTimer]);

  return { handleArrowUp, handleArrowDown, isKeyboardNavigationSource };
};
