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

import {
  type EntityData,
  type Field,
  FieldType,
  FormMode,
  type Tab,
  type WindowMetadata,
} from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "./form/constants";

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getFieldReference = (reference?: string): FieldType => {
  switch (reference) {
    case "10":
      return FieldType.DATETIME;
    case FIELD_REFERENCE_CODES.TABLE_DIR_19:
    case FIELD_REFERENCE_CODES.PRODUCT:
    case FIELD_REFERENCE_CODES.TABLE_DIR_18:
      return FieldType.TABLEDIR;
    case FIELD_REFERENCE_CODES.DATE:
    case FIELD_REFERENCE_CODES.DATETIME:
      return FieldType.DATE;
    case FIELD_REFERENCE_CODES.BOOLEAN:
      return FieldType.BOOLEAN;
    case FIELD_REFERENCE_CODES.INTEGER:
    case FIELD_REFERENCE_CODES.NUMERIC:
    case FIELD_REFERENCE_CODES.DECIMAL:
      return FieldType.NUMBER;
    case FIELD_REFERENCE_CODES.QUANTITY_22:
    case FIELD_REFERENCE_CODES.QUANTITY_29:
      return FieldType.QUANTITY;
    case FIELD_REFERENCE_CODES.LIST_17:
    case FIELD_REFERENCE_CODES.LIST_13:
      return FieldType.LIST;
    case "28":
      return FieldType.BUTTON;
    case FIELD_REFERENCE_CODES.SELECT_30:
      return FieldType.SELECT;
    case FIELD_REFERENCE_CODES.WINDOW:
      return FieldType.WINDOW;
    default:
      return FieldType.TEXT;
  }
};

export const sanitizeValue = (value: unknown, field?: Field) => {
  const reference = getFieldReference(field?.column?.reference);

  // Special handling for known numeric fields by name
  if (field?.inputName === "consumptionDays" || field?.name === "consumptionDays") {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  }

  if (reference === FieldType.DATE) {
    return value ? String(value).split("-").toReversed().join("-") : null;
  }

  if (reference === FieldType.QUANTITY || reference === FieldType.NUMBER) {
    // For numeric fields, preserve numeric values
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  }

  const stringValue = String(value);

  const valueMap = {
    true: "Y",
    false: "N",
    null: null,
  } as const;

  const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
    ? valueMap[stringValue as keyof typeof valueMap]
    : value;

  return safeValue;
};

export const buildPayloadByInputName = (values?: Record<string, unknown> | null, fields?: Record<string, Field>) => {
  if (!values) return null;

  return Object.entries(values).reduce(
    (acc, [key, value]) => {
      const field = fields?.[key];
      const newKey = field?.inputName ?? key;

      // Special handling for known numeric fields when field metadata is not available
      if (!field && (key === "consumptionDays" || newKey === "consumptionDays")) {
        if (value === null || value === undefined || value === "") {
          acc[newKey] = null;
        } else {
          const numericValue = Number(value);
          acc[newKey] = Number.isNaN(numericValue) ? value : numericValue;
        }
      } else {
        acc[newKey] = sanitizeValue(value, field);
      }

      return acc;
    },
    {} as Record<string, unknown>
  );
};

export const parseDynamicExpression = (expr: string) => {
  // Transform @field_name@ syntax to valid JavaScript references
  const expr0 = expr.replace(/@([a-zA-Z_]\w*)@/g, (_, fieldName) => {
    return `(currentValues["${fieldName}"] || context["${fieldName}"])`;
  });

  // Transform Etendo comparison operators to JavaScript
  // Convert single = to == for comparison (avoiding conflicts with assignment)
  const expr1 = expr0.replace(/([^=!<>])=([^=])/g, "$1==$2");

  const expr2 = expr1.replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
    return `${obj}["${prop}"]`;
  });

  const expr3 = expr2.replace(/context\.(\$?\w+)/g, (_, prop) => {
    return `context.${prop}`;
  });

  const expr4 = expr3.replace(/context\[\s*(['"])([^"'\]]+)\1\s*\]/g, (_, quote, prop) => {
    return `context[${quote}${prop}${quote}]`;
  });

  const expr5 = expr4.replace(/context\[\s*(['"])(.*?)\1\s*\]/g, (_, quote, key) => {
    return `context[${quote}${key}${quote}]`;
  });

  return expr5;
};

export const buildQueryString = ({
  mode,
  windowMetadata,
  tab,
}: {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
}) =>
  new URLSearchParams({
    windowId: String(windowMetadata?.id || ""),
    tabId: String(tab.id),
    moduleId: String(tab.module),
    _operationType: mode === FormMode.NEW ? "add" : "update",
    _noActiveFilter: String(true),
    sendOriginalIDBack: String(true),
    _extraProperties: "",
    Constants_FIELDSEPARATOR: "$",
    _className: "OBViewDataSource",
    Constants_IDENTIFIER: "_identifier",
    isc_dataFormat: "json",
  });

export const buildFormPayload = ({
  values,
  oldValues,
  mode,
  csrfToken,
}: {
  values: EntityData;
  oldValues?: EntityData;
  mode: FormMode;
  csrfToken: string;
}) => {
  // Fields that should be excluded from the payload
  const auditFields = ["creationDate", "createdBy", "updated", "updatedBy"];

  const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
    if (!auditFields.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as EntityData);

  const payload: any = {
    dataSource: "isc_OBViewDataSource_0",
    operationType: mode === FormMode.NEW ? "add" : "update",
    componentId: "isc_OBViewForm_0",
    data: {
      accountingDate: new Date(),
      ...filteredValues,
    },
    csrfToken,
  };

  if (mode !== FormMode.NEW && oldValues) {
    const filteredOldValues = Object.entries(oldValues).reduce((acc, [key, value]) => {
      if (!auditFields.includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {} as EntityData);

    payload.oldValues = filteredOldValues;
  }

  return payload;
};

export const formatNumber = (value: number) => new Intl.NumberFormat(navigator.language).format(value);

export const formatTime = (input: string | Date): string => {
  const date = typeof input === "string" ? new Date(input) : input;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = hours < 10 ? `0${hours}` : hours.toString();
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();

  return `${hoursStr}:${minutesStr}`;
};

export const getMessageType = (sender: string) => {
  if (sender === "error") {
    return "error";
  }
  if (sender === "user") {
    return "right-user";
  }
  return "left-user";
};

export const formatLabel = (label: string, count?: number): string | undefined => {
  if (label.includes("%s") && count !== undefined) {
    return label.replace("%s", String(count));
  }
  return undefined;
};

export const buildProcessPayload = (
  record: Record<string, unknown>,
  tab: Tab,
  processDefaults: Record<string, unknown> = {},
  userInput: Record<string, unknown> = {}
) => {
  // Base record values with input name mapping
  const recordValues = buildPayloadByInputName(record, tab.fields);

  // System context fields that are needed for process execution
  const systemContext = {
    // Window/Tab metadata
    [`inp${tab.entityName?.replace(/^C_/, "")?.toLowerCase() || "record"}Id`]: record.id,
    inpTabId: String(tab.id),
    inpwindowId: String(tab.window),
    inpTableId: String(tab.table),
    inpkeyColumnId: `${tab.entityName}_ID`, // Use entityName + "_ID" pattern instead of keyColumn
    keyProperty: "id",
    inpKeyName: `inp${tab.entityName}_ID`, // Use entityName + "_ID" pattern
    keyColumnName: `${tab.entityName}_ID`, // Use entityName + "_ID" pattern
    keyPropertyType: "_id_13",

    // Process execution fields
    PromotionsDefined: "N",
    IsReversalDocument: "N",
    DOCBASETYPE: record.docBaseType || "",
    VoidAutomaticallyCreated: 0,
    FinancialManagement: "Y",
    _ShowAcct: "Y",

    // Accounting dimension display logic
    ACCT_DIMENSION_DISPLAY: "",
    $IsAcctDimCentrally: "Y",

    // Element context fields (these come from accounting configuration)
    $Element_BP: record.cBpartnerId ? "Y" : "",
    $Element_OO: record.adOrgId ? "Y" : "",
    $Element_PJ: record.cProjectId ? "Y" : "",
    $Element_CC: record.cCostcenterId ? "Y" : "",
    $Element_MC: record.mCostcenterId ? "Y" : "",
    $Element_U1: record.user1Id ? "Y" : "",
    $Element_U2: record.user2Id ? "Y" : "",

    // Document-specific element visibility
    $Element_BP_ARI_H: "Y",
    $Element_OO_ARI_H: "Y",
    $Element_PJ_ARI_H: "Y",
    $Element_CC_ARI_H: "",
    $Element_U1_ARI_H: "N",
    $Element_U2_ARI_H: "N",
  };

  // Combine all payload parts
  return {
    ...recordValues, // Record data with proper input names
    ...systemContext, // System context and metadata
    ...processDefaults, // Process defaults from server
    ...userInput, // User input from form
  };
};

/**
 * Builds a query string for single record deletion operations in the Etendo ERP system.
 * This function creates the necessary URL parameters required by the OBViewDataSource
 * to perform a delete operation on a specific record within a tab context.
 *
 * @param {Object} params - The parameters object for building the delete query string
 * @param {WindowMetadata} [params.windowMetadata] - Optional window metadata containing window information
 * @param {Tab} params.tab - The tab object containing tab configuration and metadata
 * @param {string} params.recordId - The unique identifier of the record to be deleted
 * @returns {URLSearchParams} A URLSearchParams object containing all necessary parameters for the delete operation
 *
 * @example
 * // Delete a business partner record
 * const deleteParams = buildSingleDeleteQueryString({
 *   windowMetadata: { id: '123' },
 *   tab: { id: '456', module: '0', window: '123' },
 *   recordId: 'C_BPartner_789'
 * });
 *
 * @example
 * // Delete without window metadata (uses tab.window fallback)
 * const deleteParams = buildSingleDeleteQueryString({
 *   tab: { id: '456', module: '0', window: '123' },
 *   recordId: 'C_Invoice_ABC123'
 * });
 */
export const buildSingleDeleteQueryString = ({
  windowMetadata,
  tab,
  recordId,
}: {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  recordId: string;
}) =>
  new URLSearchParams({
    windowId: String(windowMetadata?.id || tab.window || ""),
    tabId: String(tab.id),
    moduleId: String(tab.module || "0"),
    _operationType: "remove",
    _noActiveFilter: "true",
    sendOriginalIDBack: "true",
    _extraProperties: "",
    Constants_FIELDSEPARATOR: "$",
    _className: "OBViewDataSource",
    Constants_IDENTIFIER: "_identifier",
    id: recordId,
    _textMatchStyle: "substring",
    _componentId: "isc_OBViewGrid_0",
    _dataSource: "isc_OBViewDataSource_0",
    isc_metaDataPrefix: "_",
    isc_dataFormat: "json",
  });

export const buildDeletePayload = ({
  recordId,
  csrfToken,
}: {
  recordId: string;
  csrfToken: string;
}) => ({
  dataSource: "isc_OBViewDataSource_0",
  operationType: "remove",
  componentId: "isc_OBViewGrid_0",
  data: { id: recordId },
  csrfToken,
});

export const buildRequestOptions = (
  values: EntityData,
  initialState: EntityData,
  mode: FormMode,
  userId: string,
  signal: AbortSignal
) => ({
  signal,
  method: "POST",
  body: buildFormPayload({ values, oldValues: initialState, mode, csrfToken: userId }),
});
export { shouldShowTab, type TabWithParentInfo } from "./tabUtils";
