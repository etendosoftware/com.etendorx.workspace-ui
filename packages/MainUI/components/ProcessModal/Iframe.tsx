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
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  type MessageStylesType,
  type ProcessIframeModalClosedProps,
  type ProcessIframeModalOpenProps,
  isIframeModalOpen,
} from "./types";
import CustomModal from "@workspaceui/componentlibrary/src/components/Modal/CustomModal";

const CLOSE_MODAL_ACTION = "closeModal";
const PROCESS_ORDER_ACTION = "processOrder";
const SHOW_PROCESS_MESSAGE_ACTION = "showProcessMessage";
const IFRAME_UNLOADED_ACTION = "iframeUnloaded";
const REQUEST_FAILED_ACTION = "requestFailed";
const MESSAGE_FALLBACK_TIMEOUT_MS = 5000;

/**
 * Classic forms running inside an iframe use window.innerWidth (the iframe's width)
 * instead of screen.width when calculating popup positions for window.open() calls.
 * This causes popups (e.g. Attribute selector) to appear near the left edge of the screen.
 * We inject a small script that overrides window.open() to recalculate left/top positions
 * using screen.width/screen.height, centering the popup correctly.
 */
const injectPopupPositionFix = (iframeRef: RefObject<HTMLIFrameElement | null>): void => {
  try {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const script = doc.createElement("script");
    script.textContent = `
      if (!window.__etendoPopupFixApplied) {
        window.__etendoPopupFixApplied = true;
        var _origOpen = window.open;
        window.open = function(url, name, features, replace) {
          if (features && typeof features === 'string') {
            var w = 800, h = 600;
            var mw = features.match(/width=(\\d+)/);
            var mh = features.match(/height=(\\d+)/);
            if (mw) w = parseInt(mw[1], 10);
            if (mh) h = parseInt(mh[1], 10);
            features = features
              .replace(/left=-?\\d+/, 'left=' + Math.max(0, Math.round((screen.width - w) / 2)))
              .replace(/top=-?\\d+/, 'top=' + Math.max(0, Math.round((screen.height - h) / 2)));
          }
          return _origOpen.apply(this, arguments);
        };
      }
    `;
    doc.head.appendChild(script);
  } catch {
    // Cross-origin or access error — ignore silently
  }
};

const ProcessIframeOpenModal = ({
  isOpen,
  onClose,
  url,
  formParams,
  title,
  onProcessSuccess,
  tabId,
  size = "default",
}: ProcessIframeModalOpenProps) => {
  const { t } = useTranslation();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [processMessage, setProcessMessage] = useState<ProcessMessage | null>(null);
  const processMessageRef = useRef<ProcessMessage | null>(null);
  const { fetchProcessMessage } = useProcessMessage(tabId);
  const [processWasSuccessful, setProcessWasSuccessful] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  const loadCount = useRef<number>(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [awaitingMessage, setAwaitingMessage] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    processMessageRef.current = processMessage;
  }, [processMessage]);

  const handleClose = useCallback(() => {
    if ((processWasSuccessful || hasNavigated) && onProcessSuccess) {
      onProcessSuccess();
    }

    setProcessWasSuccessful(false);
    setHasNavigated(false);
    onClose();
  }, [onClose, onProcessSuccess, processWasSuccessful, hasNavigated]);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const showFallbackMessage = useCallback(() => {
    clearFallbackTimer();
    setAwaitingMessage(false);
    setProcessMessage({
      type: "warning",
      title: t("process.fallbackMessage.title"),
      text: t("process.fallbackMessage.text"),
    });
  }, [t, clearFallbackTimer]);

  const startFallbackCountdown = useCallback(() => {
    if (fallbackTimerRef.current !== null) return;
    setAwaitingMessage(true);
    fallbackTimerRef.current = setTimeout(showFallbackMessage, MESSAGE_FALLBACK_TIMEOUT_MS);
  }, [showFallbackMessage]);

  const handleReceivedMessage = useCallback(
    (message: ProcessMessage) => {
      if (message?.type === "info" && message?.text === "") return;
      clearFallbackTimer();
      setAwaitingMessage(false);
      if (message.text?.toUpperCase().includes("ERROR") || message.title?.toUpperCase().includes("ERROR")) {
        setProcessMessage({
          ...message,
          type: "error",
          title: message.title || t("errors.internalServerError.title"),
        });
        setProcessWasSuccessful(false);
      } else {
        setProcessMessage(message);
        const isSuccess = message.type === "success";
        setProcessWasSuccessful(isSuccess);
        if (isSuccess) {
          setProgressWidth(100);
        }
      }
    },
    [t, clearFallbackTimer]
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

  const handleRequestFailed = useCallback(() => {
    clearFallbackTimer();
    setAwaitingMessage(false);
    setProcessMessage({
      type: "error",
      title: t("process.requestFailed.title"),
      text: t("process.requestFailed.text"),
    });
  }, [t, clearFallbackTimer]);

  const handleProcessMessage = useCallback(async () => {
    startFallbackCountdown();
    try {
      const message = await fetchProcessMessage();
      if (message) {
        clearFallbackTimer();
        setAwaitingMessage(false);
        handleReceivedMessage(message);
        return true;
      }
    } catch (error) {
      handleMessageError(error);
      clearFallbackTimer();
      setAwaitingMessage(false);
      return error instanceof Error && !(error instanceof DOMException);
    }
    return false;
  }, [fetchProcessMessage, handleReceivedMessage, handleMessageError, startFallbackCountdown, clearFallbackTimer]);

  const handleIframeLoad = useCallback(() => {
    loadCount.current += 1;
    if (loadCount.current > 1) {
      setHasNavigated(true);
    }
    setIframeLoading(false);
    injectPopupPositionFix(iframeRef);
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
      setAwaitingMessage(false);
      clearFallbackTimer();
    }
    loadCount.current = 0;
    setHasNavigated(false);
  }, [url, clearFallbackTimer]);

  useEffect(() => () => clearFallbackTimer(), [clearFallbackTimer]);

  useEffect(() => {
    if (processMessage?.type === "success") {
      const totalDuration = 3000;
      const updateInterval = 50;
      const decrementValue = (100 / totalDuration) * updateInterval;

      const progressTimer = setInterval(() => {
        setProgressWidth((prev) => Math.max(0, prev - decrementValue));
      }, updateInterval);

      const closeTimer = setTimeout(() => {
        clearInterval(progressTimer);
        handleClose();
      }, totalDuration);

      return () => {
        clearInterval(progressTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [processMessage, handleClose]);

  const shouldSuppressAutoClose = useCallback(() => {
    const current = processMessageRef.current;
    return current?.type === "error" || current?.type === "warning";
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.action === CLOSE_MODAL_ACTION) {
        if (shouldSuppressAutoClose()) return;
        handleClose();
      }
      if (event.data?.action === PROCESS_ORDER_ACTION) {
        await handleProcessMessage();
      }
      if (event.data?.action === SHOW_PROCESS_MESSAGE_ACTION && event.data?.payload) {
        handleReceivedMessage(event.data.payload as ProcessMessage);
      }
      if (event.data?.action === IFRAME_UNLOADED_ACTION) {
        if (processMessageRef.current) return;
        startFallbackCountdown();
      }
      if (event.data?.action === REQUEST_FAILED_ACTION) {
        handleRequestFailed();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    handleClose,
    handleProcessMessage,
    handleReceivedMessage,
    handleRequestFailed,
    shouldSuppressAutoClose,
    startFallbackCountdown,
  ]);

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

  // Apply larger size for Forms - responsive with max size
  const sizeClass = size === "large" ? "!w-[90vw] !max-w-[1600px] !h-[92vh] !max-h-[1000px]" : "";

  const showLoadingOverlay = iframeLoading || awaitingMessage;
  const loadingText = awaitingMessage ? t("process.processingMessage") : t("common.loading");

  return (
    <CustomModal
      isOpen={isOpen}
      title={title || t("common.processes")}
      iframeLoading={showLoadingOverlay}
      iframeRef={iframeRef}
      customContentClass={sizeClass}
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
            {processMessage.type === "success" && (
              <div className="w-full bg-(--color-transparent-neutral-10) h-1">
                <div
                  className="h-1 transition-all duration-50 ease-linear"
                  style={{
                    width: `${progressWidth}%`,
                    backgroundColor: messageStyles.borderColor,
                  }}
                />
              </div>
            )}
          </div>
        )
      }
      url={url || ""}
      formParams={formParams ?? null}
      handleIframeLoad={handleIframeLoad}
      handleClose={handleClose}
      texts={{
        loading: loadingText,
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
