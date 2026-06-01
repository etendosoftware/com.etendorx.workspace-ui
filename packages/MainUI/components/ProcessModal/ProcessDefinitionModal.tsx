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
import { toast } from "sonner";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import Button from "../../../ComponentLibrary/src/components/Button/Button";
import {
  // Contexts
  useTabContext,
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
  compileExpression,
  logger,
  FIELD_REFERENCE_CODES,
  datasource,
  Metadata,
  // Constants
  BUTTON_LIST_REFERENCE_ID,
  BUTTON_REFERENCE_ID,
  PROCESS_TYPES,
  isPickAndExecute,
  PICK_AND_EXECUTE_UI_PATTERN,
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
import { useWindowStore } from "@/stores/windowStore";
import { useUserStore } from "@/stores/userStore";
import { useLanguage } from "@/contexts/language";
import Modal from "../Modal";
import Loading from "../loading";
import { ToastContent } from "../ToastContent";
import WindowReferenceGrid from "./WindowReferenceGrid";
import ProcessParameterSelector from "./selectors/ProcessParameterSelector";
import { useProcessPayload, isDateReference, convertParameterDateFields } from "./hooks/useProcessPayload";
import { useProcessExecution } from "./hooks/useProcessExecution";
import { useProcessFICCallout, type FICCalloutResponse } from "./hooks/useProcessFICCallout";
import { compileOnRefreshFunction, type OnRefreshFunction } from "./processView";
import { useGridRowValidation } from "./hooks/useGridRowValidation";
import { useParameterChangeHooks } from "./hooks/useParameterChangeHooks";
import { compileParameterHook, type CompiledParameterHook } from "@/utils/processes/definition/compileParameterHook";
import { createFormHandle, type MessageBarHandle } from "@/utils/processes/definition/scriptProxies";
import {
  DEFAULT_PROCESS_PARAM_GROUP_ID,
  groupProcessParametersByFieldGroup,
  type ProcessParameterGroup,
} from "./utils/groupProcessParametersByFieldGroup";
import { buildSuccessBannerMessage } from "./utils/responseBanner";
import { CollapsibleSection } from "./components/CollapsibleSection";

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
  contextRecord,
}: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { getLabel, language } = useLanguage();
  const { graph } = useSelected();
  const { tab, record: tabRecord } = useTabContext();
  const record = tabRecord ?? (contextRecord as typeof tabRecord);
  const session = useUserStore((s) => s.session);
  const token = useUserStore((s) => s.token);
  const getCsrfToken = useUserStore((s) => s.getCsrfToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const triggerRecovery = useWindowStore((s) => s.triggerRecovery);
  const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);

  const [processDefinition, setProcessDefinition] = useState(button.processDefinition);
  const { etmetaOnprocess, etmetaOnload, etmetaOnRefresh } = processDefinition;

  // Build the reusable process script context (auth-aware HTTP helpers)
  // Memoized so the reference is stable: the useEffect that depends on it won't re-run on every render.
  const processScriptContext = useMemo(
    () => buildProcessScriptContext({ token: token || "", getCsrfToken, getLabel, language }),
    [token, getCsrfToken, getLabel, language]
  );

  // Compile etmetaOnRefresh once into a callable so we can attach it to the
  // "view" argument passed into onLoad/onProcess (mirrors classic's
  // view.onRefreshFunction; see processView.ts). undefined when the column is null.
  const onRefreshFunction: OnRefreshFunction | undefined = useMemo(
    () =>
      compileOnRefreshFunction(etmetaOnRefresh, {
        Metadata,
        // OB arrives via processScriptContext (single shared instance per modal).
        ...processScriptContext,
      }),
    [etmetaOnRefresh, processScriptContext]
  );
  const processId = processDefinition.id;
  const javaClassName = processDefinition.javaClassName;

  const [gridRefreshKey, setGridRefreshKey] = useState(0);

  // Warehouse plugin — evaluated only when etmetaOnload returns type: 'warehouseProcess'
  const selectedRecordsForPlugin = useMemo(() => (tab ? graph.getSelectedMultiple(tab) : []), [graph, tab]);

  const {
    schema: warehouseSchema,
    payscriptPlugin: warehousePayscriptPlugin,
    effectiveOnProcess: warehouseOnProcess,
    loading: warehousePluginLoading,
  } = useWarehousePlugin({
    processId,
    onLoadCode: etmetaOnload ?? undefined,
    onProcessCode: typeof etmetaOnprocess === "string" ? etmetaOnprocess : undefined,
    processDefinition: processDefinition as Record<string, unknown>,
    selectedRecords: selectedRecordsForPlugin as { id: string }[],
    token: token ?? "",
  });

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [result, setResult] = useState<ExecuteProcessResult | null>(null);
  const isFinalSuccess = result?.success === true && !result?.keepOpen;
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const [gridSelection, setGridSelectionInternal] = useState<GridSelectionStructure>({});
  const [shouldTriggerSuccess, setShouldTriggerSuccess] = useState(false);
  const [fileParams, setFileParams] = useState<Record<string, File>>({});

  const handleFileChange = useCallback((paramName: string, file: File | null) => {
    setFileParams((prev) => {
      if (file) return { ...prev, [paramName]: file };
      const next = { ...prev };
      delete next[paramName];
      return next;
    });
  }, []);

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

  // Register PayScript DSL if available in process definition.
  // Source: em_etmeta_payscript_logic column → etmetaPayscriptLogic property.
  useEffect(() => {
    if (processDefinition.id && processDefinition.etmetaPayscriptLogic) {
      registerPayScriptDSL(processDefinition.id, processDefinition.etmetaPayscriptLogic);
      setRulesRegistered(true);
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

    const getListButtons = (refList: any[]): any[] => {
      return refList.map((item) => ({
        value: item.value,
        label: item.label,
      }));
    };

    const getDynamicButtons = async (buttonListParam: any) => {
      const rawRefKey = buttonListParam.referenceSearchKey;
      const referenceId = rawRefKey && typeof rawRefKey === "object" ? (rawRefKey as { id: string }).id : rawRefKey;

      if (!referenceId) return [];

      const responseData = await fetchDynamicButtons(referenceId);
      if (!responseData || responseData.length === 0) return [];

      return responseData.map((item: any) => ({
        value: item.searchKey,
        label: item.name,
        isFilter: ["filter", "search", "refresh"].includes(item.searchKey?.toLowerCase()),
      }));
    };

    const loadButtons = async () => {
      const allParameters = Object.values(parameters);
      const buttonListParam = allParameters.find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
      const individualButtons = allParameters.filter((p) => p.reference === BUTTON_REFERENCE_ID);

      if (!buttonListParam && individualButtons.length === 0) {
        if (active) setAvailableButtons([]);
        return;
      }

      const buttons: Array<{ value: string; label: string; isFilter?: boolean }> = [];

      if (buttonListParam) {
        if (buttonListParam.refList && buttonListParam.refList.length > 0) {
          buttons.push(...getListButtons(buttonListParam.refList));
        } else {
          const dynamicButtons = await getDynamicButtons(buttonListParam);
          buttons.push(...dynamicButtons);
        }
      }

      const individualMapped = individualButtons.map((p) => ({
        value: p.dBColumnName,
        label: p.name,
      }));
      buttons.push(...individualMapped);

      if (active) {
        setAvailableButtons(buttons);
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

  // Pick-and-Execute discriminator: prefers the explicit `uiPattern` from metadata
  // and falls back to the presence of a Window Reference parameter for legacy seeds.
  const isPE = useMemo(() => isPickAndExecute(button.processDefinition), [button.processDefinition]);

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
    logicFields: staticLogicFields,
    filterExpressions,
    hasData: hasInitialData,
  } = useProcessInitializationState(processInitialization, memoizedParameters);

  // Dynamic logic fields updated by server-side FIC callout responses.
  // These take precedence over the static initialization values.
  const [calloutLogicFields, setCalloutLogicFields] = useState<Record<string, boolean>>({});

  // Combined view: static defaults + dynamic callout updates (callout wins on conflict)
  const logicFields = useMemo(
    () => ({ ...staticLogicFields, ...calloutLogicFields }),
    [staticLogicFields, calloutLogicFields]
  );

  // Reset callout logic fields when the modal closes
  useEffect(() => {
    if (!open) setCalloutLogicFields({});
  }, [open]);

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
    // Flatten raw defaults so expressions like @adcs_action@ resolve to a simple
    // string instead of a { value, identifier } object. Without this, any
    // defaultValue expression that references an unmapped raw column key (keys
    // without the "inp" prefix that mapInitializationResponse leaves as-is) would
    // receive the raw object, causing evaluateParameterDefaults to compute wrong
    // values and corrupting the form state submitted to the backend.
    const flatDefaults = Object.fromEntries(
      Object.entries(processInitialization?.defaults || {}).map(([key, val]) => [
        key,
        val && typeof val === "object" && "value" in val ? (val as { value: unknown }).value : val,
      ])
    );
    const combined = {
      ...basePayload,
      // Include raw parameter keys from DefaultsProcessActionHandler (e.g. "currentStatus")
      // alongside the display-name-mapped versions (e.g. "Current Status").
      // Selector filters on the backend use @currentStatus@ (the raw key), not the display name.
      ...flatDefaults,
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
  const formValuesRef = useRef(rawFormValues);
  if (JSON.stringify(formValuesRef.current) !== JSON.stringify(rawFormValues)) {
    formValuesRef.current = rawFormValues;
  }
  const formValues = formValuesRef.current;

  // Parameter-level migrated JS hooks. `onParameterChange` is bound centrally to
  // value changes; `onGridLoad` is compiled per grid parameter and handed to its
  // WindowReferenceGrid. Both share the process-level hooks' script context.
  const scriptHookContext = useMemo(() => ({ Metadata, ...processScriptContext }), [processScriptContext]);
  const scriptFormHandle = useMemo(() => createFormHandle(form), [form]);
  const messageBar = useMemo<MessageBarHandle>(() => {
    const toastBySeverity: Record<string, (message: string) => void> = {
      error: toast.error,
      warning: toast.warning,
      success: toast.success,
      info: toast.info,
    };
    return {
      setMessage: (severity, _title, text) => (toastBySeverity[String(severity).toLowerCase()] ?? toast)(text),
      hide: () => toast.dismiss(),
    };
  }, []);

  useParameterChangeHooks({ form, parameters, context: scriptHookContext, messageBar });

  const gridLoadHooks = useMemo(() => {
    const map = new Map<string, CompiledParameterHook | null>();
    for (const param of Object.values(parameters)) {
      if (param.etmetaOnGridLoad) {
        map.set(param.id || param.name, compileParameterHook(param.etmetaOnGridLoad, scriptHookContext));
      }
    }
    return map;
  }, [parameters, scriptHookContext]);

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

  // Generic server-side callout for REPORT_AND_PROCESS processes.
  // Replicates Classic's FormInitializationComponent MODE=CHANGE mechanism:
  // when any parameter changes, the FIC servlet is called and the response
  // (updated column values + display logic) is applied back to the form.
  // The tabId comes from the process metadata returned by meta/report-and-process.
  const ficTabId =
    type === PROCESS_TYPES.REPORT_AND_PROCESS
      ? ((processDefinition as Record<string, unknown>).tabId as string | undefined) || ""
      : "";

  const handleCalloutResponse = useCallback(
    (response: FICCalloutResponse) => {
      // Apply field value updates from the callout
      for (const [rawKey, rawValue] of Object.entries(response.columnValues)) {
        // Classic uses inp-prefixed keys; strip the prefix to find the form field
        const key = rawKey.startsWith("inp") ? rawKey.substring(3) : rawKey;

        // Try to match by dBColumnName first, then by name
        const param = Object.values(parameters).find(
          (p) => p.dBColumnName === key || p.dBColumnName === rawKey || p.name === key || p.name === rawKey
        );
        const formKey = param?.name || key;

        if (rawValue.value !== undefined) {
          form.setValue(formKey, rawValue.value, { shouldDirty: true, shouldValidate: false });
        }
        if (rawValue.identifier !== undefined) {
          form.setValue(`${formKey}$_identifier`, rawValue.identifier, { shouldDirty: false, shouldValidate: false });
        }
      }

      // Extract display/readonly logic updates from columnValues.
      // Classic FIC returns logic flags as entries with keys ending in _displaylogic / _readonly_logic.
      const newLogic: Record<string, boolean> = {};
      for (const [rawKey, rawValue] of Object.entries(response.columnValues)) {
        const lowerKey = rawKey.toLowerCase();
        if (lowerKey.endsWith("_displaylogic") || lowerKey.endsWith("_display_logic")) {
          const baseKey = rawKey.replace(/_display_?logic$/i, "");
          const param = Object.values(parameters).find((p) => p.dBColumnName === baseKey || p.name === baseKey);
          const logicKey = param?.name || baseKey;
          newLogic[`${logicKey}.display`] = rawValue.value === "Y";
        } else if (lowerKey.endsWith("_readonlylogic") || lowerKey.endsWith("_readonly_logic")) {
          const baseKey = rawKey.replace(/_readonly_?logic$/i, "");
          const param = Object.values(parameters).find((p) => p.dBColumnName === baseKey || p.name === baseKey);
          const logicKey = param?.name || baseKey;
          newLogic[`${logicKey}.readonly`] = rawValue.value === "Y";
        }
      }

      if (Object.keys(newLogic).length > 0) {
        setCalloutLogicFields((prev) => ({ ...prev, ...newLogic }));
      }
    },
    [parameters, form]
  );

  useProcessFICCallout({
    tabId: ficTabId,
    parameters,
    form,
    enabled: open && !!ficTabId && !loading && !initializationLoading,
    onCalloutResponse: handleCalloutResponse,
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

  const peGrids = useMemo(() => {
    if (!isPE) return [];
    return Object.values(parameters)
      .filter((p) => p.reference === WINDOW_REFERENCE_ID && p.window?.tabs)
      .map((p) => {
        const paramTab = p.window!.tabs![0] as Tab;
        const key = p.dBColumnName || p.name;
        return {
          selectedRows: gridSelection[key]?._selection ?? [],
          fields: paramTab?.fields,
        };
      });
  }, [isPE, parameters, gridSelection]);

  const { hasInvalidSelection } = useGridRowValidation({ grids: peGrids });

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
    etmetaOnprocess,
    onRefreshFunction,
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
    hasWindowReference: isPE,
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
    fileParams,
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
    if (open && isPE) {
      const loadConfig = async () => {
        const combinedPayload = { ...recordValues, ...session };
        await fetchConfig(combinedPayload);
      };
      loadConfig();
    }
  }, [fetchConfig, recordValues, session, tabId, open, isPE]);

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

  // Report and Process subtype with uipattern = "Pick and Execute" is not implemented.
  // Surface a warning and close the modal to avoid a broken render (no Window Reference
  // parameter → empty grid + no Done payload).
  useEffect(() => {
    if (!open) return;
    if (type !== PROCESS_TYPES.REPORT_AND_PROCESS) return;
    if (processDefinition?.uIPattern !== PICK_AND_EXECUTE_UI_PATTERN) return;
    toast.warning(t("process.pickAndExecuteNotImplemented"));
    onClose();
  }, [open, type, processDefinition?.uIPattern, t, onClose]);

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

        const effectiveOnLoad = etmetaOnload || (isBulkCompletion ? DEFAULT_BULK_COMPLETION_ONLOAD : null);

        if (effectiveOnLoad && tab) {
          const result = await executeStringFunction(
            effectiveOnLoad,
            { Metadata, ...processScriptContext },
            button.processDefinition,
            {
              selectedRecords,
              tabId: tab.id || "",
              tableId: tab.table || "",
              parentRecord: recordValues,
              // Mirrors classic SmartClient view.onRefreshFunction so migrated
              // scripts can call view.onRefreshFunction(view) to rebuild the modal.
              onRefreshFunction,
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
    etmetaOnload,
    onRefreshFunction,
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
    if (isFinalSuccess) return null;

    if (result.keepOpen && result.success) {
      // Only render the success banner when the server explicitly emitted a
      // message via `responseActions[].showMsgInProcessView` (Classic UX:
      // silent on actions like Search that only refresh the grid).
      const parsed = buildSuccessBannerMessage(result.data, result.isHtml);
      if (!parsed) return null;
      return (
        <div className="p-3 rounded mb-4 border-l-4 bg-gray-50 border-(--color-success-main)">
          <h4 className="font-bold text-sm">{t("process.completedSuccessfully")}</h4>
          <div className="border-(--color-active-40) rounded p-2">
            <ToastContent message={parsed.msgText} isHtml={parsed.isHtml} data-testid="ToastContent__761503" />
          </div>
        </div>
      );
    }

    const isWarning = result.messageType === "warning";
    const msgTitle = t("process.warning");
    const rawMsg =
      result.error ||
      (typeof result.data === "string" ? result.data : result.data?.msgText || result.data?.message) ||
      t("errors.internalServerError.title");
    const msgText = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
    const isHtml = Boolean(result.isHtml) || /<[a-z][\s\S]*>/i.test(msgText);
    const borderColor = "border-(--color-warning-main)";

    return (
      <div className={`p-3 rounded mb-4 border-l-4 bg-gray-50 ${borderColor}`}>
        <h4 className="font-bold text-sm">{msgTitle}</h4>
        <div className="border-(--color-active-40) rounded p-2">
          <ToastContent message={msgText} isHtml={isHtml} data-testid="ToastContent__761503" />
        </div>
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

  const isWindowReferenceParameter = useCallback(
    (parameter: ProcessParameter) => parameter.reference === WINDOW_REFERENCE_ID,
    []
  );

  const resolveGroupTitle = useCallback((group: ProcessParameterGroup): string => group.identifier, []);

  const isParameterRenderable = useCallback(
    (parameter: ProcessParameter): boolean => {
      // @ts-ignore — `active` is not in the public ProcessParameter type but
      // the metadata payload carries it; mirroring the previous behaviour.
      if (parameter.active === false) return false;
      if (isBulkCompletion) {
        return (
          parameter.name === "DocAction" ||
          parameter.dBColumnName === "DocAction" ||
          parameter.name === "Document Actionn"
        );
      }
      if (parameter.reference === BUTTON_LIST_REFERENCE_ID || parameter.reference === BUTTON_REFERENCE_ID) {
        return false;
      }
      if (isWindowReferenceParameter(parameter)) {
        return evaluateWindowReferenceDisplay({
          parameter,
          logicFields,
          formValues,
          availableFormData,
          parameters,
          session,
          recordValues: recordValues || {},
          parentFields: tab?.fields,
        });
      }
      return true;
    },
    [
      isBulkCompletion,
      isWindowReferenceParameter,
      logicFields,
      formValues,
      availableFormData,
      parameters,
      session,
      recordValues,
      tab?.fields,
    ]
  );

  const renderScalarParameter = (parameter: ProcessParameter) => (
    <ProcessParameterSelector
      key={`param-${parameter.id || parameter.name}-${parameter.reference || "default"}`}
      parameter={parameter}
      logicFields={logicFields}
      parameters={parameters}
      recordValues={recordValues || undefined}
      parentFields={tab?.fields}
      selectedRecordsCount={selectedRecordsCount}
      onFileChange={handleFileChange}
      values={formValues}
      processId={processId}
      data-testid="ProcessParameterSelector__761503"
    />
  );

  const renderWindowReferenceParameter = (parameter: ProcessParameter) => {
    const parameterTab = getTabForParameter(parameter);
    return (
      <WindowReferenceGrid
        key={`window-ref-${parameter.id || parameter.name}-${gridRefreshKey}`}
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
        onClose={onClose}
        processDefinition={button.processDefinition}
        onGridLoadHook={gridLoadHooks.get(parameter.id || parameter.name) ?? null}
        gridLoadFormHandle={scriptFormHandle}
        messageBar={messageBar}
        data-testid="WindowReferenceGrid__761503"
      />
    );
  };

  const renderGroupBody = (group: ProcessParameterGroup) => {
    const scalars = group.parameters.filter((p) => !isWindowReferenceParameter(p));
    const windowRefs = group.parameters.filter(isWindowReferenceParameter);
    return (
      <>
        {scalars.length > 0 && (
          <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2">{scalars.map(renderScalarParameter)}</div>
        )}
        {windowRefs.length > 0 && (
          <div className="w-full flex flex-col gap-4 mt-2">{windowRefs.map(renderWindowReferenceParameter)}</div>
        )}
      </>
    );
  };

  const renderGroup = (group: ProcessParameterGroup) => {
    if (group.id === DEFAULT_PROCESS_PARAM_GROUP_ID) {
      return (
        <div key={`group-${group.id}`} className="w-full">
          {renderGroupBody(group)}
        </div>
      );
    }
    return (
      <CollapsibleSection
        key={`group-${group.id}`}
        title={resolveGroupTitle(group)}
        initiallyExpanded={!group.fieldGroupCollapsed}
        data-testid="CollapsibleSection__761503">
        {renderGroupBody(group)}
      </CollapsibleSection>
    );
  };

  const renderParameters = () => {
    // When retryExecution=true (keepOpen), keep the form visible so the user can re-execute.
    // Only hide parameters when execution fully completed (isFinalSuccess).
    if (result?.success && !result?.keepOpen) return null;

    const visibleParameters = Object.values(parameters)
      .filter(isParameterRenderable)
      .sort((a, b) => (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0));

    const groups = groupProcessParametersByFieldGroup(visibleParameters);
    if (groups.length === 0) return null;

    return <div className="w-full flex flex-col gap-4 mb-4">{groups.map(renderGroup)}</div>;
  };

  const getActionButtonContent = () => {
    if (isPending) {
      return {
        icon: null,
        text: <span className="animate-pulse">{t("common.loading")}...</span>,
      };
    }
    if (isFinalSuccess) {
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
    loadingMetadata ||
    initializationBlocksSubmit ||
    hasMandatoryParametersWithoutValue ||
    isSubmitting ||
    !!isFinalSuccess ||
    (isPE && !gridSelection) ||
    (isPE && hasInvalidSelection);

  const renderModalContent = () => {
    if (warehousePluginLoading && etmetaOnload) {
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
                {!!button.processDefinition.description && (
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
                  {renderResponse()}
                  {renderParameters()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end mx-3 my-3">
              {type === PROCESS_TYPES.REPORT_AND_PROCESS && (!result || !isFinalSuccess) && (
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

              {type !== PROCESS_TYPES.REPORT_AND_PROCESS && (!result || !isFinalSuccess) && !isPending && (
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
                ((!result || !isFinalSuccess) && availableButtons.length > 0
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
                  : (!result || !isFinalSuccess) && (
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
      {open && !isFinalSuccess && (
        <Modal open={open && !isFinalSuccess} onClose={handleClose} data-testid="Modal__761503">
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
