import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useTranslation } from '@/hooks/useTranslation';
import { useApiContext } from '@/hooks/useApiContext';

export interface ProcessMessage {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
}

const urlMessageParam = '/meta/message';

export function useProcessMessage() {
  const apiUrl = useApiContext();
  const { t } = useTranslation();

  const fetchProcessMessage = useCallback(async (): Promise<ProcessMessage | null> => {
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
      });

      if (!response.ok) {
        logger.error('Error en respuesta:', response.status);
        return null;
      }

      const data = await response.json();

      if (data) {
        console.debug(data);
        if (!data.message) {
          return null;
        }

        let messageType = data.type?.toLowerCase() || 'info';

        if (data.message && data.message.toUpperCase().includes('ERROR')) {
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
            (normalizedType === 'error' ? t('errors.internalServerError.title') : t('process.messageTitle')),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error al obtener mensajes del proceso:', error);
      return null;
    }
  }, [apiUrl, t]);

  return { fetchProcessMessage };
}
