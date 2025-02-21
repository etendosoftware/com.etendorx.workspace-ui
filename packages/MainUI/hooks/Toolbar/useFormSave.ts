import { useCallback, useContext } from 'react';
import { useMetadataContext } from '../useMetadataContext';
import { API_DATASOURCE_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { UserContext } from '@/contexts/user';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

interface SaveFormResponse {
  success: boolean;
  message?: string;
  error?: Error;
  data?: unknown;
}

interface SaveFormParams {
  windowId: string;
  tabId: string;
  moduleId?: string;
  recordId?: string;
}

export const useFormSave = ({ windowId, tabId, moduleId = '0', recordId }: SaveFormParams) => {
  const { tab } = useMetadataContext();
  const { session } = useContext(UserContext);
  const csrfToken = session['#CSRF_TOKEN'];

  const buildEndpointUrl = useCallback(
    (entityName: string) => {
      const params = new URLSearchParams({
        windowId,
        tabId,
        moduleId,
        _operationType: 'update',
        _noActiveFilter: 'true',
        sendOriginalIDBack: 'true',
        _extraProperties: '',
        Constants_FIELDSEPARATOR: '$',
        _className: 'OBViewDataSource',
        Constants_IDENTIFIER: '_identifier',
        isc_dataFormat: 'json',
        stateless: 'true',
      });

      return `/${entityName}?${params}`;
    },
    [windowId, tabId, moduleId],
  );

  const saveForm = useCallback(
    async (formValues: Record<string, unknown>): Promise<SaveFormResponse> => {
      if (!tab?.entityName) {
        return {
          success: false,
          error: new Error('Entity name is required'),
          message: 'Missing entity name',
        };
      }

      try {
        const payload = {
          data: {
            ...formValues,
            _entityName: tab.entityName,
            id: recordId,
            _identifier: `${formValues.documentNo} - ${formValues.orderDate} - ${formValues.grandTotalAmount}`,
          },
          operationType: 'update',
          csrfToken: csrfToken,
        };

        const response = await Metadata.datasourceServletClient.post(buildEndpointUrl(tab.entityName), payload);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save form');
        }

        const responseData = await response.json();

        return {
          success: true,
          message: 'Form saved successfully',
          data: responseData,
        };
      } catch (error) {
        console.error('Error saving form:', error);
        return {
          success: false,
          error: error as Error,
          message: error instanceof Error ? error.message : 'Failed to save form',
        };
      }
    },
    [tab?.entityName, recordId, csrfToken, buildEndpointUrl],
  );

  return { saveForm };
};
