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

import { useEffect, useReducer, useRef } from "react";

/**
 * Pause after which selection side effects (child tabs, toolbar auxiliary inputs) follow the selection.
 * Same as Classic's `fireOnPause('delayedRecordSelected_…', …, fireOnPauseDelay * 2)` in ob-standard-view.js.
 */
export const SELECTION_SETTLE_MS = 400;

/**
 * Follows `value`, but coalesces bursts: a change after `delayMs` without changes is returned in the
 * same render, so an isolated change costs nothing; changes that follow within `delayMs` are held and
 * only the last one is returned, once the value has not changed for `delayMs`.
 */
export function useSettledValue<T>(value: T, delayMs: number): T {
  const stateRef = useRef({ settled: value, latest: value, changedAt: Number.NEGATIVE_INFINITY });
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const state = stateRef.current;

  // Updated during render on purpose, so an isolated change is returned in the same render. A render
  // React throws away can at worst start one quiet period early.
  if (!Object.is(state.latest, value)) {
    const now = Date.now();
    if (now - state.changedAt >= delayMs) {
      state.settled = value;
    }
    state.latest = value;
    state.changedAt = now;
  }

  useEffect(() => {
    if (Object.is(state.settled, value)) return;
    const timer = setTimeout(() => {
      state.settled = state.latest;
      rerender();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [state, value, delayMs]);

  return state.settled;
}
