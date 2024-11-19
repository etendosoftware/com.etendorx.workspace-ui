'use client';

import Image from 'next/image';
import { Button } from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import Logo from '../public/etendo.svg?url';
import Link from 'next/link';
import { ErrorDisplayProps } from './types';

export function ErrorDisplay({
  title,
  description,
  showRetry = false,
  onRetry,
  showHomeButton = false,
}: ErrorDisplayProps) {
  const { clientWidth, clientHeight } = window.document.body;
  const { t } = useTranslation();

  return (
    <div className="center-all flex-column">
      <Image src={Logo} width={clientWidth} height={clientHeight} alt="Etendo" className="etendo-logo" />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {showRetry && onRetry && (
        <Button variant="contained" onClick={onRetry}>
          {t('errors.internalServerError.retry')}
        </Button>
      )}
      {showHomeButton && (
        <Link href="/">
          <Button variant="contained">{t('navigation.common.home')}</Button>
        </Link>
      )}
    </div>
  );
}
