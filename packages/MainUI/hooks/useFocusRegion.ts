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
import { useFocusContext } from "@/contexts/focus";

/**
 * Registers a component as a named focus region within the window's FocusContext.
 * Returns whether this region currently has focus, and an `acquire` function to request it.
 *
 * @param id - Unique focus region ID (use tab.id)
 * @param options.onBlur - Called (async, fire-and-forget) when another region acquires focus.
 *                         Used to trigger auto-save when the user navigates to a child tab.
 */
export function useFocusRegion(
  id: string,
  options?: { onBlur?: () => Promise<void> | void }
): { isFocused: boolean; acquire: () => void } {
  const { activeFocusId, setFocus, registerRegion, unregisterRegion } = useFocusContext();

  // Ref keeps onBlur fresh without causing re-registration on every render
  const onBlurRef = useRef(options?.onBlur);
  onBlurRef.current = options?.onBlur;

  useEffect(() => {
    registerRegion({
      id,
      onBlur: () => onBlurRef.current?.(),
    });
    return () => unregisterRegion(id);
  }, [id, registerRegion, unregisterRegion]);

  const acquire = useCallback(() => {
    setFocus(id);
  }, [id, setFocus]);

  return {
    isFocused: activeFocusId === id,
    acquire,
  };
}
