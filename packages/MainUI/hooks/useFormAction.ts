import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export interface UseFormActionParams {
  mode: FormMode;
}

export const useFormAction = ({ mode }: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const controller = useRef<AbortController>(new AbortController());

  const submit = useCallback(
    async params => {
      try {
        console.debug('Submiting...', { params });
        setLoading(true);

        const { data, statusText } = await Metadata.datasourceServletClient.request('ComboTableDatasourceService', {
          signal: controller.current.signal,
          method: 'POST',
          body: {
            mode,
          },
        });

        if (data?.response?.data && !controller.current.signal.aborted) {
          return data.response.data;
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [mode],
  );

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { submit, loading, error };
};
