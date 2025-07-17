import { useCallback, useRef, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { type CopilotQuestionParams, CopilotClient } from "@workspaceui/api-client/src/api/copilot";

interface UseSSEConnectionProps {
  onMessage: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export const useSSEConnection = ({ onMessage, onError, onComplete }: UseSSEConnectionProps) => {
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;
  const isCompletedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const hasReceivedMessageRef = useRef(false);

  const startSSEConnection = useCallback(
    async (params: CopilotQuestionParams, retryCount = 0) => {
      let intervalId: NodeJS.Timeout | null = null;

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        if (retryCount === 0) {
          isCompletedRef.current = false;
          shouldReconnectRef.current = true;
          hasReceivedMessageRef.current = false;
          setReconnectAttempts(0);
        }

        const sseUrl = CopilotClient.buildSSEUrl(params);
        const headers = CopilotClient.getSSEHeaders();

        const eventSource = new EventSourcePolyfill(sseUrl, {
          headers,
          heartbeatTimeout: 120000,
          withCredentials: true,
        });

        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setIsConnected(true);
            setReconnectAttempts(0);
            hasReceivedMessageRef.current = true;
            onMessage(data);
          } catch (err) {
            console.error("Error parsing SSE message:", err, "Raw data:", event.data);
            if (intervalId) {
              clearInterval(intervalId);
            }
            onError("Error parsing server response");
          }
        };

        eventSource.onerror = (err) => {
          setIsConnected(false);
          if (intervalId) {
            clearInterval(intervalId);
          }

          if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
            if (hasReceivedMessageRef.current && !isCompletedRef.current) {
              isCompletedRef.current = true;
              shouldReconnectRef.current = false;
              onComplete();
            } else if (!isCompletedRef.current && !hasReceivedMessageRef.current) {
              console.error("SSE connection closed without receiving messages:", err);
              if (retryCount < maxReconnectAttempts) {
                const delay = 2 ** retryCount * 1000;
                setTimeout(() => {
                  setReconnectAttempts(retryCount + 1);
                  startSSEConnection(params, retryCount + 1);
                }, delay);
              } else {
                onError("Connection error occurred");
              }
            }
          } else {
            console.error("SSE connection error:", err);

            if (retryCount < maxReconnectAttempts && shouldReconnectRef.current && !hasReceivedMessageRef.current) {
              const delay = 2 ** retryCount * 1000;
              setTimeout(() => {
                setReconnectAttempts(retryCount + 1);
                startSSEConnection(params, retryCount + 1);
              }, delay);
            } else {
              if (!isCompletedRef.current && !hasReceivedMessageRef.current) {
                onError("Connection error occurred");
              }
            }
          }

          eventSource.close();
        };

        eventSource.onopen = () => {
          setIsConnected(true);
          setReconnectAttempts(0);
        };

        intervalId = setInterval(() => {
          if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
            setIsConnected(false);
            if (hasReceivedMessageRef.current && !isCompletedRef.current) {
              isCompletedRef.current = true;
              shouldReconnectRef.current = false;
              onComplete();
            }
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        }, 1000);

        return () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          eventSource.close();
        };
      } catch (error) {
        console.error("Error starting SSE connection:", error);
        setIsConnected(false);
        
        if (intervalId) {
          clearInterval(intervalId);
        }

        if (retryCount < maxReconnectAttempts && !hasReceivedMessageRef.current) {
          const delay = 2 ** retryCount * 1000;
          setTimeout(() => {
            startSSEConnection(params, retryCount + 1);
          }, delay);
        } else {
          onError(error instanceof Error ? error.message : "Failed to start connection");
        }
      }
    },
    [onMessage, onError, onComplete, maxReconnectAttempts]
  );

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setReconnectAttempts(0);
    isCompletedRef.current = false;
    shouldReconnectRef.current = true;
    hasReceivedMessageRef.current = false;
  }, []);

  return {
    startSSEConnection,
    closeConnection,
    isConnected,
    reconnectAttempts,
  };
};
