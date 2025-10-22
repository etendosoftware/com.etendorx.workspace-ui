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
import { executeProcess, type ExecuteProcessResult } from "@/app/actions/process";
import { buildPayloadByInputName, buildProcessPayload } from "@/utils";
import { executeStringFunction } from "@/utils/functions";
import { logger } from "@/utils/logger";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
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
import { PROCESS_DEFINITION_DATA, WINDOW_SPECIFIC_KEYS } from "@/utils/processes/definition/constants";
import type { Tab, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { mapKeysWithDefaults } from "@/utils/processes/manual/utils";

/** Fallback object for record values when no record context exists */
export const FALLBACK_RESULT = {};

/** Reference ID for window reference field types */
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW;

export type GridSelectionStructure = {
  [entityName: string]: {
    _selection: unknown[];
    _allRows: unknown[];
  };
};

export type GridSelectionUpdater = GridSelectionStructure | ((prev: GridSelectionStructure) => GridSelectionStructure);
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
function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const { session, token } = useUserContext();

  const { onProcess, onLoad } = button.processDefinition;
  const processId = button.processDefinition.id;
  const javaClassName = button.processDefinition.javaClassName;

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [result, setResult] = useState<ExecuteProcessResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [gridSelection, setGridSelection] = useState<GridSelectionStructure>({});
  const [shouldTriggerSuccess, setShouldTriggerSuccess] = useState(false);

  const selectedRecords = graph.getSelectedMultiple(tab);
  console.log({ button });
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
    return Object.values(parameters).some((param) => param.reference === WINDOW_REFERENCE_ID) || javaClassName;
  }, [javaClassName, parameters]);

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
    enabled: !!processId && !!windowId && open, // Only fetch when modal is open
    record: record || undefined, // Pass complete record data
    tab: tab || undefined, // Pass tab metadata
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

  // Combined form data: record values + process defaults (similar to FormView pattern)
  const availableFormData = useMemo(() => {
    if (!record || !tab) return {};

    // Build base payload with system context fields
    const basePayload = buildProcessPayload(record, tab, {}, {});

    return {
      ...basePayload,
      ...initialState,
    };
  }, [record, tab, initialState]);

  const form = useForm({
    defaultValues: availableFormData,
    mode: "onChange",
  });

  useEffect(() => {
    if (hasInitialData && Object.keys(availableFormData).length > 0) {
      form.reset(availableFormData);
    }
  }, [hasInitialData, availableFormData, form, initialState]);

  // Reactive view into form state (submitting)
  const { isSubmitting } = useFormState({ control: form.control });

  // Watch all form values to trigger re-validation when any field changes
  const formValues = form.watch();

  // Combine loading states: initialization and callouts (do not include internal param-loading)

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

    // Trigger onSuccess only when closing the modal if process was successful
    if (shouldTriggerSuccess) {
      onSuccess?.();
    }

    setResult(null);
    setLoading(true);
    setParameters(button.processDefinition.parameters);
    setShouldTriggerSuccess(false);
    onClose();
  }, [button.processDefinition.parameters, isPending, onClose, shouldTriggerSuccess, onSuccess]);

  const extractMessageFromProcessView = useCallback((res: ExecuteProcessResult) => {
    const msgView = res.data?.responseActions?.[0]?.showMsgInProcessView;
    if (!msgView) return null;

    return {
      message: msgView.msgText,
      messageType: msgView.msgType,
    };
  }, []);

  const extractMessageFromData = useCallback((res: ExecuteProcessResult) => {
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
   * Executes processes with window reference parameters
   * Used for processes that require grid record selection
   * Calls servlet with selected grid records and process-specific data
   */
  const handleWindowReferenceExecute = useCallback(async () => {
    if (!tab || !processId) {
      return;
    }
    startTransition(async () => {
      try {
        const currentAttrs = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
        const currentRecordValue = recordValues?.[currentAttrs.inpPrimaryKeyColumnId];
        const payload = {
          [currentAttrs.inpColumnId]: currentRecordValue,
          [currentAttrs.inpPrimaryKeyColumnId]: currentRecordValue,
          _buttonValue: "DONE",
          _params: {
            ...mapKeysWithDefaults({ ...form.getValues(), ...gridSelection }),
          },
          windowId: tab.window,
        };

        // Add additional payload fields from configuration
        if (currentAttrs.additionalPayloadFields && recordValues) {
          for (const fieldName of currentAttrs.additionalPayloadFields) {
            if (recordValues[fieldName] !== undefined) {
              payload[fieldName] = recordValues[fieldName];
            }
          }
        }

        const res = await executeProcess(
          processId,
          payload,
          token || "",
          tab.window?.toString(),
          undefined,
          javaClassName
        );

        const parsedResult = parseProcessResponse(res);
        setResult(parsedResult);

        if (parsedResult.success) setShouldTriggerSuccess(true);
      } catch (error) {
        logger.warn("Error executing process:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [tab, processId, recordValues, form, gridSelection, token, javaClassName, parseProcessResponse]);

  /**
   * Executes processes directly via servlet using javaClassName
   * Used for processes that have javaClassName but no onProcess function
   * Bypasses client-side JavaScript execution and calls servlet directly
   */
  const handleDirectJavaProcessExecute = useCallback(async () => {
    if (!tab || !processId || !javaClassName) {
      return;
    }

    const windowConfig = WINDOW_SPECIFIC_KEYS[windowId];
    const extraKey = windowConfig ? { [windowConfig.key]: windowConfig.value(record) } : {};

    startTransition(async () => {
      try {
        const payload = {
          recordIds: record?.id ? [record.id] : [],
          _buttonValue: "DONE",
          _params: {},
          _entityName: tab.entityName,
          ...extraKey,
          ...recordValues,
          ...form.getValues(),
          windowId: tab.window,
        };

        const res = await executeProcess(
          processId,
          payload,
          token || "",
          tab.window?.toString(),
          undefined,
          javaClassName
        );

        const parsedResult = parseProcessResponse(res);
        setResult(parsedResult);

        if (parsedResult.success) setShouldTriggerSuccess(true);
      } catch (error) {
        logger.warn("Error executing direct Java process:", error);
        setResult({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }, [tab, processId, javaClassName, windowId, record, recordValues, form, token, parseProcessResponse]);

  /**
   * Main process execution handler - routes to appropriate execution method
   *
   * Execution Priority:
   * 1. Window Reference Process (hasWindowReference = true)
   * 2. Direct Java Process (javaClassName exists, no onProcess)
   * 3. String Function Process (onProcess exists)
   */
  const handleExecute = useCallback(async () => {
    if (hasWindowReference) {
      await handleWindowReferenceExecute();
      return;
    }

    // If process has javaClassName but no onProcess, execute directly via servlet
    if (!onProcess && javaClassName && tab) {
      await handleDirectJavaProcessExecute();
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
      try {
        const stringFnResult = await executeStringFunction(onProcess, { Metadata }, button.processDefinition, {
          _buttonValue: "DONE",
          buttonValue: "DONE",
          windowId: tab.window,
          entityName: tab.entityName,
          recordIds: selectedRecords?.map((r) => r.id),
          ...completePayload, // Use complete payload instead of just form values
        });

        const responseMessage = stringFnResult.responseActions[0].showMsgInProcessView;
        const success = responseMessage.msgType === "success";
        setResult({ success, data: responseMessage, error: success ? undefined : responseMessage.msgText });
        if (success) setShouldTriggerSuccess(true);
      } catch (error) {
        logger.warn("Error executing process:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [
    hasWindowReference,
    handleWindowReferenceExecute,
    handleDirectJavaProcessExecute,
    onProcess,
    javaClassName,
    tab,
    record,
    initialState,
    button.processDefinition,
    selectedRecords,
    form,
  ]);

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

  useEffect(() => {
    if (open) {
      setResult(null);
      setParameters(button.processDefinition.parameters);

      // Initialize grid selection structure with empty arrays for all window reference parameters
      const initialGridSelection: GridSelectionStructure = {};
      for (const param of Object.values(button.processDefinition.parameters)) {
        if (param.reference === WINDOW_REFERENCE_ID) {
          initialGridSelection[param.dBColumnName] = {
            _selection: [],
            _allRows: [],
          };
        }
      }

      setGridSelection(initialGridSelection);
    }
  }, [button.processDefinition.parameters, open]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!open) return;

      try {
        setLoading(true);

        if (onLoad && tab) {
          const result = await executeStringFunction(onLoad, { Metadata }, button.processDefinition, {
            selectedRecords,
            tabId,
          });

          setParameters((prev) => {
            const newParameters = { ...prev };

            for (const [parameterName, values] of Object.entries(result)) {
              const newOptions = values as string[];
              newParameters[parameterName] = { ...newParameters[parameterName] };
              newParameters[parameterName].refList = newParameters[parameterName].refList.filter((option) =>
                newOptions.includes(option.value)
              );
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
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, tabId]);

  const renderResponse = () => {
    if (!result) return null;

    const isSuccessMessage = result.success;
    const msgTitle = isSuccessMessage ? t("process.completedSuccessfully") : t("process.processError");
    let msgText: string;
    if (isSuccessMessage) {
      msgText = typeof result.data === "string" ? (result.data as string) : t("process.completedSuccessfully");
    } else {
      msgText = result.error || t("errors.internalServerError.title");
    }

    const messageClasses = `p-3 rounded mb-4 border-l-4 ${
      isSuccessMessage ? "bg-green-50 border-(--color-success-main)" : "bg-gray-50 border-(--color-etendo-main)"
    }`;

    const displayText = msgText.replace(/<br\s*\/?>/gi, "\n");

    return (
      <div className={messageClasses}>
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
    if (result) return null;
    return Object.values(parameters).map((parameter) => {
      if (parameter.reference === WINDOW_REFERENCE_ID) {
        const parameterTab = getTabForParameter(parameter);
        const parameterEntityName = parameterTab?.entityName || "";
        const parameterTabId = parameterTab?.id || "";
        return (
          <WindowReferenceGrid
            key={`window-ref-${parameter.id || parameter.name}`}
            parameter={parameter}
            parameters={parameters}
            onSelectionChange={setGridSelection}
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
            data-testid="WindowReferenceGrid__761503"
          />
        );
      }
      return (
        <ProcessParameterSelector
          key={`param-${parameter.id || parameter.name}-${parameter.reference || "default"}`}
          parameter={parameter}
          logicFields={logicFields}
          data-testid="ProcessParameterSelector__761503"
        />
      );
    });
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
    <Modal open={open} onClose={handleClose} data-testid="Modal__761503">
      <FormProvider {...form} data-testid="FormProvider__761503">
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{button.name}</h3>
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
            <div className="flex-1 overflow-auto p-4">
              <div className={`relative ${isPending ? "animate-pulse cursor-progress cursor-to-children" : ""}`}>
                <div
                  className={`absolute transition-opacity inset-0 flex items-center pointer-events-none justify-center bg-white ${
                    (loading || initializationLoading) && !result ? "opacity-100" : "opacity-0"
                  }`}>
                  <Loading data-testid="Loading__761503" />
                </div>
                <div
                  className={`transition-opacity ${(loading || initializationLoading) && !result ? "opacity-0" : "opacity-100"}`}>
                  {renderResponse()}
                  {renderParameters()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-4 justify-center mx-4 mb-4">
              {!result && !isPending && (
                <Button variant="outlined" size="large" onClick={handleClose} data-testid="CloseButton__761503">
                  {t("common.close")}
                </Button>
              )}

              {!result && (
                <Button
                  variant="filled"
                  size="large"
                  onClick={handleExecute}
                  disabled={isActionButtonDisabled}
                  startIcon={getActionButtonContent().icon}
                  data-testid="ExecuteButton__761503">
                  {getActionButtonContent().text}
                </Button>
              )}

              {result && (
                <Button variant="outlined" size="large" onClick={handleClose} data-testid="CloseResultButton__761503">
                  {t("common.close")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </FormProvider>
    </Modal>
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
