import { useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";

export const useCopilotClient = () => {
  const token = useUserContext();

  const initializeClient = useCallback(() => {
    if (!token?.token) {
      console.log("CopilotClient: Token not available yet, skipping initialization");
      return;
    }
    
    console.log("CopilotClient: Initializing with token");
    CopilotClient.setBaseUrl();
    CopilotClient.setToken(token.token);
  }, [token]);

  useEffect(() => {
    initializeClient();
  }, [initializeClient]);

  const client = useMemo(
    () => ({
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
      isReady: !!token?.token,
    }),
    [initializeClient, token?.token]
  );

  return client;
};
