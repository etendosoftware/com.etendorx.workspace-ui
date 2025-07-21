import type { IAssistant } from "@workspaceui/api-client/src/api/copilot";
import { useState, useCallback, useEffect } from "react";
import { useCopilotClient } from "./useCopilotClient";

export const useAssistants = () => {
  const [selectedOption, setSelectedOption] = useState<IAssistant | null>(null);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copilotClient = useCopilotClient();

  const getAssistants = useCallback(
    async (retryCount = 0) => {
      if (!copilotClient.isReady) {
        console.log("CopilotClient not ready yet, skipping getAssistants");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching assistants...");
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
