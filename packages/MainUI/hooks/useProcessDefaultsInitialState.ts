import { useMemo } from "react";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefaultsResponse } from "@/components/ProcessModal/types/ProcessParameterExtensions";
import {
  createParameterNameMap,
  processDefaultValueLegacy,
  extractLogicFields,
} from "@/utils/process/processDefaultsUtils";
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
    return createParameterNameMap(parameters);
  }, [parameters]);

  const initialState = useMemo(() => {
    if (!processDefaults?.defaults) return {};

    const acc = {} as EntityData;
    const { defaults } = processDefaults;

    // Process each default value
    for (const [fieldName, value] of Object.entries(defaults)) {
      const processed = processDefaultValueLegacy(fieldName, value, parameterNameMap);
      if (processed) {
        acc[processed.fieldName] = processed.fieldValue;
        if (processed.identifier) {
          acc[`${processed.fieldName}$_identifier`] = processed.identifier;
        }
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

    const logic = extractLogicFields(processDefaults.defaults);
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
    refreshParent: processDefaults?.refreshParent || false,
  };
};
