import { useMemo } from "react";
import { logger } from "@/utils/logger";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type {
  ProcessDefaultsResponse,
  ProcessDefaultValue,
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
  _parameters?: ProcessParameter[]
) => {
  const isLogicField = (name: string) =>
    name.endsWith('_display_logic') || name.endsWith('_readonly_logic');

  const processDefaultField = (
    acc: EntityData,
    fieldName: string,
    value: ProcessDefaultValue,
  ) => {
    // Skip logic fields (will be processed separately)
    if (isLogicField(fieldName)) return;

    // Use the original field name from server, not the parameter display name
    const formFieldName = fieldName;

    if (isReferenceValue(value)) {
      acc[formFieldName] = value.value;
      if (value.identifier) {
        acc[`${formFieldName}$_identifier`] = value.identifier;
      }
      logger.debug(`Mapped reference field ${fieldName} to ${formFieldName}:`, {
        value: value.value,
        identifier: value.identifier,
      });
      return;
    }

    if (isSimpleValue(value)) {
      acc[formFieldName] = typeof value === 'boolean' ? value : String(value);
      logger.debug(`Mapped simple field ${fieldName} to ${formFieldName}:`, {
        value: String(value),
        type: typeof value,
      });
      return;
    }

    // Fallback for unexpected value types
    logger.warn(`Unexpected value type for field ${fieldName}:`, value);
    if (typeof value === 'object' && value !== null) {
      acc[formFieldName] = JSON.stringify(value);
    } else {
      acc[formFieldName] = String(value || "");
    }
  };

  const buildInitialStateFromDefaults = (
    defaults: Record<string, ProcessDefaultValue>,
  ) => {
    const acc = {} as EntityData;
    for (const [fieldName, value] of Object.entries(defaults)) {
      try {
        processDefaultField(acc, fieldName, value);
      } catch (error) {
        logger.error(`Error processing default value for field ${fieldName}:`, error);
        acc[fieldName] = "";
      }
    }
    return acc;
  };

  const initialState = useMemo(() => {
    if (!processInitialization?.defaults) return null;

    const { defaults } = processInitialization;
    // If defaults is empty object, return empty object (not null)
    if (Object.keys(defaults).length === 0) return {};

    const acc = buildInitialStateFromDefaults(defaults);

    logger.debug("Process initial state:", {
      originalFields: Object.keys(defaults).length,
      processedFields: Object.keys(acc).length,
      fieldNames: Object.keys(acc),
    });

    return acc;
  }, [processInitialization]);

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
