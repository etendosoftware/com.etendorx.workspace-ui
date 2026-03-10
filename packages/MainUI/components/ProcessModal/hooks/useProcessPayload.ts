/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview useProcessPayload — hook that encapsulates all process payload
 * building logic: form value mapping, grid preparation, record ID extraction,
 * and per-process/per-window context field injection.
 */

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { convertToISODateFormat } from "@/utils/process/processDefaultsUtils";
import { mapKeysWithDefaults } from "@/utils/processes/manual/utils";
import {
  PROCESS_DEFINITION_DATA,
  WINDOW_SPECIFIC_KEYS,
  ADD_PAYMENT_ORDER_PROCESS_ID,
} from "@/utils/processes/definition/constants";
import type { ProcessParameter, EntityData } from "@workspaceui/api-client/src/api/types";
import type { GridSelectionStructure } from "../ProcessDefinitionModal";

// ---------------------------------------------------------------------------
// Date-field helpers (module-level, no closure state needed)
// ---------------------------------------------------------------------------

const DATE_REFERENCE_CODES = [
  FIELD_REFERENCE_CODES.DATE.id,
  FIELD_REFERENCE_CODES.DATETIME.id,
  FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id,
];

const NULLABLE_REFERENCES = [
  FIELD_REFERENCE_CODES.INTEGER.id,
  FIELD_REFERENCE_CODES.NUMERIC.id,
  FIELD_REFERENCE_CODES.QUANTITY_22.id,
  FIELD_REFERENCE_CODES.QUANTITY_29.id,
  FIELD_REFERENCE_CODES.DECIMAL.id,
  FIELD_REFERENCE_CODES.RATE.id,
  FIELD_REFERENCE_CODES.LIST_13.id,
  FIELD_REFERENCE_CODES.LIST_17.id,
  FIELD_REFERENCE_CODES.TABLE_DIR_18.id,
  FIELD_REFERENCE_CODES.TABLE_DIR_19.id,
  FIELD_REFERENCE_CODES.PRODUCT.id,
  FIELD_REFERENCE_CODES.SELECTOR.id,
  FIELD_REFERENCE_CODES.WINDOW.id,
  FIELD_REFERENCE_CODES.LOCATION_21.id,
  FIELD_REFERENCE_CODES.SELECT_30.id,
];

export const isDateReference = (reference: string): boolean =>
  DATE_REFERENCE_CODES.includes(reference as (typeof DATE_REFERENCE_CODES)[number]) ||
  reference.toLowerCase().includes("date") ||
  reference.toLowerCase().includes("time");

const shouldConvertEmptyToNull = (reference: string): boolean =>
  isDateReference(reference) || NULLABLE_REFERENCES.includes(reference as (typeof NULLABLE_REFERENCES)[number]);

const convertDateFieldValue = (fieldValue: unknown): unknown => {
  if (!fieldValue || typeof fieldValue !== "string") return fieldValue;
  const originalValue = String(fieldValue);
  const convertedValue = convertToISODateFormat(originalValue);
  return convertedValue !== originalValue ? convertedValue : fieldValue;
};

export const convertParameterDateFields = (combined: Record<string, unknown>, param: ProcessParameter): void => {
  if (combined[param.name]) {
    combined[param.name] = convertDateFieldValue(combined[param.name]);
  }
  if (param.dBColumnName && param.dBColumnName !== param.name && combined[param.dBColumnName]) {
    combined[param.dBColumnName] = convertDateFieldValue(combined[param.dBColumnName]);
  }
};

// ---------------------------------------------------------------------------
// Hook params / return types
// ---------------------------------------------------------------------------

export interface UseProcessPayloadParams {
  form: UseFormReturn<any>;
  parameters: Record<string, ProcessParameter>;
  gridSelection: GridSelectionStructure;
  record: EntityData | undefined;
  recordValues: Record<string, unknown> | undefined;
  processId: string;
  selectedRecords: EntityData[];
}

export interface UseProcessPayloadReturn {
  getMappedFormValues: () => Record<string, any>;
  resolveDocAction: (formValues: Record<string, any>) => void;
  getPopulatedGrids: () => GridSelectionStructure;
  getMergedProcessValues: (extraValues?: Record<string, any>) => Record<string, any>;
  buildProcessSpecificFields: (processId: string) => Record<string, unknown>;
  buildWindowSpecificFields: (windowId: string | number) => Record<string, unknown>;
  getRecordIds: () => string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProcessPayload({
  form,
  parameters,
  gridSelection,
  record,
  recordValues,
  processId,
  selectedRecords,
}: UseProcessPayloadParams): UseProcessPayloadReturn {
  const getMappedFormValues = useCallback(() => {
    const rawValues = form.getValues();
    const mappedValues: Record<string, any> = {};

    for (const p of Object.values(parameters)) {
      if (!p.name) continue;

      let val = rawValues[p.name];
      if (val === undefined && p.dBColumnName) {
        val = rawValues[p.dBColumnName];
      }

      if (val === "" && p.reference && shouldConvertEmptyToNull(p.reference)) {
        val = null;
      }

      // targetKey is always defined: p.name is guaranteed truthy by the `continue` above
      const targetKey = p.dBColumnName || p.name;
      mappedValues[targetKey] = val !== undefined ? val : null;

      const identifierKey = `${p.name}$_identifier`;
      if (rawValues[identifierKey] !== undefined) {
        mappedValues[`${targetKey}$_identifier`] = rawValues[identifierKey];
      }
    }

    return mappedValues;
  }, [form, parameters]);

  const resolveDocAction = useCallback(
    (formValues: Record<string, any>) => {
      const docActionParam = Object.values(parameters).find(
        (p) => p.name === "DocAction" || p.dBColumnName === "DocAction"
      );
      if (docActionParam && formValues[docActionParam.name]) {
        formValues.DocAction = formValues[docActionParam.name];
      }
    },
    [parameters]
  );

  const getPopulatedGrids = useCallback((): GridSelectionStructure => {
    const populated: GridSelectionStructure = {};
    for (const [gridName, gridData] of Object.entries(gridSelection)) {
      if (gridData._selection && gridData._selection.length > 0) {
        populated[gridName] = gridData;
      } else {
        populated[gridName] = {
          _selection: [],
          _allRows: gridData._allRows || [],
        };
      }
    }
    return populated;
  }, [gridSelection]);

  const getMergedProcessValues = useCallback(
    (extraValues: Record<string, any> = {}) => {
      const populatedGrids = getPopulatedGrids();
      const isAddPayment = processId === ADD_PAYMENT_ORDER_PROCESS_ID;

      if (isAddPayment) {
        return mapKeysWithDefaults({ ...form.getValues(), ...populatedGrids });
      }

      const formValues = getMappedFormValues();
      resolveDocAction(formValues);

      return mapKeysWithDefaults({
        ...extraValues,
        ...formValues,
        ...populatedGrids,
      });
    },
    [processId, form, getPopulatedGrids, getMappedFormValues, resolveDocAction]
  );

  const buildProcessSpecificFields = useCallback(
    (pid: string): Record<string, unknown> => {
      const currentAttrs = PROCESS_DEFINITION_DATA[pid as keyof typeof PROCESS_DEFINITION_DATA];
      if (!currentAttrs || !recordValues) return {};

      let currentRecordValue = recordValues[currentAttrs.inpPrimaryKeyColumnId];

      if (currentRecordValue === undefined && currentAttrs.inpColumnId) {
        currentRecordValue = recordValues[currentAttrs.inpColumnId];
      }
      if (currentRecordValue === undefined && record?.id) {
        currentRecordValue = record.id;
      }

      const fields: Record<string, unknown> = {
        [currentAttrs.inpColumnId]: currentRecordValue,
        [currentAttrs.inpPrimaryKeyColumnId]: currentRecordValue,
      };

      if (currentAttrs.additionalPayloadFields) {
        for (const fieldName of currentAttrs.additionalPayloadFields) {
          if (recordValues[fieldName] !== undefined) {
            fields[fieldName] = recordValues[fieldName];
          }
        }
      }

      return fields;
    },
    [recordValues, record]
  );

  const buildWindowSpecificFields = useCallback(
    (windowId: string | number): Record<string, unknown> => {
      const windowSpecificKey = WINDOW_SPECIFIC_KEYS[windowId as string];
      if (!windowSpecificKey) return {};
      return { [windowSpecificKey.key]: windowSpecificKey.value(record) };
    },
    [record]
  );

  const getRecordIds = useCallback(() => {
    if (selectedRecords && selectedRecords.length > 0) {
      return selectedRecords.map((r) => String(r.id));
    }
    return record?.id ? [String(record.id)] : [];
  }, [selectedRecords, record]);

  return {
    getMappedFormValues,
    resolveDocAction,
    getPopulatedGrids,
    getMergedProcessValues,
    buildProcessSpecificFields,
    buildWindowSpecificFields,
    getRecordIds,
  };
}
