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
  entityKeyColumn: NonNullable<Field>
): Record<string, unknown> => {
  const additionalFields =
    mode === SessionMode.SETSESSION
      ? {} // No additional fields needed for session sync ¿This is correct?
      : getFieldsToAdd(tab.entityName, mode as FormMode);

  return {
    ...parentData,
    inpKeyName: entityKeyColumn.inputName,
    inpTabId: tab.id,
    inpTableId: tab.table,
    inpkeyColumnId: entityKeyColumn.columnName,
    keyColumnName: entityKeyColumn.columnName,
    _entityName: tab.entityName,
    inpwindowId: tab.window,
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
 *
 * @param data - Form initialization response containing auxiliary input values
 * @returns Flattened object with field names as keys and their string values
 *
 * @example
 * ```typescript
 * const sessionAttrs = buildSessionAttributes(formData);
 * // Returns: { "fieldName1": "value1", "fieldName2": "value2" }
 * ```
 */
export const buildSessionAttributes = (data: FormInitializationResponse): Record<string, string> => {
  return { ...extractKeyValuePairs(data.auxiliaryInputValues), ...data.sessionAttributes };
};
