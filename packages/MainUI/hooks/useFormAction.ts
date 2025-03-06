import { useCallback, useEffect, useRef, useState } from 'react';
import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useUserContext } from './useUserContext';

export interface UseFormActionParams {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
}

export const useFormAction = ({ window, tab, mode }: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const controller = useRef<AbortController>(new AbortController());
  const { user } = useUserContext();
  const userId = user?.id;

  const submit = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        setLoading(true);

        const queryStringParams = buildQueryString({ mode, window, tab });
        const url = `${tab.entityName}?${queryStringParams}`;
        const options = {
          signal: controller.current.signal,
          method: 'POST',
          body: {
            dataSource: 'isc_OBViewDataSource_0',
            operationType: mode == FormMode.NEW ? 'add' : 'update',
            componentId: 'isc_OBViewForm_0',
            data: {
              ...values,
            },
            oldValues: {},
            csrfToken: userId,
          },
        } as const;

        const { data, statusText } = await Metadata.datasourceServletClient.request(url, options);

        if (data?.response?.data && !controller.current.signal.aborted) {
          return data.response.data;
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [mode, window, tab, userId],
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

const buildQueryString = ({ mode, window, tab }: UseFormActionParams) =>
  new URLSearchParams({
    windowId: String(window.id),
    tabId: String(tab.id),
    moduleId: String(tab.module),
    _operationType: mode == FormMode.NEW ? 'add' : 'update',
    _noActiveFilter: String(true),
    sendOriginalIDBack: String(true),
    _extraProperties: '',
    Constants_FIELDSEPARATOR: '$',
    _className: 'OBViewDataSource',
    Constants_IDENTIFIER: '_identifier',
    isc_dataFormat: 'json',
  });
