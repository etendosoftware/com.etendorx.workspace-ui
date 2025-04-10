import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProcessIframeModalProps, MessageStylesType } from './types';
import { useProcessMessage, ProcessMessage } from '@/hooks/useProcessMessage';
import { useTranslation } from '@/hooks/useTranslation';
import { logger } from '@/utils/logger';
import { useUserContext } from '@/hooks/useUserContext';

const ProcessIframeModal = ({ isOpen, onClose, url, title, onProcessSuccess }: ProcessIframeModalProps) => {
  const { t } = useTranslation();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [processMessage, setProcessMessage] = useState<ProcessMessage | null>(null);
  const [startPolling, setStartPolling] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const { fetchProcessMessage } = useProcessMessage();
  const [processWasSuccessful, setProcessWasSuccessful] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleReceivedMessage = useCallback(
    (message: ProcessMessage, clearFn: () => void) => {
      clearFn();

      if (message.message && message.message.toUpperCase().includes('ERROR')) {
        setProcessMessage({
          ...message,
          type: 'error',
          title: message.title || t('errors.internalServerError.title'),
        });
        setProcessWasSuccessful(false);
      } else {
        setProcessMessage(message);
        setProcessWasSuccessful(message.type === 'success');
      }
    },
    [t],
  );
  const handlePollingError = useCallback(
    (error: unknown, clearFn: () => void) => {
      if (error instanceof Error && !(error instanceof DOMException && error.name === 'AbortError')) {
        logger.error(error);
        clearFn();
        setProcessMessage({
          type: 'error',
          title: t('errors.internalServerError.title'),
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
        return error instanceof Error && !(error instanceof DOMException && error.name === 'AbortError');
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
    if (!isOpen || !startPolling) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(async () => {
        const shouldStop = await pollOnce(signal, () => clearInterval(intervalId));
        if (shouldStop) return;
      }, 2000);

      return () => clearInterval(intervalId);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen, startPolling, pollOnce]);

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
      setStartPolling(false);
    }
  }, [url]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  const getMessageStyles = useCallback((type: string): MessageStylesType => {
    const normalizedType = type?.toLowerCase() || '';
    if (normalizedType.includes('error')) {
      return {
        bgColor: 'var(--color-error-contrast-text)',
        borderColor: 'var(--color-error-main)',
        textColor: 'var(--color-error-main)',
        buttonBg: 'var(--color-error-main)',
      };
    }
    switch (normalizedType) {
      case 'success':
        return {
          bgColor: 'var(--color-success-contrast-text)',
          borderColor: 'var(--color-success-main)',
          textColor: 'var(--color-success-main)',
          buttonBg: 'var(--color-success-main)',
        };
      case 'warning':
        return {
          bgColor: 'var(--color-warning-contrast-text)',
          borderColor: 'var(--color-warning-main)',
          textColor: 'var(--color-warning-main)',
          buttonBg: 'var(--color-warning-main)',
        };
      case 'info':
      default:
        return {
          bgColor: 'var(--color-etendo-light)',
          borderColor: 'var(--color-etendo-main)',
          textColor: 'var(--color-etendo-main)',
          buttonBg: 'var(--color-etendo-main)',
        };
    }
  }, []);

  const messageStyles = useMemo(
    () =>
      processMessage
        ? getMessageStyles(processMessage.type)
        : {
            bgColor: '',
            borderColor: '',
            textColor: '',
            buttonBg: '',
          },
    [processMessage, getMessageStyles],
  );

  const { token } = useUserContext();

  const loadIframe = useCallback(async (url: string, token: string) => {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const iframeNode = document.createElement("document");
    iframeNode.setHTMLUnsafe(text);
    console.debug('fragment', iframeNode);
    const result = document.evaluate('/html/frameset//frame', iframeNode);
    console.debug('result', result);
    // setIframeUrl(URL.createObjectURL(new Blob(text)));
  }, []);

  useEffect(() => {
    if (url && token) {
      loadIframe(url, token);
    }
  }, [loadIframe, token, url]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative bg-white flex flex-col w-full max-w-3xl border-4 border-gray-300 rounded-xl h-3/6 max-h-[50vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-xl bg-[var(--color-baseline-10)]">
          <h2 className="text-lg font-semibold">{title || t('common.processes')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none"></button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-90">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-[var(--color-etendo-main)] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 font-medium">{t('common.loading')}</p>
              </div>
            </div>
          )}
          {processMessage?.message && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-4/5 max-w-md rounded-lg shadow-lg overflow-hidden border"
              style={{
                borderColor: messageStyles.borderColor,
                backgroundColor: 'white',
              }}>
              <div className="flex items-start gap-3 p-4" style={{ backgroundColor: messageStyles.bgColor }}>
                <div className="flex-shrink-0"></div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: messageStyles.textColor }}>
                    {processMessage.title || t('common.processes')}
                  </h3>
                  {processMessage.message && <p className="text-gray-700">{processMessage.message}</p>}
                </div>
              </div>
            </div>
          )}
          {iframeUrl && (
            <iframe
              src={iframeUrl}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              title={t('common.processes')}
            />
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end rounded-xl bg-[var(--color-baseline-10)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 mx-auto bg-[var(--color-etendo-main)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessIframeModal;
