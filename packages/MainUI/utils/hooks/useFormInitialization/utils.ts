import type { ClientOptions } from "@workspaceui/api-client/src/api/client";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { FormMode, type Tab, type FormInitializationResponse, type Field } from "@workspaceui/api-client/src/api/types";
import { ACTION_FORM_INITIALIZATION } from "./constants";
import { logger } from "@/utils/logger";
import { getFieldsToAdd } from "@/utils/form/entityConfig";

const getRowId = (mode: FormMode, recordId?: string | null): string => {
  return mode === FormMode.EDIT ? (recordId ?? "null") : "null";
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
 * @param mode - Form operation mode (NEW, EDIT, etc.)
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
  mode: FormMode,
  parentData: Record<string, unknown>,
  entityKeyColumn: NonNullable<Field>
): Record<string, unknown> => {
  const additionalFields = getFieldsToAdd(tab.entityName, mode);

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
  mode: FormMode;
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
