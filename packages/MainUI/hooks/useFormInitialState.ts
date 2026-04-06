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

import { useTabContext } from "@/contexts/tab";
import type {
  EntityData,
  EntityValue,
  Field,
  FormInitializationResponse,
  Tab,
} from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { useMemo } from "react";
import { FieldName } from "./types";
import useFormParent from "./useFormParent";

type ColumnValueEntry = FormInitializationResponse["columnValues"][string];
type FieldMap = Record<string, Field>;

/**
 * Converts a FIC boolean string value to a JS boolean.
 * Etendo encodes YES_NO (reference "20") columns as "" for false and "Y" for true.
 * Returns the original string unchanged for non-boolean fields.
 */
function toBooleanEntityValue(value: string, field: Field | undefined): EntityValue {
  if (field?.column?.reference !== FIELD_REFERENCE_CODES.BOOLEAN.id) return value;
  if (value === "" || value === "false") return false;
  if (value === "Y" || value === "true") return true;
  return value;
}

/**
 * Writes auxiliary input values into the accumulator, remapping keys to hqlName when possible.
 */
function applyAuxiliaryInputs(
  acc: EntityData,
  auxiliaryInputValues: FormInitializationResponse["auxiliaryInputValues"],
  fieldsByColumnName: FieldMap
): void {
  for (const [key, { value }] of Object.entries(auxiliaryInputValues || {})) {
    const newKey = fieldsByColumnName[key]?.hqlName ?? key;
    acc[newKey] = value;
  }
}

/**
 * Writes a single column value entry (value, identifier, entries) into the accumulator.
 */
function applyColumnValueEntry(
  acc: EntityData,
  newKey: string,
  entry: ColumnValueEntry,
  field: Field | undefined
): void {
  acc[newKey] = toBooleanEntityValue(entry.value, field);

  if (entry.entries) {
    acc[`${newKey}$_entries`] = entry.entries.map((e) => ({
      id: e.id,
      label: e._identifier,
    })) as unknown as EntityValue;
  }

  // Always set the identifier key — even when empty — so a previously set identifier
  // is cleared when the server returns null/empty for a field.
  acc[`${newKey}$_identifier`] = entry.identifier ?? "";
}

/**
 * Writes all FIC column values into the accumulator, resolving field keys to hqlName.
 * Primary lookup: by columnName. Secondary: by stripped inputName for property fields
 * whose FIC key is "_propertyField_*" rather than the plain columnName.
 */
function applyColumnValues(
  acc: EntityData,
  columnValues: FormInitializationResponse["columnValues"],
  fieldsByColumnName: FieldMap,
  fieldsByPropertyFieldKey: FieldMap
): void {
  for (const [key, entry] of Object.entries(columnValues || {})) {
    const field = fieldsByColumnName[key] ?? fieldsByPropertyFieldKey[key];
    const newKey = field?.hqlName ?? key;
    applyColumnValueEntry(acc, newKey, entry, field);
  }
}

/**
 * Second pass: resolves @ColumnName@ default references for fields that came back
 * empty from the FIC. The backend cannot resolve cross-field references like
 * @DateInvoiced@ for NEW records because the payload carries no record data.
 * By this point acc already contains all FIC-resolved values, so the referenced
 * field's value is available to fill the empty slot.
 */
function resolveDefaultReferences(acc: EntityData, fields: Tab["fields"], fieldsByColumnName: FieldMap): void {
  for (const field of Object.values(fields)) {
    if (!field?.column?.defaultValue || !field.hqlName) continue;

    const match = /^@(\w+)@$/.exec(field.column.defaultValue);
    if (!match) continue;

    const currentValue = acc[field.hqlName];
    if (currentValue !== undefined && currentValue !== "") continue;

    const referencedField = fieldsByColumnName[match[1]];
    if (!referencedField?.hqlName) continue;

    const referencedValue = acc[referencedField.hqlName];
    if (referencedValue !== undefined && referencedValue !== "") {
      acc[field.hqlName] = referencedValue;
    }
  }
}

export const useFormInitialState = (formInitialization?: FormInitializationResponse | null) => {
  const { tab } = useTabContext();
  const parentData = useFormParent(FieldName.HQL_NAME);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  // Build a secondary lookup for property fields using the FIC response key format.
  // The FIC returns property field values in columnValues under the key
  // `_propertyField_{propertyPath}_{columnName}`, which is the field's `inputName`
  // with the leading "inp" stripped (e.g. "inp_propertyField_type_Type" → "_propertyField_type_Type").
  const fieldsByPropertyFieldKey = useMemo(() => {
    if (!tab?.fields) return {} as FieldMap;
    return Object.values(tab?.fields).reduce((acc, field) => {
      if (field.column?.propertyPath && field.inputName) {
        acc[field.inputName.replace(/^inp/, "")] = field;
      }
      return acc;
    }, {} as FieldMap);
  }, [tab?.fields]);

  const initialState = useMemo(() => {
    if (!formInitialization) return null;

    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    applyAuxiliaryInputs(acc, formInitialization.auxiliaryInputValues, fieldsByColumnName);
    applyColumnValues(acc, formInitialization.columnValues, fieldsByColumnName, fieldsByPropertyFieldKey);
    resolveDefaultReferences(acc, tab.fields, fieldsByColumnName);

    return { ...parentData, ...acc };
  }, [fieldsByColumnName, fieldsByPropertyFieldKey, formInitialization, parentData, tab?.fields]);

  return initialState;
};
