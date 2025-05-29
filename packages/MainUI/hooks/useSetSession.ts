import { buildPayloadByInputName } from '@/utils';
import { logger } from '@/utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import type { EntityData, FormInitializationResponse, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback } from 'react';
import { useUserContext } from './useUserContext';

const ACTION = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'SETSESSION';

export const useSetSession = () => {
  const { setSession } = useUserContext();

  return useCallback(
    async (record: EntityData, tab: Tab) => {
      if (!tab) return;

      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tab.id,
        ROW_ID: String(record.id),
        PARENT_ID: 'null',
      });

      try {
        const payload = buildPayloadByInputName(record, tab.fields);
        const response = await Metadata.kernelClient.post(`?${params}`, payload);

        if (!response?.ok) {
          throw new Error(response.statusText);
        }

        const data = response.data as FormInitializationResponse;

        setSession((prev) => {
          const result = { ...prev, ...data.sessionAttributes };

          for (const [inputName, { value }] of Object.entries(data.auxiliaryInputValues)) {
            result[inputName] = value || '';
          }

          return result;
        });
      } catch (error) {
        logger.warn(error);
      }
    },
    [setSession],
  );
};
