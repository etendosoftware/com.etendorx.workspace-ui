import { useCallback, useContext } from 'react';
import { logger } from '@/utils/logger';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiContext } from '@/contexts/api';
import { useUserContext } from './useUserContext';

export interface ProcessMessage {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
}

const urlMessageParam = '/meta/message';

export function useProcessMessage(tabId: string) {
  const apiUrl = useContext(ApiContext);
  const { token } = useUserContext();
  const { t } = useTranslation();

  const normalizeMessageType = useCallback(
    (messageType: string, message: string): 'success' | 'error' | 'warning' | 'info' => {
      const normalizedType = messageType?.toLowerCase() || 'info';

      if (normalizedType === 'success' || messageType === 'Success') {
        return 'success';
      }

      if (message && message.toUpperCase().includes('ERROR')) {
        return 'error';
      }

      if (normalizedType.includes('success')) {
        return 'success';
      } else if (normalizedType.includes('error')) {
        return 'error';
      } else if (normalizedType.includes('warn')) {
        return 'warning';
      } else {
        return 'info';
      }
    },
    [],
  );

  const getMessageTitle = useCallback(
    (originalTitle: string | undefined, type: string): string => {
      if (originalTitle) {
        return originalTitle;
      }

      switch (type) {
        case 'error':
          return t('errors.internalServerError.title');
        case 'success':
          return t('process.completedSuccessfully');
        default:
          return t('process.messageTitle');
      }
    },
    [t],
  );

  const processResponseData = useCallback(
    (data: ProcessMessage): ProcessMessage | null => {
      if (!data) {
        return null;
      }

      if (data.message === 'No message found') {
        return null;
      }

      const messageType = normalizeMessageType(data.type || 'info', data.message || '');

      return {
        message: data.message || '',
        type: messageType,
        title: getMessageTitle(data.title, messageType),
      };
    },
    [normalizeMessageType, getMessageTitle],
  );

  const handleFetchError = useCallback((error: unknown): ProcessMessage | null => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.warn(error);
    }

    logger.warn(error);
    return null;
  }, []);

  const fetchProcessMessage = useCallback(
    async (signal?: AbortSignal): Promise<ProcessMessage | null> => {
      if (!apiUrl) {
        logger.error(apiUrl, 'API-URL Error');
        return null;
      }

      try {
        const response = await fetch(`${apiUrl}${urlMessageParam}?tabId=${tabId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal,
        });

        if (!response.ok) {
          logger.error(response.status);
          return null;
        }

        const data = await response.json();

        return processResponseData(data);
      } catch (error) {
        return handleFetchError(error);
      }
    },
    [apiUrl, tabId, token, processResponseData, handleFetchError],
  );

  return { fetchProcessMessage };
}
