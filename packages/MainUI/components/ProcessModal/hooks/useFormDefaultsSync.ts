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

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Re-applies the process defaults to the form whenever `availableFormData`
 * changes (async `processInitialization` defaults, session, parameters),
 * while preserving fields modified by onLoad/onChange scripts or by the user.
 *
 * The `keepDirtyValues` option is the key: a value written by a migrated
 * onLoad script through `view.theForm.getItem(...).setValue(...)` is set with
 * `shouldDirty: true`, so it becomes dirty and survives a later reset instead
 * of being wiped by the freshly-arrived defaults. Untouched (clean) fields
 * still take the new defaults.
 *
 * @param form - The react-hook-form instance backing the process modal.
 * @param availableFormData - The merged defaults to apply; an empty object is
 *   ignored so the form is not reset before any data is available.
 */
export function useFormDefaultsSync<T extends FieldValues>(form: UseFormReturn<T>, availableFormData: T): void {
  useEffect(() => {
    if (Object.keys(availableFormData).length === 0) {
      return;
    }
    form.reset(availableFormData, { keepDirtyValues: true });
  }, [availableFormData, form]);
}
