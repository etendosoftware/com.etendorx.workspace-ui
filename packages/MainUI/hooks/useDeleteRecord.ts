import { useCallback, useRef, useState } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useUserContext } from './useUserContext';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useTranslation } from './useTranslation';

export interface UseDeleteRecordParams {
  tab: Tab;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showConfirmation?: boolean;
}

export const useDeleteRecord = ({ tab, onSuccess, onError }: UseDeleteRecordParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user } = useUserContext();
  const userId = user?.id;
  const { t } = useTranslation();

  const deleteRecord = useCallback(
    async (record: EntityData) => {
      if (!record || !record.id) {
        onError?.(t('status.noIdError'));
        return false;
      }

      if (!tab || !tab.entityName) {
        onError?.(t('status.noEntityError'));
        return false;
      }

      try {
        setLoading(true);

        controller.current.abort();
        controller.current = new AbortController();

        const queryParams = new URLSearchParams({
          windowId: String(tab.windowId),
          tabId: String(tab.id),
          moduleId: String(tab.module || '0'),
          _operationType: 'remove',
          _noActiveFilter: 'true',
          sendOriginalIDBack: 'true',
          _extraProperties: '',
          Constants_FIELDSEPARATOR: '$',
          _className: 'OBViewDataSource',
          Constants_IDENTIFIER: '_identifier',
          csrfToken: userId || '',
          id: String(record.id),
        });

        const url = `/${tab.entityName}?${queryParams}`;

        const options = {
          signal: controller.current.signal,
          method: 'DELETE',
        };

        const response = await Metadata.datasourceServletClient.request(url, options);

        if (!response.ok) {
          throw new Error(t('status.httpError') + response.status);
        }

        setLoading(false);

        if (onSuccess) {
          onSuccess();
        }

        return true;
      } catch (err) {
        setLoading(false);

        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }

        if (onError) {
          onError(err instanceof Error ? err.message : String(err));
        }

        return false;
      }
    },
    [tab, onError, t, userId, onSuccess],
  );

  return { deleteRecord, loading };
};
