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
