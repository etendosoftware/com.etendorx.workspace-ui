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

import {
  type ProcessActionButton,
  type ProcessResponse,
  isProcessActionButton,
  isProcessDefinitionButton,
} from "@/components/ProcessModal/types";
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { isDebugManualProcesses } from "@/utils/debug";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useParams } from "next/navigation";
import { useCallback, useContext, useState } from "react";
import { UserContext } from "../../contexts/user";
import { useRuntimeConfig } from "../../contexts/RuntimeConfigContext";
import { useMetadataContext } from "../useMetadataContext";
import type { ExecuteProcessDefinitionParams, ExecuteProcessParams } from "./types";
import { getParams } from "@/utils/processes/manual/utils";
import data from "@/utils/processes/manual/data.json";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const { config, loading: configLoading } = useRuntimeConfig();

  // Use ETENDO_CLASSIC_HOST for direct browser access to Tomcat
  // This is necessary in Docker hybrid mode where the browser needs to access
  // Tomcat directly (e.g., localhost:8080) instead of through the Next.js proxy
  const publicHost = config?.etendoClassicHost || "";

  const { token } = useContext(UserContext);
  const { windowId } = useMetadataContext();
  const { tab, record } = useTabContext();
  const { recordId } = useParams<{ recordId: string }>();

  const executeProcessDefinition = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessDefinitionParams): Promise<ProcessResponse> => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams({
          processId: button.processDefinition.id,
        });

        const processParams: Record<string, unknown> = {};
        for (const param of button.processInfo.parameters) {
          if (params[param.id]) {
            processParams[param.id] = params[param.id];
          }
        }
        const payload = {
          recordIds: [recordId],
          _buttonValue: button.buttonText,
          _params: processParams,
          _entityName: button.processInfo?._entityName || "",
        };

        const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!ok) {
          throw new Error(`HTTP error! status: ${status}`);
        }

        if (data.response?.status === -1) {
          throw new Error(data.response.error?.message || "Unknown server error");
        }

        return data;
      } catch (error) {
        logger.warn(error);

        const processError = error instanceof Error ? error : new Error("Process execution failed");
        setError(processError);
        throw processError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const executeProcessAction = useCallback(
    async (button: ProcessActionButton): Promise<ProcessResponse> => {
      return new Promise((resolve, reject) => {
        try {
          setLoading(true);
          setError(null);

          if (!record || !tab.id || !tab.window || !button.id) {
            throw new Error("Record or Tab or Button not found");
          }

          const currentButtonId = button.id;
          const safeWindowId = windowId || (tab.window ? String(tab.window) : "");
          const safeTabId = tab.id ? String(tab.id) : "";
          const safeRecordId = String(record.id || recordId || "");
          const safeTableId = tab.table ? String(tab.table) : "";

          const requiredData = [safeWindowId, safeTabId, safeRecordId, currentButtonId, safeTableId];

          if (!requiredData.every((value) => value)) {
            throw new Error("Required data not found");
          }

          if (!(currentButtonId in data)) {
            throw new Error("Button ID not found in data");
          }

          const processAction = data[currentButtonId as keyof typeof data];
          const baseUrl = `${publicHost}${API_IFRAME_FORWARD_PATH}${processAction.url}`;
          const isPostedProcess = currentButtonId === "Posted";

          const params = getParams({
            currentButtonId,
            record,
            recordId: safeRecordId,
            windowId: safeWindowId,
            tabId: safeTabId,
            tableId: safeTableId,
            token,
            isPostedProcess,
          });

          const completeUrl = `${baseUrl}?${params.toString()}`;

          if (isDebugManualProcesses()) {
            try {
              const debugParams: Record<string, string> = {};
              params.forEach((v, k) => {
                debugParams[k] = v;
              });
              logger.debug("[MANUAL_PROCESS] Prepared URL", completeUrl);
              logger.debug("[MANUAL_PROCESS] Context", {
                buttonId: currentButtonId,
                windowId: safeWindowId,
                tabId: safeTabId,
                tableId: safeTableId,
                recordId: safeRecordId,
              });
              logger.debug("[MANUAL_PROCESS] Params", debugParams);
            } catch {}
          }
          setIframeUrl(completeUrl);

          resolve({
            showInIframe: true,
            iframeUrl: completeUrl,
          });
        } catch (error) {
          logger.warn(error);

          const processError = error instanceof Error ? error : new Error("Process execution failed");
          setError(processError);
          reject(processError);
        } finally {
          setLoading(false);
        }
      });
    },
    [record, recordId, tab.id, tab.window, tab.table, token, windowId, publicHost]
  );

  const executeProcess = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
      try {
        if (isProcessActionButton(button)) {
          return await executeProcessAction(button);
        }
        if (isProcessDefinitionButton(button)) {
          return await executeProcessDefinition({ button, recordId, params });
        }
        throw new Error("Process type not supported");
      } catch (error) {
        console.error(error);
        throw new Error("Process execution failed");
      }
    },
    [executeProcessAction, executeProcessDefinition]
  );

  const resetIframeUrl = useCallback(() => setIframeUrl(""), []);

  return {
    executeProcess,
    loading: loading || configLoading,
    error,
    iframeUrl,
    resetIframeUrl,
    currentRecord: record,
    recordsLoaded: !!record,
    recordsLoading: loading,
    recordData: record,
    recordId,
  };
}
