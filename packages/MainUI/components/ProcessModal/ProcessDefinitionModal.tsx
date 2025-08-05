import { useTabContext } from "@/contexts/tab";
import { useProcessConfig } from "@/hooks/datasource/useProcessDatasourceConfig";
import { useProcessInitialization } from "@/hooks/useProcessInitialization";
import { useProcessInitializationState } from "@/hooks/useProcessInitialState";
import { useSelected } from "@/hooks/useSelected";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { buildPayloadByInputName, buildProcessPayload } from "@/utils";
import { executeStringFunction } from "@/utils/functions";
import { logger } from "@/utils/logger";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import Modal from "../Modal";
import Loading from "../loading";
import WindowReferenceGrid from "./WindowReferenceGrid";
import BaseSelector from "./selectors/BaseSelector";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";
import type {
  ProcessDefinitionModalContentProps,
  ProcessDefinitionModalProps,
  RecordValues,
  ResponseMessage,
} from "./types";
import { PROCESS_DEFINITION_DATA } from "@/utils/processes/definition/constants";

export const FALLBACK_RESULT = {};
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW;

function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const { session } = useUserContext();

  const { onProcess, onLoad } = button.processDefinition;
  const processId = button.processDefinition.id;
  const javaClassName = button.processDefinition.javaClassName;

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [response, setResponse] = useState<ResponseMessage>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  });

  // Process initialization for default values (adapted from FormInitialization pattern)
  const {
    processInitialization,
    loading: initializationLoading,
    error: initializationError,
    refetch: refetchDefaults,
  } = useProcessInitialization({
    processId: processId || "",
    windowId: windowId || "",
    recordId: record?.id ? String(record.id) : undefined, // Convert EntityValue to string
    enabled: !!processId && !!windowId && open, // Only fetch when modal is open
    record: record || undefined, // Pass complete record data
    tab: tab || undefined,       // Pass tab metadata
  });

  // Process form initial state (similar to useFormInitialState)
  // Memoize parameters to prevent infinite re-execution
  const memoizedParameters = useMemo(() => Object.values(parameters), [parameters]);

  const {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent,
    hasData: hasInitialData,
  } = useProcessInitializationState(
    processInitialization,
    memoizedParameters // Use memoized version to prevent infinite loops
  );

  // Combined form data: record values + process defaults (similar to FormView pattern)
  const availableFormData = useMemo(() => {
    if (!record || !tab) return {};

    // Build base payload with system context fields
    const basePayload = buildProcessPayload(
      record,           // Complete record data
      tab,             // Tab metadata
      {},              // Don't include initialState here yet
      {}               // User input will be added during execution
    );

    // Use initialState directly - it's already processed by useProcessInitializationState
    // No need to reprocess the values, they're already mapped correctly
    console.log('Raw initialState from hook:', initialState);
    console.log('Available form data will be:', {
      ...basePayload,
      ...initialState
    });

    return {
      ...basePayload,        // System context fields
      ...initialState,       // Already processed defaults from useProcessInitializationState
    };
  }, [record, tab, initialState]);

  const form = useForm({
    values: availableFormData, // Pre-populate with combined data
    mode: "onChange"
  });

  // Reset form values when defaults are loaded
  useEffect(() => {
    if (hasInitialData && Object.keys(availableFormData).length > 0) {
      console.log('Resetting form with new values:', availableFormData);
      form.reset(availableFormData);
    }
  }, [hasInitialData, availableFormData, form]);

  const handleClose = useCallback(() => {
    if (isExecuting) return;
    setResponse(undefined);
    setIsExecuting(false);
    setIsSuccess(false);
    setLoading(true);
    setParameters(button.processDefinition.parameters);
    onClose();
  }, [button.processDefinition.parameters, isExecuting, onClose]);

  const handleWindowReferenceExecute = useCallback(async () => {
    if (!tab || !processId) return;

    setIsExecuting(true);
    setIsSuccess(false);

    try {
      const params = new URLSearchParams({
        processId,
        windowId: tab.window,
        _action: javaClassName,
      });

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
      };

      const response = await Metadata.kernelClient.post(`?${params}`, payload);

      if (response?.data?.message) {
        const isSuccessResponse = response.data.message.severity === "success";

        setResponse({
          msgText: response.data.message.text || "",
          msgTitle: isSuccessResponse ? t("process.completedSuccessfully") : t("process.processError"),
          msgType: response.data.message.severity,
        });

        if (isSuccessResponse) {
          setIsSuccess(true);
          onSuccess?.();
        }
      } else if (response?.data) {
        setResponse({
          msgText: "Process completed successfully",
          msgTitle: t("process.completedSuccessfully"),
          msgType: "success",
        });

        setIsSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      logger.warn("Error executing process:", error);
      setResponse({
        msgText: error instanceof Error ? error.message : "Unknown error",
        msgTitle: t("errors.internalServerError.title"),
        msgType: "error",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [tab, processId, javaClassName, recordValues, gridSelection, entityName, t, onSuccess]);

  const handleExecute = useCallback(async () => {
    if (hasWindowReference) {
      await handleWindowReferenceExecute();
      return;
    }

    if (!onProcess || !tab || !record) return;

    setIsExecuting(true);
    setIsSuccess(false);

    try {
      // Build complete payload with all context fields
      const completePayload = buildProcessPayload(
        record,                 // Complete record data
        tab,                   // Tab metadata
        initialState || {},    // Process defaults from server (handle null case)
        form.getValues()       // User input from form
      );

      const result = await executeStringFunction(onProcess, { Metadata }, button.processDefinition, {
        buttonValue: "DONE",
        windowId: tab.window,
        entityName: tab.entityName,
        recordIds: selectedRecords?.map((r) => r.id),
        ...completePayload,    // Use complete payload instead of just form values
      });

      const responseMessage = result.responseActions[0].showMsgInProcessView;
      setResponse(responseMessage);

      if (responseMessage.msgType === "success") {
        setIsSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      logger.warn("Error executing process:", error);
      setResponse({
        msgText: error instanceof Error ? error.message : "Unknown error",
        msgTitle: t("errors.internalServerError.title"),
        msgType: "error",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [
    hasWindowReference,
    handleWindowReferenceExecute,
    onProcess,
    tab,
    record,
    initialState,
    button.processDefinition,
    selectedRecords,
    form,
    t,
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
        hasFilterExpressions: Object.keys(filterExpressions || {}).length > 0
      });
    }
  }, [initializationError, hasInitialData, processId, initialState, logicFields, filterExpressions]);

  useEffect(() => {
    if (open) {
      setIsExecuting(false);
      setIsSuccess(false);
      setResponse(undefined);
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
    if (!response) return null;

    const isSuccessMessage = response.msgType === "success";
    const messageClasses = `p-3 rounded mb-4 border-l-4 ${
      isSuccessMessage ? "bg-green-50 border-(--color-success-main)" : "bg-gray-50 border-(--color-etendo-main)"
    }`;

    return (
      <div className={messageClasses}>
        <h4 className="font-bold text-sm">{response.msgTitle}</h4>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
        <p className="text-sm" dangerouslySetInnerHTML={{ __html: response.msgText }} />
      </div>
    );
  };

  const renderParameters = () => {
    if (isSuccess) return null;

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
          key={`param-${parameter.id || parameter.name}-${parameter.reference || 'default'}`}
          parameter={parameter}
          logicFields={logicFields} // Pass logic fields from process defaults
        />
      );
    });
  };

  const renderActionButton = () => {
    if (isExecuting) {
      return <span className="animate-pulse">{t("common.loading")}...</span>;
    }

    if (isSuccess) {
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

  const isActionButtonDisabled = isExecuting || isSuccess || (hasWindowReference && gridSelection.length === 0);

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
                disabled={isExecuting}>
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className={`relative ${isExecuting ? "animate-pulse cursor-progress cursor-to-children" : ""}`}>
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
                disabled={isExecuting}>
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

export default function ProcessDefinitionModal({ button, onSuccess, ...props }: ProcessDefinitionModalProps) {
  if (!button) return null;

  return <ProcessDefinitionModalContent {...props} button={button} onSuccess={onSuccess} />;
}
