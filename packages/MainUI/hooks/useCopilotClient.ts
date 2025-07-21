import { useContext, useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";
import { performCopilotHealthCheck } from "@/utils/health-check";
import { ApiContext } from "@/contexts/api";
import { logger } from "@/utils/logger";

export const useCopilotClient = () => {
  const token = useUserContext();
  const etendoUrl = useContext(ApiContext);

  const initializeClient = useCallback(async () => {
    if (!token?.token || !etendoUrl) {
      logger.log("CopilotClient: Token or Etendo URL not available yet, skipping initialization");
      return;
    }

    logger.log("CopilotClient: Initializing with token and URL", { etendoUrl });
    CopilotClient.setBaseUrl(etendoUrl);
    CopilotClient.setToken(token.token);

    const copilotUrl = `${etendoUrl.replace(/\/$/, "")}/copilot/`;
    await performCopilotHealthCheck(copilotUrl, token.token);
  }, [token, etendoUrl]);

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
      isReady: !!token?.token && !!etendoUrl,
    }),
    [initializeClient, token?.token, etendoUrl]
  );

  return client;
};
