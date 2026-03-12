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
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import ChevronDownIcon from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import Button from "../../../ComponentLibrary/src/components/Button/Button";
import {
  // Contexts
  useTabContext,
  useWindowContext,
  useUserContext,
  // Hooks
  useProcessConfig,
  useProcessInitialization,
  useProcessInitializationState,
  useSelected,
  useTranslation,
  useProcessCallouts,
  useWarehousePlugin,
  // Next.js
  useRouter,
  useSearchParams,
  // Utilities
  buildPayloadByInputName,
  buildProcessPayload,
  buildProcessScriptContext,
  applyGridSelection,
  updateParametersFromOnLoadResult,
  evaluateParameterDefaults,
  isBulkCompletionProcess,
  DEFAULT_BULK_COMPLETION_ONLOAD,
  registerPayScriptDSL,
  createOBShim,
  compileExpression,
  logger,
  FIELD_REFERENCE_CODES,
  datasource,
  Metadata,
  // Constants
  BUTTON_LIST_REFERENCE_ID,
  PROCESS_TYPES,
  // Components
  GenericWarehouseProcess,
  createProcessExpressionContext,
  executeStringFunction,
  // Types
  type ExecuteProcessResult,
  type ProcessDefinitionModalContentProps,
  type RecordValues,
  type ProcessDefinitionModalProps,
  type Tab,
  type ProcessParameter,
  type EntityData,
  type Field,
} from "./imports";
import Modal from "../Modal";
import Loading from "../loading";
import WindowReferenceGrid from "./WindowReferenceGrid";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";
import { useProcessPayload, isDateReference, convertParameterDateFields } from "./hooks/useProcessPayload";
import { useProcessExecution } from "./hooks/useProcessExecution";

const CollapsibleSection = ({ title, children }: { title: string; children: import("react").ReactNode }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer select-none">
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
          data-testid="ChevronDownIcon__761503"
        />
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </button>
      <div style={{ display: expanded ? "block" : "none" }}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exported types (consumed by hooks and external components)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Module-level constants / helpers
// ---------------------------------------------------------------------------

/** Fallback object for record values when no record context exists */
export const FALLBACK_RESULT = {};

/** Reference ID for window reference field types */
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW.id;

// ---------------------------------------------------------------------------
// evaluateWindowReferenceDisplay — display-logic evaluation for grid params
// ---------------------------------------------------------------------------

interface EvaluateWindowReferenceDisplayOptions {
  parameter: ProcessParameter;
  logicFields?: Record<string, boolean>;
  formValues: Record<string, unknown>;
  availableFormData: Record<string, unknown>;
  parameters: Record<string, ProcessParameter>;
  session: Record<string, unknown>;
  recordValues: Record<string, unknown>;
  parentFields?: Record<string, Field>;
}

const evaluateWindowReferenceDisplay = (options: EvaluateWindowReferenceDisplayOptions): boolean => {
  const { parameter, logicFields, formValues, availableFormData, parameters, session, recordValues, parentFields } =
    options;
  let isDisplayed = true;
  const defaultsDisplayLogic = logicFields?.[`${parameter.name}.display`];

  if (parameter.displayLogic) {
    const mergedValues = { ...availableFormData, ...formValues };
    const hasData = Object.keys(mergedValues).length > 0;
    const isMalformedLogic = parameter.displayLogic.includes("_logic") && !parameter.displayLogic.includes("@");

    if (!isMalformedLogic && hasData) {
      try {
        const compiledExpr = compileExpression(parameter.displayLogic);

        const smartContext = createProcessExpressionContext({
          values: mergedValues,
          parameters,
          recordValues,
          parentFields,
          session,
        });

        isDisplayed = compiledExpr(smartContext, smartContext);
      } catch (error) {
        logger.warn(`Error evaluating display logic for ${parameter.name}`, error);
      }
    }
  } else if (defaultsDisplayLogic !== undefined) {
    isDisplayed = defaultsDisplayLogic;
  }
  return isDisplayed;
};

// ---------------------------------------------------------------------------
// ProcessDefinitionModalContent
// ---------------------------------------------------------------------------

/**
 * ProcessDefinitionModalContent - Core modal component for process execution
 *
 * Handles three types of process execution:
 * 1. Window Reference Processes - Displays a grid for record selection
 * 2. Direct Java Processes - Executes servlet directly using javaClassName
 * 3. String Function Processes - Executes client-side JavaScript functions
 */
function ProcessDefinitionModalContent({
  onClose,
  button,
  open,
  onSuccess,
  type,
  keepOpenOnSuccess,
}: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const { session, token, getCsrfToken } = useUserContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerRecovery, isRecoveryLoading } = useWindowContext();

  const [processDefinition, setProcessDefinition] = useState(button.processDefinition);
  const { onProcess, onLoad } = processDefinition;

  // Build the reusable process script context (auth-aware HTTP helpers)
  // Memoized so the reference is stable: the useEffect that depends on it won't re-run on every render.
  const processScriptContext = useMemo(
    () => buildProcessScriptContext({ token: token || "", getCsrfToken }),
    [token, getCsrfToken]
  );
  const processId = processDefinition.id;
  const javaClassName = processDefinition.javaClassName;

  const [gridRefreshKey, setGridRefreshKey] = useState(0);

  // Warehouse plugin — evaluated only when onLoad returns type: 'warehouseProcess'
  const selectedRecordsForPlugin = useMemo(() => (tab ? graph.getSelectedMultiple(tab) : []), [graph, tab]);

  const {
    schema: warehouseSchema,
    payscriptPlugin: warehousePayscriptPlugin,
    effectiveOnProcess: warehouseOnProcess,
    loading: warehousePluginLoading,
  } = useWarehousePlugin({
    processId,
    onLoadCode: onLoad,
    onProcessCode: typeof onProcess === "string" ? onProcess : undefined,
    processDefinition: processDefinition as Record<string, unknown>,
    selectedRecords: selectedRecordsForPlugin as { id: string }[],
    token: token ?? "",
  });

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [result, setResult] = useState<ExecuteProcessResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const [gridSelection, setGridSelectionInternal] = useState<GridSelectionStructure>({});
  const [shouldTriggerSuccess, setShouldTriggerSuccess] = useState(false);

  // Ref (not state) to store _filterExpressions returned by JS onLoad scripts.
  // Using a ref avoids triggering re-renders that would cause infinite loops.
  const onLoadFilterExpressionsRef = useRef<Record<string, Record<string, string>>>({});

  const setGridSelection = useCallback((updater: GridSelectionUpdater) => {
    setGridSelectionInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }, []);

  const [autoSelectConfig, setAutoSelectConfig] = useState<AutoSelectConfig | null>(null);
  const [autoSelectApplied, setAutoSelectApplied] = useState(false);
  const [availableButtons, setAvailableButtons] = useState<Array<{ value: string; label: string; isFilter?: boolean }>>(
    []
  );
  const [rulesRegistered, setRulesRegistered] = useState(false);

  // Register PayScript DSL if available in process definition
  useEffect(() => {
    if (processDefinition.id) {
      const def = processDefinition as any;
      const dsl =
        def.etmetaPayscriptLogic ||
        def.emPayscriptLogic ||
        def.em_payscript_logic ||
        def.emEtmetaOnprocess ||
        def.em_etmeta_onprocess;
      if (dsl) {
        registerPayScriptDSL(processDefinition.id, dsl);
        setRulesRegistered(true);
      }
    }
  }, [processDefinition]);

  useEffect(() => {
    let active = true;

    const fetchDynamicButtons = async (referenceId: string) => {
      try {
        const result = (await datasource.get("ADList", {
          criteria: [{ fieldName: "reference.id", operator: "equals", value: referenceId }],
          sortBy: "sequenceNumber",
          _startRow: 0,
          _endRow: 100,
        })) as any;

        return result?.response?.data || result?.data?.response?.data || [];
      } catch (e) {
        logger.error("Failed to fetch dynamic buttons", e);
        return [];
      }
    };

    const loadButtons = async () => {
      const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);

      if (!buttonListParam) {
        if (active) setAvailableButtons([]);
        return;
      }

      if (buttonListParam.refList && buttonListParam.refList.length > 0) {
        if (active) {
          setAvailableButtons(
            buttonListParam.refList.map((item) => ({
              value: item.value,
              label: item.label,
            }))
          );
        }
        return;
      }

      const referenceId = (buttonListParam as any).referenceSearchKey;

      if (referenceId) {
        const responseData = await fetchDynamicButtons(referenceId);

        if (responseData && responseData.length > 0 && active) {
          const mappedButtons = responseData.map((item: any) => ({
            value: item.searchKey,
            label: item.name,
            isFilter: ["filter", "search", "refresh"].includes(item.searchKey?.toLowerCase()),
          }));
          setAvailableButtons(mappedButtons);
        } else if (active) {
          setAvailableButtons([]);
        }
      } else {
        if (active) setAvailableButtons([]);
      }
    };

    loadButtons();
    return () => {
      active = false;
    };
  }, [parameters]);

  // Handle case when modal is opened from sidebar (no tab context)
  const selectedRecords = useMemo(() => (tab ? graph.getSelectedMultiple(tab) : []), [graph, tab]);
  const selectedRecordsCount = (selectedRecords || []).length;

  const firstWindowReferenceParam = useMemo(
    () => Object.values(parameters).find((param) => param.reference === WINDOW_REFERENCE_ID),
    [parameters]
  );

  const windowReferenceTab = firstWindowReferenceParam?.window?.tabs?.[0] as Tab;
  const tabId = windowReferenceTab?.id || "";
  const windowId = tab?.window || "";

  const recordValues: RecordValues | null = useMemo(() => {
    if (!record || !tab?.fields) return FALLBACK_RESULT;
    return buildPayloadByInputName(record, tab.fields);
  }, [record, tab?.fields]);

  const hasWindowReference = useMemo(
    () => Object.values(parameters).some((param) => param.reference === WINDOW_REFERENCE_ID),
    [parameters]
  );

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

  const {
    processInitialization,
    loading: initializationLoading,
    error: initializationError,
  } = useProcessInitialization({
    processId: processId || "",
    windowId: windowId || "",
    recordId: record?.id ? String(record.id) : undefined,
    enabled: !!processId && open,
    record: record || undefined,
    tab: tab || undefined,
    type,
  });

  const memoizedParameters = useMemo(() => Object.values(parameters), [parameters]);

  const {
    initialState,
    logicFields,
    filterExpressions,
    hasData: hasInitialData,
  } = useProcessInitializationState(processInitialization, memoizedParameters);

  const isBulkCompletion = useMemo(
    () => isBulkCompletionProcess(processDefinition, parameters),
    [processDefinition, parameters]
  );

  // Stable processConfig object for WindowReferenceGrid — prevents new reference on every render.
  const stableProcessConfig = useMemo(
    () => ({
      processId: processConfig?.processId || "",
      ...processConfig,
      _filterExpressions: onLoadFilterExpressionsRef.current,
      defaults: (processInitialization?.defaults || {}) as Record<string, { value: string; identifier: string }>,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      JSON.stringify(processConfig),
      JSON.stringify(processInitialization?.defaults),
      JSON.stringify(onLoadFilterExpressionsRef.current),
    ]
  );

  // Combined form data: record values + process defaults
  const availableFormData = useMemo(() => {
    if (!record || !tab) {
      const combined = {
        ...initialState,
        _processId: processId,
      };
      const evaluatedDefaults = evaluateParameterDefaults(parameters, session || {}, combined);
      Object.assign(combined, evaluatedDefaults);

      const parametersList = Object.values(parameters);
      for (const param of parametersList) {
        const isDateField = param.reference && isDateReference(param.reference);
        if (isDateField) {
          convertParameterDateFields(combined, param);
        }
      }
      return combined;
    }

    const basePayload = buildProcessPayload(record, tab, {}, {});
    const combined = {
      ...basePayload,
      ...initialState,
      _processId: processId,
    };

    const evaluatedDefaults = evaluateParameterDefaults(parameters, session || {}, combined);
    Object.assign(combined, evaluatedDefaults);

    const parametersList = Object.values(parameters);
    for (const param of parametersList) {
      const isDateField = param.reference && isDateReference(param.reference);
      if (isDateField) {
        convertParameterDateFields(combined, param);
      }
    }
    return combined;
  }, [record, tab, initialState, parameters, session, processId]);

  const form = useForm({
    defaultValues: availableFormData as any,
    mode: "onChange",
  });

  useEffect(() => {
    const hasFormData = Object.keys(availableFormData).length > 0;
    if (hasFormData) {
      form.reset(availableFormData);
    }
  }, [availableFormData, form]);

  // Initialize gridSelection from filterExpressions
  useEffect(() => {
    if (open && filterExpressions && Object.keys(filterExpressions).length > 0) {
      const initialGrids: GridSelectionStructure = {};
      for (const gridName of Object.keys(filterExpressions)) {
        initialGrids[gridName] = { _selection: [], _allRows: [] };
      }
      setGridSelection(initialGrids);
    } else if (!open) {
      setGridSelection({});
    }
  }, [open, filterExpressions, setGridSelection]);

  const { isSubmitting } = useFormState({ control: form.control });
  const rawFormValues = form.watch();
  // Stabilize reference: only change identity when values actually change (deep equality).
  // Prevents WindowReferenceGrid and display-logic from re-running on every unrelated render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const formValues = useMemo(() => rawFormValues, [JSON.stringify(rawFormValues)]);

  const handleGridUpdate = useCallback(
    (gridName: string, data: unknown) => {
      if (!Array.isArray(data)) return;
      setGridSelection((prev) => {
        const currentGrid = prev[gridName] || { _selection: [], _allRows: [] };
        return {
          ...prev,
          [gridName]: { ...currentGrid, _selection: data },
        };
      });
    },
    [setGridSelection]
  );

  useProcessCallouts({
    processId: processId || "",
    form,
    gridSelection,
    parameters,
    enabled: open && !loading && !initializationLoading,
    onGridUpdate: handleGridUpdate,
    dependencies: [rulesRegistered],
    selectedRecords,
  });

  const initializationBlocksSubmit = Boolean(initializationError);

  const hasMandatoryParametersWithoutValue = useMemo(() => {
    if (loading || initializationLoading) return false;

    return Object.values(parameters).some((p) => {
      // @ts-ignore
      if (!p.mandatory || p.active === false) return false;
      if (p.defaultValue) return false;

      const fieldName = p.name;
      const dbColumnName = p.dBColumnName;

      let fieldValue = formValues[fieldName as keyof typeof formValues] as unknown;
      if (fieldValue === undefined && dbColumnName) {
        fieldValue = formValues[dbColumnName as keyof typeof formValues] as unknown;
      }

      const isRegisteredByName = fieldName in formValues;
      const isRegisteredByDBColumn = dbColumnName && dbColumnName in formValues;
      if (!isRegisteredByName && !isRegisteredByDBColumn) return false;

      const isEmpty =
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0);

      if (logicFields && dbColumnName) {
        if (logicFields[`${dbColumnName}.display`] === false) return false;
      }

      return isEmpty;
    });
  }, [loading, initializationLoading, parameters, formValues]);

  const handleClose = useCallback(() => {
    if (isPending) return;
    setResult(null);
    setLoading(true);
    setParameters(processDefinition.parameters);
    setShouldTriggerSuccess(false);
    onClose();
  }, [button.processDefinition.parameters, isPending, onClose]);

  // -------------------------------------------------------------------------
  // Payload builders
  // -------------------------------------------------------------------------

  const {
    getMappedFormValues,
    resolveDocAction,
    getMergedProcessValues,
    buildProcessSpecificFields,
    buildWindowSpecificFields,
    getRecordIds,
  } = useProcessPayload({
    form,
    parameters,
    gridSelection,
    record: record ?? undefined,
    recordValues: recordValues ?? undefined,
    processId,
    selectedRecords: selectedRecords as EntityData[],
  });

  // -------------------------------------------------------------------------
  // Execution handlers
  // -------------------------------------------------------------------------

  const { handleExecute, handleReportProcessExecute, handleNavigateToTab } = useProcessExecution({
    processId,
    javaClassName,
    windowId,
    tabId,
    onProcess,
    tab,
    record: record ?? undefined,
    initialState: initialState ?? undefined,
    selectedRecords: selectedRecords as EntityData[],
    processScriptContext,
    button,
    parameters,
    form,
    token: token ?? undefined,
    getCsrfToken,
    router,
    searchParams,
    isRecoveryLoading,
    triggerRecovery,
    onClose,
    onSuccess,
    keepOpenOnSuccess,
    getMergedProcessValues,
    getRecordIds,
    buildProcessSpecificFields,
    buildWindowSpecificFields,
    getMappedFormValues,
    resolveDocAction,
    hasWindowReference,
    availableButtons,
    isPending,
    shouldTriggerSuccess,
    startTransition,
    setResult,
    setLoading,
    setParameters,
    setShouldTriggerSuccess,
    setGridRefreshKey,
    initialParameters: button.processDefinition.parameters,
  });

  // -------------------------------------------------------------------------
  // useEffect — onLoad execution
  // -------------------------------------------------------------------------

  /**
   * Dispatches the raw result from an onLoad script to the appropriate state setters.
   * Returns true if processing should stop early (e.g., the result contained an error).
   */
  const handleOnLoadResult = useCallback(
    (result: Record<string, unknown>): boolean => {
      if (result.error) {
        const err = result.error as Record<string, unknown>;
        setResult({
          success: false,
          error: String(err.message ?? err.msgText ?? JSON.stringify(result.error)),
          data: result.error,
        });
        setLoading(false);
        return true; // stop early
      }

      if (result._gridSelection && typeof result._gridSelection === "object") {
        setGridSelection((prev) => applyGridSelection(prev, result._gridSelection as Record<string, string[]>));
      }

      // Store JS-returned filter expressions in a ref (no re-render trigger).
      // The value is picked up on the next natural render caused by setParameters below.
      if (result._filterExpressions && typeof result._filterExpressions === "object") {
        onLoadFilterExpressionsRef.current = result._filterExpressions as Record<string, Record<string, string>>;
      }

      if (result.autoSelectConfig) {
        setAutoSelectConfig(result.autoSelectConfig as AutoSelectConfig);
      }

      setParameters((prev) => updateParametersFromOnLoadResult(result, prev, form.setValue));
      return false;
    },
    [setGridSelection, form.setValue]
  );

  useEffect(() => {
    if (open && hasWindowReference) {
      const loadConfig = async () => {
        const combinedPayload = { ...recordValues, ...session };
        await fetchConfig(combinedPayload);
      };
      loadConfig();
    }
  }, [fetchConfig, recordValues, session, tabId, open, hasWindowReference]);

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
    const loadProcessMetadata = async () => {
      const hasParameters = Object.keys(button.processDefinition.parameters).length > 0;
      if (!open || hasParameters || !processId || loadingMetadata) return;

      try {
        setLoadingMetadata(true);
        setLoading(true);

        const slug = type === PROCESS_TYPES.PROCESS_DEFINITION ? "meta/process" : "meta/report-and-process";
        const response = await Metadata.client.post(`${slug}/${processId}`);

        if (response.ok && response.data) {
          const processData = response.data;

          if (processData.parameters) {
            setParameters((prev) => {
              const merged = { ...processData.parameters };
              for (const [key, value] of Object.entries(prev)) {
                if (!merged[key]) merged[key] = value;
              }
              return merged;
            });
          }

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
      setAutoSelectConfig(null);
      setAutoSelectApplied(false);
    }
  }, [button.processDefinition.parameters, open]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!open) return;
      if (warehousePluginLoading) return;
      if (warehouseSchema) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const effectiveOnLoad = onLoad || (isBulkCompletion ? DEFAULT_BULK_COMPLETION_ONLOAD : null);

        if (effectiveOnLoad && tab) {
          const result = await executeStringFunction(
            effectiveOnLoad,
            { Metadata, OB: createOBShim(), ...processScriptContext },
            button.processDefinition,
            {
              selectedRecords,
              tabId: tab.id || "",
              tableId: tab.table || "",
              parentRecord: recordValues,
            }
          );

          if (result) {
            const shouldStop = handleOnLoadResult(result);
            if (shouldStop) return;
          }
        }

        setTimeout(() => setLoading(false), 300);
      } catch (error) {
        logger.warn("Error loading parameters:", error);
        setLoading(false);
      }
    };

    fetchOptions();
  }, [
    button.processDefinition,
    onLoad,
    open,
    selectedRecords,
    recordValues,
    tab,
    isBulkCompletion,
    processScriptContext,
    warehousePluginLoading,
    warehouseSchema,
    handleOnLoadResult,
  ]);

  // -------------------------------------------------------------------------
  // Auto-select logic
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!autoSelectConfig || autoSelectApplied) return;

    if (autoSelectConfig._gridSelection) {
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
    if (!target || !Array.isArray(target._allRows) || target._allRows.length === 0) return;

    let valueToCompare = logic.value;
    if (logic.valueFromContext) {
      const selected = Object.values(selectedRecords || {})[0];
      valueToCompare = selected?.[logic.valueFromContext];
    }

    if (Array.isArray(logic.ids) && logic.ids.length > 0) {
      const idsSet = new Set(logic.ids.map((id) => String(id)));
      const matched = target._allRows.filter((row: unknown) => {
        const record = row as Record<string, unknown>;
        return idsSet.has(String(record?.id ?? record?.ID ?? record?.Id ?? row));
      });
      if (matched.length > 0) {
        setGridSelection((prev) => ({
          ...prev,
          [tableKey]: { ...prev[tableKey], _selection: matched },
        }));
        setAutoSelectApplied(true);
      }
      return;
    }

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
          return rowValue === valueToCompare;
      }
    });

    if (matchedRows.length > 0) {
      setGridSelection((prev) => ({
        ...prev,
        [tableKey]: { ...prev[tableKey], _selection: matchedRows },
      }));
      setAutoSelectApplied(true);
    }
  }, [autoSelectConfig, autoSelectApplied, gridSelection, selectedRecords]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderResponse = () => {
    if (!result) return null;
    if (result.success) return null;

    const isWarning = result.messageType === "warning";
    const msgTitle = isWarning ? t("process.warning") : t("process.processError");
    const msgText =
      result.error || result.data?.msgText || result.data?.message || t("errors.internalServerError.title");
    const displayText = msgText.replace(/<br\s*\/?>/gi, "\n");
    const borderColor = isWarning ? "border-(--color-warning-main)" : "border-(--color-error-main)";

    return (
      <div className={`p-3 rounded mb-4 border-l-4 bg-gray-50 ${borderColor}`}>
        <h4 className="font-bold text-sm">{msgTitle}</h4>
        <p className="text-sm border-(--color-active-40) rounded whitespace-pre-line p-2">{displayText}</p>
        {isWarning && result.linkTabId && result.linkRecordId && (
          <button
            type="button"
            onClick={() => handleNavigateToTab(result.linkTabId as string, result.linkRecordId as string)}
            className="text-blue-600 underline hover:text-blue-800 font-medium text-sm mt-1">
            {t("packing.checkStatus")}
          </button>
        )}
      </div>
    );
  };

  const getTabForParameter = useCallback((parameter: ProcessParameter) => {
    if (parameter.reference !== WINDOW_REFERENCE_ID || !parameter.window?.tabs) return null;
    return parameter.window.tabs[0] as Tab;
  }, []);

  const renderParameters = () => {
    if (result?.success) return null;

    const parametersList = Object.values(parameters)
      .filter((p) => {
        // @ts-ignore
        if (p.active === false) return false;
        if (isBulkCompletion) {
          return p.name === "DocAction" || p.dBColumnName === "DocAction" || p.name === "Document Actionn";
        }
        return true;
      })
      .sort((a, b) => (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0));

    const windowReferences: React.ReactElement[] = [];
    const selectors: React.ReactElement[] = [];

    for (const parameter of parametersList) {
      // @ts-ignore
      if (parameter.active === false) continue;
      if (parameter.reference === BUTTON_LIST_REFERENCE_ID) continue;

      if (parameter.reference === WINDOW_REFERENCE_ID) {
        const isDisplayed = evaluateWindowReferenceDisplay({
          parameter,
          logicFields,
          formValues,
          availableFormData,
          parameters,
          session,
          recordValues: recordValues || {},
          parentFields: tab?.fields,
        });

        if (!isDisplayed) continue;

        const parameterTab = getTabForParameter(parameter);
        windowReferences.push(
          <CollapsibleSection
            key={`window-ref-${parameter.id || parameter.name}-${gridRefreshKey}`}
            title={parameter.name}
            data-testid="CollapsibleSection__761503">
            <WindowReferenceGrid
              parameter={parameter}
              parameters={parameters}
              selectedRecordsCount={selectedRecordsCount}
              onSelectionChange={setGridSelection}
              gridSelection={gridSelection}
              tabId={parameterTab?.id || ""}
              entityName={parameterTab?.entityName || ""}
              windowReferenceTab={parameterTab || windowReferenceTab}
              processConfig={stableProcessConfig}
              processConfigLoading={processConfigLoading}
              processConfigError={processConfigError}
              recordValues={recordValues}
              currentValues={formValues}
              originTab={tab}
              showTitle={false}
              data-testid="WindowReferenceGrid__761503"
            />
          </CollapsibleSection>
        );
      } else {
        selectors.push(
          <ProcessParameterSelector
            key={`param-${parameter.id || parameter.name}-${parameter.reference || "default"}`}
            parameter={parameter}
            logicFields={logicFields}
            parameters={parameters}
            recordValues={recordValues || undefined}
            parentFields={tab?.fields}
            selectedRecordsCount={selectedRecordsCount}
            data-testid="ProcessParameterSelector__761503"
          />
        );
      }
    }

    return (
      <>
        {selectors.length > 0 && (
          <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2 mb-4">{selectors}</div>
        )}
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

  const renderModalContent = () => {
    if (warehousePluginLoading && onLoad) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 flex items-center gap-3">
            <span className="animate-spin text-2xl">⟳</span>
            <span className="text-sm text-gray-600">{button.name}</span>
          </div>
        </div>
      );
    }

    if (warehouseSchema) {
      return (
        <GenericWarehouseProcess
          schema={warehouseSchema}
          payscriptPlugin={warehousePayscriptPlugin}
          onProcessCode={warehouseOnProcess}
          processId={processId}
          onClose={handleClose}
          onSuccess={onSuccess}
          data-testid="GenericWarehouseProcess__761503"
        />
      );
    }

    return (
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
              <div className={`relative h-full ${isPending ? "animate-pulse cursor-progress cursor-to-children" : ""}`}>
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
                  : (!result || !result.success) && (
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
    );
  };

  return (
    <>
      {open && !result?.success && (
        <Modal open={open && !result?.success} onClose={handleClose} data-testid="Modal__761503">
          {renderModalContent()}
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ProcessDefinitionModal — default export with null guard
// ---------------------------------------------------------------------------

/**
 * ProcessDefinitionModal - Main export component with null check
 *
 * Provides a guard against null button props and forwards all props to the content component.
 */
export default function ProcessDefinitionModal({ button, ...props }: ProcessDefinitionModalProps) {
  if (!button) return null;
  return (
    <ProcessDefinitionModalContent {...props} button={button} data-testid="ProcessDefinitionModalContent__761503" />
  );
}
