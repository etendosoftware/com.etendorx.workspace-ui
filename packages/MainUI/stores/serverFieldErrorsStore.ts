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

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ServerFieldErrors } from "@/utils/form/serverFieldErrors";

interface ServerFieldErrorsStore {
  /** `{ [scope]: { [fieldName]: message } }` */
  errors: Record<string, ServerFieldErrors>;
  /** Replaces the field errors of a scope with the ones of the last rejected save. */
  setFieldErrors: (scope: string, errors: ServerFieldErrors) => void;
  /** Drops the error of one field; nothing changes when the field has none. */
  clearFieldError: (scope: string, fieldName: string) => void;
  /** Drops every field error of a scope; nothing changes when it has none. */
  clearScope: (scope: string) => void;
}

/** Copy of `errors` without `key`. */
const without = <T>(errors: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(errors).filter(([entryKey]) => entryKey !== key));

/**
 * Field errors returned by the server when it rejects a save, shown on the fields until the
 * user changes the value or the record is saved, left or closed. They are kept apart from the
 * react-hook-form errors: an error set there on a key the form does not register would block
 * every following submit.
 */
export const useServerFieldErrorsStore = create<ServerFieldErrorsStore>()(
  devtools(
    (set, get) => ({
      errors: {},
      setFieldErrors: (scope, errors) => {
        set((state) => ({ errors: { ...state.errors, [scope]: errors } }), false, "serverFieldErrors/setFieldErrors");
      },
      clearFieldError: (scope, fieldName) => {
        const scopeErrors = get().errors[scope];
        if (!scopeErrors || !(fieldName in scopeErrors)) {
          return;
        }
        set(
          (state) => ({ errors: { ...state.errors, [scope]: without(scopeErrors, fieldName) } }),
          false,
          "serverFieldErrors/clearFieldError"
        );
      },
      clearScope: (scope) => {
        if (!(scope in get().errors)) {
          return;
        }
        set((state) => ({ errors: without(state.errors, scope) }), false, "serverFieldErrors/clearScope");
      },
    }),
    { name: "ServerFieldErrorsStore" }
  )
);

/** Server error message of a field, or `undefined` when the field has none. */
export const useServerFieldError = (scope: string, fieldName: string): string | undefined =>
  useServerFieldErrorsStore((state) => state.errors[scope]?.[fieldName]);
