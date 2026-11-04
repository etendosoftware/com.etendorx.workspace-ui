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

import { useRef } from "react";

const NO_KEYS: readonly unknown[] = [];

const sameKeys = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((key, index) => Object.is(key, b[index]));

/**
 * Returns `value` while `isVisible`, and the last value seen while visible once it is hidden (or the
 * first value, if it mounts hidden). Rendering a React element obtained this way lets React skip that
 * subtree entirely while it cannot be seen: the same element instance is never re-rendered.
 *
 * `refreshKeys` lists what the hidden subtree must still reflect (e.g. its rows and selection): when one
 * of them changes, the current value is taken even while hidden.
 *
 * With `keepWhenUnchanged`, a subtree that is shown again keeps its last value if none of the keys changed,
 * so it is not rendered anew just for having been shown. `refreshKeys` must then list everything it shows
 * that can change while it is hidden.
 */
export function useFrozenWhileHidden<T>(
  isVisible: boolean,
  value: T,
  refreshKeys: readonly unknown[] = NO_KEYS,
  keepWhenUnchanged = false
): T {
  const frozenRef = useRef<{ value: T; keys: readonly unknown[] } | null>(null);
  const wasVisibleRef = useRef(isVisible);
  const unchanged = frozenRef.current !== null && sameKeys(frozenRef.current.keys, refreshKeys);
  // Only the render that shows the subtree again can keep the old value: from then on the subtree is on
  // screen and has to follow everything, not just the keys.
  const isBeingShown = isVisible && !wasVisibleRef.current;
  wasVisibleRef.current = isVisible;
  const keep = !isVisible || (keepWhenUnchanged && isBeingShown);
  if (frozenRef.current === null || !keep || !unchanged) {
    frozenRef.current = { value, keys: refreshKeys };
  }
  return frozenRef.current.value;
}
