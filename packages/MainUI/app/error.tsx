'use client';

import Image from 'next/image';
import { Button } from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import Logo from '../public/etendo.svg?url';
import React from 'react';

export default function GlobalError({
  error,
  reset,
  children,
}: React.PropsWithChildren<{ error?: Error & { digest?: string }; reset: () => void }>) {
  const { clientWidth, clientHeight } = window.document.body;
  const { t } = useTranslation();

  return (
    <div className="center-all flex-column">
      <Image src={Logo} width={clientWidth} height={clientHeight} alt="Etendo" className="etendo-logo" />
      {error ? (
        <>
          <h2>{t('errors.internalServerError.title')}</h2>
          <p>{error.message}</p>
        </>
      ) : (
        children
      )}
      <Button variant="contained" onClick={reset}>
        {t('errors.internalServerError.retry')}
      </Button>
    </div>
  );
}
