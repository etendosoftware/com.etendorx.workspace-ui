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
import { getLanguage } from '@/utils/language';

export const ApiContext = createContext<string | null>(null);

export default function ApiProvider({ children, url }: React.PropsWithChildren<{ url: string }>) {
  const language = getLanguage();
  const controllerRef = useRef(new AbortController());
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const { t } = useTranslation();

  const healthCheck = useCallback((url: string, controller: AbortController) => {
    if (url && !controller.signal.aborted) {
      dispatch({ type: 'RESET' });
      performHealthCheck(
        url,
        controller.signal,
        HEALTH_CHECK_MAX_ATTEMPTS,
        HEALTH_CHECK_RETRY_DELAY_MS,
        () => {
          controller.abort();
          dispatch({ type: 'SET_CONNECTED' });
        },
        () => {
          controller.abort();
          dispatch({ type: 'SET_ERROR' });
        },
      );
    }
  }, []);

  const handleRetry = useCallback(() => {
    const controller = controllerRef.current;

    healthCheck(url, controller);

    return () => {
      controller.abort();
      controllerRef.current = new AbortController();
    };
  }, [healthCheck, url]);

  const applyUrl = useCallback(() => {
    if (url && state.connected) {
      Metadata.setBaseUrl(url);
      datasource.setBaseUrl(url);
    }
  }, [state.connected, url]);

  useEffect(handleRetry, [handleRetry]);

  useEffect(applyUrl, [applyUrl]);

  if (state.connected) {
    return <ApiContext.Provider value={url}>{children}</ApiContext.Provider>;
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <ErrorDisplay
          title={t('errors.networkError.title')}
          description={t('errors.networkError.description')}
          showRetry={true}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return <Loading language={language} />;
}
