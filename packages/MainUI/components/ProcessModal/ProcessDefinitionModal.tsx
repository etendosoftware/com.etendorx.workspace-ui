/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
/**
 * @fileoverview ProcessDefinitionModal - Modal component for executing Etendo process definitions
 *
 * This component provides a comprehensive interface for executing different types of processes:
 * - Window Reference Processes: Processes that display a grid for record selection
 * - Direct Java Processes: Processes executed directly via servlet calls
 * - String Function Processes: Processes executed via client-side JavaScript functions
 *
 * The modal handles:
 * - Parameter rendering with various input types
 * - Default value loading via DefaultsProcessActionHandler
 * - Process execution with proper error handling
 * - Response message display and success/error states
 *
 */
import { useTabContext } from "@/contexts/tab";
import { useProcessConfig } from "@/hooks/datasource/useProcessDatasourceConfig";
import { useProcessInitialization } from "@/hooks/useProcessInitialization";
import { useProcessInitializationState } from "@/hooks/useProcessInitialState";
import { useSelected } from "@/hooks/useSelected";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import type { ExecuteProcessResult } from "@/app/actions/process";
import { revalidateDopoProcess } from "@/app/actions/revalidate"; // Import revalidation action
import { buildPayloadByInputName, buildProcessPayload } from "@/utils";
import {
  BUTTON_LIST_REFERENCE_ID,
  PROCESS_DEFINITION_DATA,
  WINDOW_SPECIFIC_KEYS,
  PROCESS_TYPES,
} from "@/utils/processes/definition/constants";
import { executeStringFunction } from "@/utils/functions";
import { logger } from "@/utils/logger";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { convertToISODateFormat } from "@/utils/process/processDefaultsUtils";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import Modal from "../Modal";
import Loading from "../loading";
import WindowReferenceGrid from "./WindowReferenceGrid";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";
import Button from "../../../ComponentLibrary/src/components/Button/Button";
import type { ProcessDefinitionModalContentProps, ProcessDefinitionModalProps, RecordValues } from "./types";
import type { Tab, ProcessParameter, EntityData } from "@workspaceui/api-client/src/api/types";
import { mapKeysWithDefaults } from "@/utils/processes/manual/utils";
import { useProcessCallouts } from "./callouts/useProcessCallouts";
import { evaluateParameterDefaults } from "@/utils/process/evaluateParameterDefaults";
import { buildProcessParameters } from "@/utils/process/processPayloadMapper";
import {
  DEFAULT_BULK_COMPLETION_ONLOAD,
  isBulkCompletionProcess,
} from "@/utils/process/bulkCompletionUtils";

// Date field reference codes for conversion
const DATE_REFERENCE_CODES = [
  FIELD_REFERENCE_CODES.DATE, // "15"
  FIELD_REFERENCE_CODES.DATETIME, // "16"
  FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME, // UUID
];

/**
 * Checks if a parameter reference is a date/time field
 */
const isDateReference = (reference: string): boolean => {
  return (
    DATE_REFERENCE_CODES.includes(reference as (typeof DATE_REFERENCE_CODES)[number]) ||
    reference.toLowerCase().includes("date") ||
    reference.toLowerCase().includes("time")
  );
};

/** Fallback object for record values when no record context exists */
export const FALLBACK_RESULT = {};

/** Reference ID for window reference field types */
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW;

export type GridSelectionStructure = {
  [entityName: string]: {
    _selection: EntityData[];
    _allRows: EntityData[];
  };
};

export type GridSelectionUpdater = GridSelectionStructure | ((prev: GridSelectionStructure) => GridSelectionStructure);

type AutoSelectLogic = {
  field?: string;
  operator?: string; // '=', '!=', '>', '<', 'in'
  value?: string | number | boolean | string[] | number[] | symbol | null;
  valueFromContext?: string;
  ids?: string[]; // alternative to logic by field
};

type AutoSelectConfig = {
  table?: string; // key used in gridSelection (dBColumnName or entityName)
  logic?: AutoSelectLogic;
  _gridSelection?: Record<string, string[]>; // backward-compatible payload
};

/**
 * Converts a date field value to ISO format if needed
 * @param fieldValue - The field value to convert
 * @returns The converted value or original if no conversion needed
 */
const convertDateFieldValue = (fieldValue: unknown): unknown => {
  if (!fieldValue || typeof fieldValue !== "string") {
    return fieldValue;
  }

  const originalValue = String(fieldValue);
  const convertedValue = convertToISODateFormat(originalValue);

  return convertedValue !== originalValue ? convertedValue : fieldValue;
};

/**
 * Converts date fields in combined data for a single parameter
 * @param combined - The combined data object
 * @param param - The parameter to process
 */
const convertParameterDateFields = (combined: Record<string, unknown>, param: ProcessParameter): void => {
  // Convert by parameter name
  if (combined[param.name]) {
    combined[param.name] = convertDateFieldValue(combined[param.name]);
  }

  // Convert by dBColumnName if different from name
  if (param.dBColumnName && param.dBColumnName !== param.name && combined[param.dBColumnName]) {
    combined[param.dBColumnName] = convertDateFieldValue(combined[param.dBColumnName]);
  }
};
/**
 * ProcessDefinitionModalContent - Core modal component for process execution
 *
 * Handles three types of process execution:
 * 1. Window Reference Processes - Displays a grid for record selection
 * 2. Direct Java Processes - Executes servlet directly using javaClassName
 * 3. String Function Processes - Executes client-side JavaScript functions
 *
 * @param props - Component props
 * @param props.onClose - Callback when modal is closed
 * @param props.button - Process definition button configuration
 * @param props.open - Modal visibility state
 * @param props.onSuccess - Optional callback when process completes successfully
 * @returns JSX.Element Modal component with process execution interface
 */
function ProcessDefinitionModalContent({ onClose, button, open, onSuccess, type }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const { session, token, getCsrfToken } = useUserContext();

  const [processDefinition, setProcessDefinition] = useState(button.processDefinition);
  const { onProcess, onLoad } = processDefinition;
  const processId = processDefinition.id;
  const javaClassName = processDefinition.javaClassName;

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [result, setResult] = useState<ExecuteProcessResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const [gridSelection, setGridSelectionInternal] = useState<GridSelectionStructure>({});
  const [shouldTriggerSuccess, setShouldTriggerSuccess] = useState(false);

  // Wrapper to log all gridSelection changes
  const setGridSelection = useCallback((updater: GridSelectionUpdater) => {
    setGridSelectionInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      logger.debug("[PROCESS_DEBUG] gridSelection changed:", {
        prevKeys: Object.keys(prev),
        nextKeys: Object.keys(next),
        changes: Object.entries(next).map(([name, data]) => ({
          name,
          selectionCount: data._selection?.length || 0,
          allRowsCount: data._allRows?.length || 0,
        })),
      });
      return next;
    });
  }, []);

  // NEW: autoSelectConfig state to hold declarative selection instructions OR backward-compatible _gridSelection
  const [autoSelectConfig, setAutoSelectConfig] = useState<AutoSelectConfig | null>(null);
  const [autoSelectApplied, setAutoSelectApplied] = useState(false);
  const [availableButtons, setAvailableButtons] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);

    if (buttonListParam && buttonListParam.refList) {
      setAvailableButtons(
        buttonListParam.refList.map((item) => ({
          value: item.value,
          label: item.label,
        }))
      );
    } else {
      setAvailableButtons([]);
    }
  }, [parameters]);

  // Handle case when modal is opened from sidebar (no tab context)
  const selectedRecords = useMemo(() => (tab ? graph.getSelectedMultiple(tab) : []), [graph, tab]);
  const firstWindowReferenceParam = useMemo(() => {
    return Object.values(parameters).find((param) => param.reference === WINDOW_REFERENCE_ID);
  }, [parameters]);

  const windowReferenceTab = firstWindowReferenceParam?.window?.tabs?.[0] as Tab;
  const tabId = windowReferenceTab?.id || "";
  const windowId = tab?.window || "";

  const recordValues: RecordValues | null = useMemo(() => {
    if (!record || !tab?.fields) return FALLBACK_RESULT;
    return buildPayloadByInputName(record, tab.fields);
  }, [record, tab?.fields]);

  const hasWindowReference = useMemo(() => {
    return Object.values(parameters).some((param) => param.reference === WINDOW_REFERENCE_ID);
  }, [parameters]);

  const {
    fetchConfig,
    loading: processConfigLoading,
    error: processConfigError,
    config: processConfig,
  } = useProcessConfig({
    processId: processId || "",
    windowId: windowId || "",
    tabId,
    javaClassName,
  });

  // Process initialization for default values (adapted from FormInitialization pattern)
  const {
    processInitialization,
    loading: initializationLoading,
    error: initializationError,
  } = useProcessInitialization({
    processId: processId || "",
    windowId: windowId || "",
    recordId: record?.id ? String(record.id) : undefined, // Convert EntityValue to string
    // Allow loading process defaults even without windowId (when opened from sidebar)
    enabled: !!processId && open,
    record: record || undefined, // Pass complete record data
    tab: tab || undefined, // Pass tab metadata
    type,
  });

  // Process form initial state (similar to useFormInitialState)
  // Memoize parameters to prevent infinite re-execution
  const memoizedParameters = useMemo(() => Object.values(parameters), [parameters]);

  const {
    initialState,
    logicFields,
    filterExpressions,
    hasData: hasInitialData,
  } = useProcessInitializationState(
    processInitialization,
    memoizedParameters // Use memoized version to prevent infinite loops
  );

  const isBulkCompletion = useMemo(
    () => isBulkCompletionProcess(processDefinition, parameters),
    [processDefinition, parameters]
  );

  // Combined form data: record values + process defaults (similar to FormView pattern)
  const availableFormData = useMemo(() => {
    // If no record or tab (e.g. sidebar process), just use the defaults
    if (!record || !tab) {
      const combined = { ...initialState };

      // Evaluate defaultValue expressions for parameters that don't have API defaults
      const evaluatedDefaults = evaluateParameterDefaults(parameters, session || {}, combined);
      Object.assign(combined, evaluatedDefaults);

      // Still need to convert dates for specific parameters
      const parametersList = Object.values(parameters);
      for (const param of parametersList) {
        const isDateField = param.reference && isDateReference(param.reference);
        if (isDateField) {
          convertParameterDateFields(combined, param);
        }
      }
      return combined;
    }

    // Build base payload with system context fields
    const basePayload = buildProcessPayload(record, tab, {}, {});

    const combined = {
      ...basePayload,
      ...initialState,
    };

    // Evaluate defaultValue expressions for parameters that don't have API defaults
    const evaluatedDefaults = evaluateParameterDefaults(parameters, session || {}, combined);
    Object.assign(combined, evaluatedDefaults);

    // Convert date fields to ISO format for all parameters
    // This ensures date inputs display values correctly regardless of source (record or defaults)
    const parametersList = Object.values(parameters);

    for (const param of parametersList) {
      // Check if parameter is a date field by reference code OR by name containing "date"/"time"
      const isDateField = param.reference && isDateReference(param.reference);

      if (isDateField) {
        convertParameterDateFields(combined, param);
      }
    }

    return combined;
  }, [record, tab, initialState, parameters, session]);

  const form = useForm({
    defaultValues: availableFormData as any,
    mode: "onChange",
  });

  useEffect(() => {
    const hasFormData = Object.keys(availableFormData).length > 0;
    if (hasFormData) {
      logger.debug("[PROCESS_DEBUG] Resetting form with availableFormData:", {
        keys: Object.keys(availableFormData),
        hasGrids: Object.keys(availableFormData).some(
          (k) => k === "order_invoice" || k === "credit_to_use" || k === "glitem"
        ),
        sample: JSON.stringify(availableFormData).substring(0, 300),
      });
      form.reset(availableFormData);
    }
  }, [availableFormData, form]);

  // Initialize gridSelection from filterExpressions
  // This dynamically creates grid structures based on what the backend returns
  // Dependencies include 'open' to reset on each modal open
  useEffect(() => {
    if (open && filterExpressions && Object.keys(filterExpressions).length > 0) {
      const initialGrids: GridSelectionStructure = {};

      // Create empty grid structure for each key in filterExpressions
      for (const gridName of Object.keys(filterExpressions)) {
        initialGrids[gridName] = {
          _selection: [],
          _allRows: [],
        };
      }

      setGridSelection(initialGrids);
      logger.debug("[PROCESS_DEBUG] Initialized gridSelection from filterExpressions:", {
        gridNames: Object.keys(initialGrids),
        filterExpressions,
      });
    } else if (!open) {
      // Reset gridSelection when modal closes
      setGridSelection({});
    }
  }, [open, filterExpressions, setGridSelection]);

  // Reactive view into form state (submitting)
  const { isSubmitting } = useFormState({ control: form.control });

  // Watch all form values to trigger re-validation when any field changes
  const formValues = form.watch();

  // Process callouts - execute when form values change
  useProcessCallouts({
    processId: processId || "",
    form,
    gridSelection,
    enabled: open && !loading && !initializationLoading,
  });

  // NOTE: globalCalloutManager.isCalloutRunning() not working correctly
  // const isDataLoading = Boolean(
  //   initializationLoading || !globalCalloutManager.arePendingCalloutsEmpty() // || globalCalloutManager.isCalloutRunning()
  // );

  // If initialization failed, keep the button disabled until user action

  const initializationBlocksSubmit = Boolean(initializationError);
  // Check if there are mandatory parameters without value in the form
  // Only validate after initial loading is complete

  const hasMandatoryParametersWithoutValue = useMemo(() => {
    if (loading || initializationLoading) {
      return false;
    }

    // Use formValues from watch() to get reactive values
    const willBlock = Object.values(parameters).some((p) => {
      if (!p.mandatory) {
        return false;
      }

      // If parameter has a defaultValue, don't block - it should be auto-filled
      if (p.defaultValue) {
        return false;
      }

      // Get the field value from form
      // IMPORTANT: Fields are registered with parameter.name, not dBColumnName
      const fieldValue = formValues[p.name as keyof typeof formValues] as unknown;

      // If the field is registered in the form (not undefined in formValues object)
      // then it means it was rendered and we should validate it
      const fieldIsRegistered = p.name in formValues;

      // Only validate fields that are actually registered in the form
      // If not registered, it means ProcessParameterSelector didn't render it (displayLogic = false)
      if (!fieldIsRegistered) {
        return false;
      }

      // Check if value is empty (null, undefined, empty string, empty array)
      const isEmpty =
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0);

      // Block if mandatory field is empty
      return isEmpty;
    });

    return willBlock;
  }, [loading, initializationLoading, parameters, formValues]);

  const handleClose = useCallback(() => {
    if (isPending) return;

    setResult(null);
    setLoading(true);
    setParameters(processDefinition.parameters);
    setShouldTriggerSuccess(false);
    onClose();
  }, [button.processDefinition.parameters, isPending, onClose]);

  const handleSuccessClose = useCallback(() => {
    if (isPending) return;

    // Trigger refresh when closing success modal
    if (shouldTriggerSuccess) {
      onSuccess?.();
    }

    setResult(null);
    setLoading(true);
    setParameters(processDefinition.parameters);
    setShouldTriggerSuccess(false);
    onClose();
  }, [button.processDefinition.parameters, isPending, onClose, shouldTriggerSuccess, onSuccess]);

  const extractMessageFromProcessView = useCallback((res: ExecuteProcessResult) => {
    const data = res.data;
    const responseActions =
      data?.responseActions || data?.response?.responseActions || data?.response?.data?.responseActions;

    if (!responseActions) return null;

    let actionWithMsg;
    if (Array.isArray(responseActions)) {
      actionWithMsg = responseActions.find((action: any) => action.showMsgInProcessView);
    } else if (typeof responseActions === "object") {
      actionWithMsg = responseActions;
    }

    const msgView = actionWithMsg?.showMsgInProcessView;

    if (!msgView) return null;

    return {
      message: msgView.msgText,
      messageType: msgView.msgType,
    };
  }, []);

  const extractMessageFromData = useCallback((res: ExecuteProcessResult) => {
    // Handle nested response error structure
    if (res.data?.response?.error) {
      return {
        message: res.data.response.error.message,
        messageType: "error",
      };
    }

    if (res.data && typeof res.data === "object" && "text" in res.data) {
      return {
        message: res.data.text,
        messageType: res.data.severity || "success",
      };
    }

    const potentialMessage = res.data?.message || res.data?.msgText || res.data?.responseMessage;

    if (potentialMessage && typeof potentialMessage === "object" && "text" in potentialMessage) {
      return {
        message: potentialMessage.text,
        messageType: potentialMessage.severity || "success",
      };
    }

    return {
      message: potentialMessage,
      messageType: res.data?.msgType || res.data?.messageType || (res.success ? "success" : "error"),
    };
  }, []);

  const parseProcessResponse = useCallback(
    (res: ExecuteProcessResult) => {
      const viewMessage = extractMessageFromProcessView(res);
      const { message, messageType } = viewMessage || extractMessageFromData(res);

      return {
        success: res.success && messageType === "success",
        data: message,
        error: messageType !== "success" ? message || res.error : undefined,
      };
    },
    [extractMessageFromProcessView, extractMessageFromData]
  );

  /**
   * Builds process-specific payload fields based on process configuration
   */
  const buildProcessSpecificFields = useCallback(
    (processId: string): Record<string, unknown> => {
      const currentAttrs = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
      if (!currentAttrs || !recordValues) {
        return {};
      }

      const currentRecordValue = recordValues[currentAttrs.inpPrimaryKeyColumnId];
      const fields: Record<string, unknown> = {
        [currentAttrs.inpColumnId]: currentRecordValue,
        [currentAttrs.inpPrimaryKeyColumnId]: currentRecordValue,
      };

      // Add additional payload fields from process configuration
      if (currentAttrs.additionalPayloadFields) {
        for (const fieldName of currentAttrs.additionalPayloadFields) {
          if (recordValues[fieldName] !== undefined) {
            fields[fieldName] = recordValues[fieldName];
          }
        }
      }

      return fields;
    },
    [recordValues]
  );

  /**
   * Builds window-specific payload fields based on window configuration
   */
  const buildWindowSpecificFields = useCallback(
    (windowId: string): Record<string, unknown> => {
      const windowSpecificKey = WINDOW_SPECIFIC_KEYS[windowId];
      if (!windowSpecificKey) {
        return {};
      }

      return {
        [windowSpecificKey.key]: windowSpecificKey.value(record),
      };
    },
    [record]
  );

  /**
   * Executes processes with window reference parameters
   * Used for processes that require grid record selection
   * Calls servlet with selected grid records and process-specific data
   */
  /**
   * Common execution logic for Java-based processes (Window Reference & Direct Java)
   */
  const executeJavaProcess = useCallback(
    async (payload: any, logContext = "process") => {
      try {
        const baseUrl = "/api/erp/org.openbravo.client.kernel";
        const queryParams = new URLSearchParams();
        if (processId) queryParams.set("processId", processId);
        if (tab?.window) queryParams.set("windowId", tab.window.toString());
        if (javaClassName) queryParams.set("_action", javaClassName);

        const apiUrl = `${baseUrl}?${queryParams.toString()}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Authorization: `Bearer ${token}`,
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Execution failed");
        }

        let resultData = null;
        try {
          resultData = await response.json();
        } catch {}

        const res: ExecuteProcessResult = {
          success: true,
          data: resultData,
        };

        const parsedResult = parseProcessResponse(res);
        setResult(parsedResult);

        if (parsedResult.success) {
          await revalidateDopoProcess();
          setShouldTriggerSuccess(true);
        }
      } catch (error) {
        logger.warn(`Error executing ${logContext}:`, error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
    [processId, tab?.window, javaClassName, token, getCsrfToken, parseProcessResponse, revalidateDopoProcess]
  );

  const getMappedFormValues = useCallback(() => {
    const rawValues = form.getValues();
    const mappedValues: Record<string, any> = {};
    const paramMap = new Map<string, string>();

    Object.values(parameters).forEach((p: any) => {
      if (p.name && p.dBColumnName) {
        paramMap.set(p.name, p.dBColumnName);
      }
    });

    for (const [key, value] of Object.entries(rawValues)) {
      const mappedKey = paramMap.get(key) || key;
      mappedValues[mappedKey] = value;
    }
    return mappedValues;
  }, [form, parameters]);

  /**
   * Prepares grids for payload
   * Includes all grids that were initialized, but cleans up their structure:
   * - Grids with selections keep both _selection and _allRows
   * - Grids without selections get empty arrays to satisfy backend expectations
   */
  const getPopulatedGrids = useCallback(() => {
    const populated: GridSelectionStructure = {};

    logger.debug("[PROCESS_DEBUG] getPopulatedGrids - Input gridSelection:", {
      gridNames: Object.keys(gridSelection),
      details: Object.entries(gridSelection).map(([name, data]) => ({
        name,
        selectionCount: data._selection?.length || 0,
        allRowsCount: data._allRows?.length || 0,
      })),
    });

    for (const [gridName, gridData] of Object.entries(gridSelection)) {
      // Include all grids that exist in gridSelection
      // If no selection, send empty arrays to prevent backend errors
      if (gridData._selection && gridData._selection.length > 0) {
        // Grid has selections - include full data
        populated[gridName] = gridData;
      } else {
        // Grid has no selections - send empty structure
        populated[gridName] = {
          _selection: [],
          _allRows: gridData._allRows || [],
        };
      }
    }

    logger.debug("[PROCESS_DEBUG] getPopulatedGrids - Output populated grids:", {
      gridNames: Object.keys(populated),
      details: Object.entries(populated).map(([name, data]) => ({
        name,
        selectionCount: data._selection?.length || 0,
        allRowsLength: data._allRows?.length || 0,
      })),
    });

    return populated;
  }, [gridSelection]);

  /**
   * Executes processes with window reference parameters
   * Used for processes that require grid record selection
   * Calls servlet with selected grid records and process-specific data
   */
  const handleWindowReferenceExecute = useCallback(
    async (actionValue?: string) => {
      // Allow execution without tab context when opened from sidebar
      if (!processId) {
        return;
      }
      startTransition(async () => {
        const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
        const buttonParams = buttonListParam && actionValue ? { [buttonListParam.dBColumnName]: actionValue } : {};

        // Only include grids that have data
        const populatedGrids = getPopulatedGrids();

        logger.debug("[PROCESS_DEBUG] handleWindowReferenceExecute - Before building payload:", {
          formValuesKeys: Object.keys(form.getValues()),
          populatedGridsKeys: Object.keys(populatedGrids),
        });

        const formValues = form.getValues();
        const mappedValues = mapKeysWithDefaults({ ...formValues, ...populatedGrids });

        logger.debug("[PROCESS_DEBUG] handleWindowReferenceExecute - After mapKeysWithDefaults:", {
          mappedValuesKeys: Object.keys(mappedValues),
          hasGridsInMapped: Object.keys(mappedValues).some(
            (k) => k === "order_invoice" || k === "credit_to_use" || k === "glitem"
          ),
        });

        // Build base payload
        const payload: Record<string, unknown> = {
          recordIds: record?.id ? [record.id] : [],
          _buttonValue: actionValue || "DONE",
          _params: {
            ...mappedValues,
            ...buttonParams,
          },
          _entityName: tab?.entityName || "",
          windowId: tab?.window || "",
          ...buildProcessSpecificFields(processId),
          ...(tab?.window ? buildWindowSpecificFields(tab.window) : {}),
        };

        const params = payload._params as Record<string, unknown>;
        logger.debug("[PROCESS_DEBUG] handleWindowReferenceExecute - Final payload:", {
          payloadKeys: Object.keys(payload),
          paramsKeys: Object.keys(params),
          gridsInParams: Object.keys(params).filter(
            (k) => k === "order_invoice" || k === "credit_to_use" || k === "glitem"
          ),
          orderInvoiceStructure: params.order_invoice
            ? {
                hasSelection: !!(params.order_invoice as any)._selection,
                selectionLength: ((params.order_invoice as any)._selection || []).length,
                hasAllRows: !!(params.order_invoice as any)._allRows,
                allRowsLength: ((params.order_invoice as any)._allRows || []).length,
                fullStructure: JSON.stringify(params.order_invoice).substring(0, 300),
              }
            : "NOT PRESENT",
          payloadSample: JSON.stringify(payload).substring(0, 500),
        });

        await executeJavaProcess(payload, "process");
      });
    },
    [
      tab,
      processId,
      parameters,
      record,
      buildProcessSpecificFields,
      buildWindowSpecificFields,
      executeJavaProcess,
      getMappedFormValues,
      initialState,
      getPopulatedGrids,
    ]
  );

  /**
   * Executes processes directly via servlet using javaClassName
   * Used for processes that have javaClassName but no onProcess function
   * Bypasses client-side JavaScript execution and calls servlet directly
   */
  const handleDirectJavaProcessExecute = useCallback(
    async (actionValue?: string) => {
      // Allow execution without tab context when opened from sidebar
      if (!processId || !javaClassName) {
        return;
      }

      const windowConfig = windowId ? WINDOW_SPECIFIC_KEYS[windowId] : null;
      const extraKey = windowConfig ? { [windowConfig.key]: windowConfig.value(record) } : {};

      startTransition(async () => {
        const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
        const buttonParams = buttonListParam && actionValue ? { [buttonListParam.dBColumnName]: actionValue } : {};

        // Only include grids that have data
        const populatedGrids = getPopulatedGrids();

        // Determine record IDs to send
        // Prioritize explicit selection, fall back to current record contex
        let recordIds: string[] = [];
        if (selectedRecords && selectedRecords.length > 0) {
          recordIds = selectedRecords.map((r) => String(r.id));
        } else if (record?.id) {
          recordIds = [String(record.id)];
        }

        const mappedFormValues = getMappedFormValues();

        const payload = {
          recordIds,
          _buttonValue: actionValue || "DONE",
          _params: {
            ...mapKeysWithDefaults({ ...recordValues, ...extraKey, ...mappedFormValues, ...populatedGrids }),
            ...buttonParams,
          },
        };

        await executeJavaProcess(payload, "direct Java process");
      });
    },
    [
      processId,
      javaClassName,
      windowId,
      record,
      selectedRecords,
      recordValues,
      parameters,
      executeJavaProcess,
      getMappedFormValues,
      initialState,
      getPopulatedGrids,
    ]
  );

  /**
   * Main process execution handler - routes to appropriate execution method
   *
   * Execution Priority:
   * 1. Window Reference Process (hasWindowReference = true)
   * 2. Direct Java Process (javaClassName exists, no onProcess)
   * 3. String Function Process (onProcess exists)
   */
  const handleExecute = useCallback(
    async (actionValue?: string) => {
      setResult(null);
      if (hasWindowReference) {
        await handleWindowReferenceExecute(actionValue);
        return;
      }

      // If process has javaClassName but no onProcess, execute directly via servlet
      if (!onProcess && javaClassName) {
        await handleDirectJavaProcessExecute(actionValue);
        return;
      }

      if (!onProcess || !tab) {
        return;
      }

      startTransition(async () => {
        // Build complete payload with all context fields
        const completePayload = buildProcessPayload(
          record || {}, // Complete record data (fallback to empty object)
          tab, // Tab metadata
          initialState || {}, // Process defaults from server (handle null case)
          (() => {
            const formValues = form.getValues();
            return formValues;
          })() // User input from form
        );

        const stringFunctionPayload = {
          _buttonValue: actionValue || "DONE",
          buttonValue: actionValue || "DONE",
          windowId: tab.window,
          tabId: tab?.id || tabId || "",
          entityName: tab.entityName,
          recordIds: selectedRecords?.map((r) => r.id),
          ...completePayload, // Use complete payload instead of just form values
        };

        try {
          const stringFnResult = await executeStringFunction(
            onProcess,
            { Metadata },
            button.processDefinition,
            stringFunctionPayload
          );

          const responseMessage = stringFnResult.responseActions[0].showMsgInProcessView;
          const success = responseMessage.msgType === "success";
          setResult({ success, data: responseMessage, error: success ? undefined : responseMessage.msgText });
          if (success) {
            setShouldTriggerSuccess(true);
          }
        } catch (error) {
          logger.warn("Error executing process:", error);
          setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
        }
      });
    },
    [
      hasWindowReference,
      handleWindowReferenceExecute,
      handleDirectJavaProcessExecute,
      onProcess,
      javaClassName,
      tab,
      tabId,
      record,
      initialState,
      button.processDefinition,
      selectedRecords,
      form,
    ]
  );

  /**
   * Handler for REPORT_AND_PROCESS type execution with polling
   * 1. Execute process via POST -> returns pInstanceId
   * 2. Poll status every 3s until isProcessing is false
   */
  const handleReportProcessExecute = useCallback(async () => {
    startTransition(async () => {
      try {
        const formValues = form.getValues();
        const formParameters = buildProcessParameters(formValues, parameters);

        // Execute process
        const response = await fetch("/api/process/report-and-process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            processId: button.processDefinition.id,
            parameters: formParameters,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setResult({ success: false, error: errorData.error || "Process execution failed" });
          return;
        }

        const { pInstanceId } = await response.json();

        // Poll for completion every 3 seconds
        const pollStatus = async (): Promise<void> => {
          const statusRes = await fetch(`/api/process/report-and-process/${pInstanceId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!statusRes.ok) {
            setResult({ success: false, error: "Failed to check process status" });
            return;
          }

          const status = await statusRes.json();

          if (status.isProcessing) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await pollStatus();
            return;
          }

          // Process completed
          const success = status.result === 1;
          setResult({
            success,
            data: status.errorMsg,
            error: success ? undefined : status.errorMsg,
          });

          if (success) {
            setShouldTriggerSuccess(true);
          }
        };

        await pollStatus();
      } catch (error) {
        logger.error("Report process execution error:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [form, button.processDefinition.id, token, parameters]);

  useEffect(() => {
    if (open && hasWindowReference) {
      const loadConfig = async () => {
        const combinedPayload = {
          ...recordValues,
          ...session,
        };
        await fetchConfig(combinedPayload);
      };

      loadConfig();
    }
  }, [fetchConfig, recordValues, session, tabId, open, hasWindowReference]);

  // Note: Default values are now handled by availableFormData (FormInitialization pattern)
  // This replaces the previous processConfig.defaults logic with comprehensive
  // DefaultsProcessActionHandler integration including mixed types and logic fields

  // Handle initialization errors and logging
  useEffect(() => {
    if (initializationError) {
      logger.warn("Process initialization error:", initializationError);
    }

    if (hasInitialData) {
      logger.debug("Process defaults loaded successfully", {
        processId,
        fieldsCount: Object.keys(initialState || {}).length,
        hasLogicFields: Object.keys(logicFields || {}).length > 0,
        hasFilterExpressions: Object.keys(filterExpressions || {}).length > 0,
      });
    }
  }, [initializationError, hasInitialData, processId, initialState, logicFields, filterExpressions]);

  // Load process definition metadata when opened from sidebar (parameters are empty)
  useEffect(() => {
    const loadProcessMetadata = async () => {
      // Check if parameters are empty (opened from sidebar)
      const hasParameters = Object.keys(button.processDefinition.parameters).length > 0;
      if (!open || hasParameters || !processId || loadingMetadata) {
        return;
      }

      try {
        setLoadingMetadata(true);
        setLoading(true);

        // Fetch process definition metadata using the new /meta/process endpoint
        const slug = type === PROCESS_TYPES.PROCESS_DEFINITION ? "meta/process" : "meta/report-and-process";
        const response = await Metadata.client.post(`${slug}/${processId}`);

        if (response.ok && response.data) {
          const processData = response.data;

          // Update parameters from the loaded metadata
          if (processData.parameters) {
            setParameters(processData.parameters);
            logger.debug("Process metadata loaded successfully", {
              processId,
              paramCount: Object.keys(processData.parameters).length,
            });
          }

          // Also update other process definition properties if needed
          // The modal will use these updated values
          setProcessDefinition((prev) => ({
            ...prev,
            ...processData,
            parameters: processData.parameters || prev.parameters,
          }));
        }
      } catch (error) {
        logger.warn("Error loading process metadata:", error);
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadProcessMetadata();
  }, [open, processId, button.processDefinition.parameters, type]);

  useEffect(() => {
    if (open) {
      setResult(null);
      setParameters(button.processDefinition.parameters);

      // Grid selection initialization is now handled by the filterExpressions effect (lines 338-359)
      // This ensures dynamic initialization based on backend response

      // clear any previous auto select when opening
      setAutoSelectConfig(null);
      setAutoSelectApplied(false);
    }
  }, [button.processDefinition.parameters, open]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!open) return;

      try {
        setLoading(true);

        const effectiveOnLoad = onLoad || (isBulkCompletion ? DEFAULT_BULK_COMPLETION_ONLOAD : null);

        if (effectiveOnLoad && tab) {
          const result = await executeStringFunction(effectiveOnLoad, { Metadata }, button.processDefinition, {
            selectedRecords,
            tabId: tab.id || "",
            tableId: tab.table || "",
          });

          // If result is undefined/null, skip
          const safeResult = result || {};

          // If backend returns a legacy `_gridSelection` mapping (ids), apply it directly (backward compatibility)
          if (safeResult._gridSelection && typeof safeResult._gridSelection === "object") {
            // Merge into gridSelection state
            setGridSelection((prev) => {
              const next = { ...prev };
              for (const [key, ids] of Object.entries(safeResult._gridSelection as Record<string, string[]>)) {
                // keep existing _allRows if present, but overwrite _selection with EntityData array
                next[key] = {
                  ...(next[key] || { _selection: [], _allRows: [] }),
                  _selection: Array.isArray(ids)
                    ? ids.map(
                        (id) =>
                          ({
                            id: String(id),
                          }) as EntityData
                      )
                    : [],
                };
              }
              return next;
            });
          }

          // If backend returns an autoSelectConfig, store it
          if (safeResult.autoSelectConfig) {
            setAutoSelectConfig(safeResult.autoSelectConfig as AutoSelectConfig);
          }

          setParameters((prev) => {
            const newParameters = { ...prev };

            for (const [parameterName, values] of Object.entries(safeResult)) {
              if (["_gridSelection", "autoSelectConfig"].includes(parameterName)) continue;

              if (!newParameters[parameterName]) continue;

              try {
                const isArray = Array.isArray(values);
                const newOptions = isArray ? (values as string[]) : [values as string];

                newParameters[parameterName] = { ...newParameters[parameterName] };

                if (Array.isArray(newParameters[parameterName].refList)) {
                  newParameters[parameterName].refList = newParameters[parameterName].refList.filter((option) =>
                    newOptions.includes(option.value)
                  );
                }
              } catch (e) {
                logger.warn("Malformed parameter data from onLoad for", parameterName, e);
              }
            }

            return newParameters;
          });
        }

        setTimeout(() => {
          setLoading(false);
        }, 300);
      } catch (error) {
        logger.warn("Error loading parameters:", error);
        setLoading(false);
      }
    };

    fetchOptions();
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, setGridSelection, isBulkCompletion]);

  /**
   * NEW useEffect:
   * Applies autoSelectConfig when:
   *  - autoSelectConfig state is set OR legacy _gridSelection has been merged into gridSelection
   *  - and the corresponding grid's _allRows have been populated by WindowReferenceGrid (via onSelectionChange)
   *
   * The logic supports:
   *  - autoSelectConfig._gridSelection: mapping table -> [ids]
   *  - autoSelectConfig.table + autoSelectConfig.logic: declarative selection
   */
  useEffect(() => {
    if (!autoSelectConfig || autoSelectApplied) return;

    // If autoSelectConfig contains legacy _gridSelection mapping, handle quickly
    if (autoSelectConfig._gridSelection) {
      // Merge into gridSelection (ids already set previously, but ensure structure)
      setGridSelection((prev) => {
        const next = { ...prev };
        for (const [tableKey, ids] of Object.entries(autoSelectConfig._gridSelection || {})) {
          next[tableKey] = {
            ...(next[tableKey] || { _selection: [], _allRows: [] }),
            _selection: Array.isArray(ids)
              ? ids.map(
                  (id) =>
                    ({
                      id: String(id),
                    }) as EntityData
                )
              : [],
          };
        }
        return next;
      });
      setAutoSelectApplied(true);
      return;
    }

    const tableKey = autoSelectConfig.table;
    const logic = autoSelectConfig.logic;
    if (!tableKey || !logic) return;

    const target = gridSelection[tableKey];
    if (!target || !Array.isArray(target._allRows) || target._allRows.length === 0) {
      // no rows yet — wait until WindowReferenceGrid calls onSelectionChange and updates gridSelection
      return;
    }

    // Determine value to compare (literal or from context)
    let valueToCompare = logic.value;
    if (logic.valueFromContext) {
      const selected = Object.values(selectedRecords || {})[0];
      valueToCompare = selected?.[logic.valueFromContext];
    }

    // If logic contains explicit ids => select by ids directly
    if (Array.isArray(logic.ids) && logic.ids.length > 0) {
      const idsSet = new Set(logic.ids.map((id) => String(id)));
      const matched = target._allRows.filter((row: unknown) => {
        const record = row as Record<string, unknown>;
        return idsSet.has(String(record?.id ?? record?.ID ?? record?.Id ?? row));
      });
      if (matched.length > 0) {
        setGridSelection((prev) => ({
          ...prev,
          [tableKey]: {
            ...prev[tableKey],
            _selection: matched,
          },
        }));
        logger.debug(`Auto-selection applied on table ${tableKey} by explicit ids (${matched.length})`);
        setAutoSelectApplied(true);
      }
      return;
    }

    // Otherwise, apply operator-based selection using field comparison
    const matchedRows = target._allRows.filter((row: unknown) => {
      const record = row as Record<string, unknown>;
      const rowValue = record?.[logic.field as string];

      switch (logic.operator) {
        case "=":
        case "==":
          return rowValue === valueToCompare;
        case "!=":
        case "<>":
          return rowValue !== valueToCompare;
        case ">":
          return typeof rowValue === "number" && typeof valueToCompare === "number" && rowValue > valueToCompare;
        case "<":
          return typeof rowValue === "number" && typeof valueToCompare === "number" && rowValue < valueToCompare;
        case "in": {
          if (!Array.isArray(valueToCompare)) return false;
          const typedArray = valueToCompare as (string | number | boolean)[];
          return typedArray.some((val) => val === rowValue);
        }
        default:
          // default to strict equality if operator missing
          return rowValue === valueToCompare;
      }
    });

    if (matchedRows.length > 0) {
      setGridSelection((prev) => ({
        ...prev,
        [tableKey]: {
          ...prev[tableKey],
          _selection: matchedRows,
        },
      }));
      logger.debug(`Auto-selection applied on table ${tableKey} (${matchedRows.length} rows)`);
      setAutoSelectApplied(true);
    }
  }, [autoSelectConfig, autoSelectApplied, gridSelection, selectedRecords]);

  const renderResponse = () => {
    if (!result) return null;

    const isSuccessMessage = result.success;
    const msgTitle = isSuccessMessage ? t("process.completedSuccessfully") : t("process.processError");
    let msgText: string;
    if (isSuccessMessage) {
      msgText =
        typeof result.data === "string"
          ? (result.data as string)
          : result.data?.msgText || result.data?.message || t("process.completedSuccessfully");
    } else {
      msgText = result.error || result.data?.msgText || result.data?.message || t("errors.internalServerError.title");
    }

    const displayText = msgText.replace(/<br\s*\/?>/gi, "\n");

    // Success message styled like the reference image
    if (isSuccessMessage) {
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4"
            style={{ background: "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)" }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                <CheckIcon className="w-10 h-10 fill-green-600" data-testid="SuccessCheckIcon__761503" />
              </div>
              <h4 className="font-bold text-xl text-center text-green-800">{msgTitle}</h4>
              {displayText && displayText !== msgTitle && (
                <p className="text-sm text-center text-gray-700 whitespace-pre-line">{displayText}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Error message - keep the simple style
    return (
      <div className="p-3 rounded mb-4 border-l-4 bg-gray-50 border-(--color-etendo-main)">
        <h4 className="font-bold text-sm">{msgTitle}</h4>
        <p className="text-sm whitespace-pre-line">{displayText}</p>
      </div>
    );
  };

  const getTabForParameter = useCallback((parameter: ProcessParameter) => {
    if (parameter.reference !== WINDOW_REFERENCE_ID || !parameter.window?.tabs) {
      return null;
    }

    return parameter.window.tabs[0] as Tab;
  }, []);

  const renderParameters = () => {
    if (result?.success) return null;

    // Sort parameters by sequence number
    let parametersList = Object.values(parameters).sort(
      (a, b) => (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0)
    );

    // If bulk completion, only show DocAction
    if (isBulkCompletion) {
      parametersList = parametersList.filter(
        (p) => p.name === "DocAction" || p.dBColumnName === "DocAction" || p.name === "Document Actionn"
      );
    }

    const windowReferences: React.ReactElement[] = [];
    const selectors: React.ReactElement[] = [];

    // Separate window references from selectors
    for (const parameter of parametersList) {
      // Skip inactive parameters
      // @ts-ignore
      if (parameter.active === false) {
        continue;
      }

      if (parameter.reference === WINDOW_REFERENCE_ID) {
        const parameterTab = getTabForParameter(parameter);
        const parameterEntityName = parameterTab?.entityName || "";
        const parameterTabId = parameterTab?.id || "";
        windowReferences.push(
          <WindowReferenceGrid
            key={`window-ref-${parameter.id || parameter.name}`}
            parameter={parameter}
            parameters={parameters}
            onSelectionChange={setGridSelection}
            gridSelection={gridSelection}
            tabId={parameterTabId}
            entityName={parameterEntityName}
            windowReferenceTab={parameterTab || windowReferenceTab}
            processConfig={{
              processId: processConfig?.processId || "",
              ...processConfig,
              defaults: (processInitialization?.defaults || {}) as Record<
                string,
                { value: string; identifier: string }
              >,
            }}
            processConfigLoading={processConfigLoading}
            processConfigError={processConfigError}
            recordValues={recordValues}
            currentValues={formValues}
            data-testid="WindowReferenceGrid__761503"
          />
        );
      } else {
        selectors.push(
          <ProcessParameterSelector
            key={`param-${parameter.id || parameter.name}-${parameter.reference || "default"}`}
            parameter={parameter}
            logicFields={logicFields}
            data-testid="ProcessParameterSelector__761503"
          />
        );
      }
    }

    return (
      <>
        {/* Selectors in 3 column grid - matching FormView style */}
        {selectors.length > 0 && (
          <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2 mb-4">{selectors}</div>
        )}

        {/* Window references full width with spacing between tables */}
        {windowReferences.length > 0 && <div className="w-full flex flex-col gap-4">{windowReferences}</div>}
      </>
    );
  };

  const getActionButtonContent = () => {
    if (isPending) {
      return {
        icon: null,
        text: <span className="animate-pulse">{t("common.loading")}...</span>,
      };
    }

    if (result?.success) {
      return {
        icon: <CheckIcon fill="white" data-testid="CheckIcon__761503" />,
        text: t("process.completedSuccessfully"),
      };
    }

    return {
      icon: <CheckIcon fill="white" data-testid="CheckIcon__761503" />,
      text: t("common.execute"),
    };
  };

  const isActionButtonDisabled =
    isPending ||
    initializationBlocksSubmit ||
    hasMandatoryParametersWithoutValue ||
    isSubmitting ||
    !!result?.success ||
    (hasWindowReference && !gridSelection);

  return (
    <>
      {/* Main Process Modal */}
      {open && !result?.success && (
        <Modal open={open && !result?.success} onClose={handleClose} data-testid="Modal__761503">
          <FormProvider {...form} data-testid="FormProvider__761503">
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold">{button.name}</h3>
                    {button.processDefinition.description && (
                      <p className="text-sm text-gray-600">{String(button.processDefinition.description)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-(--color-baseline-10)"
                    disabled={isPending}>
                    <CloseIcon data-testid="CloseIcon__761503" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 min-h-[12rem]">
                  <div
                    className={`relative h-full ${isPending ? "animate-pulse cursor-progress cursor-to-children" : ""}`}>
                    {(loading || initializationLoading) && !result && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 transition-opacity duration-200">
                        <Loading data-testid="Loading__761503" />
                      </div>
                    )}
                    <div className="h-full">
                      {result && !result.success && renderResponse()}
                      {renderParameters()}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end mx-3 my-3">
                  {/* REPORT_AND_PROCESS type: always show Cancel + Execute */}
                  {type === PROCESS_TYPES.REPORT_AND_PROCESS && (!result || !result.success) && (
                    <>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleClose}
                        disabled={isPending}
                        className="w-49"
                        data-testid="CancelButton__761503">
                        {t("common.cancel")}
                      </Button>
                      <Button
                        variant="filled"
                        size="large"
                        onClick={handleReportProcessExecute}
                        disabled={Boolean(isActionButtonDisabled)}
                        startIcon={getActionButtonContent().icon}
                        className="w-49"
                        data-testid="ExecuteReportButton__761503">
                        {getActionButtonContent().text}
                      </Button>
                    </>
                  )}

                  {/* Other process types: existing logic */}
                  {type !== PROCESS_TYPES.REPORT_AND_PROCESS && (!result || !result.success) && !isPending && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleClose}
                      className="w-49"
                      data-testid="CloseButton__761503">
                      {t("common.close")}
                    </Button>
                  )}

                  {type !== PROCESS_TYPES.REPORT_AND_PROCESS &&
                    ((!result || !result.success) && availableButtons.length > 0
                      ? availableButtons.map((btn) => (
                          <Button
                            key={btn.value}
                            variant="filled"
                            size="large"
                            onClick={() => handleExecute(btn.value)}
                            disabled={Boolean(isActionButtonDisabled)}
                            className="w-49"
                            data-testid={`ExecuteButton_${btn.value}__761503`}>
                            {btn.label}
                          </Button>
                        ))
                      : !result && (
                          <Button
                            variant="filled"
                            size="large"
                            onClick={() => handleExecute()}
                            disabled={Boolean(isActionButtonDisabled)}
                            startIcon={getActionButtonContent().icon}
                            className="w-49"
                            data-testid="ExecuteButton__761503">
                            {getActionButtonContent().text}
                          </Button>
                        ))}
                </div>
              </div>
            </div>
          </FormProvider>
        </Modal>
      )}
      {/* Success Modal - Separate overlay */}
      {open && result?.success && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
          <div
            className="rounded-2xl p-6 shadow-xl max-w-sm w-full relative"
            style={{ background: "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)" }}>
            <button
              type="button"
              onClick={handleSuccessClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors"
              aria-label="Close">
              <CloseIcon className="w-5 h-5" data-testid="SuccessCloseIcon__761503" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center">
                <CheckIcon className="w-6 h-6 fill-(--color-success-main)" data-testid="SuccessCheckIcon__761503" />
              </div>
              <div>
                <h4 className="font-medium text-xl text-center text-(--color-success-main)">
                  {t("process.completedSuccessfully")}
                </h4>
                {(() => {
                  const msg =
                    typeof result?.data === "string"
                      ? result.data
                      : result?.data?.msgText || result?.data?.message || result?.error;

                  if (!msg || msg === t("process.completedSuccessfully")) return null;

                  return (
                    <p className="text-sm text-center text-(--color-transparent-neutral-80) whitespace-pre-line">
                      {String(msg).replace(/<br\s*\/?>/gi, "\n")}
                    </p>
                  );
                })()}
              </div>
              <Button
                variant="filled"
                size="large"
                onClick={handleSuccessClose}
                className="w-49"
                data-testid="SuccessCloseButton__761503">
                {t("common.close")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * ProcessDefinitionModal - Main export component with null check
 *
 * Provides a guard against null button props and forwards all props to the content component.
 * This wrapper ensures the modal only renders when a valid process button is provided.
 *
 * @param props - Modal props including button configuration
 * @param props.button - Process definition button (nullable)
 * @param props.onSuccess - Success callback
 * @returns JSX.Element | null - Modal component or null if no button provided
 */
export default function ProcessDefinitionModal({ button, ...props }: ProcessDefinitionModalProps) {
  if (!button) return null;

  return (
    <ProcessDefinitionModalContent {...props} button={button} data-testid="ProcessDefinitionModalContent__761503" />
  );
}
