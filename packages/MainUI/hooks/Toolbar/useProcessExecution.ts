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

          if (!record) {
            throw new Error("No se ha cargado el registro correctamente");
          }

          const extractValue = (keys: string[], defaultValue: string): string => {
            for (const key of keys) {
              const value = record[key];
              if (value !== undefined && value !== null && value !== "") {
                return String(value);
              }
            }
            return defaultValue;
          };

          const docStatus = extractValue(["documentStatus", "docstatus", "docStatus", "DOCSTATUS", "DocStatus"], "DR");
          const isProcessing = extractValue(
            ["processing", "isprocessing", "isProcessing", "PROCESSING", "Processing"],
            "N"
          );
          const adClientId = extractValue(
            ["adClientId", "AD_Client_ID", "aD_Client_ID", "adclientid", "AdClientId", "client"],
            "23C59575B9CF467C9620760EB255B389"
          );
          const adOrgId = extractValue(
            ["adOrgId", "AD_Org_ID", "aD_Org_ID", "adorgid", "AdOrgId", "organization"],
            "7BABA5FF80494CAFA54DEBD22EC46F01"
          );

          const isPostedProcess = button.id === "Posted";
          const commandAction = "BUTTONDocAction104";
          const baseUrl = `${API_BASE_URL}${API_FORWARD_PATH}${button.processAction.manualURL}`; //"http://localhost:8080/etendo/SalesOrder/Header_Edition.html";
          const safeWindowId = windowId || (tab?.window ? String(tab.window) : "143");
          const safeTabId = tab?.id ? String(tab.id) : "186";
          const safeRecordId = String(record.id || recordId || "");

          const params = new URLSearchParams();
          params.append("IsPopUpCall", "1");
          params.append("Command", commandAction);
          params.append("inpcOrderId", safeRecordId);
          params.append("inpKey", safeRecordId);

          if (isPostedProcess) {
            params.append("inpdocstatus", docStatus);
            params.append("inpprocessing", isProcessing);
            params.append("inpdocaction", "P");
          } else {
            params.append("inpdocstatus", docStatus);
            params.append("inpprocessing", isProcessing);
            params.append("inpdocaction", "CO");
          }

          params.append("inpwindowId", safeWindowId);
          params.append("inpTabId", safeTabId);
          params.append("inpadClientId", adClientId);
          params.append("inpadOrgId", adOrgId);
          params.append("inpkeyColumnId", "C_Order_ID");
          params.append("keyColumnName", "C_Order_ID");

          if (token) {
            params.append("token", token);
          }

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
