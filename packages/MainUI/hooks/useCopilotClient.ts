import { useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";
import { performCopilotHealthCheck } from "@/utils/health-check";

export const useCopilotClient = () => {
  const token = useUserContext();

  const initializeClient = useCallback(async () => {
    if (!token?.token) {
      console.log("CopilotClient: Token not available yet, skipping initialization");
      return;
    }
    
    console.log("CopilotClient: Initializing with token");
    CopilotClient.setBaseUrl();
    CopilotClient.setToken(token.token);

    // Perform health check to diagnose issues
    const copilotUrl = process.env.NEXT_PUBLIC_COPILOT_URL || "/etendo/copilot/";
    await performCopilotHealthCheck(copilotUrl, token.token);
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
