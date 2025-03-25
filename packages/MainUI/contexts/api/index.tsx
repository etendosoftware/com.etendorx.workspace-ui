'use client';

import { createContext, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useTranslation } from '@/hooks/useTranslation';
import { HEALTH_CHECK_MAX_ATTEMPTS, HEALTH_CHECK_RETRY_DELAY_MS } from '@/constants/config';
import { initialState, stateReducer } from './state';
import { performHealthCheck } from '../../utils/health-check';
import LoadingScreen from '@/screens/Loading';
import { getApiUrl } from '@/app/actions';
import { logger } from '@/utils/logger';
import { FALLBACK_URL } from '@/utils/constants';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';

export const ApiContext = createContext<string | null>(null);

export default function ApiProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const controllerRef = useRef(new AbortController());
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);

  const healthCheck = useCallback(() => {
    if (url) {
      dispatch({ type: 'RESET' });
      performHealthCheck(
        url,
        controllerRef.current.signal,
        HEALTH_CHECK_MAX_ATTEMPTS,
        HEALTH_CHECK_RETRY_DELAY_MS,
        () => dispatch({ type: 'SET_CONNECTED' }),
        () => dispatch({ type: 'SET_ERROR' }),
      );
    }
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    healthCheck();

    return () => {
      controller.abort();
    };
  }, [healthCheck]);

  useEffect(() => {
    getApiUrl()
      .then(url => {
        logger.info('Fetched API URL', url);
        setUrl(url);
      })
      .catch(err => {
        logger.error('Error getting API URL', err);
        logger.error('Falling back to default URL', FALLBACK_URL);
        setUrl(FALLBACK_URL);
      });
  }, []);

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
      <div className="flex flex-col items-center justify-center h-full w-full">
        <ErrorDisplay
          title={t('errors.networkError.title')}
          description={t('errors.networkError.description')}
          showRetry={true}
          onRetry={healthCheck}
        />
      </div>
    );
  }

  return <LoadingScreen />;
}
