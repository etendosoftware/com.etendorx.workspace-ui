import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { buildPayloadByInputName } from '@/utils';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

const ACTION = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'SETSESSION';

export const useSetSession = () => {
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
        const response = await Metadata.kernelClient.post(`${params}`, payload);

        if (!response?.ok) {
          throw new Error(response.statusText);
        } else {
          const cookie = response.headers.getSetCookie();
          console.debug(cookie);
        }

        return response;
      } catch (error) {
        logger.error(error);
      }
    },
    [],
  );
};
