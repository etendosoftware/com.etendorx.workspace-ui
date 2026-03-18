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
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { createOBShim } from "@/utils/propertyStore";

// ---------------------------------------------------------------------------
// Internal types for response action shapes
// ---------------------------------------------------------------------------

interface ProcessViewMsg {
  msgType?: string;
  msgTitle?: string;
  msgText?: string;
}

interface ResponseAction {
  showMsgInProcessView?: ProcessViewMsg;
  smartclientSay?: { message?: string };
}

interface ExtractedMessage {
  message: unknown;
  messageType: string | undefined;
  isHtml: boolean;
  linkTabId?: string;
  linkRecordId?: string;
}

// ---------------------------------------------------------------------------
// Param / return types
// ---------------------------------------------------------------------------

export interface UseProcessExecutionParams {
  // Process identity
  processId: string;
  javaClassName: string | undefined;
  windowId: string | number;
  tabId: string;
  onProcess: any;
  // Context
  tab: Tab | undefined;
  record: EntityData | undefined;
  initialState: Record<string, any> | undefined;
  selectedRecords: EntityData[];
  processScriptContext: any;
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
  onProcess,
  tab,
  record,
  initialState,
  selectedRecords,
  processScriptContext,
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
}: UseProcessExecutionParams): UseProcessExecutionReturn {
  const { t } = useTranslation();

  // -------------------------------------------------------------------------
  // Response parsing
  // -------------------------------------------------------------------------

  const extractMessageFromProcessView = useCallback((res: ExecuteProcessResult): ExtractedMessage | null => {
    const data = res.data;
    const responseActions =
      data?.responseActions || data?.response?.responseActions || data?.response?.data?.responseActions;

    if (!responseActions) return null;

    let actionWithMsg: ResponseAction | undefined;
    if (Array.isArray(responseActions)) {
      actionWithMsg = responseActions.find(
        (action: ResponseAction) => action.showMsgInProcessView || action.smartclientSay
      );
    } else if (typeof responseActions === "object") {
      actionWithMsg = responseActions as ResponseAction;
    }

    const msgView = actionWithMsg?.showMsgInProcessView;
    if (msgView) {
      const rawMsg = msgView.msgText || "";
      const parsed = parseSmartClientMessage(rawMsg);
      return {
        message: rawMsg || parsed.text,
        messageType: msgView.msgType,
        isHtml: /<[a-z][\s\S]*>/i.test(rawMsg),
        linkTabId: parsed.tabId,
        linkRecordId: parsed.recordId,
      };
    }

    const smartclientSay = actionWithMsg?.smartclientSay;
    if (smartclientSay?.message) {
      return {
        message: smartclientSay.message,
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

        const res: ExecuteProcessResult = { success: true, data: resultData };
        const parsedResult = parseProcessResponse(res);
        const { messageType, linkTabId, linkRecordId } = parsedResult;

        if (messageType === "success" || messageType === "warning") {
          await revalidateDopoProcess();
          const message =
            typeof parsedResult.data === "string"
              ? parsedResult.data
              : parsedResult.data?.message || parsedResult.data?.msgText || "";

          showProcessToast({
            isSuccess: messageType === "success",
            message,
            linkTabId,
            linkRecordId,
          });

          setShouldTriggerSuccess(true);
          handleSuccessClose(true);
        } else {
          setResult(parsedResult);
        }
      } catch (error) {
        logger.warn(`Error executing ${logContext}:`, error);
        setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
    [
      processId,
      tab?.window,
      javaClassName,
      token,
      getCsrfToken,
      parseProcessResponse,
      setShouldTriggerSuccess,
      handleSuccessClose,
      setResult,
      showProcessToast,
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
        // New UI keys grid entries by parameter.dBColumnName — keep all original keys and
        // additionally expose the main grid under "grid" for Classic compatibility.
        // Secondary grids (e.g. credit_to_use) must remain under their original keys.
        const normalizedValues: Record<string, unknown> = { ...mergedValues };
        let mainGridSet = false;
        for (const [key, value] of Object.entries(mergedValues)) {
          const isGridEntry =
            value !== null &&
            typeof value === "object" &&
            "_selection" in (value as object) &&
            "_allRows" in (value as object);
          if (isGridEntry && key !== "credit_to_use" && !mainGridSet) {
            normalizedValues.grid = value;
            mainGridSet = true;
          }
        }

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

  const handleDirectJavaProcessExecute = useCallback(
    async (actionValue?: string) => {
      if (!processId || !javaClassName) return;
      startTransition(async () => {
        const windowConfig = windowId ? WINDOW_SPECIFIC_KEYS[windowId as string] : null;
        const extraKey = windowConfig ? { [windowConfig.key]: windowConfig.value(record) } : {};

        const buttonListParam = Object.values(parameters).find((p) => p.reference === BUTTON_LIST_REFERENCE_ID);
        const buttonParams = buttonListParam && actionValue ? { [buttonListParam.dBColumnName]: actionValue } : {};

        const processDefConfig = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
        const skipParamsLevel = processDefConfig?.skipParamsLevel;

        const params = getMergedProcessValues({ ...getMappedFormValues(), ...extraKey });
        const _basePayload = tab ? buildProcessPayload(record || {}, tab, {}, {}) : {};

        const payload = {
          recordIds: getRecordIds(),
          _buttonValue: actionValue || "DONE",
          _entityName: tab?.entityName || "",
          ...(skipParamsLevel ? { ...params, ...buttonParams } : { _params: { ...params, ...buttonParams } }),
          ...buildProcessSpecificFields(processId),
          ..._basePayload,
        };

        await executeJavaProcess(payload, "direct Java process");
      });
    },
    [
      tab,
      processId,
      javaClassName,
      windowId,
      record,
      parameters,
      getMergedProcessValues,
      getMappedFormValues,
      getRecordIds,
      buildProcessSpecificFields,
      executeJavaProcess,
      startTransition,
    ]
  );

  const extractResponseMessage = useCallback(
    (result: any) => {
      if (result?.responseActions?.[0]?.showMsgInProcessView) {
        return result.responseActions[0].showMsgInProcessView;
      }
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

  const handleExecute = useCallback(
    async (actionValue?: string) => {
      const actionButton = availableButtons.find((b) => b.value === actionValue);
      if (actionButton?.isFilter) {
        setGridRefreshKey((prev) => prev + 1);
        return;
      }

      setResult(null);
      if (hasWindowReference) {
        await handleWindowReferenceExecute(actionValue);
        return;
      }

      if (!onProcess && javaClassName) {
        await handleDirectJavaProcessExecute(actionValue);
        return;
      }

      if (!onProcess || !tab) return;

      startTransition(async () => {
        const formValues = form.getValues();
        resolveDocAction(formValues);

        const completePayload = buildProcessPayload(record || {}, tab, initialState || {}, formValues);

        const stringFunctionPayload = {
          _buttonValue: actionValue || "DONE",
          buttonValue: actionValue || "DONE",
          windowId: tab.window,
          tabId: tab?.id || tabId || "",
          entityName: tab.entityName,
          recordIds: selectedRecords?.map((r) => r.id),
          ...completePayload,
        };

        try {
          const stringFnResult = await executeStringFunction(
            onProcess,
            { Metadata, OB: createOBShim(), ...processScriptContext },
            button.processDefinition,
            stringFunctionPayload
          );

          const result = stringFnResult?.data ?? stringFnResult;
          const responseMessage = extractResponseMessage(result);

          const msgType = responseMessage.msgType || responseMessage.severity;
          const isSuccess = msgType === "success";
          const isWarning = msgType === "warning";

          if (isSuccess || isWarning) {
            const message = responseMessage.msgText || responseMessage.text || t("process.completedSuccessfully");

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
      onProcess,
      javaClassName,
      tab,
      tabId,
      record,
      initialState,
      button.processDefinition,
      selectedRecords,
      form,
      parameters,
      processScriptContext,
      resolveDocAction,
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
        const formParameters = buildProcessParameters(formValues, parameters);

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
    button.processDefinition.id,
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
