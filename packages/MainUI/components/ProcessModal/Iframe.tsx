import { useState, useEffect } from 'react';
import { ProcessIframeModalProps, MessageStylesType } from './types';
import { fetchProcessMessage, ProcessMessage } from '@/hooks/useProcessMessage';

const ProcessIframeModal = ({ isOpen, onClose, url, title }: ProcessIframeModalProps) => {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [processMessage, setProcessMessage] = useState<ProcessMessage | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [startPolling, setStartPolling] = useState(false);

  useEffect(() => {
    if (!isOpen || !startPolling) return;

    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(async () => {
        const message = await fetchProcessMessage();

        if (message) {
          if (message.message && message.message.toUpperCase().includes('ERROR')) {
            setProcessMessage({
              ...message,
              type: 'error',
              title: message.title || 'Error',
            });
          } else {
            setProcessMessage(message);
          }
          clearInterval(intervalId);
          return;
        }

        setPollingCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 10) {
            clearInterval(intervalId);
          }
          return newCount;
        });
      }, 3000);

      return () => {
        clearInterval(intervalId);
      };
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, startPolling]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setStartPolling(true);
  };

  useEffect(() => {
    if (url) {
      setIframeLoading(true);
      setProcessMessage(null);
      setPollingCount(0);
      setStartPolling(false);
    }
  }, [url]);

  const getMessageStyles = (type: string): MessageStylesType => {
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
        return {
          bgColor: 'var(--color-etendo-light)',
          borderColor: 'var(--color-etendo-main)',
          textColor: 'var(--color-etendo-main)',
          buttonBg: 'var(--color-etendo-main)',
        };
      default:
        return {
          bgColor: 'var(--color-etendo-light)',
          borderColor: 'var(--color-etendo-main)',
          textColor: 'var(--color-etendo-main)',
          buttonBg: 'var(--color-etendo-main)',
        };
    }
  };

  if (!isOpen) return null;

  const messageStyles: MessageStylesType = processMessage
    ? getMessageStyles(processMessage.type)
    : {
        bgColor: '',
        borderColor: '',
        textColor: '',
        buttonBg: '',
      };

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative bg-white flex flex-col w-full max-w-3xl border-4 border-gray-300 rounded-xl h-3/6 max-h-[50vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-xl bg-[var(--color-baseline-10)]">
          <h2 className="text-lg font-semibold">{title || 'Proceso de Etendo'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none"></button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-90">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-[var(--color-etendo-main)] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 font-medium">Cargando proceso...</p>
              </div>
            </div>
          )}
          {processMessage && (
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
                    {processMessage.title}
                  </h3>
                  {processMessage.message && <p className="text-gray-700">{processMessage.message}</p>}
                </div>
              </div>
              <div className="p-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded text-white text-sm font-medium focus:outline-none mx-auto"
                  style={{ backgroundColor: messageStyles.buttonBg }}>
                  Aceptar
                </button>
              </div>
            </div>
          )}
          {startPolling && !processMessage && pollingCount > 0 && pollingCount < 10 && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white bg-opacity-95 py-2 px-4 rounded-full shadow-md flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--color-etendo-main)] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Esperando respuesta del proceso...</span>
              </div>
            </div>
          )}

          <iframe src={url} onLoad={handleIframeLoad} className="w-full h-full border-0" title="Proceso de Etendo" />
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end rounded-xl bg-[var(--color-baseline-10)]">
          <button
            onClick={onClose}
            className="px-4 py-2 mx-auto bg-[var(--color-etendo-main)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessIframeModal;
