import { API_BASE_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { BasicAuthHelper } from '@workspaceui/etendohookbinder/src/auth/basicAuth';
import { useState } from 'react';
import { ProcessButton, ProcessResponse } from '../components/Toolbar/types';
import { BaseFieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';

interface ExecuteProcessParams {
  button: ProcessButton;
  recordId?: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeProcess = async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
    try {
      setLoading(true);
      setError(null);

      const actionUrl = `${API_BASE_URL}/etendo/org.openbravo.client.kernel`;
      const queryParams = new URLSearchParams({
        _action: button.processInfo.javaClassName,
        processId: button.processId,
      });

      const processParams = button.processInfo.parameters?.reduce<Record<string, unknown>>(
        (acc, param) => ({
          ...acc,
          [param.id]: params[param.id] ?? param.name,
        }),
        {},
      );

      const payload = {
        recordIds: recordId ? [recordId] : [],
        _buttonValue: button.buttonText,
        _params: processParams,
        _entityName: button.processInfo._entityName,
      };

      const response = await fetch(`${actionUrl}?${queryParams}`, {
        method: 'POST',
        headers: {
          ...BasicAuthHelper.createHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.response?.status === -1) {
        throw new Error(data.response.error?.message || 'Unknown server error');
      }

      if (!response.ok) {
        throw new Error(`Error HTTP! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('useProcessExecution - Error details:', error);
      const processError = error instanceof Error ? error : new Error('Process execution failed');
      setError(processError);
      throw processError;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeProcess,
    loading,
    error,
  };
}
