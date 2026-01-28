import { useState, useCallback, useEffect } from "react";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import type { IAssistant, IMessage, CopilotQuestionParams } from "@workspaceui/api-client/src/api/copilot";
import { AuthService } from "../services/auth";
import { EventSourcePolyfill } from "event-source-polyfill";

export const useCopilot = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<IAssistant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize CopilotClient
  useEffect(() => {
    const init = async () => {
      try {
        console.log("[useCopilot] Initializing Copilot...");
        const token = await AuthService.autoLogin();
        CopilotClient.setBaseUrl();
        CopilotClient.setToken(token);
        setIsInitialized(true);
        console.log("[useCopilot] Copilot initialized successfully");
      } catch (error) {
        console.error("[useCopilot] Failed to initialize Copilot:", error);
      }
    };
    init();
  }, []);

  // Load assistants
  const loadAssistants = useCallback(async () => {
    if (!isInitialized) return;

    setIsLoadingAssistants(true);
    try {
      const data = await CopilotClient.getAssistants();
      setAssistants(data);
    } catch (error) {
      console.error("[useCopilot] Error loading assistants:", error);
    } finally {
      setIsLoadingAssistants(false);
    }
  }, [isInitialized]);

  // Load assistants when initialized
  useEffect(() => {
    if (isInitialized) {
      loadAssistants();
    }
  }, [isInitialized, loadAssistants]);

  const handleSelectAssistant = useCallback((assistant: IAssistant | null) => {
    setSelectedAssistant(assistant);
    setMessages([]);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!selectedAssistant || !isInitialized) return;

      // Add user message
      const userMessage: IMessage = {
        text: message,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const params: CopilotQuestionParams = {
          question: message,
          app_id: selectedAssistant.app_id,
        };

        const processedParams = await CopilotClient.handleLargeQuestion(params);
        const sseUrl = CopilotClient.buildSSEUrl(processedParams);
        const headers = CopilotClient.getSSEHeaders();

        console.log("[useCopilot] Sending message via SSE:", sseUrl);

        const eventSource = new EventSourcePolyfill(sseUrl, {
          headers,
          heartbeatTimeout: 120000,
          withCredentials: true,
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const answer = data?.answer as { response?: string; role?: string };

            if (answer?.response && answer.role !== "debug") {
              setMessages((prev) => [
                ...prev,
                {
                  text: answer.response,
                  sender: "bot",
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            }
          } catch (err) {
            console.error("Error parsing SSE message:", err);
          }
        };

        eventSource.onerror = () => {
          setIsLoading(false);
          eventSource.close();
        };

        const checkInterval = setInterval(() => {
          if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
            setIsLoading(false);
            clearInterval(checkInterval);
          }
        }, 1000);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            text: "Error al enviar mensaje",
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setIsLoading(false);
      }
    },
    [selectedAssistant, isInitialized]
  );

  const handleResetConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    assistants,
    selectedAssistant,
    isLoading,
    isLoadingAssistants,
    isInitialized,
    handleSelectAssistant,
    handleSendMessage,
    handleResetConversation,
  };
};
