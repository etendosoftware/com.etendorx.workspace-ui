import { useMemo } from "react";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type { 
  ProcessDefaultsResponse
} from "@/components/ProcessModal/types/ProcessParameterExtensions";
import {
  isReferenceValue,
  isSimpleValue 
} from "@/components/ProcessModal/types/ProcessParameterExtensions";
import { logger } from "@/utils/logger";

/**
 * Hook to convert ProcessDefaultsResponse to form initial state
 * This adapts the DefaultsProcessActionHandler response structure to work with react-hook-form
 */
export const useProcessDefaultsInitialState = (
  processDefaults?: ProcessDefaultsResponse | null,
  parameters?: Record<string, ProcessParameter>
) => {
  // Build parameter name map once per change of parameters
  const parameterNameMap = useMemo(() => {
    if (!parameters) return {} as Record<string, ProcessParameter>;

    const map: Record<string, ProcessParameter> = {};
    Object.values(parameters).forEach((param) => {
      map[param.name] = param;
      if (param.dBColumnName && param.dBColumnName !== param.name) {
        map[param.dBColumnName] = param;
      }
    });
    return map;
  }, [parameters]);

  const initialState = useMemo(() => {
    if (!processDefaults?.defaults) return {};

    const acc = {} as EntityData;
    const { defaults } = processDefaults;

    // Process each default value
    for (const [fieldName, value] of Object.entries(defaults)) {
      try {
        // Skip logic fields (will be processed separately)
        if (fieldName.endsWith('_display_logic') || fieldName.endsWith('_readonly_logic')) {
          continue;
        }

        // Find corresponding parameter
        const parameter = parameterNameMap[fieldName];
        const formFieldName = parameter?.name || fieldName;

        if (isReferenceValue(value)) {
          // Handle reference objects with value/identifier
          acc[formFieldName] = value.value;
          acc[`${formFieldName}$_identifier`] = value.identifier;
          
          logger.debug(`Mapped reference field ${fieldName}:`, {
            formField: formFieldName,
            value: value.value,
            identifier: value.identifier
          });
        } else if (isSimpleValue(value)) {
          // Handle simple values (string, number, boolean)
          acc[formFieldName] = String(value);
          
          logger.debug(`Mapped simple field ${fieldName}:`, {
            formField: formFieldName,
            value: String(value)
          });
        } else {
          logger.warn(`Unexpected value type for field ${fieldName}:`, value);
          // Fallback to string conversion
          acc[formFieldName] = String(value);
        }
      } catch (error) {
        logger.error(`Error processing default value for field ${fieldName}:`, error);
        // Set fallback value to prevent form errors
        acc[fieldName] = "";
      }
    }

    logger.info("Process defaults initial state:", acc);
    return acc;
  }, [processDefaults, parameterNameMap]);

  return initialState;
};

/**
 * Hook to extract logic field values from process defaults
 * These control field visibility and readonly state
 */
export const useProcessLogicFields = (processDefaults?: ProcessDefaultsResponse | null) => {
  const logicFields = useMemo(() => {
    if (!processDefaults?.defaults) return {};

    const logic: Record<string, boolean> = {};
    const { defaults } = processDefaults;

    for (const [fieldName, value] of Object.entries(defaults)) {
      if (fieldName.endsWith('_display_logic')) {
        const baseFieldName = fieldName.replace('_display_logic', '');
        logic[`${baseFieldName}.display`] = value === "Y";
      } else if (fieldName.endsWith('_readonly_logic')) {
        const baseFieldName = fieldName.replace('_readonly_logic', '');
        logic[`${baseFieldName}.readonly`] = value === "Y";
      }
    }

    logger.debug("Process logic fields:", logic);
    return logic;
  }, [processDefaults]);

  return logicFields;
};

/**
 * Hook to extract filter expressions for dynamic selector behavior
 */
export const useProcessFilterExpressions = (processDefaults?: ProcessDefaultsResponse | null) => {
  const filterExpressions = useMemo(() => {
    if (!processDefaults?.filterExpressions) return {};

    logger.debug("Process filter expressions:", processDefaults.filterExpressions);
    return processDefaults.filterExpressions;
  }, [processDefaults]);

  return filterExpressions;
};

/**
 * Combined hook that provides all process defaults functionality
 */
export const useProcessDefaults = (
  processDefaults?: ProcessDefaultsResponse | null,
  parameters?: Record<string, ProcessParameter>
) => {
  const initialState = useProcessDefaultsInitialState(processDefaults, parameters);
  const logicFields = useProcessLogicFields(processDefaults);
  const filterExpressions = useProcessFilterExpressions(processDefaults);

  return {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent: processDefaults?.refreshParent || false
  };
};
