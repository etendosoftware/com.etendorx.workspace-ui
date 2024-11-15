'use client';

import Link from 'next/link';
import Logo from '../public/etendo.svg?url';
import Image from 'next/image';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '@mui/material';

export default function NotFound() {
  const { clientWidth, clientHeight } = window.document.body;
  const { t } = useTranslation();

  return (
    <div className="center-all flex-column">
      <Image src={Logo} width={clientWidth} height={clientHeight} alt="Etendo" className="etendo-logo" />
      <h2>{t('errors.notFound.title')}</h2>
      <p>{t('errors.notFound.description')}</p>
      <Link href="/">
        <Button variant="contained">{t('navigation.common.home')}</Button>
      </Link>
    </div>
  );
}
