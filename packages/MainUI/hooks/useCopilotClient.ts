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

import { useEffect, useCallback, useMemo } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useUserContext } from "./useUserContext";
import { useApiContext } from "./useApiContext";
import { performCopilotHealthCheck } from "@/utils/health-check";
import { logger } from "@/utils/logger";

export const useCopilotClient = () => {
  const token = useUserContext();
  const apiUrl = useApiContext();

  const initializeClient = useCallback(async () => {
    if (!token?.token || !apiUrl) {
      logger.log("CopilotClient: Token or API URL not available yet, skipping initialization");
      return;
    }

    logger.log("CopilotClient: Initializing with token and API URL:", apiUrl);
    CopilotClient.setBaseUrl(apiUrl);
    CopilotClient.setToken(token.token);

    const copilotUrl = CopilotClient.getCurrentBaseUrl();
    await performCopilotHealthCheck(copilotUrl, token.token);
  }, [token, apiUrl]);

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
