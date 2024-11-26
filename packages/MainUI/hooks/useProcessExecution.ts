import { API_BASE_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { useState, useContext } from 'react';
import { ProcessButton, ProcessResponse } from '../components/Toolbar/types';
import { UserContext } from '../contexts/user';
import { BaseFieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';

interface ExecuteProcessParams {
  button: ProcessButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useContext(UserContext);

  const executeProcess = async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    try {
      setLoading(true);
      setError(null);

      const actionUrl = `${API_BASE_URL}/org.openbravo.client.kernel`;
      const queryParams = new URLSearchParams({
        _action: button.processInfo.javaClassName,
        processId: button.processId,
        stateless: 'true',
      });

      const processParams: Record<string, unknown> = {};
      button.processInfo.parameters?.forEach(param => {
        if (params[param.id]) {
          processParams[param.id] = params[param.id];
        }
      });

      const payload = {
        recordIds: [recordId],
        _buttonValue: button.buttonText,
        _params: processParams,
        _entityName: button.processInfo?._entityName || '',
      };

      const response = await fetch(`${actionUrl}?${queryParams}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.response?.status === -1) {
        throw new Error(data.response.error?.message || 'Unknown server error');
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
