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

import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import { useCallback } from "react";
import { useUserContext } from "./useUserContext";
import { useRuntimeConfig } from "../contexts/RuntimeConfigContext";

export interface ProcessMessage {
  text: string;
  type: "error" | "success" | "info" | "warning";
  title: string;
}

export function useProcessMessage(tabId: string) {
  const { t } = useTranslation();
  const { token } = useUserContext();
  const { config } = useRuntimeConfig();

  // Use ETENDO_CLASSIC_HOST for direct browser access to Tomcat
  // This is necessary because the iframe is also loading from Tomcat directly
  const publicHost = config?.etendoClassicHost || "";

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

      if (data.text === "No message found") {
        return null;
      }

      const messageType = normalizeMessageType(data.type || "info", data.text || "");

      return {
        text: data.text || "",
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
    try {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const response: Response & { data?: any } = await fetch(
        `${publicHost}/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel?_action=org.openbravo.client.application.window.GetTabMessageActionHandler&language=en_US`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tabId,
          }),
        }
      );
      const data = await response.json();
      return processResponseData(data);
    } catch (error) {
      return handleFetchError(error);
    }
  }, [publicHost, token, tabId, processResponseData, handleFetchError]);

  return { fetchProcessMessage };
}
