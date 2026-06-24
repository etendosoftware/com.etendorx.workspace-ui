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
 * @fileoverview useProcessExecution — hook that encapsulates the 4 execution paths
 * (window reference, direct Java, string function, report-and-process), response
 * parsing helpers, success/close handling, and tab navigation.
 */

import React, { useCallback } from "react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ExecuteProcessResult } from "@/app/actions/process";
import { revalidateDopoProcess } from "@/app/actions/revalidate";
import { buildProcessPayload } from "@/utils";
import { executeStringFunction } from "@/utils/functions";
import { buildProcessParameters } from "@/utils/process/processPayloadMapper";
import {
  BUTTON_LIST_REFERENCE_ID,
  PROCESS_DEFINITION_DATA,
  WINDOW_SPECIFIC_KEYS,
} from "@/utils/processes/definition/constants";
import { logger } from "@/utils/logger";
import { useTranslation } from "@/hooks/useTranslation";
import { parseSmartClientMessage } from "../Custom/shared/processModalUtils";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { appendWindowToUrl } from "@/utils/url/utils";
import { ToastContent } from "@/components/ToastContent";
import type { Tab, ProcessParameter, EntityData } from "@workspaceui/api-client/src/api/types";
import { normalizeGridValues } from "@/utils/process/gridNormalization";
import { shouldRefreshAfterProcess, shouldRetryAfterProcess } from "../utils/processResponseFlags";
import {
  type DispatchedAction,
  dispatchResponseActions,
  findFirstMessage,
  findFirstOpenDirectTab,
  readDispatchableResponseActions,
} from "../utils/responseActionDispatcher";
import { dispatchProcessReturnActions } from "@/utils/processes/definition/actionDispatcherStore";
import {
  createFormHandle,
  createViewProxy,
  type CallerField,
  type FieldController,
  type GridResolver,
  type ViewController,
  type ViewData,
} from "@/utils/processes/definition/scriptProxies";
import { shouldRunProcessLifecycleHooks } from "@/utils/processes/definition/processLifecycle";
import { messageBar } from "@/utils/processes/definition/messageBarStore";

// ---------------------------------------------------------------------------
// Internal types for response action shapes
// ---------------------------------------------------------------------------

interface ExtractedMessage {
  message: unknown;
  messageType: string | undefined;
  isHtml: boolean;
  linkTabId?: string;
  linkRecordId?: string;
}

// ---------------------------------------------------------------------------
// Pure helpers for executeJavaProcess
// ---------------------------------------------------------------------------

/** Registry-first dispatcher of the OB shim (`OB.Utilities.Action.executeJSON`). */
type ActionExecuteJSON = (jsonArray: unknown) => void;

/**
 * Reads `OB.Utilities.Action.executeJSON` from the shared script context. The
 * same per-modal OB shim instance that `onLoad` used to register process actions
 * (e.g. `showVATGrid`) is reachable here, so dispatching the kernel response
 * through it runs those registered actions plus the built-in ones.
 */
const getActionExecuteJSON = (ctx: Record<string, unknown>): ActionExecuteJSON | undefined =>
  (ctx.OB as { Utilities?: { Action?: { executeJSON?: ActionExecuteJSON } } } | undefined)?.Utilities?.Action
    ?.executeJSON;

const KERNEL_ENDPOINT = "/api/erp/org.openbravo.client.kernel";

const buildKernelEndpoint = (args: {
  processId?: string;
  windowId?: string | number;
  javaClassName?: string;
}): string => {
  const qs = new URLSearchParams();
  if (args.processId) qs.set("processId", args.processId);
  if (args.windowId !== undefined && args.windowId !== null && args.windowId !== "") {
    qs.set("windowId", String(args.windowId));
  }
  if (args.javaClassName) qs.set("_action", args.javaClassName);
  return `${KERNEL_ENDPOINT}?${qs.toString()}`;
};

/** Fetches `url`, throws on non-2xx, returns parsed JSON or null when body is not JSON. */
const fetchAndParseJson = async (url: string, init: RequestInit): Promise<unknown> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Execution failed");
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Param / return types
// ---------------------------------------------------------------------------

export interface UseProcessExecutionParams {
  // Process identity
  processId: string;
  javaClassName: string | undefined;
  windowId: string | number;
  tabId: string;
  /** Body of em_etmeta_onprocess column, evaluated as a function expression on submit. */
  etmetaOnprocess: string | null | undefined;
  /**
   * Pre-compiled body of em_etmeta_on_refresh. Attached to the view-arg passed
   * to the string function so migrated code can call view.onRefreshFunction(view)
   * exactly like classic SmartClient does.
   */
  onRefreshFunction: ((view: unknown) => unknown) | undefined;
  // Context
  tab: Tab | undefined;
  /** Forwarded launcher field; present only for nested (script-launched) opens. */
  callerField?: CallerField;
  record: EntityData | undefined;
  initialState: Record<string, any> | undefined;
  selectedRecords: EntityData[];
  /**
   * Script context shared by every migrated hook ({ Metadata, ...processScriptContext,
   * ...moduleScope }). Used as the onProcess injection context so module-scope helpers
   * resolve by bare name on submit too.
   */
  scriptContext: Record<string, unknown>;
  /** View-level bridge + read-only data, so onProcess's second arg is the canonical view. */
  viewController?: ViewController;
  viewData?: ViewData;
  fieldController?: FieldController;
  /** Resolves `view.theForm.getItem('<param>').canvas.viewGrid` inside onProcess. */
  gridResolver?: GridResolver;
  // biome-ignore lint/suspicious/noExplicitAny: button shape varies by process type
  button: any;
  parameters: Record<string, ProcessParameter>;
  form: UseFormReturn<any>;
  // Auth
  token: string | undefined;
  getCsrfToken: () => string;
  // Navigation
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
  isRecoveryLoading: boolean;
  triggerRecovery: () => void;
  onClose: () => void;
  onSuccess: (() => void) | undefined;
  keepOpenOnSuccess?: boolean;
  // Payload builders (from useProcessPayload)
  getMergedProcessValues: (extra?: Record<string, any>) => Record<string, any>;
  getRecordIds: () => string[];
  buildProcessSpecificFields: (id: string) => Record<string, unknown>;
  buildWindowSpecificFields: (windowId: string | number) => Record<string, unknown>;
  getMappedFormValues: () => Record<string, any>;
  resolveDocAction: (fv: Record<string, any>) => void;
  // Execution state
  hasWindowReference: boolean;
  availableButtons: Array<{ value: string; isFilter?: boolean }>;
  isPending: boolean;
  shouldTriggerSuccess: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  // State setters
  setResult: (result: ExecuteProcessResult | null) => void;
  setLoading: (loading: boolean) => void;
  setParameters: (params: any) => void;
  setShouldTriggerSuccess: (value: boolean) => void;
  setGridRefreshKey: (fn: (prev: number) => number) => void;
  /** Original button.processDefinition.parameters — used to reset on close */
  initialParameters: Record<string, ProcessParameter>;
  /** File objects from Upload File parameters, keyed by parameter dBColumnName */
  fileParams: Record<string, File>;
}

export interface UseProcessExecutionReturn {
  executeJavaProcess: (payload: any, logContext?: string) => Promise<void>;
  handleWindowReferenceExecute: (actionValue?: string) => Promise<void>;
  handleDirectJavaProcessExecute: (actionValue?: string) => Promise<void>;
  handleExecute: (actionValue?: string) => Promise<void>;
  handleReportProcessExecute: () => Promise<void>;
  handleSuccessClose: (triggerSuccess?: boolean) => void;
  handleNavigateToTab: (tabId: string, recordId: string) => Promise<void>;
  parseProcessResponse: (res: ExecuteProcessResult) => ExecuteProcessResult;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProcessExecution({
  processId,
  javaClassName,
  windowId,
  tabId,
  etmetaOnprocess,
  onRefreshFunction,
  tab,
  callerField,
  record,
  initialState,
  selectedRecords,
  scriptContext,
  viewController,
  viewData,
  fieldController,
  gridResolver,
  button,
  parameters,
  form,
  token,
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
  initialParameters,
  fileParams,
}: UseProcessExecutionParams): UseProcessExecutionReturn {
  const { t } = useTranslation();

  // -------------------------------------------------------------------------
  // Response parsing
  // -------------------------------------------------------------------------

  const extractMessageFromProcessView = useCallback((res: ExecuteProcessResult): ExtractedMessage | null => {
    const actions: DispatchedAction[] = dispatchResponseActions(res.data);
    const message = findFirstMessage(actions);
    // Prefer the structured `openDirectTab` action over the legacy SmartClient
    // HTML link parser. The fallback still kicks in when the handler embeds
    // `openDirectTab('TAB','REC')` inside the message HTML (older handlers).
    const structuredOpenDirectTab = findFirstOpenDirectTab(actions);

    if (message) {
      const rawMsg = message.payload.msgText || "";
      const parsedHtml = parseSmartClientMessage(rawMsg);
      return {
        message: rawMsg || parsedHtml.text,
        messageType: message.payload.msgType,
        isHtml: /<[a-z][\s\S]*>/i.test(rawMsg),
        linkTabId: structuredOpenDirectTab?.tabId ?? parsedHtml.tabId,
        linkRecordId: structuredOpenDirectTab?.recordId ?? parsedHtml.recordId,
      };
    }

    const smartclientSayAction = actions.find(
      (a): a is Extract<DispatchedAction, { kind: "smartclientSay" }> => a.kind === "smartclientSay"
    );
    if (smartclientSayAction?.payload.message) {
      return {
        message: smartclientSayAction.payload.message,
        messageType: "success",
        isHtml: true,
      };
    }

    return null;
  }, []);

  const extractMessageFromData = useCallback((res: ExecuteProcessResult): ExtractedMessage => {
    if (res.data?.response?.error) {
      return {
        message: res.data.response.error.message,
        messageType: "error",
        isHtml: false,
      };
    }

    if (res.data && typeof res.data === "object" && "text" in res.data) {
      return {
        message: res.data.text,
        messageType: res.data.severity || "success",
        isHtml: false,
      };
    }

    const potentialMessage = res.data?.message || res.data?.msgText || res.data?.responseMessage;

    if (potentialMessage && typeof potentialMessage === "object" && "text" in potentialMessage) {
      return {
        message: potentialMessage.text,
        messageType: potentialMessage.severity || "success",
        isHtml: false,
      };
    }

    return {
      message: potentialMessage,
      messageType: res.data?.msgType || res.data?.messageType || (res.success ? "success" : "error"),
      isHtml: false,
    };
  }, []);

  const parseProcessResponse = useCallback(
    (res: ExecuteProcessResult): ExecuteProcessResult => {
      const viewMessage = extractMessageFromProcessView(res);
      const { message, messageType, isHtml, linkTabId, linkRecordId } = viewMessage || extractMessageFromData(res);

      return {
        success: res.success && messageType === "success",
        data: message,
        error: messageType !== "success" ? (message as string | undefined) || res.error : undefined,
        isHtml: isHtml || false,
        messageType,
        linkTabId,
        linkRecordId,
      };
    },
    [extractMessageFromProcessView, extractMessageFromData]
  );

  // -------------------------------------------------------------------------
  // Tab navigation (for openDirectTab warning links)
  // -------------------------------------------------------------------------

  const handleNavigateToTab = useCallback(
    async (targetTabId: string, recordId: string) => {
      if (isRecoveryLoading) return;
      try {
        const res = await fetch(`/api/erp/meta/tab/${targetTabId}?language=en_US`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const tabData = await res.json();
        const resolvedWindowId = tabData?.window || tabData?.windowId || targetTabId;
        setResult(null);
        onClose();
        const newWindowIdentifier = getNewWindowIdentifier(resolvedWindowId);
        triggerRecovery();
        const newUrlParams = appendWindowToUrl(searchParams, {
          windowIdentifier: newWindowIdentifier,
          tabId: targetTabId,
          recordId,
        });
        router.replace(`window?${newUrlParams}`);
      } catch (e) {
        logger.warn("[ProcessDefinitionModal] Tab navigation failed, falling back", e);
        window.location.href = `/window?wi_0=${targetTabId}_${Date.now()}&ri_0=${recordId}`;
      }
    },
    [token, isRecoveryLoading, triggerRecovery, searchParams, router, onClose, setResult]
  );

  // -------------------------------------------------------------------------
  // Success / close handling
  // -------------------------------------------------------------------------

  const handleSuccessClose = useCallback(
    (triggerSuccess?: boolean) => {
      if (isPending) return;

      const shouldRefresh = triggerSuccess || shouldTriggerSuccess;
      if (shouldRefresh) {
        onSuccess?.();
      }

      setShouldTriggerSuccess(false);
      setResult(null);

      if (keepOpenOnSuccess) {
        setGridRefreshKey((prev) => prev + 1);
        return;
      }

      setLoading(true);
      setParameters(initialParameters);
      onClose();
    },
    [
      initialParameters,
      isPending,
      keepOpenOnSuccess,
      onClose,
      shouldTriggerSuccess,
      onSuccess,
      setResult,
      setLoading,
      setParameters,
      setShouldTriggerSuccess,
      setGridRefreshKey,
    ]
  );

  const showProcessToast = useCallback(
    (params: {
      isSuccess: boolean;
      message: string;
      linkTabId?: string;
      linkRecordId?: string;
    }) => {
      const { isSuccess, message, linkTabId, linkRecordId } = params;
      const toastFn = isSuccess ? toast.success : toast.warning;
      const title = isSuccess ? t("process.completedSuccessfully") : t("process.warning");

      const parsed =
        typeof message === "string"
          ? parseSmartClientMessage(message)
          : { text: message, tabId: undefined, recordId: undefined };

      toastFn(title, {
        description: React.createElement(ToastContent, {
          message: parsed.text || message,
          linkTabId: linkTabId || parsed.tabId,
          linkRecordId: linkRecordId || parsed.recordId,
          onNavigate: handleNavigateToTab,
          "data-testid": "ToastContent__761503",
        } as any),
        duration: linkTabId || parsed.tabId ? Number.POSITIVE_INFINITY : 5000,
      });
    },
    [t, handleNavigateToTab]
  );

  // -------------------------------------------------------------------------
  // Core Java servlet execution
  // -------------------------------------------------------------------------

  const buildMultipartRequest = useCallback(
    (apiUrl: string, payload: any): RequestInit => {
      const formData = new FormData();
      for (const [paramName, file] of Object.entries(fileParams)) {
        formData.append(paramName, file, file.name);
      }
      formData.append("processId", processId || "");
      formData.append("reportId", "null");
      formData.append("windowId", String(tab?.window || ""));
      if (payload._params) {
        for (const [paramName, file] of Object.entries(fileParams)) {
          payload._params[paramName] = `C:\\fakepath\\${(file as File).name}`;
        }
      }
      formData.append("paramValues", JSON.stringify(payload));
      return {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "X-CSRF-Token": getCsrfToken() },
        body: formData,
      };
    },
    [fileParams, processId, tab?.window, token, getCsrfToken]
  );

  const buildJsonRequest = useCallback(
    (payload: any): RequestInit => ({
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${token}`,
        "X-CSRF-Token": getCsrfToken(),
      },
      body: JSON.stringify(payload),
    }),
    [token, getCsrfToken]
  );

  const handleJavaProcessResult = useCallback(
    async (parsedResult: ReturnType<typeof parseProcessResponse>) => {
      const { messageType, linkTabId, linkRecordId } = parsedResult;
      if (messageType === "success" || messageType === "warning") {
        await revalidateDopoProcess();
        const message =
          typeof parsedResult.data === "string"
            ? parsedResult.data
            : parsedResult.data?.message || parsedResult.data?.msgText || "";
        showProcessToast({ isSuccess: messageType === "success", message, linkTabId, linkRecordId });
        setShouldTriggerSuccess(true);
        handleSuccessClose(true);
      } else {
        setResult(parsedResult);
      }
    },
    [revalidateDopoProcess, showProcessToast, setShouldTriggerSuccess, handleSuccessClose, setResult]
  );

  const executeJavaProcess = useCallback(
    async (payload: any, logContext = "process") => {
      try {
        const apiUrl = buildKernelEndpoint({ processId, windowId: tab?.window, javaClassName });
        const hasFiles = Object.keys(fileParams).length > 0;
        const requestInit = hasFiles ? buildMultipartRequest(apiUrl, payload) : buildJsonRequest(payload);

        const resultData = await fetchAndParseJson(apiUrl, requestInit);
        const parsedResult = parseProcessResponse({ success: true, data: resultData });

        // Dispatch the server `responseActions` registry-first, mirroring the
        // classic `OB.Utilities.Action.executeJSON(responseActions)` the process
        // popup runs after every execution. This fires process-registered actions
        // (e.g. `showVATGrid`) and the built-in grid refreshes; message/navigation
        // keys are skipped because the success flow below already handles them.
        const dispatchableActions = readDispatchableResponseActions(resultData);
        if (dispatchableActions.length > 0) {
          getActionExecuteJSON(scriptContext)?.(dispatchableActions);
        }

        if (shouldRetryAfterProcess(resultData)) {
          setShouldTriggerSuccess(true);
          setResult({ ...parsedResult, keepOpen: true });
          if (shouldRefreshAfterProcess(resultData)) {
            setGridRefreshKey((prev) => prev + 1);
          }
          return;
        }

        await handleJavaProcessResult(parsedResult);
      } catch (error) {
        logger.warn(`Error executing ${logContext}:`, error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
    [
      processId,
      tab?.window,
      javaClassName,
      fileParams,
      scriptContext,
      buildMultipartRequest,
      buildJsonRequest,
      parseProcessResponse,
      handleJavaProcessResult,
      setResult,
      setShouldTriggerSuccess,
      setGridRefreshKey,
    ]
  );

  // -------------------------------------------------------------------------
  // Execution paths
  // -------------------------------------------------------------------------

  const handleWindowReferenceExecute = useCallback(
    async (actionValue?: string) => {
      if (!processId) return;
      startTransition(async () => {
        const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
        const buttonParams = buttonListParam && actionValue ? { [buttonListParam.dBColumnName]: actionValue } : {};

        const mergedValues = getMergedProcessValues();
        const _basePayload = tab ? buildProcessPayload(record || {}, tab, {}, {}) : {};

        const processDefConfig = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
        const skipParamsLevel = processDefConfig?.skipParamsLevel;

        // Classic's OBPickAndExecuteActionHandler reads grid data from _params.grid.
        const normalizedValues = normalizeGridValues(mergedValues);

        const payload: Record<string, unknown> = {
          recordIds: getRecordIds(),
          // Classic SmartClient sends "newVersion" as the Done button value for Pick & Execute
          _buttonValue: actionValue || "newVersion",
          ...(skipParamsLevel
            ? { ...normalizedValues, ...buttonParams }
            : { _params: { ...normalizedValues, ...buttonParams } }),
          _entityName: tab?.entityName || "",
          windowId: tab?.window || "",
          ...buildProcessSpecificFields(processId),
          ...(tab?.window ? buildWindowSpecificFields(tab.window) : {}),
          ..._basePayload,
        };

        await executeJavaProcess(payload, "process");
      });
    },
    [
      tab,
      processId,
      parameters,
      buildProcessSpecificFields,
      buildWindowSpecificFields,
      executeJavaProcess,
      getMergedProcessValues,
      getRecordIds,
      startTransition,
    ]
  );

  /**
   * Builds the standard Java-process execution payload — the new-UI counterpart
   * of Classic's `allProperties` (parent record context at the top level +
   * `_params` with the process form values + `_buttonValue` / `_entityName`).
   * Shared by the direct-Java path and the `actionHandlerCall()` reproduction
   * (`runStandardExecution`) so both send an identical request.
   */
  const buildStandardJavaPayload = useCallback(
    (actionValue?: string): Record<string, unknown> => {
      const windowConfig = windowId ? WINDOW_SPECIFIC_KEYS[windowId as string] : null;
      const extraKey = windowConfig ? { [windowConfig.key]: windowConfig.value(record) } : {};

      const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
      const buttonParams = buttonListParam && actionValue ? { [buttonListParam.dBColumnName]: actionValue } : {};

      const processDefConfig = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
      const skipParamsLevel = processDefConfig?.skipParamsLevel;

      const params = getMergedProcessValues({ ...getMappedFormValues(), ...extraKey });
      const _basePayload = tab ? buildProcessPayload(record || {}, tab, {}, {}) : {};

      return {
        recordIds: getRecordIds(),
        _buttonValue: actionValue || "DONE",
        _entityName: tab?.entityName || "",
        ...(skipParamsLevel ? { ...params, ...buttonParams } : { _params: { ...params, ...buttonParams } }),
        ...buildProcessSpecificFields(processId),
        ..._basePayload,
      };
    },
    [
      tab,
      processId,
      windowId,
      record,
      parameters,
      getMergedProcessValues,
      getMappedFormValues,
      getRecordIds,
      buildProcessSpecificFields,
    ]
  );

  const handleDirectJavaProcessExecute = useCallback(
    async (actionValue?: string) => {
      if (!processId || !javaClassName) return;
      startTransition(async () => {
        await executeJavaProcess(buildStandardJavaPayload(actionValue), "direct Java process");
      });
    },
    [processId, javaClassName, buildStandardJavaPayload, executeJavaProcess, startTransition]
  );

  /**
   * Faithful reproduction of Classic's `actionHandlerCall()` for migrated
   * `onProcess` scripts (`view.executeProcess()`). The platform builds the
   * standard payload and posts it to the process's configured Java class —
   * exactly as the Classic framework does — then dispatches any server
   * `responseActions` registry-first. It is intentionally side-effect-light (no
   * `setResult`/toast/retry): the returned response flows back through the
   * `onProcess` return so the modal handles the message once.
   */
  const runStandardExecution = useCallback(
    async (actionValue?: string): Promise<unknown> => {
      const apiUrl = buildKernelEndpoint({ processId, windowId: tab?.window, javaClassName });
      const resultData = await fetchAndParseJson(apiUrl, buildJsonRequest(buildStandardJavaPayload(actionValue)));

      const dispatchableActions = readDispatchableResponseActions(resultData);
      if (dispatchableActions.length > 0) {
        getActionExecuteJSON(scriptContext)?.(dispatchableActions);
      }

      return resultData;
    },
    [processId, tab?.window, javaClassName, scriptContext, buildJsonRequest, buildStandardJavaPayload]
  );

  const extractResponseMessage = useCallback(
    (result: any) => {
      const message = findFirstMessage(dispatchResponseActions(result));
      if (message) return message.payload;
      if (result?.severity) {
        return { msgType: result.severity, msgText: result.text };
      }
      if (result?.error) {
        return { msgType: "error", msgText: result.error.msgText || result.error };
      }
      return { msgType: "success", msgText: t("process.completedSuccessfully") };
    },
    [t]
  );

  /**
   * Builds the canonical `view` proxy passed as the onProcess second argument.
   * It carries the data fields the migrated scripts read (recordIds, windowId,
   * DocAction, …) and the full view surface (theForm, messageBar, refresh, …).
   * Shared by the standard onProcess path and the Pick&Execute pre-submit
   * validation hook so both expose an identical surface to the migrated script.
   */
  const buildOnProcessView = useCallback(
    (actionValue?: string) => {
      const formValues = form.getValues();
      resolveDocAction(formValues);

      const completePayload = tab ? buildProcessPayload(record || {}, tab, initialState || {}, formValues) : {};

      return createViewProxy(createFormHandle(form), parameters, {
        messageBar,
        controller: fieldController,
        viewController,
        gridResolver,
        data: viewData,
        // Classic `actionHandlerCall()` equivalent for migrated onProcess scripts.
        executeProcess: runStandardExecution,
        hookData: {
          _buttonValue: actionValue || "DONE",
          buttonValue: actionValue || "DONE",
          windowId: tab?.window,
          tabId: tab?.id || tabId || "",
          entityName: tab?.entityName,
          recordIds: selectedRecords?.map((r) => r.id),
          // Mirrors classic SmartClient view.onRefreshFunction so migrated
          // scripts can refresh the modal grid/form after async actions. The
          // parent's refresh after a nested process closes is wired through the
          // process stack (ProcessStackHost fires the launcher's onRefreshFunction).
          onRefreshFunction,
          ...completePayload,
        },
      });
    },
    [
      form,
      resolveDocAction,
      tab,
      record,
      initialState,
      parameters,
      messageBar,
      fieldController,
      viewController,
      gridResolver,
      viewData,
      runStandardExecution,
      tabId,
      selectedRecords,
      onRefreshFunction,
    ]
  );

  /**
   * Pre-submit validation hook for Pick&Execute / Window-Reference processes.
   * For these, the Done button posts straight to the Java handler via
   * `handleWindowReferenceExecute`, so the migrated `em_etmeta_onprocess` runs
   * here as a client-side guard BEFORE the submit (the faithful equivalent of
   * Classic's `clientSideValidationFail()`). The script returns
   * `{ severity: 'error', text }` to abort the submit, or `undefined` to proceed.
   * It must NOT call `view.executeProcess()` — the platform performs the submit.
   *
   * @returns `true` if the submit may proceed, `false` if validation aborted it.
   */
  const runPreSubmitValidation = useCallback(
    async (actionValue?: string): Promise<boolean> => {
      if (!etmetaOnprocess) return true;
      const processView = buildOnProcessView(actionValue);
      try {
        const stringFnResult = await executeStringFunction(
          etmetaOnprocess,
          scriptContext,
          button.processDefinition,
          processView
        );
        const result = stringFnResult?.data ?? stringFnResult;
        const responseMessage = extractResponseMessage(result);

        if (responseMessage.msgType === "error") {
          messageBar.setMessage("error", null, responseMessage.msgText);
          setResult({ success: false, data: responseMessage, error: responseMessage.msgText });
          return false;
        }
        return true;
      } catch (error) {
        logger.warn("Error in Pick&Execute pre-submit validation:", error);
        messageBar.setMessage("error", null, error instanceof Error ? error.message : "Unknown error");
        return false;
      }
    },
    [
      buildOnProcessView,
      etmetaOnprocess,
      scriptContext,
      button.processDefinition,
      extractResponseMessage,
      messageBar,
      setResult,
    ]
  );

  const handleExecute = useCallback(
    async (actionValue?: string) => {
      const actionButton = availableButtons.find((b) => b.value === actionValue);
      if (actionButton?.isFilter) {
        setGridRefreshKey((prev) => prev + 1);
        return;
      }

      setResult(null);
      if (hasWindowReference) {
        // Run the migrated pre-submit onProcess validation (if any) before
        // posting to the Java handler. Previously em_etmeta_onprocess was never
        // evaluated for P&E/Window-Reference processes (the early return below).
        if (etmetaOnprocess && shouldRunProcessLifecycleHooks({ tab, callerField })) {
          const canProceed = await runPreSubmitValidation(actionValue);
          if (!canProceed) return; // message already shown; do not submit
        }
        await handleWindowReferenceExecute(actionValue);
        return;
      }

      if (!etmetaOnprocess && javaClassName) {
        await handleDirectJavaProcessExecute(actionValue);
        return;
      }

      if (!etmetaOnprocess || !shouldRunProcessLifecycleHooks({ tab, callerField })) return;

      startTransition(async () => {
        // The onProcess second argument is the canonical view (see buildOnProcessView).
        const processView = buildOnProcessView(actionValue);

        try {
          const stringFnResult = await executeStringFunction(
            etmetaOnprocess,
            // Shared hook context: OB (single instance per modal) plus module-scope
            // helpers, so onProcess resolves bare-name helpers like the other hooks.
            scriptContext,
            button.processDefinition,
            processView
          );

          const result = stringFnResult?.data ?? stringFnResult;

          // Dispatch the non-message response actions (refreshGrid,
          // refreshGridParameter, setSelectorValueFromRecord, report) before the
          // success-close runs and possibly unmounts the modal. The message and
          // openDirectTab kinds are intentionally left to the flow below.
          dispatchProcessReturnActions(result);

          const responseMessage = extractResponseMessage(result);

          const msgType = responseMessage.msgType;
          const isSuccess = msgType === "success";
          const isWarning = msgType === "warning";

          if (isSuccess || isWarning) {
            const message = responseMessage.msgText || t("process.completedSuccessfully");

            showProcessToast({
              isSuccess,
              message,
              linkTabId: (result as any)?.linkTabId,
              linkRecordId: (result as any)?.linkRecordId,
            });

            setShouldTriggerSuccess(true);
            handleSuccessClose(true);
          } else {
            setResult({ success: false, data: responseMessage, error: responseMessage.msgText });
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
      runPreSubmitValidation,
      buildOnProcessView,
      etmetaOnprocess,
      javaClassName,
      tab,
      callerField,
      button.processDefinition,
      scriptContext,
      availableButtons,
      setResult,
      setGridRefreshKey,
      setShouldTriggerSuccess,
      handleSuccessClose,
      startTransition,
      t,
      extractResponseMessage,
      showProcessToast,
    ]
  );

  const handleReportProcessExecute = useCallback(async () => {
    startTransition(async () => {
      try {
        const formValues = form.getValues();
        const rawParameters = buildProcessParameters(formValues, parameters);
        // Only send parameters that are explicitly defined in the process schema.
        // Etendo form state may contain internal/meta fields (e.g. responseActions,
        // refreshParent, _processId) that are not valid process parameters and cause
        // backend constraint violations (ADParameter.string max 60 chars).
        const validColumns = new Set(
          Object.values(parameters)
            .map((p) => p.dBColumnName)
            .filter(Boolean)
        );
        const formParameters = Object.fromEntries(
          Object.entries(rawParameters).filter(([k, v]) => v !== null && v !== undefined && validColumns.has(k))
        );

        const response = await fetch("/api/process/report-and-process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            processId,
            parameters: formParameters,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setResult({ success: false, error: errorData.error || "Process execution failed" });
          return;
        }

        const { pInstanceId } = await response.json();

        const pollDeadline = Date.now() + 10 * 60 * 1000;

        const pollStatus = async (): Promise<void> => {
          if (Date.now() > pollDeadline) {
            setResult({ success: false, error: t("process.executionTimeout") });
            return;
          }

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

          const isSuccess = status.result === 1;
          const isWarning = status.result === 2; // Warning code in report-and-process

          if (isSuccess || isWarning) {
            const message = status.errorMsg || (isSuccess ? t("process.completedSuccessfully") : "");

            showProcessToast({
              isSuccess,
              message,
            });

            setShouldTriggerSuccess(true);
            handleSuccessClose(true);
          } else {
            setResult({ success: isSuccess, data: status.errorMsg, error: status.errorMsg });
          }
        };

        await pollStatus();
      } catch (error) {
        logger.error("Report process execution error:", error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }, [
    form,
    processId,
    token,
    parameters,
    setResult,
    setShouldTriggerSuccess,
    handleSuccessClose,
    startTransition,
    t,
    showProcessToast,
  ]);

  return {
    executeJavaProcess,
    handleWindowReferenceExecute,
    handleDirectJavaProcessExecute,
    handleExecute,
    handleReportProcessExecute,
    handleSuccessClose,
    handleNavigateToTab,
    parseProcessResponse,
  };
}
