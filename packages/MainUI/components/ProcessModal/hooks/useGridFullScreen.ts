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

import { type CSSProperties, useEffect } from "react";

/**
 * Escape in the full screen of a process grid leaves the full screen first, without closing the process
 * window (ETP-6312). The listener is on the window, in the capture phase, so it runs before the capture one of
 * the modal on the document, which it stops. A second Escape, already out of full screen, closes the process.
 *
 * @param isFullScreen whether the grid is in full screen; the listener only exists while it is
 * @param exitFullScreen leaves the full screen of the grid
 */
export function useExitFullScreenOnEscape(isFullScreen: boolean, exitFullScreen: () => void): void {
  useEffect(() => {
    if (!isFullScreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      exitFullScreen();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isFullScreen, exitFullScreen]);
}

/**
 * Style of the wrapper of a process grid. In full screen the grid leaves the flow (`position: fixed`), so the
 * wrapper keeps the height of the grid and the process window behind does not shrink, move or cut its
 * parameters and buttons (ETP-6312).
 *
 * @param isFullScreen whether the grid is in full screen
 * @param minHeight height the grid takes in the flow, in pixels
 * @returns the style to apply, or `undefined` when the grid is in the flow
 */
export function getFullScreenWrapperStyle(isFullScreen: boolean, minHeight: number): CSSProperties | undefined {
  return isFullScreen ? { minHeight } : undefined;
}
