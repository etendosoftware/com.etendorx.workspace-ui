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

import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { DatasourceOptions, Field, Tab } from "@workspaceui/api-client/src/api/types";
import type { TableState } from "@/utils/window/constants";
import { isGridRenderableColumn, sortFieldsByGridOrder } from "@/utils/table/utils";
import { logger } from "@/utils/logger";

/** Format Classic's datasource writes for the "Export to Spreadsheet" toolbar button. */
export const CSV_EXPORT_FORMAT = "csv";
export const CSV_FILE_NAME = "ExportedData.csv";
export const CSV_MIME_TYPE = "text/csv;charset=utf-8;";

const UNKNOWN_BACKEND_ERROR = "Unknown backend error";
const DEFAULT_FIELD_WIDTH = 200;
const NARROW_FIELD_WIDTH = 100;
const NARROW_FIELD_TYPES = new Set(["boolean", "date", "datetime", "number", "quantity"]);

/** UI-only grid columns that are not entity fields. */
const UI_ONLY_COLUMNS = ["_editLink", "mrt-row-select", "actions"];
/** Columns left out of the exported file: the UI-only ones plus the record id. */
const EXPORT_SKIP_COLUMNS = new Set(["id", ...UI_ONLY_COLUMNS]);
const VIEW_STATE_SKIP_COLUMNS = new Set(UI_ONLY_COLUMNS);

/**
 * Grid request params that only make sense for a page of the grid: paging, and the direct
 * navigation that positions that page on a record. Classic never sends them on an export, and
 * the server would otherwise cut the file to that page.
 */
const GRID_ONLY_PARAMS = [
  "pageSize",
  "startRow",
  "endRow",
  "_startRow",
  "_endRow",
  "targetRecordId",
  "directNavigation",
] as const;

export interface ExportField {
  name: string;
  visible?: boolean;
  frozen?: boolean;
  width?: number;
  autoFitWidth?: boolean;
}

export interface ExportSort {
  id: string;
  desc: boolean;
}

/**
 * Id of the grid column a field is shown in: its name, as the grid builds its columns
 * (`parseColumns`), or its label as a fallback. Column visibility and order are keyed by it.
 */
const getGridColumnId = (field: { name?: unknown; label?: unknown } | undefined): string | undefined => {
  if (typeof field?.name === "string") {
    return field.name;
  }
  if (typeof field?.label === "string") {
    return field.label;
  }
  return undefined;
};

/**
 * Keys of the tab fields the grid shows as columns, in the grid order: the Classic grid order
 * (`sortFieldsByGridOrder`) and then the order the user gave the columns, if any. Fields the grid
 * never renders (buttons, images) and the record id are left out, as Classic does.
 *
 * @param tabFields - Fields of the tab, keyed by property name
 * @param columnOrder - Column ids in the order the user left them (`TableState.order`)
 */
export const getExportFieldNames = (tabFields: Record<string, Field>, columnOrder: string[] = []): string[] => {
  const keyByField = new Map<Field, string>();
  for (const [key, field] of Object.entries(tabFields)) {
    if (!EXPORT_SKIP_COLUMNS.has(key) && isGridRenderableColumn(field)) {
      keyByField.set(field, key);
    }
  }

  // Columns the user did not place keep the grid order after the placed ones (stable sort)
  const userPositions = new Map(columnOrder.map((columnId, index) => [columnId, index]));
  const getUserPosition = (field: Field): number =>
    userPositions.get(getGridColumnId(field) ?? "") ?? userPositions.size;

  return sortFieldsByGridOrder([...keyByField.keys()])
    .toSorted((a, b) => getUserPosition(a) - getUserPosition(b))
    .map((field) => keyByField.get(field) as string);
};

/**
 * Builds field name visibility map by combining metadata defaults with user overrides
 */
export const buildFieldNameVisibility = (
  orderedFieldNames: string[],
  tableColumnVisibility: Record<string, boolean>,
  tabFields: Record<string, unknown>
): Record<string, boolean> => {
  const fieldNameVisibility: Record<string, boolean> = {};

  for (const fieldName of orderedFieldNames) {
    const field = tabFields[fieldName] as Record<string, unknown> | undefined;

    // Check if field has showInGridView property (initial visibility from metadata)
    let isVisible = field?.showInGridView !== false; // Default to visible

    // The visibility the user set on the grid column overrides the metadata one
    const columnId = getGridColumnId(field);
    if (columnId !== undefined && columnId in tableColumnVisibility) {
      isVisible = tableColumnVisibility[columnId] !== false;
    }

    fieldNameVisibility[fieldName] = isVisible;
  }

  return fieldNameVisibility;
};

/**
 * Builds field metadata array matching SmartClient format
 */
export const buildFieldsArray = (
  orderedFieldNames: string[],
  visibility: Record<string, boolean>,
  fields: Record<string, unknown> | undefined
): ExportField[] => {
  const fieldsArray: ExportField[] = [];

  for (const fieldName of orderedFieldNames) {
    if (VIEW_STATE_SKIP_COLUMNS.has(fieldName)) continue;

    const field = fields?.[fieldName] as Record<string, unknown> | undefined;
    const fieldType = field?.type as string | undefined;
    // Determine width based on field type
    const width = NARROW_FIELD_TYPES.has(fieldType || "") ? NARROW_FIELD_WIDTH : DEFAULT_FIELD_WIDTH;

    fieldsArray.push({
      name: fieldName,
      visible: visibility[fieldName] !== false,
      width,
      ...(fieldType === "boolean" ? { autoFitWidth: false } : {}),
    });
  }

  return fieldsArray;
};

const toSortDirection = (sort: ExportSort): string => (sort.desc ? "descending" : "ascending");

const buildSortJson = (sorting: ExportSort[]): string => {
  if (sorting.length === 0) {
    return "null";
  }
  return JSON.stringify({
    fieldName: sorting[0].id,
    sortDir: toSortDirection(sorting[0]),
    sortSpecifiers: sorting.map((sort) => ({ property: sort.id, direction: toSortDirection(sort) })),
  });
};

/**
 * Builds viewState string matching SmartClient format for Classic datasource.
 * Format: ({field:"[...]",sort:"(...))",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})
 * The server takes the exported columns, and their order, from `field`.
 */
export const buildViewState = (fieldsArray: ExportField[], sorting: ExportSort[]): string => {
  // Escape quotes properly for viewState parameter
  const escapedField = JSON.stringify(fieldsArray).replace(/"/g, '\\"');
  const escapedSort = buildSortJson(sorting).replace(/"/g, '\\"');

  return `({field:"${escapedField}",sort:"(${escapedSort})",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})`;
};

/**
 * Builds the export request from the params the grid loaded its data with, so the file holds the
 * same records in the same order: every criterion (parent, column filters, search, implicit and
 * advanced filters), the sort and the session context. Paging is dropped so, as in Classic, the
 * server exports every matching row.
 */
export const buildCsvExportParams = (
  gridParams: DatasourceOptions,
  { tabId, viewState }: { tabId: string; viewState: string }
): Record<string, unknown> => {
  const params: Record<string, unknown> = { ...gridParams };
  for (const key of GRID_ONLY_PARAMS) {
    delete params[key];
  }

  return {
    ...params,
    _operationType: "fetch",
    _noCount: true,
    exportAs: CSV_EXPORT_FORMAT,
    exportToFile: true,
    viewState,
    tabId,
    _textMatchStyle: "substring",
    _UTCOffsetMiliseconds: String(new Date().getTimezoneOffset() * -60000),
  };
};

/**
 * Downloads CSV file to client
 */
export const downloadCSVFile = (csvContent: string): void => {
  if (!csvContent.trim()) {
    throw new Error("No data to export");
  }

  const blob = new Blob([csvContent], { type: CSV_MIME_TYPE });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", CSV_FILE_NAME);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

/** Message of a `{ response: { error } }` object, if it holds one. */
const readResponseError = (container: Record<string, unknown> | null): string | null => {
  const errorObj = asRecord(asRecord(container?.response)?.error);
  if (!errorObj) {
    return null;
  }
  return String(errorObj.message || UNKNOWN_BACKEND_ERROR);
};

/**
 * Extracts error message from nested response structure: `response.data.response.error`, then
 * `response.response.error`.
 */
export const extractErrorFromResponse = (respObj: Record<string, unknown>): string | null =>
  readResponseError(asRecord(respObj.data)) ?? readResponseError(respObj);

/**
 * Attempts to extract CSV content from data object
 */
const tryExtractCSVFromDataObject = (dataObj: Record<string, unknown>): string => {
  if (typeof dataObj.text === "string") return dataObj.text;
  if (typeof dataObj.data === "string") return dataObj.data;
  if (typeof dataObj.csv === "string") return dataObj.csv;
  return "";
};

/**
 * Attempts to extract CSV content from top-level object
 */
const tryExtractCSVFromTopLevel = (respObj: Record<string, unknown>): string => {
  if (typeof respObj.text === "string") return respObj.text;
  if (typeof respObj.csv === "string") return respObj.csv;
  return "";
};

/**
 * Extracts CSV content from various response structures. The datasource proxy wraps the raw CSV
 * the server writes as `{ text }`.
 */
export const extractCSVContent = (response: unknown): { csvContent: string; backendError: string | null } => {
  // Try direct string response
  if (typeof response === "string") {
    return { csvContent: response, backendError: null };
  }

  const respObj = response as Record<string, unknown>;

  // Try response.data as string
  if (typeof respObj.data === "string") {
    return { csvContent: respObj.data, backendError: null };
  }

  // Extract errors first
  const backendError = extractErrorFromResponse(respObj);

  // Try nested data object, then top-level properties
  const dataObj = asRecord(respObj.data);
  const csvContent = (dataObj && tryExtractCSVFromDataObject(dataObj)) || tryExtractCSVFromTopLevel(respObj);

  return { csvContent, backendError };
};

/**
 * Validates export prerequisites
 */
const validateExportData = (tab: Tab): void => {
  if (!tab.entityName) {
    throw new Error("Entity name not found");
  }
  if (!tab.fields || Object.keys(tab.fields).length === 0) {
    throw new Error("No fields available for export");
  }
};

/** Columns of the exported file: the grid columns, in the grid order and with the grid visibility. */
const buildExportViewState = (tab: Tab, tableState: Partial<TableState>): string => {
  const orderedFieldNames = getExportFieldNames(tab.fields, tableState.order);
  // tableState.visibility uses column ids (e.g. "Gross Unit Price") as keys, the export field names
  const fieldNameVisibility = buildFieldNameVisibility(orderedFieldNames, tableState.visibility ?? {}, tab.fields);
  const fieldsArray = buildFieldsArray(orderedFieldNames, fieldNameVisibility, tab.fields);
  return buildViewState(fieldsArray, tableState.sorting ?? []);
};

const fetchCsvContent = async (tab: Tab, params: Record<string, unknown>): Promise<string> => {
  const response = await datasource.get(tab.entityName, params);

  if (!response) {
    throw new Error("No response from server");
  }

  const respObj = response as unknown as Record<string, unknown>;
  if (respObj.__error) {
    throw new Error(`Export error: ${respObj.__error}`);
  }

  const { csvContent, backendError } = extractCSVContent(response);
  if (backendError) {
    throw new Error(`CSV export backend error: ${backendError}`);
  }
  if (!csvContent || csvContent.trim().length === 0) {
    logger.error("Export returned empty data. Response structure (keys):", Object.keys(respObj));
    throw new Error("Export returned empty data - check browser console for response structure");
  }
  return csvContent;
};

/**
 * Exports the records of a grid to a CSV file and downloads it: the same records, in the same
 * order, the grid shows, without a row limit (Classic `exportData`).
 *
 * @param tab - Tab whose entity is exported
 * @param tableState - Grid state of the tab (column visibility and sort)
 * @param gridParams - Params the grid loaded its data with (`useDatasource.getRequestParams`)
 */
export const exportGridToCsv = async ({
  tab,
  tableState,
  gridParams,
}: {
  tab: Tab;
  tableState: Partial<TableState>;
  gridParams: DatasourceOptions;
}): Promise<void> => {
  try {
    validateExportData(tab);
    const viewState = buildExportViewState(tab, tableState);
    const params = buildCsvExportParams(gridParams, { tabId: tab.id, viewState });
    downloadCSVFile(await fetchCsvContent(tab, params));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred during export";
    logger.error("CSV Export Error:", errorMessage, error);

    // Re-throw to trigger the toolbar error toast
    throw new Error(`CSV Export failed: ${errorMessage}`);
  }
};
