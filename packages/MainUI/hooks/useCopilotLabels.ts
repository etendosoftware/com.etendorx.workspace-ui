import type { ILabels } from "@workspaceui/api-client/src/api/copilot";
import { useState, useCallback } from "react";
import { useCopilotClient } from "./useCopilotClient";

export const useCopilotLabels = () => {
  const [labels, setLabels] = useState<ILabels>({});
  const [areLabelsLoaded, setAreLabelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copilotClient = useCopilotClient();

  const getLabels = useCallback(
    async (retryCount = 0) => {
      setLoading(true);
      setError(null);

      try {
        const data = await copilotClient.getLabels();

        if (data) {
          setLabels(data);
          setAreLabelsLoaded(true);
        }
      } catch (err) {
        if (retryCount < 2) {
          setTimeout(() => getLabels(retryCount + 1), 1000);
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load labels");
        console.error("Error loading Copilot labels:", err);
      } finally {
        setLoading(false);
      }
    },
    [copilotClient]
  );

  return {
    labels,
    areLabelsLoaded,
    loading,
    error,
    getLabels,
  };
};
