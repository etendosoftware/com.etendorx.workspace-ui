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

import type { EntityData, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { buildQueryString } from "@/utils";
import { shouldRemoveIdFields } from "@/utils/form/entityConfig";
import { normalizeDates } from "@/utils/form/normalizeDates";
import { logger } from "@/utils/logger";
import type { SaveOperation, SaveResult, ValidationError } from "../types/inlineEditing";
import { getMergedRowData } from "./editingRowUtils";
import type { EditingRowData } from "../types/inlineEditing";
import { validateRowForSave } from "./validationUtils";
import type { Column } from "@workspaceui/api-client/src/api/types";

/**
 * Builds the payload for saving a record via the datasource servlet
 * @param values The record data to save
 * @param oldValues The original record data (for updates)
 * @param mode The form mode (NEW or EDIT)
 * @param csrfToken The CSRF token for the request
 * @param tab The tab metadata to filter valid fields
 * @returns The formatted payload
 */
function buildSavePayload({
  values,
  oldValues,
  mode,
  csrfToken,
  tab,
}: {
  values: EntityData;
  oldValues?: EntityData;
  mode: FormMode;
  csrfToken: string;
  tab?: Tab;
}) {
  // Fields that should be excluded from the payload
  const auditFields = ["creationDate", "createdBy", "updated", "updatedBy"];

  // When creating a new record (add operation), exclude the id field as well
  const excludedFields = mode === FormMode.NEW ? [...auditFields, "id"] : auditFields;

  // Build a set of valid field names from tab.fields (using hqlName)
  // This will filter out display names like "Transaction Document" and keep only "transactionDocument"
  const validFieldNames = new Set<string>();
  if (tab?.fields) {
    Object.values(tab.fields).forEach((field: any) => {
      if (field.hqlName) {
        validFieldNames.add(field.hqlName);
      }
    });
  }

  const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
    // Skip if excluded field
    if (excludedFields.includes(key)) {
      return acc;
    }

    // Skip identifier and entries fields (they're client-side only)
    if (key.includes('$_identifier') || key.includes('$_entries')) {
      return acc;
    }

    // If we have tab metadata, only include fields that are valid (exist in tab.fields)
    // This filters out display names like "Transaction Document"
    if (tab && validFieldNames.size > 0) {
      // Allow fields that are in validFieldNames OR start with $ (system fields like $Element_BP)
      if (!validFieldNames.has(key) && !key.startsWith('$')) {
        return acc;
      }
    }

    acc[key] = value;
    // If this is a password field, also add password_cleartext
    if (key === "password" && value) {
      acc.password_cleartext = value;
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
}

/**
 * Parses server validation errors from the response
 * @param errorData The error data from the server response
 * @returns Array of validation errors
 */
function parseServerValidationErrors(errorData: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (errorData?.message) {
    // Generic server error
    errors.push({
      field: "_general",
      message: errorData.message,
      type: "server",
    });
  }

  // Parse field-specific validation errors if they exist
  if (errorData?.fieldErrors) {
    Object.entries(errorData.fieldErrors).forEach(([field, message]) => {
      errors.push({
        field,
        message: String(message),
        type: "server",
      });
    });
  }

  // Parse validation errors from different server response formats
  if (errorData?.validationErrors && Array.isArray(errorData.validationErrors)) {
    errorData.validationErrors.forEach((error: any) => {
      errors.push({
        field: error.field || "_general",
        message: error.message || "Validation error",
        type: "server",
      });
    });
  }

  // Handle constraint violation errors
  if (errorData?.constraintViolations && Array.isArray(errorData.constraintViolations)) {
    errorData.constraintViolations.forEach((violation: any) => {
      errors.push({
        field: violation.propertyPath || "_general",
        message: violation.message || "Constraint violation",
        type: "server",
      });
    });
  }

  return errors;
}

/**
 * Determines if an error is retryable (network issues, temporary server errors)
 * @param error The error that occurred
 * @param response The server response if available
 * @returns True if the operation should be retryable
 */
function isRetryableError(error: any, response?: any): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === "AbortError" || error.message.includes("timeout")) {
    return true;
  }

  // Server errors (5xx) are retryable, client errors (4xx) are not
  if (response?.status >= 500) {
    return true;
  }

  // Specific server error codes that might be temporary
  if (response?.response?.status === -1 || response?.response?.status === 503) {
    return true;
  }

  return false;
}

/**
 * Saves a record with retry mechanism for network errors
 * @param saveOperation The save operation data
 * @param tab The tab metadata
 * @param windowMetadata The window metadata
 * @param userId The current user ID for CSRF token
 * @param signal Optional abort signal for cancellation
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with save result
 */
export async function saveRecordWithRetry({
  saveOperation,
  tab,
  windowMetadata,
  userId,
  signal,
  maxRetries = 2,
}: {
  saveOperation: SaveOperation;
  tab: Tab;
  windowMetadata?: WindowMetadata;
  userId: string;
  signal?: AbortSignal;
  maxRetries?: number;
}): Promise<SaveResult> {
  let lastError: any;
  let lastResponse: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await saveRecord({
        saveOperation,
        tab,
        windowMetadata,
        userId,
        signal,
      });

      // If successful, return immediately
      if (result.success) {
        if (attempt > 0) {
          logger.info(`[SaveOperation] Retry successful on attempt ${attempt + 1}:`, {
            rowId: saveOperation.rowId,
          });
        }
        return result;
      }

      // If not successful, check if we should retry
      lastResponse = result;

      // Don't retry validation errors - they won't change
      const hasValidationErrors = result.errors?.some((error) => error.type === "server" && error.field !== "_general");
      if (hasValidationErrors) {
        return result;
      }

      // Check if this is the last attempt
      if (attempt === maxRetries) {
        return result;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!isRetryableError(error, lastResponse) || attempt === maxRetries) {
        logger.error(`[SaveOperation] Non-retryable error or max retries reached:`, {
          rowId: saveOperation.rowId,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          errors: [
            {
              field: "_general",
              message: error instanceof Error ? error.message : "Network error occurred",
              type: "server",
            },
          ],
        };
      }

      logger.warn(`[SaveOperation] Retryable error on attempt ${attempt + 1}, retrying:`, {
        rowId: saveOperation.rowId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but just in case
  return {
    success: false,
    errors: [
      {
        field: "_general",
        message: "Maximum retry attempts exceeded",
        type: "server",
      },
    ],
  };
}

/**
 * Validates a record before saving to prevent invalid data submission
 * @param saveOperation The save operation data
 * @param columns The column metadata for validation
 * @returns Validation result indicating if save should proceed
 */
export function validateRecordBeforeSave(
  saveOperation: SaveOperation,
  columns: Column[]
): { canSave: boolean; errors: ValidationError[] } {
  logger.debug(`[SaveValidation] Validating record before save:`, {
    rowId: saveOperation.rowId,
    isNew: saveOperation.isNew,
  });

  // Validate the merged data
  const validationResult = validateRowForSave(columns, saveOperation.data);

  if (!validationResult.isValid) {
    logger.warn(`[SaveValidation] Validation failed for record:`, {
      rowId: saveOperation.rowId,
      errors: validationResult.errors,
    });

    return {
      canSave: false,
      errors: validationResult.errors,
    };
  }

  logger.debug(`[SaveValidation] Validation passed for record:`, {
    rowId: saveOperation.rowId,
  });

  return {
    canSave: true,
    errors: [],
  };
}

/**
 * Saves a record using the datasource servlet
 * @param saveOperation The save operation details
 * @param tab The tab metadata
 * @param windowMetadata The window metadata
 * @param userId The current user ID for CSRF token
 * @param signal Optional abort signal for cancellation
 * @returns Promise with save result
 */
export async function saveRecord({
  saveOperation,
  tab,
  windowMetadata,
  userId,
  signal,
}: {
  saveOperation: SaveOperation;
  tab: Tab;
  windowMetadata?: WindowMetadata;
  userId: string;
  signal?: AbortSignal;
}): Promise<SaveResult> {
  try {
    logger.info(`[SaveOperation] Starting save for ${saveOperation.isNew ? "new" : "existing"} record:`, {
      rowId: saveOperation.rowId,
      entityName: tab.entityName,
      isNew: saveOperation.isNew,
    });

    const mode = saveOperation.isNew ? FormMode.NEW : FormMode.EDIT;
    const queryStringParams = buildQueryString({ mode, windowMetadata, tab });

    const shouldRemoveId = shouldRemoveIdFields(tab.entityName, mode);

    let processedValues = { ...saveOperation.data };
    let processedOriginalData = saveOperation.originalData ? { ...saveOperation.originalData } : undefined;

    // For new records, always remove the temporary ID
    if (saveOperation.isNew || shouldRemoveId) {
      const { id, id$_identifier: idIdentifier, ...valuesWithoutId } = processedValues;
      processedValues = valuesWithoutId as EntityData;

      logger.debug(`[SaveOperation] Removed ID field for new record:`, {
        originalId: id,
        processedKeys: Object.keys(processedValues),
      });

      if (processedOriginalData) {
        const { id: originalId, id$_identifier: originalIdIdentifier, ...originalWithoutId } = processedOriginalData;
        processedOriginalData = originalWithoutId as EntityData;
      }
    }

    const body = buildSavePayload({
      values: processedValues,
      oldValues: processedOriginalData,
      mode,
      csrfToken: userId,
      tab,
    });

    const url = `${tab.entityName}?${queryStringParams}`;
    const options = {
      signal,
      method: "POST",
      body: normalizeDates(body) as Record<string, unknown>,
    };

    logger.debug(
      `[SaveOperation] Making ${saveOperation.isNew ? "POST (create)" : "POST (update)"} request to: ${url}`,
      {
        operationType: body.operationType,
        dataKeys: Object.keys(body.data || {}),
        hasOldValues: !!body.oldValues,
      }
    );

    const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

    if (ok && data?.response?.status === 0) {
      const savedRecord = data.response.data[0] as EntityData;
      logger.info(`[SaveOperation] Successfully ${saveOperation.isNew ? "created" : "updated"} record:`, {
        rowId: saveOperation.rowId,
        recordId: savedRecord.id,
        isNew: saveOperation.isNew,
      });

      return {
        success: true,
        data: savedRecord,
      };
    } else {
      const errorMessage = data?.response?.error?.message || "Unknown server error";
      const validationErrors = parseServerValidationErrors(data?.response?.error);

      logger.error(`[SaveOperation] Server error for ${saveOperation.isNew ? "new" : "existing"} record:`, {
        rowId: saveOperation.rowId,
        error: errorMessage,
        validationErrors,
        responseStatus: data?.response?.status,
      });

      return {
        success: false,
        errors: validationErrors,
      };
    }
  } catch (error) {
    logger.error(`[SaveOperation] Request failed for ${saveOperation.isNew ? "new" : "existing"} record:`, {
      rowId: saveOperation.rowId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      errors: [
        {
          field: "_general",
          message: error instanceof Error ? error.message : "Network error occurred",
          type: "server",
        },
      ],
    };
  }
}

/**
 * Creates a save operation from editing row data
 * @param rowId The row ID
 * @param editingRowData The editing row data
 * @returns Save operation object
 */
export function createSaveOperation(rowId: string, editingRowData: EditingRowData): SaveOperation {
  const mergedData = getMergedRowData(editingRowData);

  return {
    rowId,
    isNew: editingRowData.isNew,
    data: mergedData,
    originalData: editingRowData.isNew ? undefined : editingRowData.originalData,
  };
}

/**
 * Handles save operation errors by updating validation state
 * @param errors Array of validation errors
 * @returns Record of field errors for state update
 */
export function processSaveErrors(errors: ValidationError[]): Record<string, string | undefined> {
  const fieldErrors: Record<string, string | undefined> = {};

  errors.forEach((error) => {
    if (error.field !== "_general") {
      fieldErrors[error.field] = error.message;
    }
  });

  return fieldErrors;
}

/**
 * Creates a new record using POST request
 * @param saveOperation The save operation details for new record
 * @param tab The tab metadata
 * @param windowMetadata The window metadata
 * @param userId The current user ID for CSRF token
 * @param signal Optional abort signal for cancellation
 * @returns Promise with save result
 */
export async function createNewRecord({
  saveOperation,
  tab,
  windowMetadata,
  userId,
  signal,
}: {
  saveOperation: SaveOperation;
  tab: Tab;
  windowMetadata?: WindowMetadata;
  userId: string;
  signal?: AbortSignal;
}): Promise<SaveResult> {
  if (!saveOperation.isNew) {
    throw new Error("createNewRecord should only be called for new records");
  }

  logger.info(`[CreateRecord] Creating new record:`, {
    rowId: saveOperation.rowId,
    entityName: tab.entityName,
    dataKeys: Object.keys(saveOperation.data),
  });

  // Use the general saveRecord function which handles both new and existing records
  return saveRecord({
    saveOperation,
    tab,
    windowMetadata,
    userId,
    signal,
  });
}

/**
 * Updates an existing record using POST request
 * @param saveOperation The save operation details for existing record
 * @param tab The tab metadata
 * @param windowMetadata The window metadata
 * @param userId The current user ID for CSRF token
 * @param signal Optional abort signal for cancellation
 * @returns Promise with save result
 */
export async function updateExistingRecord({
  saveOperation,
  tab,
  windowMetadata,
  userId,
  signal,
}: {
  saveOperation: SaveOperation;
  tab: Tab;
  windowMetadata?: WindowMetadata;
  userId: string;
  signal?: AbortSignal;
}): Promise<SaveResult> {
  if (saveOperation.isNew) {
    throw new Error("updateExistingRecord should only be called for existing records");
  }

  logger.info(`[UpdateRecord] Updating existing record:`, {
    rowId: saveOperation.rowId,
    entityName: tab.entityName,
    recordId: saveOperation.originalData?.id,
  });

  // Use the general saveRecord function which handles both new and existing records
  return saveRecord({
    saveOperation,
    tab,
    windowMetadata,
    userId,
    signal,
  });
}

/**
 * Gets the general error message from validation errors
 * @param errors Array of validation errors
 * @returns General error message or undefined
 */
export function getGeneralErrorMessage(errors: ValidationError[]): string | undefined {
  const generalError = errors.find((error) => error.field === "_general");
  return generalError?.message;
}
