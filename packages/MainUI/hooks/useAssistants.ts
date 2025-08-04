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

import type { IAssistant } from "@workspaceui/api-client/src/api/copilot";
import { useState, useCallback, useEffect } from "react";
import { useCopilotClient } from "./useCopilotClient";
import { logger } from "@/utils/logger";

export const useAssistants = () => {
  const [selectedOption, setSelectedOption] = useState<IAssistant | null>(null);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copilotClient = useCopilotClient();

  const getAssistants = useCallback(
    async (retryCount = 0) => {
      if (!copilotClient.isReady) {
        logger.log("CopilotClient not ready yet, skipping getAssistants");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        logger.log("Fetching assistants...");
        const data = await copilotClient.getAssistants();

        setAssistants(data);

        if (data.length > 0) {
          setSelectedOption(data[0]);
        } else {
          setSelectedOption(null);
          console.warn("No assistants available from backend");
        }
      } catch (err) {
        if (retryCount < 2) {
          setTimeout(() => getAssistants(retryCount + 1), 1000);
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load assistants");
        console.error("Error loading assistants:", err);
      } finally {
        setLoading(false);
      }
    },
    [copilotClient]
  );

  // Auto-fetch assistants when client is ready
  useEffect(() => {
    if (copilotClient.isReady) {
      getAssistants();
    }
  }, [copilotClient.isReady, getAssistants]);

  const handleOptionSelected = (value: IAssistant | null) => {
    setSelectedOption(value);
  };

  return {
    selectedOption,
    assistants,
    loading,
    error,
    getAssistants,
    handleOptionSelected,
    hasAssistants: assistants.length > 0,
  };
};
