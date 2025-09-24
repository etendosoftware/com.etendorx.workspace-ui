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

import { type ProcessMessage, useProcessMessage } from "@/hooks/useProcessMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type MessageStylesType,
  type ProcessIframeModalClosedProps,
  type ProcessIframeModalOpenProps,
  isIframeModalOpen,
} from "./types";
import CustomModal from "@workspaceui/componentlibrary/src/components/Modal/CustomModal";

const CLOSE_MODAL_ACTION = "closeModal";
const PROCESS_ORDER_ACTION = "processOrder";

const ProcessIframeOpenModal = ({
  isOpen,
  onClose,
  url,
  title,
  onProcessSuccess,
  tabId,
}: ProcessIframeModalOpenProps) => {
  const { t } = useTranslation();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [processMessage, setProcessMessage] = useState<ProcessMessage | null>(null);
  const { fetchProcessMessage } = useProcessMessage(tabId);
  const [processWasSuccessful, setProcessWasSuccessful] = useState(false);

  const handleClose = useCallback(() => {
    if (processWasSuccessful && onProcessSuccess) {
      onProcessSuccess();
    }

    setProcessWasSuccessful(false);
    onClose();
  }, [onClose, onProcessSuccess, processWasSuccessful]);

  const handleReceivedMessage = useCallback(
    (message: ProcessMessage) => {
      if (message?.type === "info") return;
      if (message.text?.toUpperCase().includes("ERROR")) {
        setProcessMessage({
          ...message,
          type: "error",
          title: message.title || t("errors.internalServerError.title"),
        });
        setProcessWasSuccessful(false);
      } else {
        setProcessMessage(message);
        setProcessWasSuccessful(message.type === "success");
      }
    },
    [t]
  );

  const handleMessageError = useCallback(
    (error: unknown) => {
      if (error instanceof Error && !(error instanceof DOMException)) {
        logger.warn(error);
        setProcessMessage({
          type: "error",
          title: t("errors.internalServerError.title"),
          text: String(error),
        });
      }
    },
    [t]
  );

  const handleProcessMessage = useCallback(async () => {
    try {
      const message = await fetchProcessMessage();
      if (message) {
        handleReceivedMessage(message);
        return true;
      }
    } catch (error) {
      handleMessageError(error);
      return error instanceof Error && !(error instanceof DOMException);
    }
    return false;
  }, [fetchProcessMessage, handleReceivedMessage, handleMessageError]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  const getMessageStyles = useCallback((type: string): MessageStylesType => {
    const normalizedType = type?.toLowerCase() || "";
    if (normalizedType.includes("error")) {
      return {
        bgColor: "var(--color-error-contrast-text)",
        borderColor: "var(--color-error-main)",
        textColor: "var(--color-error-main)",
        buttonBg: "var(--color-error-main)",
      };
    }
    switch (normalizedType) {
      case "success":
        return {
          bgColor: "var(--color-success-contrast-text)",
          borderColor: "var(--color-success-main)",
          textColor: "var(--color-success-main)",
          buttonBg: "var(--color-success-main)",
        };
      case "warning":
        return {
          bgColor: "var(--color-warning-contrast-text)",
          borderColor: "var(--color-warning-main)",
          textColor: "var(--color-warning-main)",
          buttonBg: "var(--color-warning-main)",
        };
      default:
        return {
          bgColor: "var(--color-etendo-light)",
          borderColor: "var(--color-etendo-main)",
          textColor: "var(--color-etendo-main)",
          buttonBg: "var(--color-etendo-main)",
        };
    }
  }, []);

  useEffect(() => {
    if (url) {
      setIframeLoading(true);
      setProcessMessage(null);
    }
  }, [url]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.action === CLOSE_MODAL_ACTION) {
        handleClose();
      }
      if (event.data?.action === PROCESS_ORDER_ACTION) {
        await handleProcessMessage();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleClose, handleProcessMessage]);

  const messageStyles = useMemo(
    () =>
      processMessage
        ? getMessageStyles(processMessage.type)
        : {
            bgColor: "",
            borderColor: "",
            textColor: "",
            buttonBg: "",
          },
    [processMessage, getMessageStyles]
  );

  if (!isOpen) return null;

  return (
    <CustomModal
      isOpen={isOpen}
      title={title || t("common.processes")}
      iframeLoading={iframeLoading}
      customContent={
        processMessage && (
          <div
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-50 w-4/5 max-w-md transform overflow-hidden rounded-lg border shadow-lg"
            style={{
              borderColor: messageStyles.borderColor,
              backgroundColor: "white",
            }}>
            <div className="flex items-start gap-3 p-4" style={{ backgroundColor: messageStyles.bgColor }}>
              <div className="flex-shrink-0" />
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-lg" style={{ color: messageStyles.textColor }}>
                  {processMessage.title || t("common.processes")}
                </h3>
                {processMessage.text && <p className="text-gray-700">{processMessage.text}</p>}
              </div>
            </div>
          </div>
        )
      }
      url={url || ""}
      handleIframeLoad={handleIframeLoad}
      handleClose={handleClose}
      texts={{
        loading: t("common.loading"),
        iframeTitle: t("common.processes"),
        noData: t("common.noDataAvailable"),
        closeButton: t("common.close"),
      }}
      data-testid="CustomModal__f85edd"
    />
  );
};

const ProcessIframeModal = (props: ProcessIframeModalOpenProps | ProcessIframeModalClosedProps) => {
  if (isIframeModalOpen(props)) {
    return <ProcessIframeOpenModal {...props} data-testid="ProcessIframeOpenModal__f85edd" />;
  }

  return null;
};

export default ProcessIframeModal;
