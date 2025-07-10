import { type ILabels, CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useState } from "react";
import { useUserContext } from "./useUserContext";

export const useCopilotLabels = () => {
  const [labels, setLabels] = useState<ILabels>({});
  const [areLabelsLoaded, setAreLabelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useUserContext();

  const getLabels = async () => {
    setLoading(true);
    setError(null);
    try {
      CopilotClient.setBaseUrl();
      CopilotClient.setToken(token);

      const data = await CopilotClient.getLabels();
      console.log("Labels response:", data);

      if (data) {
        setLabels(data);
        setAreLabelsLoaded(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load labels");
      console.error("Error loading Copilot labels:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    labels,
    areLabelsLoaded,
    loading,
    error,
    getLabels,
  };
};
