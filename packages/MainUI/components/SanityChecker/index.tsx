'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CircularProgress } from '@mui/material';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useTranslation } from '@/hooks/useTranslation';
import { HEALTH_CHECK_MAX_ATTEMPTS, HEALTH_CHECK_RETRY_DELAY_MS } from '@/constants/config';
import { initialState, stateReducer } from './state';
import { performHealthCheck } from './checker';

export default function SanityChecker({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const controllerRef = useRef(new AbortController());
  const { t } = useTranslation();

  const healthCheck = useCallback(() => {
    dispatch({ type: 'RESET' });
    performHealthCheck(
      controllerRef.current.signal,
      HEALTH_CHECK_MAX_ATTEMPTS,
      HEALTH_CHECK_RETRY_DELAY_MS,
      () => dispatch({ type: 'SET_CONNECTED' }),
      () => dispatch({ type: 'SET_ERROR' }),
    );
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;

    healthCheck();

    return () => {
      controller.abort();
    };
  }, [healthCheck]);

  if (state.connected) {
    return <>{children}</>;
  }

  return (
    <div className="center-all flex-column">
      {state.error ? (
        <ErrorDisplay
          title={t('errors.networkError.title')}
          description={t('errors.networkError.description')}
          showRetry={true}
          onRetry={healthCheck}
        />
      ) : (
        <>
          <CircularProgress />
          <span>{t('common.loading')}</span>
        </>
      )}
    </div>
  );
}
