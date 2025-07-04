import { ApiContext } from "@/contexts/api";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import { useCallback, useContext } from "react";
import { useUserContext } from "./useUserContext";

export interface ProcessMessage {
  message: string;
  type: "error" | "success" | "info" | "warning";
  title: string;
}

const urlMessageParam = "/meta/message";

export function useProcessMessage(tabId: string) {
  const apiUrl = useContext(ApiContext);
  const { token } = useUserContext();
  const { t } = useTranslation();

  const normalizeMessageType = useCallback(
    (messageType: string, message: string): "success" | "error" | "warning" | "info" => {
      const normalizedType = messageType?.toLowerCase() || "info";

      if (normalizedType === "success" || messageType === "Success") {
        return "success";
      }

      if (message?.toUpperCase().includes("ERROR")) {
        return "error";
      }

      if (normalizedType.includes("success")) {
        return "success";
      }
      if (normalizedType.includes("error")) {
        return "error";
      }
      if (normalizedType.includes("warn")) {
        return "warning";
      }
      return "info";
    },
    []
  );

  const getMessageTitle = useCallback(
    (originalTitle: string | undefined, type: string): string => {
      if (originalTitle) {
        return originalTitle;
      }

      switch (type) {
        case "error":
          return t("errors.internalServerError.title");
        case "success":
          return t("process.completedSuccessfully");
        default:
          return t("process.messageTitle");
      }
    },
    [t]
  );

  const processResponseData = useCallback(
    (data: ProcessMessage): ProcessMessage | null => {
      if (!data) {
        return null;
      }

      if (data.message === "No message found") {
        return null;
      }

      const messageType = normalizeMessageType(data.type || "info", data.message || "");

      return {
        message: data.message || "",
        type: messageType,
        title: getMessageTitle(data.title, messageType),
      };
    },
    [normalizeMessageType, getMessageTitle]
  );

  const handleFetchError = useCallback((error: unknown): ProcessMessage | null => {
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn(error);
    }

    logger.warn(error);
    return null;
  }, []);

  const fetchProcessMessage = useCallback(async (): Promise<ProcessMessage | null> => {
    if (!apiUrl) {
      logger.warn(apiUrl, "API-URL Error");
      return null;
    }

    try {
      const response = await fetch(`${apiUrl}${urlMessageParam}?tabId=${tabId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        logger.warn(response.status);
        return null;
      }

      const data = await response.json();

      return processResponseData(data);
    } catch (error) {
      return handleFetchError(error);
    }
  }, [apiUrl, tabId, token, processResponseData, handleFetchError]);

  return { fetchProcessMessage };
}
