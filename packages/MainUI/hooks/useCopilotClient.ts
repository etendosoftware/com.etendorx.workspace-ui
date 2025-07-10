import { useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";

export const useCopilotClient = () => {
  const token = useUserContext();

  const initializeClient = useCallback(() => {
    CopilotClient.setBaseUrl();
    CopilotClient.setToken(token?.token || "");
  }, [token]);

  useEffect(() => {
    initializeClient();
  }, [initializeClient]);

  const client = useMemo(() => ({
    getAssistants: CopilotClient.getAssistants,
    getLabels: CopilotClient.getLabels,
    uploadFile: CopilotClient.uploadFile,
    uploadFiles: CopilotClient.uploadFiles,
    cacheQuestion: CopilotClient.cacheQuestion,
    sendQuestion: CopilotClient.sendQuestion,
    buildSSEUrl: CopilotClient.buildSSEUrl,
    getSSEHeaders: CopilotClient.getSSEHeaders,
    shouldCacheQuestion: CopilotClient.shouldCacheQuestion,
    handleLargeQuestion: CopilotClient.handleLargeQuestion,
    reinitialize: initializeClient,
  }), [initializeClient]);

  return client;
};