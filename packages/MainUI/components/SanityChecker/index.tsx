'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_METADATA_URL, MAX_ATTEMPTS, RETRY_DELAY_MS } from '@workspaceui/etendohookbinder/src/api/constants';
import { useTranslation } from '@/hooks/useTranslation';
import GlobalError from '@/app/error';
import { delay } from '@/utils';
import { CircularProgress } from '@mui/material';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const attempts = useRef(0);
  const controller = useRef(new AbortController());
  const { t } = useTranslation();

  const healthCheck = useCallback(async () => {
    attempts.current += 1;

    try {
      const response = await fetch(API_METADATA_URL, {
        method: 'OPTIONS',
        signal: controller.current.signal,
      });

      if (response.ok) {
        setConnected(true);
      } else {
        throw new Error(response.statusText);
      }
    } catch (e) {
      if (controller.current.signal.aborted) return;

      console.warn(`Health check failed (Attempt ${attempts.current}): ${e instanceof Error ? e.message : e}`);

      if (attempts.current < MAX_ATTEMPTS) {
        await delay(RETRY_DELAY_MS);
        healthCheck();
      } else {
        setError(true);
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    attempts.current = 0;
    setConnected(false);
    setError(false);
    controller.current = new AbortController();
    healthCheck();
  }, [healthCheck]);

  useEffect(() => {
    healthCheck();

    return () => {
      controller.current.abort();
    };
  }, [healthCheck]);

  if (connected) {
    return <>{props.children}</>;
  }

  return (
    <div className="center-all flex-column">
      {error ? (
        <GlobalError reset={handleRetry}>
          <h1>{t('errors.networkError.title')}</h1>
          <p>{t('errors.networkError.description')}</p>
        </GlobalError>
      ) : (
        <>
          <CircularProgress />
          <span>{t('common.loading')}</span>
        </>
      )}
    </div>
  );
}
