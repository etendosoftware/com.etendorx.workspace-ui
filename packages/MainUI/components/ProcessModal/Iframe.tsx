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
      if (message.message?.toUpperCase().includes("ERROR")) {
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
          message: String(error),
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
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      {/* NOTE: sizes inherited from the modal for manual processes from the previous UI */}
      <div className="relative flex h-[625px] w-[900px] flex-col rounded-xl border-4 border-gray-300 bg-white">
        <div className="flex items-center justify-between rounded-xl border-gray-200 border-b bg-[var(--color-baseline-10)] p-4">
          <h2 className="font-semibold text-lg">{title || t("common.processes")}</h2>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-etendo-main)] border-t-transparent" />
                <p className="mt-2 font-medium">{t("common.loading")}</p>
              </div>
            </div>
          )}
          {processMessage && (
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
                  {processMessage.message && <p className="text-gray-700">{processMessage.message}</p>}
                </div>
              </div>
            </div>
          )}
          {!iframeLoading && !url && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <p className="text-2xl font-medium">{t("common.noDataAvailable")}</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            onLoad={handleIframeLoad}
            className="h-full w-full border-0"
            title={t("common.processes")}
          />
        </div>
        <div className="flex justify-end rounded-xl border-gray-200 border-t bg-[var(--color-baseline-10)] p-4">
          <button
            data-testid="close-button"
            type="button"
            onClick={handleClose}
            className="mx-auto rounded bg-[var(--color-etendo-main)] px-4 py-2 font-medium text-white hover:bg-[var(--color-etendo-dark)] focus:outline-none">
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProcessIframeModal = (props: ProcessIframeModalOpenProps | ProcessIframeModalClosedProps) => {
  if (isIframeModalOpen(props)) {
    return <ProcessIframeOpenModal {...props} />;
  }

  return null;
};

export default ProcessIframeModal;
