import { useMemo } from "react";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type {
  ProcessDefaultsResponse,
  ProcessDefaultValue,
} from "@/components/ProcessModal/types/ProcessParameterExtensions";
import { isReferenceValue, isSimpleValue } from "@/components/ProcessModal/types/ProcessParameterExtensions";
import { logger } from "@/utils/logger";

/**
 * Type alias for field value types
 */
type FieldValue = string | number | boolean;

/**
 * Interface for processed default value result
 */
interface ProcessedDefaultValue {
  fieldName: string;
  fieldValue: FieldValue;
  identifier?: string;
}

/**
 * Converts various date formats to ISO format (YYYY-MM-DD) for HTML date inputs
 * Supports:
 * - DD-MM-YYYY (27-10-2025)
 * - DD/MM/YYYY (27/10/2025)
 * - YYYY-MM-DD (already correct)
 * - ISO datetime (2025-10-27T00:00:00Z)
 */
export function convertToISODateFormat(dateString: string): string {
  // Already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // ISO datetime format (2025-10-27T00:00:00Z) - extract date part
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
    return dateString.split("T")[0];
  }

  // DD-MM-YYYY or DD/MM/YYYY format
  const ddmmyyyyMatch = dateString.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const isoDate = `${year}-${month}-${day}`;
    return isoDate;
  }

  return dateString;
}

/**
 * Creates a parameter mapping for efficient lookups
 */
export function createParameterMap(
  parameters?: ProcessParameter[] | Record<string, ProcessParameter>
): Map<string, ProcessParameter> {
  const map = new Map<string, ProcessParameter>();

  if (!parameters) return map;

  const paramArray = Array.isArray(parameters) ? parameters : Object.values(parameters);

  for (const param of paramArray) {
    // Map by name (primary)
    map.set(param.name, param);
    // Map by dBColumnName if different
    if (param.dBColumnName && param.dBColumnName !== param.name) {
      map.set(param.dBColumnName, param);
    }
    // Map by ID as fallback
    if (param.id && param.id !== param.name) {
      map.set(param.id, param);
    }
  }

  return map;
}

/**
 * Creates a parameter name map for legacy parameter format
 */
export function createParameterNameMap(
  parameters?: Record<string, ProcessParameter>
): Record<string, ProcessParameter> {
  if (!parameters) return {};

  const map: Record<string, ProcessParameter> = {};
  for (const param of Object.values(parameters)) {
    map[param.name] = param;
    if (param.dBColumnName && param.dBColumnName !== param.name) {
      map[param.dBColumnName] = param;
    }
  }
  return map;
}

/**
 * Checks if a parameter is a date field
 */
function isDateField(parameter: ProcessParameter | undefined): boolean {
  if (!parameter?.reference) return false;
  const ref = parameter.reference.toLowerCase();
  return ref.includes("date") || ref.includes("time");
}

/**
 * Processes a simple value (string, number, boolean)
 */
function processSimpleValue(value: FieldValue, parameter: ProcessParameter | undefined): FieldValue {
  if (isDateField(parameter)) {
    return typeof value === "string" ? convertToISODateFormat(value) : String(value);
  }
  return typeof value === "boolean" ? value : String(value);
}

/**
 * Processes a reference value
 */
function processReferenceValue(
  fieldName: string,
  formFieldName: string,
  value: { value: string; identifier: string }
): ProcessedDefaultValue {
  logger.debug(`Mapped reference field ${fieldName} to ${formFieldName}:`, {
    value: value.value,
    identifier: value.identifier,
  });
  return {
    fieldName: formFieldName,
    fieldValue: value.value,
    identifier: value.identifier,
  };
}

/**
 * Processes a fallback value for unexpected types
 */
function processFallbackValue(
  fieldName: string,
  formFieldName: string,
  value: ProcessDefaultValue
): ProcessedDefaultValue {
  logger.warn(`Unexpected value type for field ${fieldName}:`, value);
  const fallbackValue = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "");
  return {
    fieldName: formFieldName,
    fieldValue: fallbackValue,
  };
}

/**
 * Processes a single default value into a form-compatible format
 */
export function processDefaultValue(
  fieldName: string,
  value: ProcessDefaultValue,
  parameterMap: Map<string, ProcessParameter>
): ProcessedDefaultValue | null {
  try {
    // Skip logic fields (will be processed separately)
    if (fieldName.endsWith("_display_logic") || fieldName.endsWith("_readonly_logic")) {
      return null;
    }

    // Find corresponding parameter
    const parameter = parameterMap.get(fieldName);
    const formFieldName = parameter?.name || fieldName;

    if (isReferenceValue(value)) {
      return processReferenceValue(fieldName, formFieldName, value);
    }

    if (isSimpleValue(value)) {
      return {
        fieldName: formFieldName,
        fieldValue: processSimpleValue(value, parameter),
      };
    }

    // Fallback for unexpected value types
    return processFallbackValue(fieldName, formFieldName, value);
  } catch (error) {
    logger.error(`Error processing default value for field ${fieldName}:`, error);
    const parameter = parameterMap.get(fieldName);
    const formFieldName = parameter?.name || fieldName;
    return {
      fieldName: formFieldName,
      fieldValue: "",
    };
  }
}

/**
 * Processes legacy-style parameter map (Record format)
 */
export function processDefaultValueLegacy(
  fieldName: string,
  value: ProcessDefaultValue,
  parameterNameMap: Record<string, ProcessParameter>
): { fieldName: string; fieldValue: string; identifier?: string } | null {
  try {
    // Skip logic fields
    if (fieldName.endsWith("_display_logic") || fieldName.endsWith("_readonly_logic")) {
      return null;
    }

    const parameter = parameterNameMap[fieldName];
    const formFieldName = parameter?.name || fieldName;

    if (isReferenceValue(value)) {
      logger.debug(`Mapped reference field ${fieldName}:`, {
        formField: formFieldName,
        value: value.value,
        identifier: value.identifier,
      });
      return {
        fieldName: formFieldName,
        fieldValue: value.value,
        identifier: value.identifier,
      };
    }

    if (isSimpleValue(value)) {
      logger.debug(`Mapped simple field ${fieldName}:`, {
        formField: formFieldName,
        value: String(value),
      });
      return {
        fieldName: formFieldName,
        fieldValue: String(value),
      };
    }

    logger.warn(`Unexpected value type for field ${fieldName}:`, value);
    return {
      fieldName: formFieldName,
      fieldValue: String(value),
    };
  } catch (error) {
    logger.error(`Error processing default value for field ${fieldName}:`, error);
    return {
      fieldName: fieldName,
      fieldValue: "",
    };
  }
}

/**
 * Converts process defaults to EntityData format
 */
export function convertProcessDefaultsToEntityData(
  defaults: Record<string, ProcessDefaultValue>,
  parameterMap: Map<string, ProcessParameter>
): EntityData {
  const acc = {} as EntityData;

  for (const [fieldName, value] of Object.entries(defaults)) {
    const processed = processDefaultValue(fieldName, value, parameterMap);
    if (processed) {
      acc[processed.fieldName] = processed.fieldValue;

      // Store identifier for display purposes if present
      if (processed.identifier) {
        acc[`${processed.fieldName}$_identifier`] = processed.identifier;
      }
    }
  }

  return acc;
}

/**
 * Extracts logic fields from process defaults
 */
export function extractLogicFields(defaults: Record<string, ProcessDefaultValue>): Record<string, boolean> {
  const logic: Record<string, boolean> = {};

  for (const [fieldName, value] of Object.entries(defaults)) {
    if (fieldName.endsWith("_display_logic")) {
      const baseFieldName = fieldName.replace("_display_logic", "");
      logic[`${baseFieldName}.display`] = value === "Y";
    } else if (fieldName.endsWith("_readonly_logic")) {
      const baseFieldName = fieldName.replace("_readonly_logic", "");
      logic[`${baseFieldName}.readonly`] = value === "Y";
    }
  }

  return logic;
}

/**
 * Hook for processing defaults with parameter map
 */
export function useProcessDefaultsWithParameterMap(
  processDefaults?: ProcessDefaultsResponse | null,
  parameterMap?: Map<string, ProcessParameter>
) {
  const initialState = useMemo(() => {
    if (!processDefaults?.defaults || !parameterMap) return null;

    // If defaults is empty object, return empty object (not null)
    if (Object.keys(processDefaults.defaults).length === 0) return {};

    const acc = convertProcessDefaultsToEntityData(processDefaults.defaults, parameterMap);

    logger.debug("Process initial state:", {
      originalFields: Object.keys(processDefaults.defaults).length,
      processedFields: Object.keys(acc).length,
      fieldNames: Object.keys(acc),
    });

    return acc;
  }, [processDefaults, parameterMap]);

  const logicFields = useMemo(() => {
    if (!processDefaults?.defaults) return {};
    const logic = extractLogicFields(processDefaults.defaults);
    logger.debug("Process logic fields:", logic);
    return logic;
  }, [processDefaults]);

  const filterExpressions = useMemo(() => {
    if (!processDefaults?.filterExpressions) return {};
    logger.debug("Process filter expressions:", processDefaults.filterExpressions);
    return processDefaults.filterExpressions;
  }, [processDefaults]);

  return {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent: processDefaults?.refreshParent || false,
    hasData: !!initialState && Object.keys(initialState).length > 0,
  };
}
