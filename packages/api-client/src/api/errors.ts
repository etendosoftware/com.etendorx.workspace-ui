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

/**
 * Legacy message thrown for every non-access metadata failure (404, 500, network).
 * Do NOT change it: consumers match it by substring to close windows that no longer exist.
 */
export const WINDOW_NOT_FOUND_ERROR_MESSAGE = "Window not found";

export const WINDOW_ACCESS_DENIED_ERROR_NAME = "WindowAccessDeniedError";

/** Must not contain the "not found" substring, so it never falls into the legacy branch. */
export const WINDOW_ACCESS_DENIED_ERROR_MESSAGE = "Window access denied";

/**
 * Thrown when the current role is not allowed to open a window, either because the ERP answered
 * 401 or because it served the window through its implicit read-only fallback.
 */
export class WindowAccessDeniedError extends Error {
  public readonly windowId: string;
  public readonly status: number;

  constructor(windowId: string, status: number) {
    super(WINDOW_ACCESS_DENIED_ERROR_MESSAGE);
    this.name = WINDOW_ACCESS_DENIED_ERROR_NAME;
    this.windowId = windowId;
    this.status = status;
    // The build targets ES5, where `super()` returns a plain Error and breaks the prototype
    // chain. Without this, `instanceof` would be false for downlevelled consumers.
    Object.setPrototypeOf(this, WindowAccessDeniedError.prototype);
  }
}

/**
 * Detects the error by `name` rather than `instanceof`, so it also works across the ES5 downlevel
 * and across duplicated module instances (Next bundle vs. ts-jest).
 */
export const isWindowAccessDeniedError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return (error as Error).name === WINDOW_ACCESS_DENIED_ERROR_NAME;
};
