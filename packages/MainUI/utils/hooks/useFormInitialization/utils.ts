import type { ClientOptions } from "@workspaceui/api-client/src/api/client";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import {
  FormMode,
  SessionMode,
  type SessionModeType,
  type Tab,
  type FormInitializationResponse,
  type Field,
} from "@workspaceui/api-client/src/api/types";
import { ACTION_FORM_INITIALIZATION } from "./constants";
import { logger } from "@/utils/logger";
import { getFieldsToAdd } from "@/utils/form/entityConfig";
import { extractKeyValuePairs } from "@/utils/commons";
import { buildPayloadByInputName } from "@/utils";

const getRowId = (mode: FormMode | SessionModeType, recordId?: string | null): string => {
  if (mode === FormMode.EDIT || mode === SessionMode.SETSESSION) {
    return recordId ?? "null";
  }
  return "null";
};

/**
 * Builds the payload object required for form initialization API call
 *
 * Constructs a comprehensive payload containing:
 * - Parent form data context
 * - Tab and table identifiers
 * - Entity key information
 * - Additional fields specific to the entity and mode
 * - Window context information
 * - _gridVisibleProperties: list of column names for all displayed fields, required
 *   by FormInitializationComponent to process property fields correctly
 *
 * @param tab - Current tab configuration
 * @param mode - Form operation mode (NEW, EDIT, SETSESSION)
 * @param parentData - Data from parent form context
 * @param entityKeyColumn - Primary key field configuration
 * @returns Payload object ready for API submission
 *
 * @example
 * ```typescript
 * const payload = buildPayload(tab, FormMode.NEW, {}, keyColumn);
 * // Returns: { inpTabId: "123", inpTableId: "456", ... }
 * ```
 */
export const buildFormInitializationPayload = (
  tab: Tab,
  mode: FormMode | SessionModeType,
  parentData: Record<string, unknown>,
  entityKeyColumn: NonNullable<Field>,
  record?: Record<string, unknown> | null
): Record<string, unknown> => {
  const additionalFields =
    mode === SessionMode.SETSESSION
      ? {} // No additional fields needed for session sync
      : getFieldsToAdd(tab.entityName, mode as FormMode);

  // In EDIT mode, include the current record values as inp* fields so the backend
  // can correctly compute derived fields (e.g. _propertyField_* fields whose value
  // depends on other field values via callouts or computed columns).
  // Classic sends all inp{ColumnName} values in its payload; without them the
  // FormInitializationComponent returns empty values for those derived fields.
  const recordPayload = mode === FormMode.EDIT && record ? (buildPayloadByInputName(record, tab.fields) ?? {}) : {};

  // Build _gridVisibleProperties from all displayed tab fields.
  // Classic sends this list so that FormInitializationComponent (FIC) knows which
  // fields are currently visible in the form. The FIC's setValuesInRequest method
  // checks this list for property fields:
  //   - Regular fields:  their columnName is listed (e.g. "Behaviour")
  //   - Property fields: BOTH their columnName AND the "$"-format property path are
  //     listed (e.g. "Type" + "etcopFile$type" for column.propertyPath = "etcopFile.type").
  //     The FIC uses the "$" entry to identify property fields and look up their value
  //     from the inp_propertyField_* key in the payload, returning it in columnValues.
  //
  // Not needed for SETSESSION mode. Entity-specific overrides in entityConfig
  // (e.g. ADUser) take precedence via the spread of additionalFields below.
  const computedGridVisibleProperties =
    mode !== SessionMode.SETSESSION
      ? Object.values(tab.fields)
          .filter((f) => f.displayed && f.columnName)
          .flatMap((f) => {
            const propertyPath = f.column?.propertyPath;
            if (propertyPath) {
              // For property fields, include both the column name and the $-format path.
              // FormInitializationComponent.setValuesInRequest checks _gridVisibleProperties
              // for entries in the "entity$property" format to identify property fields and
              // look up their values from the payload.
              return [f.columnName, propertyPath.replace(/\./g, "$")];
            }
            return [f.columnName];
          })
      : undefined;

  return {
    ...recordPayload,
    ...parentData,
    inpKeyName: entityKeyColumn.inputName,
    inpTabId: tab.id,
    inpTableId: tab.table,
    inpkeyColumnId: entityKeyColumn.columnName,
    keyColumnName: entityKeyColumn.columnName,
    _entityName: tab.entityName,
    inpwindowId: tab.window,
    // Provide computed _gridVisibleProperties; entity-specific configs in additionalFields
    // (e.g. ADUser with its curated list) will override this via the spread below.
    ...(computedGridVisibleProperties && { _gridVisibleProperties: computedGridVisibleProperties }),
    ...additionalFields,
  };
};

/**
 * Utility function to build form initialization parameters.
 * @param mode The form mode (NEW or EDIT or SETSESSION).
 * @param tab The tab information.
 * @param recordId The ID of the record (optional).
 * @param parentId The ID of the parent record (optional).
 * @returns URLSearchParams containing the query parameters.
 */

export const buildFormInitializationParams = ({
  mode,
  tab,
  recordId,
  parentId,
}: {
  tab: Tab;
  mode: FormMode | SessionModeType;
  recordId?: string | null;
  parentId?: string | null;
}): URLSearchParams =>
  new URLSearchParams({
    MODE: mode,
    PARENT_ID: parentId ?? "null",
    TAB_ID: tab.id,
    ROW_ID: getRowId(mode, recordId),
    _action: ACTION_FORM_INITIALIZATION,
  });

export const fetchFormInitialization = async (
  params: URLSearchParams,
  payload: ClientOptions["body"]
): Promise<FormInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);
    return data;
  } catch (error) {
    logger.warn("Error fetching initial form data:", error);
    throw new Error("Failed to fetch initial data");
  }
};

/**
 * Builds session attributes from auxiliary input values
 *
 * Extracts and transforms auxiliary input values from the form initialization
 * response into a flat key-value object suitable for session storage.
 * This ensures form field values are properly maintained across user interactions.
 * Also includes attachment information (count and existence) when available.
 *
 * @param data - Form initialization response containing auxiliary input values
 * @returns Flattened object with field names as keys and their string values
 *
 * @example
 * ```typescript
 * const sessionAttrs = buildSessionAttributes(formData);
 * // Returns: { "fieldName1": "value1", "fieldName2": "value2", "_attachmentCount": "3", ... }
 * ```
 */
export const buildSessionAttributes = (data: FormInitializationResponse | null): Record<string, string> => {
  if (!data) return {};

  const auxiliaryInputValues = data.auxiliaryInputValues || {};
  const result = { ...extractKeyValuePairs(auxiliaryInputValues), ...data.sessionAttributes };

  // Include attachment information when available
  if (data.attachmentExists !== undefined) {
    result._attachmentExists = String(data.attachmentExists);
  }
  if (data.attachmentCount !== undefined) {
    result._attachmentCount = String(data.attachmentCount);
  }

  return result;
};
