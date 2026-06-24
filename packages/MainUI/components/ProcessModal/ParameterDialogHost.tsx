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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  clearParameterDialogs,
  type CollectedValue,
  type DynamicFormField,
  type ParameterDialogRequest,
  peekParameterDialog,
  resolveParameterDialog,
  subscribeParameterDialogs,
} from "@/utils/processes/definition/parameterDialogStore";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";

/** Maps a dynamic field's server input type to the form-reference code that routes the selector. */
function referenceForInputType(inputType: DynamicFormField["inputType"]): string {
  if (inputType === "CHECK") return FIELD_REFERENCE_CODES.BOOLEAN.id;
  return FIELD_REFERENCE_CODES.STRING.id;
}

/** Builds a minimal `ProcessParameter` for a dynamic field so the standard selector can render it. */
function toParameter(field: DynamicFormField): ProcessParameter {
  return {
    id: field.id || field.name,
    name: field.name,
    dBColumnName: field.name,
    reference: referenceForInputType(field.inputType),
    mandatory: false,
    refList: [],
  } as unknown as ProcessParameter;
}

/** Seeds the react-hook-form defaults from each field's declared default value. */
function buildDefaultValues(fields: DynamicFormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    defaults[field.name] = field.inputType === "CHECK" ? field.defaultCheck === "Y" : (field.defaultText ?? "");
  }
  return defaults;
}

/** Collects the form values into the `CollectedValue[]` echoed back to the script. */
function collectValues(fields: DynamicFormField[], values: Record<string, unknown>): CollectedValue[] {
  return fields.map((field) => ({
    id: field.id,
    name: field.name,
    inputType: field.inputType,
    value: values[field.name],
  }));
}

/** Inner form, remounted per request via `key` so its defaults reset for each dialog. */
function ParameterDialogForm({ request }: { request: ParameterDialogRequest }) {
  const { t } = useTranslation();
  const fields = request.fields;
  const defaultValues = useMemo(() => buildDefaultValues(fields), [fields]);
  const form = useForm({ defaultValues });
  const parameters = useMemo(() => fields.map(toParameter), [fields]);
  const values = form.watch();

  const onOk = () => resolveParameterDialog(request.id, collectValues(fields, form.getValues()));
  const onCancel = () => resolveParameterDialog(request.id, null);

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative flex w-[500px] flex-col rounded-xl border-4 border-gray-300 bg-white shadow-lg">
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-[var(--color-baseline-10)] p-4">
          <h2 className="text-lg font-semibold text-gray-800">{request.title ?? t("process.messageTitle")}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={t("common.close")}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <FormProvider {...form} data-testid="FormProvider__15edcf">
            {parameters.map((parameter) => (
              <ProcessParameterSelector
                key={parameter.name}
                parameter={parameter}
                values={values}
                data-testid={`ParameterDialogHost__${parameter.name}`}
              />
            ))}
          </FormProvider>
        </div>

        <div className="flex justify-end gap-3 rounded-b-xl border-t border-gray-200 bg-[var(--color-baseline-10)] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 focus:outline-none">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onOk}
            className="rounded bg-[var(--color-etendo-main)] px-4 py-2 font-medium text-white hover:bg-[var(--color-etendo-dark)] focus:outline-none">
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the active dynamic parameter-form dialog requested by a migrated script
 * (via `openDynamicForm` / a registered `OB.Utilities.Action.set` builder).
 * Subscribes to the singleton queue and shows one dialog at a time. Mounted inside
 * the process modal, so on unmount every pending dialog resolves to `null` (the
 * safe default) instead of hanging the awaiting script.
 */
export default function ParameterDialogHost() {
  const current = useSyncExternalStore(subscribeParameterDialogs, peekParameterDialog, peekParameterDialog);

  useEffect(() => () => clearParameterDialogs(), []);

  if (!current) return null;

  // `key` remounts the inner form (and its react-hook-form instance) per request.
  return <ParameterDialogForm key={current.id} request={current} data-testid="ParameterDialogForm__15edcf" />;
}
