/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useApiContext } from './useApiContext';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { buildPayloadByInputName } from '@/utils/form';

const ACTION = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'SETSESSION';

export const useSetSession = () => {
  const apiUrl = useApiContext();

  return useCallback(
    async (record: any, tab: Tab, token?: string | null) => {
      if (!tab) return;

      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tab.id,
        ROW_ID: record.id,
        PARENT_ID: 'null',
      });

      try {
        const payload = buildPayloadByInputName(record, tab.fields);
        const response = await fetch(`${apiUrl}/org.openbravo.client.kernel?${params}`, {
          method: 'POST',
          body: JSON.stringify(payload),
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
    [apiUrl],
  );
};
