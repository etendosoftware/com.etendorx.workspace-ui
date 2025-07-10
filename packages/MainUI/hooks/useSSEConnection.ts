import { type CopilotQuestionParams, CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { useCallback, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

interface UseSSEConnectionProps {
  onMessage: (data: any) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export const useSSEConnection = ({ onMessage, onError, onComplete }: UseSSEConnectionProps) => {
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

  const startSSEConnection = useCallback(
    async (params: CopilotQuestionParams) => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const sseUrl = CopilotClient.buildSSEUrl(params);
        const headers = CopilotClient.getSSEHeaders();

        const eventSource = new EventSourcePolyfill(sseUrl, {
          headers,
          heartbeatTimeout: 12000000,
        });

        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error("Error parsing SSE message:", err);
            onError("Error parsing server response");
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource failed:", err);
          onError("Connection error occurred");
          eventSource.close();
          onComplete();
        };

        const intervalId = setInterval(() => {
          if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
            onComplete();
            clearInterval(intervalId);
          }
        }, 1000);

        return () => {
          clearInterval(intervalId);
          eventSource.close();
        };
      } catch (error) {
        console.error("Error starting SSE connection:", error);
        onError(error instanceof Error ? error.message : "Failed to start connection");
      }
    },
    [onMessage, onError, onComplete]
  );

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    startSSEConnection,
    closeConnection,
  };
};
