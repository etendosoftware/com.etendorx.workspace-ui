import { useState, useCallback } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefinitionButton } from "@/components/ProcessModal/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

export interface UseProcessDefinitionTriggerResult {
  isProcessModalOpen: boolean;
  processButtonData: ProcessDefinitionButton | null;
  isLoading: boolean;
  triggerProcess: (processId: string) => Promise<void>;
  closeProcessModal: () => void;
}

export function useProcessDefinitionTrigger(field: Field): UseProcessDefinitionTriggerResult {
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processButtonData, setProcessButtonData] = useState<ProcessDefinitionButton | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const triggerProcess = useCallback(
    async (processId: string) => {
      if (!processId) return;

      setIsLoading(true);
      try {
        const response = await Metadata.client.post(`meta/process/${processId}`);
        if (response.ok && response.data) {
          const processData = response.data;
          const name = processData.name || field.name || "";

          const button = {
            ...field,
            id: field.id,
            name,
            action: "P",
            enabled: true,
            visible: true,
            processId,
            buttonText: name,
            buttonRefList: [],
            processInfo: {
              loadFunction: processData.loadFunction || "",
              searchKey: processData.searchKey || "",
              clientSideValidation: processData.clientSideValidation || "",
              _entityName: processData._entityName || "OBUIAPP_Process",
              id: processId,
              name,
              javaClassName: processData.javaClassName || "",
              parameters: [],
            },
            processDefinition: {
              id: processId,
              name,
              description: processData.description || "",
              javaClassName: processData.javaClassName || "",
              parameters: processData.parameters || {},
              onLoad: processData.onLoad || "",
              onProcess: processData.onProcess || "",
              ...processData,
            },
          } as unknown as ProcessDefinitionButton;

          setProcessButtonData(button);
          setIsProcessModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to load process definition:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [field]
  );

  const closeProcessModal = useCallback(() => {
    setIsProcessModalOpen(false);
    setProcessButtonData(null);
  }, []);

  return {
    isProcessModalOpen,
    processButtonData,
    isLoading,
    triggerProcess,
    closeProcessModal,
  };
}
