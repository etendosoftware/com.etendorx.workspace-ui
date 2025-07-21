import { useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";
import { performCopilotHealthCheck } from "@/utils/health-check";
import { logger } from "@/utils/logger";

export const useCopilotClient = () => {
  const token = useUserContext();

  const initializeClient = useCallback(async () => {
    if (!token?.token) {
      logger.log("CopilotClient: Token not available yet, skipping initialization");
      return;
    }

    logger.log("CopilotClient: Initializing with token");
    CopilotClient.setBaseUrl();
    CopilotClient.setToken(token.token);

    const copilotUrl = CopilotClient.getCurrentBaseUrl();
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
