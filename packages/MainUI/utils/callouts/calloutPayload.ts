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

// Callout (FIC MODE=CHANGE) payload pieces shared by the form view and the grid's inline editing.

// Build _gridVisibleProperties so that the FIC in CHANGE mode can identify
// property fields and compute their values from DB when a related FK field
// changes (e.g. selecting a new "file" populates the read-only "Type" field).
// Classic always sends this list in callout payloads.
export const buildGridVisibleProperties = (tab: { fields: Record<string, Field> }) =>
  Object.values(tab.fields)
    .filter((f) => f.displayed && f.columnName)
    .flatMap((f) => {
      const propertyPath = f.column?.propertyPath;
      if (propertyPath) {
        return [f.columnName, propertyPath.replace(/\./g, "$")];
      }
      return [f.columnName];
    });

// Populate callout inputs from selector out-fields metadata.
// For type "calloutInput": append the suffix to the field's inputName so the
// backend callout receives the hidden input (e.g. inpmProductId_CURR).
// For type "field": directly set the target form field value from the selected record.
export const applyOutFields = (
  field: Field,
  optionData: Record<string, unknown> | undefined,
  calloutData: Record<string, any>,
  setValue: (name: string, value: unknown, options?: { shouldDirty: boolean }) => void
) => {
  const outFields = field.selector?.outFields;
  if (!outFields?.length || !optionData) return;

  for (const outField of outFields) {
    const rawValue = optionData[outField.selectorFieldProperty];
    if (outField.type === "calloutInput" && outField.suffix) {
      calloutData[`${field.inputName}${outField.suffix}`] = String(rawValue ?? "");
    } else if (outField.type === "field" && outField.targetHqlName) {
      const val = rawValue ?? "";
      setValue(outField.targetHqlName, val, { shouldDirty: false });
      const identifierKey = `${outField.selectorFieldProperty}$_identifier`;
      if (optionData[identifierKey]) {
        setValue(`${outField.targetHqlName}$_identifier`, optionData[identifierKey], { shouldDirty: false });
      }
    }
  }
};
