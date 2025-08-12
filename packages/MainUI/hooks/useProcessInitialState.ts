import { useMemo } from "react";
import { logger } from "@/utils/logger";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefaultsResponse } from "@/components/ProcessModal/types/ProcessParameterExtensions";
import {
  createParameterMap,
  useProcessDefaultsWithParameterMap,
  extractLogicFields,
} from "@/utils/process/processDefaultsUtils";

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
    return createParameterMap(parameters);
  }, [parameters]);

  const { initialState } = useProcessDefaultsWithParameterMap(processInitialization, parameterMap);

  return initialState;
};

/**
 * Hook to extract logic field values from process defaults
 * These control field visibility and readonly state
 */
export const useProcessLogicFields = (processInitialization?: ProcessDefaultsResponse | null) => {
  const logicFields = useMemo(() => {
    if (!processInitialization?.defaults) return {};

    const logic = extractLogicFields(processInitialization.defaults);
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
  const parameterMap = useMemo(() => {
    return createParameterMap(parameters);
  }, [parameters]);

  const { initialState, logicFields, filterExpressions, refreshParent, hasData } = useProcessDefaultsWithParameterMap(
    processInitialization,
    parameterMap
  );

  return {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent,
    hasData,
  };
};
