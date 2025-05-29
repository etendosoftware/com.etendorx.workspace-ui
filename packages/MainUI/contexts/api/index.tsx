'use client';

import { createContext, useCallback, useEffect, useReducer, useRef } from 'react';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useTranslation } from '@/hooks/useTranslation';
import { HEALTH_CHECK_MAX_ATTEMPTS, HEALTH_CHECK_RETRY_DELAY_MS } from '@/constants/config';
import { initialState, stateReducer } from './state';
import { performHealthCheck } from '../../utils/health-check';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import Loading from '@/components/loading';

export const ApiContext = createContext<string | null>(null);

export default function ApiProvider({ children, url }: React.PropsWithChildren<{ url: string }>) {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const controllerRef = useRef<AbortController>(new AbortController());
  const { t } = useTranslation();

  const healthCheck = useCallback(() => {
    const signal = controllerRef.current.signal;

    if (url && !signal.aborted) {
      dispatch({ type: 'RESET' });
      performHealthCheck(
        url,
        signal,
        HEALTH_CHECK_MAX_ATTEMPTS,
        HEALTH_CHECK_RETRY_DELAY_MS,
        () => {
          if (signal.aborted) return;
          dispatch({ type: 'SET_CONNECTED' });
        },
        () => {
          if (signal.aborted) return;
          dispatch({ type: 'SET_ERROR' });
        },
      );
    }
  }, [url]);

  useEffect(() => {
    const controller = controllerRef.current;
    healthCheck();

    return () => {
      controller.abort();
      controllerRef.current = new AbortController();
    };
  }, [healthCheck]);

  useEffect(() => {
    if (url) {
      Metadata.setBaseUrl(url);
      datasource.setBaseUrl(url);
    }
  }, [url]);

  if (state.connected) {
    return <ApiContext.Provider value={url}>{children}</ApiContext.Provider>;
  }

  if (state.error) {
    return (
      <div className='flex flex-col items-center justify-center h-full w-full'>
        <ErrorDisplay
          title={t('errors.networkError.title')}
          description={t('errors.networkError.description')}
          showRetry={true}
          onRetry={healthCheck}
        />
      </div>
    );
  }

  return <Loading />;
}
