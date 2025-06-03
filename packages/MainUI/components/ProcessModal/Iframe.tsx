import { type ProcessMessage, useProcessMessage } from "@/hooks/useProcessMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type MessageStylesType,
  type ProcessIframeModalClosedProps,
  type ProcessIframeModalOpenProps,
  isIframeModalOpen,
} from "./types";

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
  const [startPolling, setStartPolling] = useState(false);
  const { fetchProcessMessage } = useProcessMessage(tabId);
  const [processWasSuccessful, setProcessWasSuccessful] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleReceivedMessage = useCallback(
    (message: ProcessMessage, clearFn: () => void) => {
      clearFn();

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
    [t],
  );
  const handlePollingError = useCallback(
    (error: unknown, clearFn: () => void) => {
      if (error instanceof Error && !(error instanceof DOMException && error.name === "AbortError")) {
        logger.warn(error);
        clearFn();
        setProcessMessage({
          type: "error",
          title: t("errors.internalServerError.title"),
          message: String(error),
        });
      }
    },
    [t],
  );

  const pollOnce = useCallback(
    async (signal: AbortSignal, clearFn: () => void) => {
      if (signal.aborted) return;

      try {
        const message = await fetchProcessMessage(signal);
        if (signal.aborted) return;
        if (message) {
          handleReceivedMessage(message, clearFn);
          return true;
        }
      } catch (error) {
        if (signal.aborted) return;
        handlePollingError(error, clearFn);
        return error instanceof Error && !(error instanceof DOMException && error.name === "AbortError");
      }
      return false;
    },
    [fetchProcessMessage, handleReceivedMessage, handlePollingError],
  );

  const handleClose = useCallback(() => {
    if (processWasSuccessful && onProcessSuccess) {
      onProcessSuccess();
    }

    setProcessWasSuccessful(false);
    onClose();
  }, [onClose, onProcessSuccess, processWasSuccessful]);

  useEffect(() => {
    return;

    // if (!isOpen || !startPolling) return;

    // abortControllerRef.current = new AbortController();
    // const signal = abortControllerRef.current.signal;

    // const timeoutId = setTimeout(() => {
    //   const intervalId = setInterval(async () => {
    //     const shouldStop = await pollOnce(signal, () => clearInterval(intervalId));
    //     if (shouldStop) return;
    //   }, 2000);

    //   return () => clearInterval(intervalId);
    // }, 2000);

    // return () => {
    //   clearTimeout(timeoutId);
    //   if (abortControllerRef.current) {
    //     abortControllerRef.current.abort();
    //     abortControllerRef.current = null;
    //   }
    // };
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (url) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIframeLoading(true);
      setProcessMessage(null);
      // setStartPolling(false);
    }
  }, [url]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    // setStartPolling(true);
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
    [processMessage, getMessageStyles],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative flex h-3/6 max-h-[50vh] w-full max-w-3xl flex-col rounded-xl border-4 border-gray-300 bg-white">
        <div className="flex items-center justify-between rounded-xl border-gray-200 border-b bg-[var(--color-baseline-10)] p-4">
          <h2 className="font-semibold text-lg">{title || t("common.processes")}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none" />
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
          <iframe
            src={url}
            onLoad={handleIframeLoad}
            className="h-full w-full border-0"
            title={t("common.processes")}
          />
        </div>
        <div className="flex justify-end rounded-xl border-gray-200 border-t bg-[var(--color-baseline-10)] p-4">
          <button
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
