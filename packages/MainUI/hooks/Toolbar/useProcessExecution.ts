import {
  type ProcessActionButton,
  type ProcessResponse,
  isProcessActionButton,
  isProcessDefinitionButton,
} from "@/components/ProcessModal/types";
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { API_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useParams } from "next/navigation";
import { useCallback, useContext, useState } from "react";
import { UserContext } from "../../contexts/user";
import { useApiContext } from "../useApiContext";
import { useMetadataContext } from "../useMetadataContext";
import type { ExecuteProcessDefinitionParams, ExecuteProcessParams } from "./types";
import { getParams } from "@/utils/processes/manual/utils";
import data from "@/utils/processes/manual/data.json";

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const API_BASE_URL = useApiContext();

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
          const baseUrl = `${API_BASE_URL}${API_FORWARD_PATH}${processAction.url}`;
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
    [record, recordId, tab.id, tab.window, token, windowId, API_BASE_URL]
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
        throw new Error("Tipo de proceso no soportado");
      } catch (error) {
        console.error(error);
        throw new Error("Tipo de proceso no soportado");
      }
    },
    [executeProcessAction, executeProcessDefinition]
  );

  const resetIframeUrl = useCallback(() => setIframeUrl(""), []);

  return {
    executeProcess,
    loading,
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
