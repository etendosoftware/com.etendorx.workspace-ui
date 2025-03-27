import { useState, useContext, useCallback } from 'react';
import { UserContext } from '../../contexts/user';
import { ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessActionParams, ExecuteProcessDefinitionParams, ExecuteProcessParams } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { ProcessButtonType } from '@/components/ProcessModal/types';
import { logger } from '@/utils/logger';

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useContext(UserContext);

  const executeProcessDefinition = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessDefinitionParams): Promise<ProcessResponse> => {
      try {
        alert('execute process definition');
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams({
          // _action: button.processDefinition.id,
          processId: button.processDefinition.id,
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

        const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!ok) {
          throw new Error(`HTTP error! status: ${status}`);
        }

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
    },
    [],
  );

  const executeProcessAction = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessActionParams): Promise<ProcessResponse> => {
      try {
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams({
          // _action: button.processDefinition.id,
          processId: button.processAction.id,
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

        const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!ok) {
          throw new Error(`HTTP error! status: ${status}`);
        }

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
    },
    [],
  );

  const executeProcess = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (ProcessButtonType.PROCESS_ACTION in button) {
        logger.error('process action', button);

        return executeProcessAction({ button, recordId, params });
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        logger.error('process definition', button);

        return executeProcessDefinition({ button, recordId, params });
      } else {
        throw new Error('Unsupported process type');
      }
    },
    [executeProcessAction, executeProcessDefinition, token],
  );

  return {
    executeProcess,
    loading,
    error,
  };
}
