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

/**
 * Returns `value` while `isVisible`, and the last value seen while visible once it is hidden (or the
 * first value, if it mounts hidden). Rendering a React element obtained this way lets React skip that
 * subtree entirely while it cannot be seen: the same element instance is never re-rendered.
 */
export function useFrozenWhileHidden<T>(isVisible: boolean, value: T): T {
  const frozenRef = useRef<{ value: T } | null>(null);
  if (isVisible || frozenRef.current === null) {
    frozenRef.current = { value };
  }
  return frozenRef.current.value;
}
