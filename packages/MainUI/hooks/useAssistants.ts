import { type IAssistant, CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useState } from "react";
import { useUserContext } from "./useUserContext";

export const useAssistants = () => {
  const [selectedOption, setSelectedOption] = useState<IAssistant | null>(null);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useUserContext();

  const getAssistants = async () => {
    setLoading(true);
    setError(null);
    try {
      CopilotClient.setBaseUrl();
      CopilotClient.setToken(token);

      const data = await CopilotClient.getAssistants();
      console.log("Assistants loaded:", data);

      setAssistants(data);

      if (data.length > 0) {
        setSelectedOption(data[0]);
      } else {
        setSelectedOption(null);
        console.warn("No assistants available from backend");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assistants");
      console.error("Error loading assistants:", err);
    } finally {
      setLoading(false);
    }
  };

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
