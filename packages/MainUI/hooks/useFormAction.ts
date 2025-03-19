import { useCallback, useEffect, useRef, useState } from 'react';
import { EntityData, FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useUserContext } from './useUserContext';

export interface UseFormActionParams {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  onSuccess: (data: EntityData) => void;
  onError: (data: string) => void;
}

export const useFormAction = ({ window, tab, mode, onSuccess, onError }: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
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
            operationType: mode === FormMode.NEW ? 'add' : 'update',
            componentId: 'isc_OBViewForm_0',
            data: {
              accountingDate: new Date(),
              ...values,
            },
            oldValues: {},
            csrfToken: userId,
          },
        } as const;

        const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

        if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
          setLoading(false);
          onSuccess?.(data.response.data[0]);
        } else {
          throw new Error(data.response.error.message);
        }
      } catch (err) {
        setLoading(false);
        onError?.(String(err));
      }
    },
    [mode, onError, onSuccess, tab, userId, window],
  );

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { submit, loading };
};

const buildQueryString = ({ mode, window, tab }: { window: WindowMetadata; tab: Tab; mode: FormMode }) =>
  new URLSearchParams({
    windowId: String(window.id),
    tabId: String(tab.id),
    moduleId: String(tab.module),
    _operationType: mode === FormMode.NEW ? 'add' : 'update',
    _noActiveFilter: String(true),
    sendOriginalIDBack: String(true),
    _extraProperties: '',
    Constants_FIELDSEPARATOR: '$',
    _className: 'OBViewDataSource',
    Constants_IDENTIFIER: '_identifier',
    isc_dataFormat: 'json',
  });
