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
 * @fileoverview Lets a field place an action (the search magnifier) inside the box of its input, so the field
 * keeps the full width of its column. The input that can host it registers itself; when the field renders an
 * input that cannot, the field keeps showing the action outside, as before.
 */

import type React from "react";
import { createContext, useContext, useLayoutEffect } from "react";

export interface FieldTrailingActionValue {
  /** The action to show at the end of the input box. */
  action: React.ReactNode;
  /** Called with `true` while an input shows the action, and with `false` when it stops. */
  setHosted: (hosted: boolean) => void;
}

export const FieldTrailingActionContext = createContext<FieldTrailingActionValue | null>(null);

/**
 * Takes the action of the enclosing field, if any, and tells the field it is shown here. The registration runs
 * before paint, so the field never shows the action twice on screen.
 *
 * @returns the action to render inside the input box, or `null`
 */
export const useFieldTrailingAction = (): React.ReactNode => {
  const value = useContext(FieldTrailingActionContext);
  // Keyed on the setter, which is stable: a new action on each render must not register the host again.
  const setHosted = value?.setHosted;

  useLayoutEffect(() => {
    if (!setHosted) return;
    setHosted(true);
    return () => setHosted(false);
  }, [setHosted]);

  return value?.action ?? null;
};
