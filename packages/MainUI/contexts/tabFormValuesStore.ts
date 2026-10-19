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

import type { SetStateAction } from "react";

export type FormValues = Record<string, unknown>;

/**
 * The dirty form values of a tab, kept outside React state so writing them does not change the
 * `TabContext` value. Readers subscribe through {@link useTabFormValues}.
 */
export interface FormValuesStore {
  get: () => FormValues;
  /** Same contract as a React state setter: a value, or an updater of the current values. */
  set: (update: SetStateAction<FormValues>) => void;
  subscribe: (listener: () => void) => () => void;
}

export const createFormValuesStore = (): FormValuesStore => {
  let values: FormValues = {};
  const listeners = new Set<() => void>();
  return {
    get: () => values,
    set: (update) => {
      const next = typeof update === "function" ? update(values) : update;
      if (next === values) return;
      values = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
