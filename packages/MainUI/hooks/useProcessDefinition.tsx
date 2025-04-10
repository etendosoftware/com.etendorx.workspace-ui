import { ProcessResponse } from '@/components/Toolbar/types';
import { ExecuteProcessDefinitionParams } from './Toolbar/types';
import { useCallback, useState } from 'react';
import { useProcessMetadata } from './useProcessMetadata';
import { ProcessButton } from '@/components/ProcessModal/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export default function useProcessDefinition(button: ProcessButton) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { metadata } = useProcessMetadata(button);

  const execute = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessDefinitionParams): Promise<ProcessResponse> => {
      try {
        setLoading(true);
        setError(null);

        const { onLoad, onProcess } = await import(`../../process/${button.processDefinition.searchKey}`);
        console.debug(onLoad, onProcess);

        const queryParams = new URLSearchParams({
          _action: button.processDefinition.javaClassName,
          processId: button.processDefinition.id,
          // windowId: windowId,
        });

        const processParams: Record<string, unknown> = {};
        button.processDefinition.parameters?.forEach(param => {
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
        const processError = error instanceof Error ? error : new Error('Process execution failed');
        setError(processError);
        throw processError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, error, metadata, execute };
}
