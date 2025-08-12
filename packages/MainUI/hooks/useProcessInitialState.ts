import { useMemo } from "react";
import { logger } from "@/utils/logger";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type { 
  ProcessDefaultsResponse
} from "@/components/ProcessModal/types/ProcessParameterExtensions";
import { 
  isReferenceValue, 
  isSimpleValue 
} from "@/components/ProcessModal/types/ProcessParameterExtensions";

/**
 * Hook to convert ProcessDefaultsResponse to form initial state
 * Adapts the FormInitialState pattern for ProcessModal usage
 */
export const useProcessInitialState = (
  processInitialization?: ProcessDefaultsResponse | null,
  parameters?: ProcessParameter[]
) => {
  // Create parameter name mapping for efficient lookups
  const parameterMap = useMemo(() => {
    if (!parameters) return new Map<string, ProcessParameter>();
    
    const map = new Map<string, ProcessParameter>();
    parameters.forEach(param => {
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
    });
    return map;
  }, [parameters]);

  const processDefaultValue = (fieldName: string, value: DefaultValue, parameterMap: Map<string, ProcessParameter>): { fieldName: string; fieldValue: EntityValue; identifier?: string } | null => {
    try {
      // Skip logic fields (will be processed separately)
      if (fieldName.endsWith('_display_logic') || fieldName.endsWith('_readonly_logic')) {
        return null;
      }

      const formFieldName = fieldName;

      if (isReferenceValue(value)) {
        logger.debug(`Mapped reference field ${fieldName} to ${formFieldName}:`, {
          value: value.value,
          identifier: value.identifier
        });
        return {
          fieldName: formFieldName,
          fieldValue: value.value,
          identifier: value.identifier
        };
      }

      if (isSimpleValue(value)) {
        const processedValue = typeof value === 'boolean' ? value : String(value);
        logger.debug(`Mapped simple field ${fieldName} to ${formFieldName}:`, {
          value: String(value),
          type: typeof value
        });
        return {
          fieldName: formFieldName,
          fieldValue: processedValue
        };
      }

      // Fallback for unexpected value types
      logger.warn(`Unexpected value type for field ${fieldName}:`, value);
      const fallbackValue = typeof value === 'object' && value !== null 
        ? JSON.stringify(value) 
        : String(value || "");
      
      return {
        fieldName: formFieldName,
        fieldValue: fallbackValue
      };
    } catch (error) {
      logger.error(`Error processing default value for field ${fieldName}:`, error);
      const parameter = parameterMap.get(fieldName);
      const formFieldName = parameter?.name || fieldName;
      return {
        fieldName: formFieldName,
        fieldValue: ""
      };
    }
  };

  const initialState = useMemo(() => {
    if (!processInitialization?.defaults) return null;
    
    // If defaults is empty object, return empty object (not null)
    if (Object.keys(processInitialization.defaults).length === 0) return {};

    const acc = {} as EntityData;
    const { defaults } = processInitialization;

    // Process each default value
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

    logger.debug("Process initial state:", {
      originalFields: Object.keys(defaults).length,
      processedFields: Object.keys(acc).length,
      fieldNames: Object.keys(acc)
    });

    return acc;
  }, [processInitialization, parameterMap]);

  return initialState;
};

/**
 * Hook to extract logic field values from process defaults
 * These control field visibility and readonly state
 */
export const useProcessLogicFields = (processInitialization?: ProcessDefaultsResponse | null) => {
  const logicFields = useMemo(() => {
    if (!processInitialization?.defaults) return {};

    const logic: Record<string, boolean> = {};
    const { defaults } = processInitialization;

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
  }, [processInitialization]);

  return logicFields;
};

/**
 * Hook to extract filter expressions for dynamic selector behavior
 */
export const useProcessFilterExpressions = (processInitialization?: ProcessDefaultsResponse | null) => {
  const filterExpressions = useMemo(() => {
    if (!processInitialization?.filterExpressions) return {};

    logger.debug("Process filter expressions:", processInitialization.filterExpressions);
    return processInitialization.filterExpressions;
  }, [processInitialization]);

  return filterExpressions;
};

/**
 * Combined hook that provides all process initialization functionality
 * Similar to useFormInitialState but adapted for ProcessModal
 */
export const useProcessInitializationState = (
  processInitialization?: ProcessDefaultsResponse | null,
  parameters?: ProcessParameter[]
) => {
  const initialState = useProcessInitialState(processInitialization, parameters);
  const logicFields = useProcessLogicFields(processInitialization);
  const filterExpressions = useProcessFilterExpressions(processInitialization);

  return {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent: processInitialization?.refreshParent || false,
    hasData: !!initialState && Object.keys(initialState).length > 0
  };
};
