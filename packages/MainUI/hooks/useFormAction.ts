import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityData, FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useUserContext } from './useUserContext';
import { UseFormHandleSubmit } from 'react-hook-form';
import { buildFormPayload, buildQueryString } from '@/utils';

export interface UseFormActionParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  onSuccess: (data: EntityData) => void;
  onError: (data: string) => void;
  initialState?: EntityData;
  submit: UseFormHandleSubmit<EntityData, undefined>;
}

export const useFormAction = ({
  windowMetadata,
  tab,
  mode,
  onSuccess,
  onError,
  initialState,
  submit,
}: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user } = useUserContext();
  const userId = user?.id;

  const execute = useCallback(
    async (values: EntityData) => {
      try {
        setLoading(true);

        const queryStringParams = buildQueryString({ mode, windowMetadata, tab });
        const body = buildFormPayload({ values, oldValues: initialState, mode, csrfToken: userId });
        const url = `${tab.entityName}?${queryStringParams}`;
        const options = { signal: controller.current.signal, method: 'POST', body };
        const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

        if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
          setLoading(false);
          onSuccess?.(data.response.data[0]);
        } else {
          throw new Error(data.response.error?.message);
        }
      } catch (err) {
        setLoading(false);
        onError?.(String(err));
      }
    },
    [initialState, mode, onError, onSuccess, tab, userId, windowMetadata],
  );

  const save = useMemo(() => submit(execute), [execute, submit]);

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { save, loading };
};
