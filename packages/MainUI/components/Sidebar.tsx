'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import { useMenu } from '@workspaceui/etendohookbinder/src/hooks/useMenu';
import EtendoLogotype from '../public/etendo.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';
import { WindowParams } from '../app/types';
import { useLanguage } from '../hooks/useLanguage';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();
  const { language } = useLanguage();

  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const { windowId } = useParams<WindowParams>();

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
  );

  return (
    <Drawer
      windowId={windowId}
      logo={EtendoLogotype.src}
      title={t('common.etendo')}
      items={menu}
      onClick={handleClick}
      onReportClick={handleClick}
      onProcessClick={handleClick}
    />
  );
}
