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
            onError("Error parsing server response");
          }
        };

        eventSource.onerror = (err) => {
          setIsConnected(false);

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

        const intervalId = setInterval(() => {
          if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
            setIsConnected(false);
            if (hasReceivedMessageRef.current && !isCompletedRef.current) {
              isCompletedRef.current = true;
              shouldReconnectRef.current = false;
              onComplete();
            }
            clearInterval(intervalId);
          }
        }, 1000);

        return () => {
          clearInterval(intervalId);
          eventSource.close();
        };
      } catch (error) {
        console.error("Error starting SSE connection:", error);
        setIsConnected(false);

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
