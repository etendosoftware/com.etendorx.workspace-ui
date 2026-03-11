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

import type { Field } from "@workspaceui/api-client/src/api/types";
import type { FieldValues, UseFormSetValue } from "react-hook-form";

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
