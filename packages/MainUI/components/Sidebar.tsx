'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import { useMenu } from '@workspaceui/etendohookbinder/src/hooks/useMenu';
import EtendoLogotype from '../public/etendo.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();

  const menu = useMenu(token, currentRole || undefined);
  const router = useRouter();
  const { windowId } = useParams<{ windowId?: string }>();

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
  );

  return <Drawer windowId={windowId} logo={EtendoLogotype.src} title={t('common.etendo')} items={menu} onClick={handleClick} />;
}
