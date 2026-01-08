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

import { memo, useCallback } from "react";
import { CellEditorFactory } from "../Table/CellEditors";
import { getFieldReference } from "@/utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useWindowReferenceGridContext } from "./WindowReferenceGridContext";
import { useTranslation } from "@/hooks/useTranslation";

// Helper functions extracted to avoid recreation
// biome-ignore lint/suspicious/noExplicitAny: Dynamic payload structure from datasource API
const applyParameters = (payload: any, parameters: any, effectiveRecordValues: any) => {
  if (parameters) {
    // biome-ignore lint/complexity/noForEach: Simple iteration over parameters map
    Object.values(parameters).forEach((param: any) => {
      const paramValue = effectiveRecordValues?.[param.name];
      if (paramValue !== undefined && paramValue !== null && param.dBColumnName) {
        payload[param.dBColumnName] = paramValue;
      }
    });
  }
};

const applySelectorConfig = (payload: any, isSelector: boolean, field: any, selectorId: string | undefined) => {
  if (isSelector) {
    payload._noCount = "true";
    if (field.selector) {
      const selectorProps = [
        "filterClass",
        "_selectedProperties",
        "_selectorDefinitionId",
        "_extraProperties",
        "_sortBy",
      ];
      selectorProps.forEach((prop) => {
        if (field.selector[prop]) payload[prop] = field.selector[prop];
      });
    } else if (selectorId) {
      payload._selectorDefinitionId = selectorId;
    }
  } else {
    payload._textMatchStyle = "substring";
  }
};

const constructPayload = (
  field: any,
  tabId: string | undefined,
  effectiveRecordValues: any,
  session: any,
  parameters: any,
  isSelector: boolean,
  selectorId: string | undefined
) => {
  const payload: any = {
    _startRow: "0",
    _endRow: "75",
    _operationType: "fetch",
    moduleId: field.module,
    windowId: tabId,
    tabId: field.tab || tabId,
    inpTabId: field.tab || tabId,
    inpwindowId: tabId,
    inpTableId: field.column?.table,
    initiatorField: field.hqlName,
    _constructor: "AdvancedCriteria",
    _OrExpression: "true",
    operator: "or",
    _org: effectiveRecordValues?.inpadOrgId || session.adOrgId,
    inpPickAndExecuteTableId: effectiveRecordValues?.inpTableId,
    ...effectiveRecordValues,
  };

  applyParameters(payload, parameters, effectiveRecordValues);
  applySelectorConfig(payload, isSelector, field, selectorId);

  return payload;
};

const fetchOptionsFromDatasource = async (apiUrl: string, payload: any, searchQuery?: string) => {
  const params = new URLSearchParams();

  Object.keys(payload).forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null && typeof payload[key] !== "object") {
      params.append(key, String(payload[key]));
    }
  });

  const criteria: any[] = [];
  if (searchQuery) {
    criteria.push({
      fieldName: "name",
      operator: "iContains",
      value: searchQuery,
    });
  }

  if (criteria.length > 0) {
    params.append(
      "criteria",
      JSON.stringify({
        fieldName: "_dummy",
        operator: "equals",
        value: new Date().getTime(),
        _constructor: "AdvancedCriteria",
        criteria: criteria,
      })
    );
  }

  if (searchQuery) {
    params.append("_sortBy", "_identifier");
  }

  const fullUrl = `${apiUrl}?${params.toString()}`;
  const response = await datasource.client.request(fullUrl, { method: "GET" });
  return response.data;
};

const mapResponseToOptions = (data: any) => {
  const responseData = data.response?.data || data.data || [];
  return responseData.map((item: any) => ({
    id: item.id,
    value: item.id,
    label: item._identifier || item.name || item.id,
    ...item,
  }));
};

export interface GridCellEditorProps {
  cell: any;
  row: any;
  col: any;
  fields: any[];
  onRecordChange?: (row: any, changes: any) => void;
  // biome-ignore lint/suspicious/noExplicitAny: validation object
  validationError?: any;
}

/**
 * Optimized Grid Cell Editor component
 * Uses context for shared grid data and refs for dynamic data to prevent unnecessary re-renders
 */
const GridCellEditorBase = ({ cell, row, col, fields, onRecordChange, validationError }: GridCellEditorProps) => {
  const { effectiveRecordValuesRef, parametersRef, tabId, session } = useWindowReferenceGridContext();
  const { t } = useTranslation();

  // Find matched field definition
  const matchingField =
    fields.find((f) => f.name === col.header) ||
    fields.find((f) => f.columnName === col.columnName) ||
    (col.columnName.endsWith("_ID") ? fields.find((f) => f.columnName === col.columnName) : undefined);

  if (!matchingField) {
    return null;
  }

  // Resolve reference code
  const reference = matchingField.column?.reference || (matchingField as any).reference;
  const fieldType = getFieldReference(reference);

  const handleChange = useCallback(
    (newValue: any, selectedOption?: any) => {
      row.original[col.columnName] = newValue;

      // Identifier update logic for TableDir/Search
      if (
        selectedOption &&
        (fieldType === FieldType.TABLEDIR ||
          fieldType === FieldType.SEARCH ||
          reference === FIELD_REFERENCE_CODES.PRODUCT ||
          reference === FIELD_REFERENCE_CODES.SELECTOR)
      ) {
        const identifierKey = `${col.columnName}$_identifier`;
        row.original[identifierKey] = selectedOption.label || selectedOption._identifier;
      }

      // Notify parent of change
      if (onRecordChange) {
        onRecordChange(row, {
          [col.columnName]: newValue,
          ...(selectedOption
            ? { [`${col.columnName}$_identifier`]: selectedOption.label || selectedOption._identifier }
            : {}),
        });
      }

      cell.row._valuesCache[cell.column.id] = newValue;
    },
    [col.columnName, fieldType, reference, onRecordChange, cell.column.id, cell.row._valuesCache, row]
  );

  const loadOptions = useCallback(
    async (field: any, searchQuery?: string) => {
      try {
        const fieldRef = field.column?.reference || field.reference;
        const isSelector = fieldRef === FIELD_REFERENCE_CODES.SELECTOR || fieldRef === FIELD_REFERENCE_CODES.PRODUCT;
        const selectorId = field.selector?._selectorDefinitionId;
        const datasourceName = field.selector?.datasourceName;

        const apiUrl = datasourceName
          ? `/api/datasource/${datasourceName}`
          : `/sws/com.etendorx.das.legacy.utils/datasource/${field.columnName || field.name}`;

        const payload = constructPayload(
          field,
          tabId,
          effectiveRecordValuesRef.current,
          session,
          parametersRef.current,
          isSelector,
          selectorId
        );

        const data = await fetchOptionsFromDatasource(apiUrl, payload, searchQuery);
        return mapResponseToOptions(data);
      } catch (e) {
        console.error("Error loading options", e);
        return [];
      }
    },
    [tabId, session]
  );

  // Generate unique IDs for accessibility
  const fieldId = `grid-cell-${row.id}-${col.columnName}`;
  
  // Validation state
  const hasError = !!validationError;
  const rawErrorMessage = validationError?.message;
  const errorMessage = rawErrorMessage ? t(rawErrorMessage) : undefined;

  return (
    <div className="w-full min-w-[200px]" title={errorMessage}>
      <CellEditorFactory
        fieldType={fieldType}
        value={cell.getValue()}
        onChange={handleChange}
        field={{ ...matchingField, type: fieldType }}
        rowId={row.id}
        columnId={cell.column.id}
        loadOptions={loadOptions}
        disabled={false}
        hasError={hasError}
        onBlur={() => {}}
        id={fieldId}
        name={col.columnName}
        data-testid={`grid-cell-editor-${col.columnName}`}
      />
      {hasError && <div className="text-xs text-red-500 mt-1">{errorMessage}</div>}
    </div>
  );
};

/**
 * Memoized version of GridCellEditor
 * Only re-renders when cell value or row/column identity changes
 * Context values (effectiveRecordValues, parameters) are handled via refs internally
 * 
 * We also compare validationError to trigger re-render on new errors
 */
export const GridCellEditor = memo(GridCellEditorBase, (prevProps, nextProps) => {
  return (
    prevProps.cell.getValue() === nextProps.cell.getValue() &&
    prevProps.row.id === nextProps.row.id &&
    prevProps.col.columnName === nextProps.col.columnName &&
    prevProps.validationError === nextProps.validationError // Important! Re-render if validation status changes
  );
});

GridCellEditor.displayName = "GridCellEditor";
