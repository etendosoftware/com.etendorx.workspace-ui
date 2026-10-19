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

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useTabContext } from "@/contexts/tab";
import type { FormValues } from "@/contexts/tabFormValuesStore";

const EMPTY: FormValues = {};
const noopSubscribe = () => () => {};

const isEmpty = (values: FormValues) => Object.keys(values).length === 0;

/**
 * The tab's dirty form values, re-rendering the caller only when one of `names` changes or the values
 * are reset to empty. In between it keeps returning the snapshot taken at the last such change, so
 * edits to other fields cost the caller nothing.
 */
export function useTabFormValues(names: readonly string[]): FormValues {
  const store = useTabContext().formValuesStore;
  const lastRef = useRef<FormValues | null>(null);

  const getSnapshot = useCallback((): FormValues => {
    if (!store) return EMPTY;
    const current = store.get();
    const last = lastRef.current;
    const unchanged =
      last !== null &&
      (current === last ||
        (isEmpty(current) && isEmpty(last)) ||
        (!isEmpty(current) && names.every((name) => Object.is(last[name], current[name]))));
    if (unchanged) return last;
    lastRef.current = current;
    return current;
  }, [store, names]);

  return useSyncExternalStore(store ? store.subscribe : noopSubscribe, getSnapshot, getSnapshot);
}
