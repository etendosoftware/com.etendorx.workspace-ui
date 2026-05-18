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

import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import type { FieldValues, UseFormSetValue } from "react-hook-form";
import { SELECTOR_SAFE_PARAMS } from "@/utils/table/constants";

/**
 * Determines the correct field name to use for form registration/updating.
 * Priority: hqlName > columnName > name
 */
export const getSelectorFieldName = (field: Field): string => {
  return field.hqlName || field.columnName || field.name;
};

/**
 * Updates a selector value in the form state, including the associated _data field.
 *
 * @param setValue The setValue function from useForm
 * @param fieldName The name of the field to update
 * @param value The ID value to set
 * @param data Optional record object to set in the _data field
 */
export const updateSelectorValue = (
  setValue: UseFormSetValue<FieldValues>,
  fieldName: string,
  value: any,
  data?: any,
  displayField?: string
) => {
  // Update the main ID field
  setValue(fieldName, value, {
    shouldValidate: true,
    shouldDirty: true,
  });

  // Update the associated data field if provided
  if (data !== undefined) {
    setValue(`${fieldName}_data`, data);

    // Update the associated _identifier field
    const identifierValue =
      displayField && data[displayField] ? data[displayField] : data._identifier || data.name || data.id || value;

    if (identifierValue !== undefined) {
      setValue(`${fieldName}$_identifier`, identifierValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }
};

export const buildBaseFilterParams = (
  field: Field,
  etendoContext: Record<string, unknown>,
  language: string
): Record<string, unknown> => ({
  ...etendoContext,
  IsSelectorItem: "true",
  _requestType: "Window",
  _noActiveFilter: "true",
  language,
  targetProperty: field.hqlName || field.columnName,
  columnName: field.column?.dBColumnName || field.columnName,
});

export const applySelectorSafeParams = (params: Record<string, unknown>, selector: Record<string, unknown>): void => {
  for (const param of SELECTOR_SAFE_PARAMS) {
    if (param === "_extraProperties") continue;
    if (selector[param] !== undefined && selector[param] !== null) {
      params[param] = selector[param];
    }
  }
};

export const applyTabContextParams = (
  params: Record<string, unknown>,
  currentTab: Tab,
  formValues: Record<string, unknown>
): void => {
  params.windowId = currentTab.window;
  params.inpwindowId = currentTab.window;
  params.inpTabId = currentTab.id;
  params.adTabId = currentTab.id;

  for (const tabField of Object.values(currentTab.fields)) {
    const f = tabField as unknown as Record<string, unknown>;
    if (f.inputName) {
      const val = formValues[f.hqlName as string] ?? formValues[f.inputName as string] ?? formValues[f.id as string];
      if (val !== undefined && val !== null) {
        params[f.inputName as string] = String(val);
      }
    }
  }

  if (params.inpadOrgId && !params._org) {
    params._org = params.inpadOrgId;
  }
};

export const buildSelectorDefaultContext = (
  formValues: Record<string, unknown>,
  currentTab: { id: string; window: string; table?: string; fields: Record<string, unknown> } | null,
  session: Record<string, unknown> | null
): Record<string, unknown> => {
  const context: Record<string, unknown> = {};

  if (currentTab?.fields) {
    for (const tabField of Object.values(currentTab.fields)) {
      const f = tabField as Record<string, unknown>;
      if (f.inputName) {
        const val = formValues[f.hqlName as string] ?? formValues[f.inputName as string] ?? formValues[f.id as string];
        context[f.inputName as string] = val === "" || val === undefined ? null : val;
      }
    }
  }

  if (currentTab) {
    context.inpTabId = currentTab.id;
    context.inpwindowId = currentTab.window;
    context.inpTableId = currentTab.table;
  }

  if (session) {
    for (const [key, value] of Object.entries(session)) {
      if (!(key in context)) {
        context[key] = value === "" ? null : value;
      }
    }
  }

  context._isFilterByIdSupported = true;

  return context;
};
