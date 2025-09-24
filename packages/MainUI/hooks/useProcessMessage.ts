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
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

export interface ProcessMessage {
  message: string;
  type: "error" | "success" | "info" | "warning";
  title: string;
}

const urlMessageParam = "?_action=org.openbravo.client.application.window.GetTabMessageActionHandler&";

export function useProcessMessage(tabId: string) {
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
    try {
      const response = await Metadata.kernelClient.post(`${urlMessageParam}`, { tabId });

      if (!response?.data) {
        logger.warn("No data returned from process message endpoint");
        return null;
      }

      return processResponseData(response.data);
    } catch (error) {
      return handleFetchError(error);
    }
  }, [tabId, processResponseData, handleFetchError]);

  return { fetchProcessMessage };
}
