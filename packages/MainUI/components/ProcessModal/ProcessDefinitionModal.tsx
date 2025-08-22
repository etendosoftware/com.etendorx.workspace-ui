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
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import Modal from "../Modal";
import Loading from "../loading";
import WindowReferenceGrid from "./WindowReferenceGrid";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";
import type { ProcessDefinitionModalContentProps, ProcessDefinitionModalProps, RecordValues } from "./types";
import { PROCESS_DEFINITION_DATA } from "@/utils/processes/definition/constants";

/** Fallback object for record values when no record context exists */
export const FALLBACK_RESULT = {};

/** Reference ID for window reference field types */
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW;

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
  const [gridSelection, setGridSelection] = useState<unknown[]>([]);

  const selectedRecords = graph.getSelectedMultiple(tab);

  const windowReferenceTab = parameters.grid?.window?.tabs?.[0] as Tab;
  const entityName = windowReferenceTab?.entityName || "";
  const windowId = tab?.window || "";
  const tabId = windowReferenceTab?.id || "";

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

  // Important: use defaultValues to avoid re-initializing the form on every render
  // Then rely on the reset effect below when defaults actually arrive
  const form = useForm({
    defaultValues: availableFormData,
    mode: "onChange",
  });

  // Reset form values when defaults are loaded
  useEffect(() => {
    if (hasInitialData && Object.keys(availableFormData).length > 0) {
      console.log("Resetting form with new values:", availableFormData);
      form.reset(availableFormData);
    }
  }, [hasInitialData, availableFormData, form]);

  const handleClose = useCallback(() => {
    if (isPending) return;
    setResult(null);
    setLoading(true);
    setParameters(button.processDefinition.parameters);
    onClose();
  }, [button.processDefinition.parameters, isPending, onClose]);

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
            grid: {
              _selection: gridSelection,
            },
          },
          _entityName: entityName,
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
        setResult(res);
        if (res.success) onSuccess?.();
      } catch (error) {
        logger.warn("Error executing process:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [tab, processId, javaClassName, recordValues, gridSelection, entityName, onSuccess, startTransition, token]);

  /**
   * Executes processes directly via servlet using javaClassName
   * Used for processes that have javaClassName but no onProcess function
   * Bypasses client-side JavaScript execution and calls servlet directly
   */
  const handleDirectJavaProcessExecute = useCallback(async () => {
    if (!tab || !processId || !javaClassName) {
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          recordIds: record?.id ? [record.id] : [],
          _buttonValue: "DONE",
          _params: {},
          _entityName: tab.entityName,
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
        setResult(res);
        if (res.success) onSuccess?.();
      } catch (error) {
        logger.warn("Error executing direct Java process:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [tab, processId, javaClassName, recordValues, form, onSuccess, startTransition, token, record?.id]);

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
        form.getValues() // User input from form
      );
      try {
        const stringFnResult = await executeStringFunction(onProcess, { Metadata }, button.processDefinition, {
          buttonValue: "DONE",
          windowId: tab.window,
          entityName: tab.entityName,
          recordIds: selectedRecords?.map((r) => r.id),
          ...completePayload, // Use complete payload instead of just form values
        });

        const responseMessage = stringFnResult.responseActions[0].showMsgInProcessView;
        const success = responseMessage.msgType === "success";
        setResult({ success, data: responseMessage, error: success ? undefined : responseMessage.msgText });
        if (success) onSuccess?.();
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
    onSuccess,
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
      setGridSelection([]);
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

    return (
      <div className={messageClasses}>
        <h4 className="font-bold text-sm">{msgTitle}</h4>
        <p className="text-sm">{msgText}</p>
      </div>
    );
  };

  const renderParameters = () => {
    if (result?.success) return null;

    return Object.values(parameters).map((parameter) => {
      if (parameter.reference === WINDOW_REFERENCE_ID) {
        return (
          <WindowReferenceGrid
            key={`window-ref-${parameter.id || parameter.name}`}
            parameter={parameter}
            onSelectionChange={setGridSelection}
            tabId={tabId}
            entityName={entityName}
            windowReferenceTab={windowReferenceTab}
            processConfig={processConfig}
            processConfigLoading={processConfigLoading}
            processConfigError={processConfigError}
            recordValues={recordValues}
          />
        );
      }
      // Use new ProcessParameterSelector for enhanced field reference support
      return (
        <ProcessParameterSelector
          key={`param-${parameter.id || parameter.name}-${parameter.reference || "default"}`}
          parameter={parameter}
          logicFields={logicFields} // Pass logic fields from process defaults
        />
      );
    });
  };

  const renderActionButton = () => {
    if (isPending) {
      return <span className="animate-pulse">{t("common.loading")}...</span>;
    }

    if (result?.success) {
      return (
        <span className="flex items-center gap-2">
          <CheckIcon fill="white" />
          {t("process.completedSuccessfully")}
        </span>
      );
    }

    return (
      <>
        {CheckIcon && <CheckIcon fill="white" />}
        {t("common.execute")}
      </>
    );
  };

  const isActionButtonDisabled = isPending || !!result?.success || (hasWindowReference && gridSelection.length === 0);

  return (
    <Modal open={open} onClose={handleClose}>
      <FormProvider {...form}>
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
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className={`relative ${isPending ? "animate-pulse cursor-progress cursor-to-children" : ""}`}>
                <div
                  className={`absolute transition-opacity inset-0 flex items-center pointer-events-none justify-center bg-white ${
                    loading || initializationLoading ? "opacity-100" : "opacity-0"
                  }`}>
                  <Loading />
                </div>
                <div className={`transition-opacity ${loading || initializationLoading ? "opacity-0" : "opacity-100"}`}>
                  {renderResponse()}
                  {renderParameters()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-4 justify-center mx-4 mb-4">
              <button
                type="button"
                onClick={handleClose}
                className="transition px-4 py-2 border border-(--color-baseline-60) text-(--color-baseline-90) rounded-full w-full
                font-medium focus:outline-none hover:bg-(--color-transparent-neutral-10)"
                disabled={isPending}>
                {t("common.close")}
              </button>
              <button
                type="button"
                onClick={handleExecute}
                className="transition px-4 py-2 text-white rounded-full w-full justify-center font-medium flex items-center gap-2 bg-(--color-baseline-100) hover:bg-(--color-etendo-main)"
                disabled={isActionButtonDisabled}>
                {renderActionButton()}
              </button>
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
export default function ProcessDefinitionModal({ button, onSuccess, ...props }: ProcessDefinitionModalProps) {
  if (!button) return null;

  return <ProcessDefinitionModalContent {...props} button={button} onSuccess={onSuccess} />;
}
