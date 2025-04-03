import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useContext } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiContext } from '@/contexts/api';

export interface ProcessMessage {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
}

const urlMessageParam = '/meta/message';

export function useProcessMessage() {
  const apiUrl = useContext(ApiContext);
  const { t } = useTranslation();

  const fetchProcessMessage = useCallback(
    async (signal?: AbortSignal): Promise<ProcessMessage | null> => {
      if (!apiUrl) {
        logger.error('API URL no disponible');
        return null;
      }

      try {
        const response = await fetch(`${apiUrl}${urlMessageParam}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        });

        if (!response.ok) {
          logger.error('Error en respuesta:', response.status);
          return null;
        }

        const data = await response.json();
        logger.info('Respuesta del servidor:', data);

        if (!data) {
          return null;
        }

        if (data.message === 'No message found') {
          return null;
        }

        let messageType = data.type?.toLowerCase() || 'info';

        if (messageType === 'success' || data.type === 'Success') {
          messageType = 'success';
        } else if (data.message && data.message.toUpperCase().includes('ERROR')) {
          messageType = 'error';
        }

        const normalizedType =
          messageType === 'success' || messageType.includes('success')
            ? 'success'
            : messageType === 'error' || messageType.includes('error')
              ? 'error'
              : messageType === 'warning' || messageType.includes('warn')
                ? 'warning'
                : 'info';

        return {
          message: data.message || '',
          type: normalizedType as 'success' | 'error' | 'warning' | 'info',
          title:
            data.title ||
            (normalizedType === 'error'
              ? t('errors.internalServerError.title')
              : normalizedType === 'success'
                ? t('process.completedSuccessfully')
                : t('process.messageTitle')),
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.info('Petición de mensaje de proceso abortada');
          return null;
        }

        logger.error('Error al obtener mensajes del proceso:', error);
        return null;
      }
    },
    [apiUrl, t],
  );

  return { fetchProcessMessage };
}
